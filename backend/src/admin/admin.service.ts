import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";

/**
 * Admin oversight: provider verification, user/organization oversight,
 * marketplace oversight.
 */
@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private audit: AuditService, private notifications: NotificationsService) {}

  async providers() {
    return this.prisma.provider.findMany({
      orderBy: { verificationStatus: "asc" },
      include: {
        documents: { include: { file: true } },
        _count: { select: { quotations: true, contracts: true, reviews: true } },
      },
    });
  }

  async organizations() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: { members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
    });
  }

  async users() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { hiringOrg: { select: { id: true, name: true } }, provider: { select: { id: true, name: true } } },
    });
  }

  async verifyProvider(id: string, status: string, notes?: string) {
    const validStatuses = ["UNVERIFIED", "DOCUMENTS_SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED", "SUSPENDED"];
    if (!validStatuses.includes(status)) throw new BadRequestException("Invalid verification status");
    const provider = await this.prisma.provider.update({ where: { id }, data: { verificationStatus: status as any } });
    void this.audit.log({ action: "PROVIDER_VERIFICATION", entityType: "Provider", entityId: id, details: { status, notes } });
    const users = await this.prisma.user.findMany({ where: { providerId: id }, select: { id: true } });
    for (const u of users) {
      void this.notifications.notify({ userId: u.id, type: "PROVIDER_VERIFIED", title: "Verification status updated", message: `Your provider verification status: ${status}` });
    }
    return provider;
  }
}
