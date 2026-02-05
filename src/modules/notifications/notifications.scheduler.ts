import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationsService } from './notifications.service';
import { NotificationStatus, NotificationType } from './schemas';
import { Course, CourseDocument } from '../course/schemas';
import { User, UserDocument } from '../user/schemas';
import { EmailService } from '../shared/services';
import { LessonReminderTemplate, LessonStartTemplate } from 'src/email/templates/notifications';
import { Env } from '../shared/constants';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Process pending notifications every minute
   * Sends emails for notifications that are due
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processNotifications() {
    try {
      const now = new Date();
      const pendingNotifications = await this.notificationsService.findPendingNotifications(now);

      if (pendingNotifications.length === 0) return;

      this.logger.log(`Processing ${pendingNotifications.length} pending notifications`);

      for (const notification of pendingNotifications) {
        try {
          await this.sendNotificationEmail(notification);
          await this.notificationsService.updateNotificationStatus(
            (notification as any)._id.toString(),
            NotificationStatus.SENT,
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to send notification ${(notification as any)._id}: ${error.message}`,
          );
          await this.notificationsService.updateNotificationStatus(
            (notification as any)._id.toString(),
            NotificationStatus.FAILED,
            error.message,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(`Error processing notifications: ${error.message}`);
    }
  }

  /**
   * Generate notifications for the next 24 hours at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyNotifications() {
    try {
      this.logger.log('Generating daily notifications');

      // Find all active courses with scheduling enabled
      const courses = await this.courseModel
        .find({
          scheduled_start_date: { $exists: true },
          daily_lesson_time: { $exists: true },
          notifications_enabled: true,
          status: { $ne: 'completed' },
        })
        .populate('user');

      let totalGenerated = 0;

      for (const course of courses) {
        try {
          const user = course.user as UserDocument;
          if (!user || !user.notification_preferences?.lesson_reminders) continue;

          const count = await this.notificationsService.generateNotificationsForCourse(
            course,
            user,
            1, // Generate for next 24 hours
          );
          totalGenerated += count;
        } catch (error: any) {
          this.logger.error(
            `Error generating notifications for course ${(course as any)._id}: ${error.message}`,
          );
        }
      }

      this.logger.log(`Generated ${totalGenerated} notifications`);
    } catch (error: any) {
      this.logger.error(`Error in daily notification generation: ${error.message}`);
    }
  }

  /**
   * Clean up old sent notifications at 3 AM
   */
  @Cron('0 3 * * *')
  async cleanupOldNotifications() {
    try {
      // Delete notifications older than 7 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      const deletedCount = await this.notificationsService.deleteOldNotifications(cutoffDate);
      this.logger.log(`Cleaned up ${deletedCount} old notifications`);
    } catch (error: any) {
      this.logger.error(`Error cleaning up notifications: ${error.message}`);
    }
  }

  /**
   * Send notification email based on type
   */
  private async sendNotificationEmail(notification: any): Promise<void> {
    const user = notification.user;
    const course = notification.course;

    if (!user?.email) {
      throw new Error('User email not found');
    }

    const webUrl = Env.WEB_APP_URL || 'https://eduflexai.com';
    const courseUrl = `${webUrl}/courses/${(course as any)._id}/ai`;
    const unsubscribeUrl = `${webUrl}/settings/notifications`;

    // Format the lesson time
    const scheduledTime = new Date(notification.scheduled_time);
    const lessonTime = scheduledTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const templateParams = {
      courseTitle: course.title,
      lessonTime,
      courseUrl,
      unsubscribeUrl,
    };

    let subject: string;
    let body: string;

    if (notification.notification_type === NotificationType.REMINDER) {
      subject = `Reminder: Your lesson in "${course.title}" starts in 30 minutes`;
      body = LessonReminderTemplate({ user, params: templateParams });
    } else {
      subject = `It's time for your lesson in "${course.title}"`;
      body = LessonStartTemplate({ user, params: templateParams });
    }

    await this.emailService.sendEmailNotification({
      email: user.email,
      subject,
      body,
    });
  }
}
