import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import {
  ScheduledNotification,
  ScheduledNotificationDocument,
  NotificationType,
  NotificationStatus,
} from './schemas';
import { CourseDocument } from '../course/schemas';
import { UserDocument } from '../user/schemas';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(ScheduledNotification.name)
    private readonly notificationModel: Model<ScheduledNotificationDocument>,
  ) {}

  async createNotification(
    data: Partial<ScheduledNotification>,
  ): Promise<ScheduledNotificationDocument> {
    const notification = new this.notificationModel(data);
    return notification.save();
  }

  async createNotifications(
    data: Partial<ScheduledNotification>[],
  ): Promise<ScheduledNotificationDocument[]> {
    const inserted = await this.notificationModel.insertMany(data);
    return inserted as unknown as ScheduledNotificationDocument[];
  }

  async findPendingNotifications(
    beforeTime: Date,
  ): Promise<ScheduledNotificationDocument[]> {
    return this.notificationModel
      .find({
        status: NotificationStatus.PENDING,
        scheduled_time: { $lte: beforeTime },
      })
      .populate('user')
      .populate('course')
      .sort({ scheduled_time: 1 })
      .limit(100); // Process in batches
  }

  async updateNotificationStatus(
    id: string,
    status: NotificationStatus,
    errorMessage?: string,
  ): Promise<ScheduledNotificationDocument | null> {
    const update: any = {
      status,
      ...(status === NotificationStatus.SENT && { sent_at: new Date() }),
      ...(errorMessage && { error_message: errorMessage }),
    };

    if (status === NotificationStatus.FAILED) {
      update.$inc = { retry_count: 1 };
    }

    return this.notificationModel.findByIdAndUpdate(id, update, { new: true });
  }

  async findNotificationsForCourse(
    courseId: string,
    options?: { status?: NotificationStatus },
  ): Promise<ScheduledNotificationDocument[]> {
    const filter: FilterQuery<ScheduledNotificationDocument> = {
      course: courseId,
      ...(options?.status && { status: options.status }),
    };
    return this.notificationModel.find(filter).sort({ scheduled_time: 1 });
  }

  async deleteNotificationsForCourse(courseId: string): Promise<number> {
    const result = await this.notificationModel.deleteMany({ course: courseId });
    return result.deletedCount || 0;
  }

  async deleteOldNotifications(olderThan: Date): Promise<number> {
    const result = await this.notificationModel.deleteMany({
      status: NotificationStatus.SENT,
      sent_at: { $lt: olderThan },
    });
    return result.deletedCount || 0;
  }

  async hasExistingNotification(
    userId: string,
    courseId: string,
    scheduledTime: Date,
    notificationType: NotificationType,
  ): Promise<boolean> {
    const existing = await this.notificationModel.findOne({
      user: userId,
      course: courseId,
      scheduled_time: scheduledTime,
      notification_type: notificationType,
    });
    return !!existing;
  }

  /**
   * Generate notifications for a course for the next N days
   */
  async generateNotificationsForCourse(
    course: CourseDocument,
    user: UserDocument,
    daysAhead: number = 1,
  ): Promise<number> {
    if (
      !course.scheduled_start_date ||
      !course.daily_lesson_time ||
      !course.notifications_enabled
    ) {
      return 0;
    }

    const now = new Date();
    const courseStartDate = new Date(course.scheduled_start_date);

    // Don't generate if course hasn't started yet
    if (courseStartDate > now) {
      // But generate for the start date if it's within daysAhead
      const msAhead = daysAhead * 24 * 60 * 60 * 1000;
      if (courseStartDate.getTime() - now.getTime() > msAhead) {
        return 0;
      }
    }

    // Parse daily lesson time (HH:mm format)
    const [hours, minutes] = course.daily_lesson_time.split(':').map(Number);
    const timezone = course.timezone || user.timezone || 'Africa/Lagos';

    const notifications: Partial<ScheduledNotification>[] = [];
    const reminderMinutes = user.notification_preferences?.reminder_minutes_before || 30;

    for (let day = 0; day < daysAhead; day++) {
      const lessonDate = new Date(now);
      lessonDate.setDate(lessonDate.getDate() + day);
      lessonDate.setHours(hours, minutes, 0, 0);

      // Skip if this time has already passed
      if (lessonDate <= now) continue;

      // Skip if before course start date
      if (lessonDate < courseStartDate) continue;

      // Create reminder notification (30 min before)
      const reminderTime = new Date(lessonDate);
      reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);

      if (reminderTime > now) {
        const hasReminder = await this.hasExistingNotification(
          (user as any)._id.toString(),
          (course as any)._id.toString(),
          reminderTime,
          NotificationType.REMINDER,
        );

        if (!hasReminder) {
          notifications.push({
            user: user as any,
            course: course as any,
            scheduled_time: reminderTime,
            notification_type: NotificationType.REMINDER,
            status: NotificationStatus.PENDING,
          });
        }
      }

      // Create lesson start notification
      const hasLessonStart = await this.hasExistingNotification(
        (user as any)._id.toString(),
        (course as any)._id.toString(),
        lessonDate,
        NotificationType.LESSON_START,
      );

      if (!hasLessonStart) {
        notifications.push({
          user: user as any,
          course: course as any,
          scheduled_time: lessonDate,
          notification_type: NotificationType.LESSON_START,
          status: NotificationStatus.PENDING,
        });
      }
    }

    if (notifications.length > 0) {
      await this.createNotifications(notifications);
    }

    return notifications.length;
  }
}
