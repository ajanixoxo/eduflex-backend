import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AgentUploadImageDto {
  @ApiProperty({
    description: 'Base64 encoded image data (without data:image/xxx;base64, prefix)',
    type: String,
    example: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  })
  @IsString()
  @IsNotEmpty()
  image_base64: string;

  @ApiProperty({
    description: 'Image prompt/description used for generation',
    type: String,
    example: 'Educational diagram of photosynthesis',
    required: false,
  })
  @IsString()
  @IsOptional()
  prompt?: string;

  @ApiProperty({
    description: 'Room name for organizing uploads',
    type: String,
    example: 'course-6925663977e9779b16370bb4-module-1-lesson-1.2',
    required: false,
  })
  @IsString()
  @IsOptional()
  room_name?: string;
}
