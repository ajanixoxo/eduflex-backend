import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ScheduledNotification,
  ScheduledNotificationSchema,
} from './schemas';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { SharedModule } from '../shared/shared.module';
import { Course, CourseSchema } from '../course/schemas/course.schema';
import { User, UserSchema } from '../user/schemas';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: ScheduledNotification.name, schema: ScheduledNotificationSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [NotificationsService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
