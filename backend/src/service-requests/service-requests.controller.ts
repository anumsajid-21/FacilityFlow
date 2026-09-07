import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  NotFoundException,
  ParseUUIDPipe,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/user.decorator';
import { ServiceRequestsService } from './service-requests.service';
import { MatchingService } from '../matching/matching.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

class ServiceRequestDto {
  @IsString() title: string;
  @IsOptional() @Transform(({ value }) => value === '' || value === null ? undefined : value) @IsUUID() categoryId?: string;
  @IsString() description: string;
  @IsUUID() buildingId: string;
  @IsOptional() @Transform(({ value }) => value === '' || value === null ? undefined : value) @IsUUID() floorId?: string;
  @IsOptional() @Transform(({ value }) => value === '' || value === null ? undefined : value) @IsUUID() areaId?: string;
  @IsOptional() @IsString() requirements?: string;
  @IsOptional() @Transform(({ value }) => value === '' || value === null ? undefined : value) @IsString() preferredDate?: string;
  @IsOptional() @IsString() frequency?: string;
  @IsOptional() @Transform(({ value }) => value === '' || value === null || isNaN(Number(value)) ? undefined : Number(value)) @IsNumber() budget?: number;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() attachmentIds?: string[];
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HIRING_ORG', 'ADMIN')
@Controller('api/v1/service-requests')
export class ServiceRequestsController {
  constructor(private readonly sr: ServiceRequestsService, private readonly matching: MatchingService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() q: PaginationDto) {
    return this.sr.list(user, q, false);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: ServiceRequestDto) {
    return this.sr.create(user, dto);
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.sr.get(user, id);
  }

  @Patch(':id')
  async update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<ServiceRequestDto>) {
    return this.sr.update(user, id, dto);
  }

  @Post(':id/submit')
  async submit(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.sr.submit(user, id);
  }

  @Post(':id/archive')
  async archive(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.sr.archive(user, id);
  }

  @Get(':id/matches')
  async matches(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    const request = await this.sr.get(user, id);
    if (request.status !== 'OPEN') {
      return { providers: [], explanation: 'Matching only for OPEN requests' };
    }
    const providers = await this.matching.match(id);
    return { providers };
  }
}
