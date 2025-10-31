import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OTP, OTPSchema, UserAuth, UserAuthSchema } from './schemas';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthProvider } from './auth.provider';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { SystemModule } from '../system/system.module';
import { UsersModule } from '../user/user.module';
import { Env } from '../shared/constants';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => SystemModule),
    MongooseModule.forFeature([
      {
        name: UserAuth.name,
        schema: UserAuthSchema,
      },
      {
        name: OTP.name,
        schema: OTPSchema,
      },
    ]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: Env.JWT_SECRET,
      }),
    }),
  ],
  providers: [
    AuthService,
    AuthProvider,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
