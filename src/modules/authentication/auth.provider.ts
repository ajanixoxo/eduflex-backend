import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { EmailService, UtilService } from '../shared/services';
import { SystemService } from '../system/system.service';
import {
  CreateAccountDto,
  RefreshTokenDto,
  RequestOtpDto,
  UpdatePasswordDto,
  UserLoginDto,
  VerifyOtpDto,
} from './dtos';
import { IApiResponseDto } from '../shared/types';
import { UserStatus, UserTypes } from '../user/enums';
import {
  ACCESS_TOKEN_EXPIRES,
  isDev,
  REFRESH_TOKEN_EXPIRES,
} from '../shared/constants';
import { OtpTemplate } from 'src/email/templates/auth/otp.template';
import { ForgotPasswordTemplate } from 'src/email/templates/auth/forgot-password.template';
import { UserDocument } from '../user/schemas';
import { PasswordResetConfirmationTemplate } from 'src/email/templates/auth/password-updated.template';
import { addMinutes } from 'date-fns';

@Injectable()
export class AuthProvider {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly utilService: UtilService,
    private readonly systemService: SystemService,
    private readonly emailService: EmailService,
  ) {}

  async loginAccount(userLoginDto: UserLoginDto): Promise<IApiResponseDto> {
    try {
      const { email, password, account_type } = userLoginDto;

      // Use case-insensitive email lookup to handle legacy users with mixed-case emails
      const user = await this.userService.getUser({
        email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      // Security: Don't reveal if email exists - use same error message as wrong password
      if (!user) throw new UnauthorizedException('Invalid credentials');

      if (
        account_type === UserTypes.CUSTOMER &&
        user.account_type !== UserTypes.CUSTOMER
      ) {
        throw new UnauthorizedException("Can't log into user dashboard");
      }

      if (
        account_type === UserTypes.STAFF &&
        user.account_type !== UserTypes.STAFF
      ) {
        throw new UnauthorizedException("Can't log into admin dashboard");
      }

      if (user.status === UserStatus.BANNED) {
        throw new ForbiddenException('Your account is banned');
      }

      const userAuth = await this.authService.getUserAuth({ user: user._id });
      if (!userAuth) {
        throw new ForbiddenException(
          'There was an issue logging you into your account. Please contact support if the issue persists.',
        );
      }

      const isValid = await this.utilService.comparePassword(
        password,
        userAuth.password,
      );
      if (!isValid) throw new UnauthorizedException('Invalid credentials');

      const [access_token, refresh_token] = await Promise.all([
        this.authService.getToken({
          sub: user._id.toString(),
          isAccessToken: true,
          exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRES,
        }),
        this.authService.getToken({
          sub: user._id.toString(),
          isAccessToken: false,
          exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRES,
        }),
      ]);

      userAuth.token_hash = await this.utilService.hashPassword(refresh_token);
      await userAuth.save();

      return {
        message: 'Login successful',
        data: {
          user,
          tokens: { access_token, refresh_token },
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal Server Error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async createUserAccount(
    createAccountDto: CreateAccountDto,
  ): Promise<IApiResponseDto> {
    try {
      const { email, phone, password, country } = createAccountDto;
      const userExists = await this.userService.getUser({
        $or: [{ email }, { phone }],
      });
      if (userExists) {
        throw new BadRequestException(
          'User with email or phone number already exists',
        );
      }
      const validCountry = this.systemService.getCountry(country.code);
      if (!validCountry) {
        throw new BadRequestException('Unsupported Country');
      }
      const hashedPassword = await this.utilService.hashPassword(password);
      const username = await this.userService.generateUsername();
      const userDetails = {
        ...createAccountDto,
        country: validCountry,
        password: hashedPassword,
        username,
      };
      const user = await this.userService.createUser(userDetails);
      await this.authService.createUserAuth({
        user,
        password: hashedPassword,
      });
      return {
        message: 'Account Creation Successful!',
        data: {
          user,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create account');
    }
  }
  async resendOtp(requestOtpDto: RequestOtpDto): Promise<IApiResponseDto> {
    try {
      const { email } = requestOtpDto;

      const user = await this.userService.getUser({ email });
      if (!user) {
        throw new NotFoundException('User does not exist');
      }

      if (user.is_email_verified) {
        throw new BadRequestException('User already verified');
      }

      const otp = await this.authService.generateAndSaveOtp(user);
      void this.emailService.sendEmailNotification({
        email: user.email,
        subject: 'OTP Verification',
        body: OtpTemplate({
          user,
          params: {
            code: otp.code,
          },
        }),
      });
      return {
        message: `Otp has been sent to your registered email`,
        data: isDev && { otp: otp.code },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to resend OTP',
      );
    }
  }
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<IApiResponseDto> {
    try {
      const { email, otp } = verifyOtpDto;
      const user = await this.userService.getUser({ email });

      if (!user) {
        throw new NotFoundException(`No user with this email was found`);
      }
      if (user.is_email_verified) {
        throw new BadRequestException('User Email Already Verified');
      }

      const otpVerified = await this.authService.isOtpValid({
        user,
        otp,
      });

      if (!otpVerified) {
        throw new BadRequestException('OTP incorrect or expired');
      }

      const updatePayload: any = {
        status: UserStatus.VERIFIED,
        is_email_verified: true,
      };

      await this.userService.updateUser({ _id: user._id }, updatePayload);

      const userAuth = await this.authService.getUserAuth({ user: user._id });
      if (!userAuth) {
        throw new InternalServerErrorException(
          'Unable to verify OTP. Please contact support!',
        );
      }
      const [access_token, refresh_token] = await Promise.all([
        this.authService.getToken({
          sub: user._id.toString(),
          isAccessToken: true,
          exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRES,
        }),
        this.authService.getToken({
          sub: user._id.toString(),
          isAccessToken: false,
          exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRES,
        }),
      ]);

      userAuth.token_hash = await this.utilService.hashPassword(refresh_token);
      await userAuth.save();

      return {
        message: 'Account Verification Successful!',
        data: {
          user,
          tokens: { access_token, refresh_token },
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to verify OTP',
      );
    }
  }
  async requestPasswordReset(
    requestOtpDto: RequestOtpDto,
  ): Promise<IApiResponseDto> {
    try {
      const { email } = requestOtpDto;

      const user = await this.userService.getUser({ email });

      if (!user) {
        throw new NotFoundException(`User with that email not found`);
      }

      const otp = await this.authService.generateAndSaveOtp(user);
      void this.emailService.sendEmailNotification({
        email: user.email,
        subject: 'Password Reset',
        body: ForgotPasswordTemplate({
          user,
          params: { code: otp.code },
        }),
      });

      return {
        message: `OTP has been sent to your registered email`,
        data: isDev && { otp: otp.code },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to request password reset',
      );
    }
  }
  async verifyResetOtp(verifyOtpDto: VerifyOtpDto): Promise<IApiResponseDto> {
    try {
      const { email, otp } = verifyOtpDto;
      const user = await this.userService.getUser({ email });

      if (!user) throw new NotFoundException('User not found');

      const otpVerified = await this.authService.isOtpValid({ user, otp });
      if (!otpVerified) {
        throw new BadRequestException('OTP is invalid or has expired');
      }

      const userAuth = await this.authService.getUserAuth({ user: user._id });
      if (!userAuth) {
        throw new InternalServerErrorException('User authentication not found');
      }

      const tokenValue = this.utilService.generateUniqueCode('x2', 15);
      const expiresAt = addMinutes(new Date(), 15);

      userAuth.reset_token = {
        value: tokenValue,
        expires: expiresAt,
      };

      await userAuth.save();

      return {
        message: 'OTP verified. Use reset token to reset your password.',
        data: isDev && { reset_token: tokenValue },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error.message || 'Failed to verify reset OTP',
      );
    }
  }
  async resetPassword(
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<IApiResponseDto> {
    try {
      const { email, password, confirm_password, reset_token } =
        updatePasswordDto;

      if (password !== confirm_password) {
        throw new BadRequestException('Passwords do not match');
      }

      const user = await this.userService.getUser({ email });
      if (!user) throw new NotFoundException('User does not exist');

      const userAuth = await this.authService.getUserAuth({ user: user._id });
      if (!userAuth || !userAuth.reset_token) {
        throw new BadRequestException('Reset token not found or expired');
      }

      const { value, expires } = userAuth.reset_token;

      if (value !== reset_token) {
        throw new UnauthorizedException('Invalid reset token');
      }

      if (expires && expires < new Date()) {
        throw new BadRequestException('Reset token has expired');
      }

      const hashedPassword = await this.utilService.hashPassword(password);
      userAuth.password = hashedPassword;

      userAuth.reset_token = undefined;
      await userAuth.save();

      void this.emailService.sendEmailNotification({
        email: user.email,
        subject: 'Password Updated!',
        body: PasswordResetConfirmationTemplate({ user }),
      });

      return {
        message: 'Password updated successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error.message || 'Failed to reset password',
      );
    }
  }
  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<IApiResponseDto> {
    const payload = await this.authService.verifyToken(
      refreshTokenDto.refresh_token,
    );
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token');
    }
    const userAuth = await this.authService.getUserAuth({
      user: payload.sub,
    });
    if (!userAuth || !userAuth.token_hash) {
      throw new ForbiddenException('Invalid user authentication');
    }
    const isValid = await this.utilService.comparePassword(
      refreshTokenDto.refresh_token,
      userAuth.token_hash,
    );
    console.log(isValid, refreshTokenDto.refresh_token, userAuth.token_hash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const [access_token, refresh_token] = await Promise.all([
      this.authService.getToken({
        sub: userAuth.user._id.toString(),
        isAccessToken: true,
        exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRES,
      }),
      this.authService.getToken({
        sub: userAuth.user._id.toString(),
        isAccessToken: false,
        exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRES,
      }),
    ]);
    userAuth.token_hash = await this.utilService.hashPassword(refresh_token);
    await userAuth.save();

    return {
      message: 'Tokens Refreshed',
      data: { tokens: { access_token, refresh_token } },
    };
  }
}
