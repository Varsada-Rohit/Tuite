import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for the Super Admin login endpoint.
 * Only requires a Firebase ID token — no tenant slug needed.
 */
export class AdminLoginDto {
  @ApiProperty({ description: 'The Firebase ID Token from the client' })
  @IsString()
  @IsNotEmpty()
  firebaseIdToken!: string;
}
