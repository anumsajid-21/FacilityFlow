import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthUser } from "../common/decorators/user.decorator";
import { PaginationDto, buildPage } from "../common/dto/pagination.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { Prisma } from "@prisma/client";

/**
 * Invoice management with manual payment recording. The payment layer is an
 * abstraction — a real payment gateway can be wired into addPayment later.
 */
@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService, private audit: AuditService, private notifications: NotificationsService) {}

  private async load(user: AuthUser, id: string) {
    const inv = await this.prisma.invoice.findUnique({ where: { id }, include: { contract: true, job: true, provider: true, organization: true } });
    if (!inv) throw new NotFoundException("Invoice not found");
    const isProvider = user.role === "PROVIDER" && user.providerId === inv.providerId;
    const isHiring = user.role === "HIRING_ORG" && user.hiringOrgId === inv.organizationId;
    if (!isProvider && !isHiring && user.role !== "ADMIN") throw new ForbiddenException("Access denied");
    return inv;
  }

  async list(user: AuthUser, q: PaginationDto) {
    const where: any = {};
    if (user.role === "PROVIDER" && user.providerId) where.providerId = user.providerId;
    else if (user.role === "HIRING_ORG" && user.hiringOrgId) where.organizationId = user.hiringOrgId;
    const [total, items] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({ where, skip: (q.page - 1) * q.limit, take: q.limit, orderBy: { createdAt: "desc" } }),
    ]);
    return buildPage(items, total, q.page, q.limit);
  }

  async get(user: AuthUser, id: string) {
    const inv = await this.load(user, id);
    const payments = await this.prisma.payment.findMany({ where: { invoiceId: inv.id } });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return { ...inv, payments, totalPaid, balance: Number(inv.total) - totalPaid };
  }

  /** Provider manually issues an invoice tied to a completed job. */
  async createFromJob(user: AuthUser, jobId: string) {
    if (user.role !== "PROVIDER" || !user.providerId) throw new ForbiddenException("Only providers");
    const job = await this.prisma.job.findUnique({ where: { id: jobId }, include: { contract: { include: { provider: true, organization: true } } } });
    if (!job) throw new NotFoundException("Job not found");
    if (job.contract.providerId !== user.providerId) throw new ForbiddenException("Not your job");
    if (job.status !== "AWAITING_APPROVAL") throw new BadRequestException("Job must be awaiting approval");
    const existing = await this.prisma.invoice.findFirst({ where: { jobId: job.id } });
    if (existing) throw new ConflictException("Invoice already exists for this job");
    const number = `INV-${job.contract.id.slice(0, 8).toUpperCase()}-${job.id.slice(0, 8).toUpperCase()}`;
    const inv = await this.prisma.invoice.create({
      data: {
        invoiceNumber: number,
        providerId: job.contract.providerId,
        organizationId: job.contract.organizationId,
        contractId: job.contractId,
        jobId: job.id,
        amount: job.contract.price,
        taxAmount: 0,
        discount: 0,
        total: job.contract.price,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "ISSUED",
        issuedById: user.userId,
      },
    });
    void this.audit.log({ actorId: user.userId, action: "INVOICE_ISSUED", entityType: "Invoice", entityId: inv.id, details: { jobId } });
    void this.notifications.notify({ userId: user.userId, type: "INVOICE_ISSUED", title: "Invoice issued", message: "An invoice was issued." });
    return inv;
  }

  async updateStatus(user: AuthUser, id: string, status: string) {
    const inv = await this.load(user, id);
    if (user.role !== "PROVIDER" || user.providerId !== inv.providerId) throw new ForbiddenException("Not your invoice");
    const valid = ["DRAFT", "ISSUED", "PENDING", "PAID", "OVERDUE", "CANCELLED"];
    if (!valid.includes(status)) throw new BadRequestException("Invalid status");
    const updated = await this.prisma.invoice.update({ where: { id: inv.id }, data: { status: status as any } });
    void this.audit.log({ actorId: user.userId, action: "INVOICE_STATUS_CHANGE", entityType: "Invoice", entityId: id, details: { status } });
    return updated;
  }

  async payments(user: AuthUser, id: string) {
    await this.load(user, id);
    return this.prisma.payment.findMany({ where: { invoiceId: id }, orderBy: { createdAt: "desc" } });
  }

  /** Hiring org records a manual/bank-transfer payment against an invoice. */
  async addPayment(user: AuthUser, id: string, dto: any) {
    const inv = await this.load(user, id);
    if (user.role === "HIRING_ORG" && user.hiringOrgId !== inv.organizationId) throw new ForbiddenException("Not your invoice");
    const [total, totalPaid] = await Promise.all([
      Number(inv.total),
      this.prisma.payment.aggregate({ where: { invoiceId: inv.id }, _sum: { amount: true } }).then((a) => Number(a._sum.amount ?? 0)),
    ]);
    if (Number(dto.amount) > total - totalPaid) throw new BadRequestException("Payment exceeds outstanding balance");
    const payment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: { invoiceId: inv.id, amount: dto.amount, paymentReference: dto.paymentReference, date: dto.date ? new Date(dto.date) : new Date(), paymentMethod: dto.paymentMethod, status: "COMPLETED", recordedById: user.userId },
      });
      const newTotal = await tx.payment.aggregate({ where: { invoiceId: inv.id }, _sum: { amount: true } });
      const paid = Number(newTotal._sum.amount ?? 0);
      const newStatus = paid >= Number(inv.total) ? "PAID" : inv.status;
      await tx.invoice.update({ where: { id: inv.id }, data: { status: newStatus } });
      return p;
    });
    void this.audit.log({ actorId: user.userId, action: "PAYMENT_RECORDED", entityType: "Payment", entityId: payment.id, details: { invoiceId: id, amount: dto.amount } });
    void this.notifications.notify({ userId: user.userId, type: "PAYMENT_RECORDED", title: "Payment recorded", message: `Payment of ${dto.amount} recorded against invoice.` });
    return payment;
  }
}
