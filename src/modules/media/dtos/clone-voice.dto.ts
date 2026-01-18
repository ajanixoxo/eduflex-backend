import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, MinLength } from 'class-validator';

export class CloneVoiceDto {
  @ApiProperty({
    description: 'The uploaded media ID (audio file) to clone voice from',
    example: '67473c52d9c3d52f6e7e26ac',
  })
  @IsString()
  @IsMongoId()
  media_id: string;

  @ApiProperty({
    description: 'Name for the cloned voice',
    example: 'My Voice',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  name: string;
}
