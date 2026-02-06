import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { UserTypes } from 'src/modules/user/enums';

export class UserLoginDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  // Note: Password length validation removed intentionally for login
  // Password policies should only be enforced during signup/password change
  // Existing users with legacy passwords (outside current policy) must still be able to log in
  @ApiProperty({
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: UserTypes, default: UserTypes.CUSTOMER })
  @IsEnum(UserTypes)
  account_type: UserTypes;
}
