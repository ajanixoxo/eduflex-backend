import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseDocument } from 'src/modules/shared/types';
import { User, type UserDocument } from 'src/modules/user/schemas';
import { Course, type CourseDocument } from 'src/modules/course/schemas';

export enum NotificationType {
  REMINDER = 'reminder', // 30 min before
  LESSON_START = 'lesson_start', // At lesson time
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class ScheduledNotification {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  user: UserDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Course.name,
    required: true,
    index: true,
  })
  course: CourseDocument;

  @Prop({ type: Date, required: true, index: true })
  scheduled_time: Date;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    required: true,
  })
  notification_type: NotificationType;

  @Prop({
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
    index: true,
  })
  status: NotificationStatus;

  @Prop({ type: Date })
  sent_at?: Date;

  @Prop({ type: String })
  error_message?: string;

  @Prop({ type: Number, default: 0 })
  retry_count: number;
}

export const ScheduledNotificationSchema =
  SchemaFactory.createForClass(ScheduledNotification);

// Add compound index for efficient queries
ScheduledNotificationSchema.index({ status: 1, scheduled_time: 1 });
ScheduledNotificationSchema.index({ user: 1, course: 1, scheduled_time: 1 });

export type ScheduledNotificationDocument = BaseDocument & ScheduledNotification;
