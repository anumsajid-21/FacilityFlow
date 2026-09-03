import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthUser } from "../common/decorators/user.decorator";
import { NotificationsService } from "../notifications/notifications.service";

/**
 * Proof-of-work management: before/after photos, notes, completion metadata.
 */
@Injectable()
export class ProofOfWorkService {
  constructor(private prisma: PrismaService, private audit: AuditService, private notifications: NotificationsService) {}

  private async loadJob(user: AuthUser, jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { contract: { include: { provider: true, organization: true } } },
    });
    if (!job) throw new NotFoundException("Job not found");
    const isProvider = user.role === "PROVIDER" && user.providerId === job.contract.providerId;
    const isHiring = user.role === "HIRING_ORG" && user.hiringOrgId === job.contract.organizationId;
    if (!isProvider && !isHiring && user.role !== "ADMIN") throw new ForbiddenException("Access denied");
    return { job, isProvider, isHiring };
  }

  async add(user: AuthUser, jobId: string, dto: any, beforePhotoIds: string[], afterPhotoIds: string[]) {
    const { job, isProvider } = await this.loadJob(user, jobId);
    if (!isProvider) throw new ForbiddenException("Only the provider can add proof of work");
    if (job.status !== "IN_PROGRESS") throw new BadRequestException("Job must be in progress to add proof");
    const existing = await this.prisma.proofOfWork.findFirst({ where: { jobId } });
    const data: any = {
      jobId,
      providerNote: dto.providerNote,
      completionNote: dto.completionNote,
      completedById: user.userId,
      workerName: dto.workerName,
    };
    const txData: any = {};
    if (beforePhotoIds.length) txData.beforePhotos = { connect: beforePhotoIds.map((id) => ({ id })) };
    if (afterPhotoIds.length) txData.afterPhotos = { connect: afterPhotoIds.map((id) => ({ id })) };
    let proof;
    if (existing) {
      proof = await this.prisma.proofOfWork.update({ where: { id: existing.id }, data: { ...data, ...txData } });
    } else {
      proof = await this.prisma.proofOfWork.create({ data: { ...data, ...txData } });
    }
    void this.audit.log({ actorId: user.userId, action: "PROOF_OF_WORK_ADDED", entityType: "ProofOfWork", entityId: proof.id, details: { jobId } });
    void this.notifications.notify({ userId: user.userId, type: "JOB_COMPLETED", title: "Proof of work submitted", message: "Proof of work has been submitted for approval." });
    return proof;
  }

  async get(user: AuthUser, jobId: string) {
    const { job, isProvider, isHiring } = await this.loadJob(user, jobId);
    const proof = await this.prisma.proofOfWork.findFirst({ where: { jobId }, include: { beforePhotos: true, afterPhotos: true, completer: { select: { id: true, name: true, email: true } } } });
    if (!proof) throw new NotFoundException("No proof of work for this job");
    return proof;
  }
}
