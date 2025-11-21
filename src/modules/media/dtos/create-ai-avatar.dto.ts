import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateAiAvatarDto {
  @ApiProperty({
    description:
      'The uploaded media ID that will be used to generate an AI avatar',
    example: '67473c52d9c3d52f6e7e26ac',
  })
  @IsString()
  @IsMongoId()
  media_id: string;

  @ApiProperty({
    description: 'Optional name for the AI Avatar',
    example: 'My Custom Avatar',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Optional description for the AI Avatar',
    example: 'A friendly avatar generated from uploaded image',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAiAvatarDto extends PartialType(CreateAiAvatarDto) {}
