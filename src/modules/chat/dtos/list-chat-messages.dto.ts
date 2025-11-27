import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseListDto } from 'src/modules/shared/dtos';
import { ChatSender } from '../schemas';

export class ListChatMessages extends BaseListDto {
  @ApiPropertyOptional({
    description: 'Filter by Sender',
    enum: ChatSender,
  })
  @IsOptional()
  @IsEnum(ChatSender)
  sender?: ChatSender;

  @ApiPropertyOptional({})
  @IsOptional()
  @IsMongoId()
  user_id?: string;

  @ApiPropertyOptional({})
  @IsOptional()
  @IsMongoId()
  course_id?: string;
}
