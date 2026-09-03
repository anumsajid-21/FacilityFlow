import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthUser } from "../common/decorators/user.decorator";
import { PaginationDto, buildPage } from "../common/dto/pagination.dto";
import { NotificationsService } from "../notifications/notifications.service";

export interface ProviderFilter {
  categoryId?: string;
  city?: string;
}

/**
 * Provider profile management, public discovery and verification workflow.
 */
@Injectable()
export class ProvidersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async publicList(filter: ProviderFilter, q: PaginationDto) {
    const take = q.limit;
    const skip = (q.page - 1) * take;
    const where: any = { verificationStatus: { in: ["VERIFIED", "DOCUMENTS_SUBMITTED"] } };
    if (filter.categoryId) {
      where.services = { some: { categoryId: filter.categoryId } };
    }
    if (filter.city) {
      where.serviceAreas = { some: { areaName: { equals: filter.city, mode: "insensitive" } } };
    }
    const [total, items] = await Promise.all([
      this.prisma.provider.count({ where }),
      this.prisma.provider.findMany({
        where,
        skip,
        take,
        include: { _count: { select: { services: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return buildPage(items, total, q.page, take);
  }

  async getOne(user: AuthUser, id: string) {
    if (user.providerId !== id) throw new ForbiddenException("You can only view your own provider profile");
    return this.prisma.provider.findUnique({
      where: { id },
      include: { services: { include: { category: true } }, serviceAreas: true, documents: true },
    });
  }

  async getPublic(id: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: { services: { include: { category: true } }, serviceAreas: true },
    });
    if (!provider) throw new NotFoundException("Provider not found");
    return provider;
  }

  async update(user: AuthUser, id: string, dto: any) {
    const provider = await this.prisma.provider.findUnique({ where: { id }, select: { id: true } });
    if (!provider) throw new NotFoundException("Provider not found");
    if (user.providerId !== id) throw new ForbiddenException("Not your profile");

    await this.prisma.$transaction(async (tx) => {
      if (dto.serviceCategoryIds) {
        await tx.providerService.deleteMany({ where: { providerId: id } });
        await tx.providerService.createMany({ data: dto.serviceCategoryIds.map((cid: string) => ({ providerId: id, categoryId: cid })) });
      }
      if (dto.serviceAreaIds) {
        await tx.providerServiceArea.deleteMany({ where: { providerId: id } });
        await tx.providerServiceArea.createMany({ data: dto.serviceAreaIds.map((aid: string) => ({ providerId: id, areaId: aid })) });
      }
      const { serviceCategoryIds, serviceAreaIds, ...rest } = dto;
      await tx.provider.update({ where: { id }, data: { ...rest } });
    });

    void this.audit.log({ actorId: user.userId, action: "PROVIDER_UPDATED", entityType: "Provider", entityId: id, details: dto });
    void this.notifications.notify({ userId: user.userId, type: "PROFILE_UPDATED", title: "Profile updated", message: "Your provider profile was updated." });
    return this.getOne(user, id);
  }

  async documents(user: AuthUser, id: string) {
    if (user.providerId !== id) throw new ForbiddenException("Not your profile");
    return this.prisma.verificationDocument.findMany({ where: { providerId: id }, orderBy: { createdAt: "desc" } });
  }

  async addDocument(user: AuthUser, id: string, dto: { documentType: string; fileId: string }) {
    if (user.providerId !== id) throw new ForbiddenException("Not your profile");
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException("Provider not found");
    // verify the file belongs to the user's provider
    const file = await this.prisma.file.findUnique({ where: { id: dto.fileId } });
    if (!file) throw new BadRequestException("File not found");
    const doc = await this.prisma.verificationDocument.create({
      data: { providerId: id, documentType: dto.documentType, fileId: dto.fileId, status: "PENDING" },
    });
    void this.audit.log({ actorId: user.userId, action: "DOCUMENT_SUBMITTED", entityType: "VerificationDocument", entityId: doc.id, details: { documentType: dto.documentType } });
    // Re-evaluate verification status
    await this.recomputeStatus(id);
    return doc;
  }

  /** Admin review of a verification document */
  async reviewDocument(documentId: string, status: "APPROVED" | "REJECTED", adminUserId: string) {
    const doc = await this.prisma.verificationDocument.findUnique({ where: { id: documentId }, include: { provider: { include: { users: { select: { id: true } } } } } });
    if (!doc) throw new NotFoundException("Document not found");
    await this.prisma.$transaction(async (tx) => {
      await tx.verificationDocument.update({ where: { id: documentId }, data: { status, reviewedById: adminUserId, reviewedAt: new Date() } });
      await this.recomputeStatus(doc.providerId, tx);
      void this.notifications.notify({ userId: doc.provider?.users?.[0]?.id ?? adminUserId, type: "VERIFICATION_REVIEWED", title: "Document reviewed", message: `Your document was ${status.toLowerCase()}.` });
    });
    void this.audit.log({ actorId: adminUserId, action: "DOCUMENT_REVIEWED", entityType: "VerificationDocument", entityId: documentId, details: { status } });
    return doc;
  }

  private async recomputeStatus(providerId: string, tx: any = this.prisma) {
    const docs = await tx.verificationDocument.findMany({ where: { providerId } });
    const statuses = docs.map((d: any) => d.status);
    let verificationStatus = "UNVERIFIED";
    if (docs.length && docs.every((d: any) => d.status === "APPROVED")) {
      verificationStatus = "VERIFIED";
    } else if (statuses.includes("APPROVED")) {
      verificationStatus = "VERIFIED";
    } else if (docs.some((d: any) => d.status === "REJECTED")) {
      verificationStatus = "REJECTED";
    } else if (docs.length > 0) {
      verificationStatus = "DOCUMENTS_SUBMITTED";
    }
    await tx.provider.update({ where: { id: providerId }, data: { verificationStatus: verificationStatus as any } });
  }
}
