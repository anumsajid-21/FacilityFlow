import { Body, Controller, Get, Param, Post, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../common/decorators/user.decorator";
import { MessagingService } from "./messaging.service";

class CreateThreadDto {
  @IsUUID() providerId: string;
  @IsOptional() @IsUUID() organizationId?: string;
  @IsOptional() @IsUUID() contractId?: string;
  @IsOptional() @IsUUID() serviceRequestId?: string;
  @IsString() @MinLength(2) subject: string;
  @IsOptional() @IsString() body?: string;
}
class SendMessageDto {
  @IsString() @MinLength(1) body: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("HIRING_ORG", "PROVIDER", "ADMIN")
@Controller("api/v1/messages")
export class MessagingController {
  constructor(private readonly messages: MessagingService) {}

  @Get("threads")
  list(@CurrentUser() user: AuthUser) { return this.messages.list(user); }

  @Post("threads")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateThreadDto) { return this.messages.create(user, dto); }

  @Get("threads/:id")
  get(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) { return this.messages.get(user, id); }

  @Post("threads/:id/messages")
  send(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string, @Body() dto: SendMessageDto) { return this.messages.send(user, id, dto.body); }
}
