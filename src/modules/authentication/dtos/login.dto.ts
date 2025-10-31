import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  ValidateIf,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { PWD_LENGTH } from '../enums';
import { UserTypes } from 'src/modules/user/enums';

export class UserLoginDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    description:
      'Should be a combination of uppercase/lowercase, numbers and special characters',
    minLength: Number(PWD_LENGTH.MIN),
    maxLength: Number(PWD_LENGTH.MAX),
  })
  @IsString()
  @IsStrongPassword()
  @MinLength(Number(PWD_LENGTH.MIN))
  @MaxLength(Number(PWD_LENGTH.MAX))
  password: string;

  @ApiProperty({ enum: UserTypes, default: UserTypes.CUSTOMER })
  @IsEnum(UserTypes)
  account_type: UserTypes;
}
