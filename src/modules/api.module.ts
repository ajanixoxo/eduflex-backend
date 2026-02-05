import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { AuthModule } from './authentication/auth.module';
import { UsersModule } from './user/user.module';
import { SystemModule } from './system/system.module';
import { CourseModule } from './course/course.module';
import { MediaModule } from './media/media.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CourseModule,
    ChatModule,
    MediaModule,
    SystemModule,
    AiModule,
    NotificationsModule,
    CalendarModule,
  ],
  providers: [ApiService],
  controllers: [ApiController],
})
export class ApiModule {}
