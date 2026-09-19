import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { AuthService } from './auth.service';
import { VerifyPhoneDto, RefreshTokenDto } from './dto';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/verify-phone
   * Accepts a Firebase ID token + tenant slug, verifies via Firebase Admin,
   * and returns internal JWT access/refresh tokens + user profile.
   */
  @Public()
  @Post('verify-phone')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Stricter rate limit on auth
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Firebase phone OTP and issue tokens' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid Firebase token' })
  @ApiResponse({ status: 403, description: 'User or tenant is inactive' })
  async verifyPhone(@Body() dto: VerifyPhoneDto) {
    return this.authService.verifyPhone(dto.firebaseIdToken, dto.tenantSlug);
  }

  /**
   * POST /api/v1/auth/refresh
   * Rotates the refresh token and issues a new access/refresh token pair.
   */
  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }
}
