import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { CalendarService } from './calendar.service';
import { Auth, IsPublic } from 'src/decorators';
import type { UserDocument } from '../user/schemas';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * Get or create calendar subscription URL for authenticated user
   * Returns the webcal:// URL for calendar apps
   */
  @Get('subscription-url')
  async getSubscriptionUrl(@Auth() user: UserDocument) {
    const subscription = await this.calendarService.getOrCreateSubscription(
      (user as any)._id.toString(),
    );

    const url = this.calendarService.getSubscriptionUrl(subscription.token);

    return {
      message: 'Calendar subscription URL generated',
      data: {
        url,
        token: subscription.token,
        instructions: {
          google:
            'Open Google Calendar → Settings → Add calendar → From URL → Paste the URL',
          apple: 'Click the link or open Calendar app → File → New Calendar Subscription → Paste URL',
          outlook:
            'Open Outlook → Calendar → Add calendar → Subscribe from web → Paste URL',
        },
      },
    };
  }

  /**
   * Public endpoint for calendar subscription (token-based auth)
   * Calendar apps will periodically fetch this to get updates
   */
  @Get('subscribe/:token')
  @IsPublic()
  async getCalendarFeed(@Param('token') token: string, @Res() res: Response) {
    const subscription = await this.calendarService.getSubscriptionByToken(token);

    if (!subscription) {
      throw new NotFoundException('Calendar subscription not found or inactive');
    }

    const user = subscription.user as UserDocument;
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const icalContent = await this.calendarService.generateUserCalendar(
      (user as any)._id.toString(),
    );

    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="eduflex-schedule.ics"',
    });

    return res.send(icalContent);
  }

  /**
   * Download iCal file for a specific course
   */
  @Get('course/:courseId/download')
  async downloadCourseCalendar(
    @Param('courseId') courseId: string,
    @Auth() user: UserDocument,
    @Res() res: Response,
  ) {
    try {
      const icalContent = await this.calendarService.generateCourseCalendar(
        courseId,
        (user as any)._id.toString(),
      );

      res.set({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="eduflex-course-${courseId}.ics"`,
      });

      return res.send(icalContent);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Regenerate calendar subscription token
   * Use this if the old token was compromised
   */
  @Get('regenerate-token')
  async regenerateToken(@Auth() user: UserDocument) {
    const subscription = await this.calendarService.regenerateToken(
      (user as any)._id.toString(),
    );

    const url = this.calendarService.getSubscriptionUrl(subscription.token);

    return {
      message: 'Calendar subscription token regenerated',
      data: {
        url,
        token: subscription.token,
        note: 'Your old calendar subscription URL will no longer work. Please update your calendar apps with the new URL.',
      },
    };
  }

  /**
   * Revoke calendar subscription
   */
  @Get('revoke')
  async revokeSubscription(@Auth() user: UserDocument) {
    const revoked = await this.calendarService.revokeSubscription(
      (user as any)._id.toString(),
    );

    return {
      message: revoked
        ? 'Calendar subscription revoked successfully'
        : 'No active subscription found',
      data: { revoked },
    };
  }
}
