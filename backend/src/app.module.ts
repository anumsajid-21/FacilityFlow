import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FilesModule } from './files/files.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { AssetsModule } from './assets/assets.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { ProvidersModule } from './providers/providers.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { MatchingModule } from './matching/matching.module';
import { QuotationsModule } from './quotations/quotations.module';
import { ContractsModule } from './contracts/contracts.module';
import { JobsModule } from './jobs/jobs.module';
import { WorkersModule } from './workers/workers.module';
import { ProofOfWorkModule } from './proof-of-work/proof-of-work.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';

/**
 * Makes Passport's JwtAuthGuard resolvable from every feature module
 * without each one importing PassportModule explicitly.
 */
@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  exports: [PassportModule],
})
export class GlobalPassportModule {}

@Module({
  imports: [
    // Core / global
    GlobalPassportModule,
    PrismaModule,
    AuditModule,
    NotificationsModule,
    FilesModule,
    // Identity
    AuthModule,
    OrganizationsModule,
    // Facility management
    FacilitiesModule,
    AssetsModule,
    ChecklistsModule,
    // Marketplace flow
    ProvidersModule,
    ServiceRequestsModule,
    MatchingModule,
    QuotationsModule,
    ContractsModule,
    // Delivery
    JobsModule,
    WorkersModule,
    ProofOfWorkModule,
    ApprovalsModule,
    // Billing & feedback
    InvoicesModule,
    ReviewsModule,
    AnalyticsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
