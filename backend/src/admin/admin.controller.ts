import { Body, Controller, Get, Param, Patch, Post, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/user.decorator";
import { AdminService } from "./admin.service";
import { IsEnum, IsString } from "class-validator";

class VerifyProviderDto {
  @IsEnum({ values: ["VERIFIED", "REJECTED", "SUSPENDED", "UNDER_REVIEW"] })
  status: string;
  @IsString() notes: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("api/v1/admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("providers")
  async providers() {
    return this.admin.providers();
  }

  @Get("organizations")
  async organizations() {
    return this.admin.organizations();
  }

  @Get("users")
  async users() {
    return this.admin.users();
  }

  @Patch("providers/:id/status")
  async verifyProvider(@Param("id", ParseUUIDPipe) id: string, @Body() dto: VerifyProviderDto) {
    return this.admin.verifyProvider(id, dto.status, dto.notes);
  }
}
