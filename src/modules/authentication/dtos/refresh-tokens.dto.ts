import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsString, Matches } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/.*\S.*/, {
    message: 'Should not be empty or contain only white spaces',
  })
  refresh_token: string;
}
