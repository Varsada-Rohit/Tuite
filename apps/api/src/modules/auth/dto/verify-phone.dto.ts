import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for the phone verification endpoint.
 * Accepts a Firebase ID token and the tenant slug.
 */
export class VerifyPhoneDto {
  @ApiProperty({ description: 'The Firebase ID Token from the client' })
  @IsString()
  @IsNotEmpty()
  firebaseIdToken!: string;

  @IsString()
  @IsNotEmpty()
  tenantSlug!: string;
}
