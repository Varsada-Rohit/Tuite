import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SeedOwnerDto {
  @ApiProperty({ example: '+1234567890', description: 'Phone number of the owner' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the owner' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  fullName!: string;
}
