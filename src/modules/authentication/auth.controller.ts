import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthProvider } from './auth.provider';
import { IsPublic } from 'src/decorators';
import {
  CreateAccountDto,
  RefreshTokenDto,
  RequestOtpDto,
  UpdatePasswordDto,
  UserLoginDto,
  VerifyOtpDto,
} from './dtos';

@Controller('auth')
@ApiTags('Authentication')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authProvider: AuthProvider) {}

  @Post('login')
  @IsPublic()
  async loginAccount(@Body() loginAccountDto: UserLoginDto) {
    return this.authProvider.loginAccount(loginAccountDto);
  }

  @Post('signup')
  @IsPublic()
  async createAccount(@Body() createAccountDto: CreateAccountDto) {
    return this.authProvider.createUserAccount(createAccountDto);
  }

  @Post('otp/resend')
  @IsPublic()
  async resendOtp(@Body() requestDto: RequestOtpDto) {
    return this.authProvider.resendOtp(requestDto);
  }

  @Post('otp/verify')
  @IsPublic()
  async verifyEmailOtp(@Body() verifyDto: VerifyOtpDto) {
    return this.authProvider.verifyOtp(verifyDto);
  }

  @Post('password/forgot')
  @IsPublic()
  async requestPasswordResetByEmail(@Body() requestDto: RequestOtpDto) {
    return this.authProvider.requestPasswordReset(requestDto);
  }

  @Post('password/verify-reset-otp')
  @IsPublic()
  async verifyResetOtp(@Body() verifyDto: VerifyOtpDto) {
    return this.authProvider.verifyResetOtp(verifyDto);
  }

  @Post('password/reset')
  @IsPublic()
  async resetPassword(@Body() updateDto: UpdatePasswordDto) {
    return this.authProvider.resetPassword(updateDto);
  }

  @Post('tokens/refresh')
  @IsPublic()
  async refreshTokens(@Body() updateDto: RefreshTokenDto) {
    return this.authProvider.refreshTokens(updateDto);
  }
}
