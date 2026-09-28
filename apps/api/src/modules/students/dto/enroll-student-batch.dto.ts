import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollStudentBatchDto {
  @ApiProperty({
    description: 'UUIDs of batches to assign the student to',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  batchIds!: string[];
}
