import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/user.decorator';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { Throttle } from '../common/decorators/throttle.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(RateLimitGuard)
  @Throttle({ limit: 5, ttl: 60 })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(RateLimitGuard)
  @Throttle({ limit: 10, ttl: 60 })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const profile = await this.authService.me(user.userId);
    return profile;
  }
}