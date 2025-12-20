import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AccessToken, VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';
import { Env } from '../shared/constants';
import { CourseService } from '../course/course.service';
import { UserDocument } from '../user/schemas';
import { UserTypes } from '../user/enums';
import { FilterQuery } from 'mongoose';
import { CourseDocument } from '../course/schemas';

@Injectable()
export class AiService {
  constructor(private readonly courseService: CourseService) {}

  generateRoomName(
    courseId: string,
    moduleNumber: number,
    lessonNumber: string,
  ): string {
    return `course-${courseId}-module-${moduleNumber}-lesson-${lessonNumber}`;
  }

  async validateCourseAccess(
    user: UserDocument,
    courseId: string,
    moduleNumber: number,
    lessonNumber: string,
  ): Promise<CourseDocument> {
    const filter: FilterQuery<CourseDocument> = {
      _id: courseId,
    };

    if (user.account_type !== UserTypes.STAFF) {
      filter.user = user._id;
    }

    const course = await this.courseService.getCourse(filter);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const module = course.modules?.find(
      (m) => m.module_number === moduleNumber,
    );
    if (!module) {
      throw new NotFoundException(`Module ${moduleNumber} not found in course`);
    }

    const lesson = module.lessons?.find(
      (l) => l.lesson_number === lessonNumber,
    );
    if (!lesson) {
      throw new NotFoundException(
        `Lesson ${lessonNumber} not found in module ${moduleNumber}`,
      );
    }

    return course;
  }

  async generateLiveKitToken(
    user: UserDocument,
    roomName: string,
  ): Promise<string> {
    if (!Env.LIVEKIT_API_KEY || !Env.LIVEKIT_API_SECRET) {
      throw new BadRequestException(
        'LiveKit credentials not configured on server',
      );
    }

    const identity = `user-${user._id.toString()}`;
    const name = `${user.firstname} ${user.lastname}`.trim() || identity;

    const at = new AccessToken(Env.LIVEKIT_API_KEY, Env.LIVEKIT_API_SECRET, {
      identity,
      name,
      ttl: '15m',
    });

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };

    at.addGrant(grant);

    at.roomConfig = new RoomConfiguration({
      agents: [{ agentName: 'eduflex-ai-agent' }],
    });

    return await at.toJwt();
  }
}
