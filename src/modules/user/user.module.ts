import { Module, forwardRef } from '@nestjs/common';
import { UserSchema, User } from './schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../authentication/auth.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserProvider } from './user.provider';
import { MediaModule } from '../media/media.module';
@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => MediaModule),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, UserProvider],
  exports: [UserService],
})
export class UsersModule {}
