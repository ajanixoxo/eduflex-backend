import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsNotEmpty } from 'class-validator';

export class AgentSaveAiTranscriptDto {
  @ApiProperty({
    description: 'Message ID returned from save-user-transcript endpoint',
    type: String,
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  message_id: string;

  @ApiProperty({
    description: 'AI response text (transcribed from TTS or text response)',
    type: String,
    example:
      'Photosynthesis is the process by which plants convert light energy into chemical energy.',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  ai_response: string;
}
