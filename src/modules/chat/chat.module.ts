import { forwardRef, Module } from '@nestjs/common';
import { UsersModule } from '../user/user.module';
import { CourseModule } from '../course/course.module';
import { MediaModule } from '../media/media.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatMessage, ChatMessageSchema } from './schemas';
import { ChatController } from './chat.controller';
import { ChatProvider } from './chat.provider';
import { ChatService } from './chat.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => CourseModule),
    forwardRef(() => MediaModule),
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatProvider, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
