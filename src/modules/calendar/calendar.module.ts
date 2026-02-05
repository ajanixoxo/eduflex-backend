import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CalendarSubscription,
  CalendarSubscriptionSchema,
} from './schemas';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { Course, CourseSchema } from '../course/schemas/course.schema';
import { User, UserSchema } from '../user/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarSubscription.name, schema: CalendarSubscriptionSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
