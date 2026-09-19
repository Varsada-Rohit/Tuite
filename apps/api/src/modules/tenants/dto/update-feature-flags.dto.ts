import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FeatureName } from '@tuite/shared-types';

class FeatureFlagInput {
  @ApiProperty({ enum: FeatureName, description: 'The name of the feature flag' })
  @IsEnum(FeatureName)
  name!: FeatureName;

  @ApiProperty({ description: 'Whether the feature is enabled' })
  @IsBoolean()
  isEnabled!: boolean;
}

export class UpdateFeatureFlagsDto {
  @ApiProperty({ type: [FeatureFlagInput], description: 'List of feature flags to update' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagInput)
  features!: FeatureFlagInput[];
}
