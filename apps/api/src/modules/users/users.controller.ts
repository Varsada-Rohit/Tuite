import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import { UsersService } from './users.service';

/**
 * User profile endpoints.
 * All routes require authentication (JwtAuthGuard is global).
 */
@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/v1/users/me
   * Returns the authenticated user's profile with active feature flags.
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with feature flags' })
  @ApiResponse({ status: 200, description: 'User profile returned successfully' })
  async getMe(@CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.usersService.getMe(user.sub, user.tenantId);
  }
}
