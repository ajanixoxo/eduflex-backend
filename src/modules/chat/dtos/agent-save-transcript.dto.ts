import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsMongoId,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum SpeakerType {
  USER = 'user',
  AI = 'ai',
  AGENT = 'agent', // alias for AI
}

export class AgentSaveTranscriptDto {
  @ApiProperty({
    description:
      'LiveKit room name (format: course-{courseId}-module-{moduleNumber}-lesson-{lessonNumber}) - get from room.name',
    type: String,
    example: 'course-6925663977e9779b16370bb4-module-1-lesson-1.2',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  room_name: string;

  @ApiProperty({
    description: 'Speaker type: "user" or "ai"/"agent"',
    enum: SpeakerType,
    example: 'user',
    required: true,
  })
  @IsEnum(SpeakerType)
  @IsNotEmpty()
  speaker_type: SpeakerType;

  @ApiProperty({
    description: 'Transcribed text from speech',
    type: String,
    example: 'Hello, can you help me?',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Language code (optional)',
    type: String,
    example: 'en',
    required: false,
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({
    description: 'Timestamp (optional)',
    type: String,
    example: '2024-12-18T14:30:00.123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  timestamp?: string;

  @ApiProperty({
    description:
      'User ID - extract from LiveKit participant.identity (format: "user-{userId}" -> extract userId part). Required for agent endpoint, ignored for authenticated user endpoint.',
    type: String,
    example: '691c5edde0fc2af34bd345f4',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  user_id?: string;

  @ApiProperty({
    description:
      'Message ID (required when speaker_type is "ai" or "agent") - returned from previous user message save',
    type: String,
    example: '675f1234abcd5678ef901234',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  message_id?: string;
}
