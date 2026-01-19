import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AccessToken, VideoGrant, AgentDispatchClient } from 'livekit-server-sdk';
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

  /**
   * Dispatch the AI agent to a room
   * This is needed for agents using explicit dispatch mode (@server.rtc_session)
   */
  async dispatchAgent(roomName: string): Promise<void> {
    if (!Env.LIVEKIT_API_KEY || !Env.LIVEKIT_API_SECRET || !Env.LIVEKIT_URL) {
      console.error('LiveKit credentials not configured for agent dispatch');
      return;
    }

    try {
      const client = new AgentDispatchClient(
        Env.LIVEKIT_URL,
        Env.LIVEKIT_API_KEY,
        Env.LIVEKIT_API_SECRET,
      );

      await client.createDispatch(roomName, 'eduflex-ai-agent');
      console.log(`Agent dispatched to room: ${roomName}`);
    } catch (error) {
      // Log but don't throw - agent might already be dispatched or room config handles it
      console.error('Agent dispatch error (may be expected):', error?.message);
    }
  }

  /**
   * Parse room name to extract course ID, module number, and lesson number
   * Format: course-{courseId}-module-{moduleNumber}-lesson-{lessonNumber}
   */
  parseRoomName(roomName: string): {
    courseId: string;
    moduleNumber: number;
    lessonNumber: string;
  } {
    const pattern = /^course-(.+)-module-(\d+)-lesson-(.+)$/;
    const match = roomName.match(pattern);

    if (!match) {
      throw new BadRequestException(
        `Invalid room name format. Expected: course-{courseId}-module-{moduleNumber}-lesson-{lessonNumber}, got: ${roomName}`,
      );
    }

    return {
      courseId: match[1],
      moduleNumber: parseInt(match[2], 10),
      lessonNumber: match[3],
    };
  }

  /**
   * Get room context for AI agent
   * Returns course, module, and lesson information for the agent to use
   */
  async getRoomContext(roomName: string): Promise<{
    course_id: string;
    course_title: string;
    course_topic: string;
    course_reason?: string;
    module_number: number;
    module_title: string;
    lesson_number: string;
    lesson_title: string;
    lesson_type: string;
    course_language?: string;
    course_teaching_style?: string;
    course_pace?: string;
    course_experience_level?: string;
    voice_id?: string;
    voice_type?: string;
    voice_name?: string;
    avatar_url?: string;
  }> {
    // Parse room name
    const { courseId, moduleNumber, lessonNumber } =
      this.parseRoomName(roomName);

    // Get course (with ai_voice and ai_avatar populated)
    const course = await this.courseService.getCourse({ _id: courseId });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Find module
    const module = course.modules?.find(
      (m) => m.module_number === moduleNumber,
    );
    if (!module) {
      throw new NotFoundException(
        `Module ${moduleNumber} not found in course ${courseId}`,
      );
    }

    // Find lesson
    const lesson = module.lessons?.find(
      (l) => l.lesson_number === lessonNumber,
    );
    if (!lesson) {
      throw new NotFoundException(
        `Lesson ${lessonNumber} not found in module ${moduleNumber}`,
      );
    }

    // Extract voice info from populated ai_voice
    const aiVoice = course.ai_voice as any;
    const aiAvatar = course.ai_avatar as any;

    return {
      course_id: course._id.toString(),
      course_title: course.title,
      course_topic: course.topic,
      course_reason: course.reason,
      module_number: moduleNumber,
      module_title: module.title,
      lesson_number: lessonNumber,
      lesson_title: lesson.title,
      lesson_type: lesson.type,
      course_language: course.language,
      course_teaching_style: course.teaching_style,
      course_pace: course.pace,
      course_experience_level: course.experience_level,
      // Voice info for TTS
      voice_id: aiVoice?.voice_id,
      voice_type: aiVoice?.voice_type,
      voice_name: aiVoice?.name,
      // Avatar info
      avatar_url: aiAvatar?.media?.url || aiAvatar?.media?.location,
    };
  }
}
