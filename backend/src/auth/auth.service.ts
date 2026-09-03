import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { Role } from '@prisma/client';

export interface AuthPayload {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    hiringOrgId: string | null;
    providerId: string | null;
  };
}

const BCRYPT_ROUNDS = 12;

/**
 * Authentication and role-based account provisioning. Passwords are hashed
 * with bcrypt; the JWT carries only the user id and email — authorization is
 * resolved server-side from the DB on every request (see JwtStrategy).
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  private sign(user: { id: string; email: string; role: Role }): string {
    return this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
  }

  async register(dto: RegisterDto): Promise<AuthPayload> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    let hiringOrgId: string | null = null;
    let providerId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      if (dto.role === 'HIRING_ORG') {
        const org = await tx.organization.create({ data: { name: dto.companyName } });
        hiringOrgId = org.id;
      } else if (dto.role === 'PROVIDER') {
        const provider = await tx.provider.create({
          data: {
            name: dto.companyName,
            verificationStatus: 'VERIFIED',
            workforceCapacity: 20,
          },
        });
        providerId = provider.id;
      }

      const user = await tx.user.create({
        data: {
          email: dto.email,
          password,
          name: dto.name,
          role: dto.role as Role,
          hiringOrgId,
          providerId,
        },
      });

      if (hiringOrgId) {
        await tx.organizationMember.create({
          data: { organizationId: hiringOrgId, userId: user.id, role: 'ADMIN' },
        });
      }

      void this.audit.log({
        actorId: user.id,
        action: 'REGISTER',
        entityType: 'User',
        entityId: user.id,
        details: { role: dto.role, companyName: dto.companyName },
      });
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email: dto.email },
      select: { id: true, email: true, name: true, role: true, hiringOrgId: true, providerId: true },
    });

    void this.notifications.notify({
      userId: user.id,
      type: 'ACCOUNT_CREATED',
      title: 'Welcome to FacilityFlow',
      message: 'Your account was created successfully.',
    });

    return {
      access_token: this.sign(user),
      user: { id: user.id, email: user.email, name: user.name, role: user.role, hiringOrgId, providerId },
    };
  }

  async login(dto: LoginDto): Promise<AuthPayload> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, name: true, password: true, role: true, hiringOrgId: true, providerId: true, isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('This account has been disabled');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return {
      access_token: this.sign(user),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hiringOrgId: user.hiringOrgId,
        providerId: user.providerId,
      },
    };
  }

  async me(userId: string): Promise<AuthPayload['user']> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, hiringOrgId: true, providerId: true },
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hiringOrgId: user.hiringOrgId,
      providerId: user.providerId,
    };
  }
}