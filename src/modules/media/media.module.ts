import { MongooseModule } from '@nestjs/mongoose';
import {
  AIAvatar,
  AIAvatarSchema,
  AIVoice,
  AIVoiceSchema,
  Media,
  MediaSchema,
} from './schemas';
import { MediaProvider } from './media.provider';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { forwardRef, Module } from '@nestjs/common';
import { UsersModule } from '../user/user.module';
import { CourseModule } from '../course/course.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => CourseModule),
    MongooseModule.forFeature([
      {
        name: Media.name,
        schema: MediaSchema,
      },
      {
        name: AIAvatar.name,
        schema: AIAvatarSchema,
      },
      {
        name: AIVoice.name,
        schema: AIVoiceSchema,
      },
    ]),
  ],
  providers: [MediaProvider, MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
