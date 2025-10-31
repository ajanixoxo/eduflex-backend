import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PWD_LENGTH } from 'src/modules/authentication/enums';

export class ChangePasswordDto {
  @ApiProperty({
    description:
      'Should be combinantion of uppercase/lowercase, numbers and special characters',
    minLength: 6,
    maxLength: 15,
  })
  @IsString()
  @IsStrongPassword()
  @MinLength(Number(PWD_LENGTH.MIN))
  @MaxLength(Number(PWD_LENGTH.MAX))
  old_password: string;
  @ApiProperty({
    description:
      'Should be combinantion of uppercase/lowercase, numbers and special characters',
    minLength: 6,
    maxLength: 15,
  })
  @IsString()
  @IsStrongPassword()
  @MinLength(Number(PWD_LENGTH.MIN))
  @MaxLength(Number(PWD_LENGTH.MAX))
  new_password: string;
  @ApiProperty()
  @IsString()
  @IsStrongPassword()
  @MinLength(Number(PWD_LENGTH.MIN))
  confirm_password: string;
}
