import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for the token refresh endpoint.
 */
export class RefreshTokenDto {
  @ApiProperty({ description: 'The current valid refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
