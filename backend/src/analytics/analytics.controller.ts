import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/user.decorator";
import { AnalyticsService } from "./analytics.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("api/v1/analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get()
  @Roles("HIRING_ORG", "ADMIN", "PROVIDER")
  async dashboard(@CurrentUser() user: AuthUser) {
    if (user.role === "PROVIDER") return this.analytics.providerDashboard(user);
    return this.analytics.hiringDashboard(user);
  }
}
