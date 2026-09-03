import { Body, Controller, Get, Param, Post, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/user.decorator";
import { ReviewsService } from "./reviews.service";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

class ReviewDto {
  @IsInt() @Min(1) @Max(5) quality: number;
  @IsInt() @Min(1) @Max(5) timeliness: number;
  @IsInt() @Min(1) @Max(5) professionalism: number;
  @IsInt() @Min(1) @Max(5) value: number;
  @IsInt() @Min(1) @Max(5) overallRating: number;
  @IsOptional() comments?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("api/v1/reviews")
export class ReviewsController {
  constructor(private readonly rs: ReviewsService) {}

  @Get("provider/:providerId")
  byProvider(@Param("providerId", ParseUUIDPipe) providerId: string) {
    return this.rs.byProvider(providerId);
  }

  @Post()
  @Roles("HIRING_ORG", "ADMIN")
  create(@CurrentUser() user: AuthUser, @Body("jobId") jobId: string, @Body("providerId") providerId: string, @Body() dto: ReviewDto) {
    return this.rs.create(user, jobId, providerId, dto);
  }
}
