import { IsString, IsNotEmpty, Matches, MinLength, MaxLength, IsOptional, IsHexColor } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'My Academy', description: 'The display name of the tenant' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'my-academy', description: 'Unique URL-friendly slug' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with hyphens (e.g., "my-academy")',
  })
  slug!: string;

  @ApiPropertyOptional({ description: 'URL to the tenant logo' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#1E40AF', description: 'Primary brand color hex' })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#F3F4F6', description: 'Secondary brand color hex' })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;
}
