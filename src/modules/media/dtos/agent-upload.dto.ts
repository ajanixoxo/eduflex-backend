import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

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

export class AgentUploadVideoDto {
  @ApiProperty({
    description: 'Base64 encoded video data (without data:video/xxx;base64, prefix)',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  video_base64: string;

  @ApiProperty({
    description: 'Video title',
    type: String,
    example: 'Understanding Photosynthesis',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Topic/description of the video',
    type: String,
    example: 'Educational video about photosynthesis',
    required: false,
  })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiProperty({
    description: 'Video duration in seconds',
    type: Number,
    example: 60,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiProperty({
    description: 'Room name for organizing uploads',
    type: String,
    example: 'course-6925663977e9779b16370bb4-module-1-lesson-1.2',
    required: false,
  })
  @IsString()
  @IsOptional()
  room_name?: string;

  @ApiProperty({
    description: 'Job ID from video generation service',
    type: String,
    example: 'vid_abc123',
    required: false,
  })
  @IsString()
  @IsOptional()
  job_id?: string;
}
