import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import ical, { ICalCalendar, ICalEventRepeatingFreq, ICalAlarmType } from 'ical-generator';
import {
  CalendarSubscription,
  CalendarSubscriptionDocument,
} from './schemas';
import { Course, CourseDocument } from '../course/schemas';
import { UserDocument } from '../user/schemas';
import { Env } from '../shared/constants';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(CalendarSubscription.name)
    private readonly subscriptionModel: Model<CalendarSubscriptionDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
  ) {}

  /**
   * Get or create a calendar subscription for a user
   */
  async getOrCreateSubscription(userId: string): Promise<CalendarSubscriptionDocument> {
    let subscription = await this.subscriptionModel.findOne({ user: userId });

    if (!subscription) {
      subscription = new this.subscriptionModel({
        user: userId,
        token: uuidv4(),
        is_active: true,
      });
      await subscription.save();
    }

    return subscription;
  }

  /**
   * Get subscription by token
   */
  async getSubscriptionByToken(token: string): Promise<CalendarSubscriptionDocument | null> {
    const subscription = await this.subscriptionModel
      .findOne({ token, is_active: true })
      .populate('user');

    if (subscription) {
      // Update last accessed time
      subscription.last_accessed = new Date();
      await subscription.save();
    }

    return subscription;
  }

  /**
   * Generate subscription URL for a user
   */
  getSubscriptionUrl(token: string): string {
    // Use the backend API URL for calendar subscriptions
    const apiUrl = Env.API_BASE_URL?.replace('https://', '').replace('http://', '') || 'eduflexbackend.funtech.dev/api-gateway/v1';
    return `webcal://${apiUrl}/calendar/subscribe/${token}`;
  }

  /**
   * Generate iCal feed for all user's courses
   */
  async generateUserCalendar(userId: string): Promise<string> {
    const courses = await this.courseModel.find({
      user: userId,
      scheduled_start_date: { $exists: true },
      daily_lesson_time: { $exists: true },
      status: { $ne: 'completed' },
    });

    const calendar = ical({
      name: 'EduFlex AI - Learning Schedule',
      description: 'Your personalized learning schedule from EduFlex AI',
      timezone: 'Africa/Lagos',
      prodId: { company: 'EduFlex AI', product: 'Learning Calendar' },
    });

    for (const course of courses) {
      this.addCourseEvents(calendar, course);
    }

    // If no courses with schedules, add a placeholder event
    if (courses.length === 0) {
      const now = new Date();
      calendar.createEvent({
        start: now,
        end: new Date(now.getTime() + 30 * 60 * 1000),
        summary: '📚 Set up your EduFlex schedule!',
        description: 'Visit EduFlex AI to create a course with a learning schedule. Your events will appear here automatically!',
      });
    }

    return calendar.toString();
  }

  /**
   * Generate iCal for a single course
   */
  async generateCourseCalendar(courseId: string, userId: string): Promise<string> {
    const course = await this.courseModel.findOne({
      _id: courseId,
      user: userId,
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const calendar = ical({
      name: `EduFlex AI - ${course.title}`,
      description: `Learning schedule for ${course.title}`,
      timezone: course.timezone || 'Africa/Lagos',
      prodId: { company: 'EduFlex AI', product: 'Learning Calendar' },
    });

    this.addCourseEvents(calendar, course);

    return calendar.toString();
  }

  /**
   * Add course events to calendar
   */
  private addCourseEvents(calendar: ICalCalendar, course: CourseDocument): void {
    if (!course.scheduled_start_date || !course.daily_lesson_time) {
      return;
    }

    const webUrl = Env.WEB_APP_URL || 'https://eduflexai.com';
    const courseUrl = `${webUrl}/courses/${(course as any)._id}/ai`;

    // Parse daily lesson time (HH:mm format)
    const [hours, minutes] = course.daily_lesson_time.split(':').map(Number);

    // Calculate end date (target_completion or 30 days from start)
    const startDate = new Date(course.scheduled_start_date);
    const endDate = course.target_completion
      ? new Date(course.target_completion)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Create event start time
    const eventStart = new Date(startDate);
    eventStart.setHours(hours, minutes, 0, 0);

    // Duration based on time_dedication (default 30 minutes)
    let durationMinutes = 30;
    if (course.time_dedication) {
      const match = course.time_dedication.match(/(\d+)/);
      if (match) {
        const value = parseInt(match[1], 10);
        if (course.time_dedication.includes('h')) {
          durationMinutes = value * 60;
        } else {
          durationMinutes = value;
        }
      }
    }

    const eventEnd = new Date(eventStart);
    eventEnd.setMinutes(eventEnd.getMinutes() + durationMinutes);

    // Create recurring event
    calendar.createEvent({
      start: eventStart,
      end: eventEnd,
      summary: `📚 ${course.title}`,
      description: `Continue your learning journey with EduFlex AI!\n\nCourse: ${course.title}\nLevel: ${course.experience_level || 'Beginner'}\n\nClick to start: ${courseUrl}`,
      location: courseUrl,
      url: courseUrl,
      repeating: {
        freq: ICalEventRepeatingFreq.DAILY,
        until: endDate,
      },
      alarms: [
        {
          type: ICalAlarmType.display,
          trigger: 30 * 60, // 30 minutes before (in seconds)
          description: `Your lesson in "${course.title}" starts in 30 minutes!`,
        },
        {
          type: ICalAlarmType.display,
          trigger: 0, // At event time
          description: `It's time for your lesson in "${course.title}"!`,
        },
      ],
    });
  }

  /**
   * Revoke a subscription
   */
  async revokeSubscription(userId: string): Promise<boolean> {
    const result = await this.subscriptionModel.updateOne(
      { user: userId },
      { is_active: false },
    );
    return result.modifiedCount > 0;
  }

  /**
   * Regenerate subscription token
   */
  async regenerateToken(userId: string): Promise<CalendarSubscriptionDocument> {
    let subscription = await this.subscriptionModel.findOne({ user: userId });

    if (subscription) {
      subscription.token = uuidv4();
      subscription.is_active = true;
      await subscription.save();
    } else {
      subscription = new this.subscriptionModel({
        user: userId,
        token: uuidv4(),
        is_active: true,
      });
      await subscription.save();
    }

    return subscription;
  }
}
