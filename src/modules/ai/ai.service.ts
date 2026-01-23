import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AccessToken, VideoGrant, AgentDispatchClient } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';
import { v2 as cloudinary } from 'cloudinary';
import { Env } from '../shared/constants';
import { CourseService } from '../course/course.service';
import { MediaService } from '../media/media.service';
import { UserDocument } from '../user/schemas';
import { UserTypes } from '../user/enums';
import { FilterQuery } from 'mongoose';
import { CourseDocument } from '../course/schemas';
import { firstValueFrom } from 'rxjs';
import { GenerateVideoDto } from './dtos';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly courseService: CourseService,
    private readonly mediaService: MediaService,
    private readonly httpService: HttpService,
  ) {
    // Configure cloudinary for video uploads
    cloudinary.config({
      api_key: Env.CLOUDINARY_API_KEY,
      cloud_name: Env.CLOUDINARY_CLOUD_NAME,
      api_secret: Env.CLOUDINARY_API_SECRET,
    });
  }

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

  /**
   * Generate a preview video for a course/concept
   * Creates a 10-15 second educational video using the AI pod
   */
  async generatePreviewVideo(
    dto: GenerateVideoDto,
    user: UserDocument,
  ): Promise<{
    video_url: string;
    duration_seconds: number;
    transcript: { time: number; text: string }[];
  }> {
    this.logger.log(`Generating preview video for concept: ${dto.target_concept}`);

    // Get the voice_id from the voice profile
    const voice = await this.mediaService.getAIVoice({ _id: dto.voice_profile_id });
    if (!voice) {
      throw new NotFoundException('Voice profile not found');
    }
    const voiceId = voice.voice_id || 'guy'; // Default to Professor Alex

    // Create a simple 2-scene script for a 10-15 second preview
    // Keep prompts simple and achievable for better video quality
    const script = {
      title: `Introduction to ${dto.target_concept}`,
      total_scenes: 2,
      scenes: [
        {
          scene_number: 1,
          video_prompt: `A book opening on a desk, natural lighting, wooden table`,
          voiceover: `Welcome! Let's explore ${dto.target_concept} together. This course will guide you through the fundamentals.`,
        },
        {
          scene_number: 2,
          video_prompt: `Colorful sticky notes on a whiteboard, office setting, daylight`,
          voiceover: `By the end, you'll have a solid understanding of the key concepts. Let's get started!`,
        },
      ],
    };

    // Generate unique job ID
    const jobId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Start video generation on the AI pod
      this.logger.log(`Starting video generation job: ${jobId}`);
      const startResponse = await firstValueFrom(
        this.httpService.post(`${(Env as any).VIDEO_GEN_URL}/video/generate`, {
          job_id: jobId,
          topic: dto.target_concept,
          context: 'course preview',
          duration_target: 15, // 10-15 seconds
          voice_id: voiceId,
          room_name: `preview-${user._id}`,
          user_id: user._id.toString(),
          script: script,
        }),
      );

      if (!startResponse.data?.success) {
        throw new BadRequestException('Failed to start video generation');
      }

      // Poll for completion (blocking)
      // Increased timeout to 10 minutes to handle queue wait times when other videos are generating
      const maxWaitMs = 10 * 60 * 1000; // 10 minutes max
      const pollIntervalMs = 3000; // Poll every 3 seconds
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitMs) {
        await this.sleep(pollIntervalMs);

        const statusResponse = await firstValueFrom(
          this.httpService.get(`${(Env as any).VIDEO_GEN_URL}/video/status/${jobId}`),
        );

        const status = statusResponse.data;
        const queueInfo = status.queue_position ? ` (queue position: ${status.queue_position})` : '';
        const elapsedSec = Math.round((Date.now() - startTime) / 1000);
        this.logger.log(`Video job ${jobId} status: ${status.status}, progress: ${status.progress}%${queueInfo} [${elapsedSec}s elapsed]`);

        if (status.status === 'completed') {
          // Get the download path from the result (e.g., /video/download/{job_id})
          const downloadPath = status.result?.video_url || status.result?.video_path;

          if (!downloadPath) {
            throw new BadRequestException('Video generation completed but no download path returned');
          }

          // Fetch the video from the pod's download endpoint
          this.logger.log(`Fetching video from pod: ${downloadPath}`);
          const videoGenUrl = (Env as any).VIDEO_GEN_URL || 'http://localhost:9400';
          const fullDownloadUrl = downloadPath.startsWith('/')
            ? `${videoGenUrl}${downloadPath}`
            : downloadPath;

          const videoResponse = await firstValueFrom(
            this.httpService.get(fullDownloadUrl, {
              responseType: 'arraybuffer',
              timeout: 60000, // 60 second timeout for download
            }),
          );

          // Upload to Cloudinary
          this.logger.log(`Uploading video to Cloudinary for user: ${user._id}`);
          const base64Video = Buffer.from(videoResponse.data).toString('base64');
          const cloudinaryResult = await cloudinary.uploader.upload(
            `data:video/mp4;base64,${base64Video}`,
            {
              folder: `eduflexai/${user._id}/preview_videos`,
              resource_type: 'video',
              public_id: jobId,
            },
          );

          this.logger.log(`Video uploaded to Cloudinary: ${cloudinaryResult.secure_url}`);

          // Build transcript from script
          const transcript = script.scenes.map((scene, index) => ({
            time: index * 7, // Approximate timing
            text: scene.voiceover,
          }));

          return {
            video_url: cloudinaryResult.secure_url,
            duration_seconds: status.result?.duration || 15,
            transcript,
          };
        }

        if (status.status === 'failed') {
          throw new BadRequestException(
            `Video generation failed: ${status.error || 'Unknown error'}`,
          );
        }
      }

      throw new BadRequestException('Video generation timed out');
    } catch (error) {
      this.logger.error(`Video generation error: ${error.message}`, error.stack);

      if (error.response?.data) {
        throw new BadRequestException(
          `Video generation failed: ${error.response.data.message || error.message}`,
        );
      }
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Start video generation (non-blocking)
   * Returns job_id immediately for polling
   */
  async startVideoGeneration(
    dto: GenerateVideoDto,
    user: UserDocument,
  ): Promise<{
    job_id: string;
    status: string;
    message: string;
  }> {
    this.logger.log(`Starting video generation for concept: ${dto.target_concept}`);

    // Get the voice_id from the voice profile
    const voice = await this.mediaService.getAIVoice({ _id: dto.voice_profile_id });
    if (!voice) {
      throw new NotFoundException('Voice profile not found');
    }
    const voiceId = voice.voice_id || 'guy';

    // Create a simple 2-scene script for a 10-15 second preview
    const script = {
      title: `Introduction to ${dto.target_concept}`,
      total_scenes: 2,
      scenes: [
        {
          scene_number: 1,
          video_prompt: `A book opening on a desk, natural lighting, wooden table`,
          voiceover: `Welcome! Let's explore ${dto.target_concept} together. This course will guide you through the fundamentals.`,
        },
        {
          scene_number: 2,
          video_prompt: `Colorful sticky notes on a whiteboard, office setting, daylight`,
          voiceover: `By the end, you'll have a solid understanding of the key concepts. Let's get started!`,
        },
      ],
    };

    // Generate unique job ID
    const jobId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Start video generation on the AI pod (non-blocking)
      this.logger.log(`Starting video generation job: ${jobId}`);
      const startResponse = await firstValueFrom(
        this.httpService.post(`${(Env as any).VIDEO_GEN_URL}/video/generate`, {
          job_id: jobId,
          topic: dto.target_concept,
          context: 'course preview',
          duration_target: 15,
          voice_id: voiceId,
          room_name: `preview-${user._id}`,
          user_id: user._id.toString(),
          script: script,
        }),
      );

      if (!startResponse.data?.success && !startResponse.data?.job_id) {
        throw new BadRequestException('Failed to start video generation');
      }

      return {
        job_id: startResponse.data?.job_id || jobId,
        status: 'processing',
        message: 'Video generation started. Poll /ai/video/status/{job_id} for progress.',
      };
    } catch (error) {
      this.logger.error(`Failed to start video generation: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to start video generation: ${error.message}`);
    }
  }

  /**
   * Get video generation status from AI pod
   */
  async getVideoStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    phase_description?: string;
    current_scene?: number;
    total_scenes?: number;
    queue_position?: number;
    video_url?: string;
    error?: string;
  }> {
    try {
      const statusResponse = await firstValueFrom(
        this.httpService.get(`${(Env as any).VIDEO_GEN_URL}/video/status/${jobId}`),
      );

      const status = statusResponse.data;

      return {
        status: status.status || 'unknown',
        progress: status.progress || 0,
        phase_description: status.phase_description,
        current_scene: status.current_scene,
        total_scenes: status.total_scenes,
        queue_position: status.queue_position,
        video_url: status.result?.video_url || status.result?.video_path,
        error: status.error,
      };
    } catch (error) {
      this.logger.error(`Failed to get video status for ${jobId}: ${error.message}`);

      if (error.response?.status === 404) {
        return {
          status: 'not_found',
          progress: 0,
          error: 'Video job not found',
        };
      }

      throw new BadRequestException(`Failed to get video status: ${error.message}`);
    }
  }

  /**
   * Download completed video from AI pod and upload to Cloudinary
   */
  async finalizeVideo(
    jobId: string,
    user: UserDocument,
  ): Promise<{
    video_url: string;
    duration_seconds: number;
  }> {
    // Get current status
    const status = await this.getVideoStatus(jobId);

    if (status.status !== 'completed') {
      throw new BadRequestException(`Video is not ready. Current status: ${status.status}`);
    }

    const downloadPath = status.video_url;
    if (!downloadPath) {
      throw new BadRequestException('Video completed but no download path returned');
    }

    // Fetch the video from the pod's download endpoint
    this.logger.log(`Fetching video from pod: ${downloadPath}`);
    const videoGenUrl = (Env as any).VIDEO_GEN_URL || 'http://localhost:9400';
    const fullDownloadUrl = downloadPath.startsWith('/')
      ? `${videoGenUrl}${downloadPath}`
      : downloadPath;

    const videoResponse = await firstValueFrom(
      this.httpService.get(fullDownloadUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
      }),
    );

    // Upload to Cloudinary
    this.logger.log(`Uploading video to Cloudinary for user: ${user._id}`);
    const base64Video = Buffer.from(videoResponse.data).toString('base64');
    const cloudinaryResult = await cloudinary.uploader.upload(
      `data:video/mp4;base64,${base64Video}`,
      {
        folder: `eduflexai/${user._id}/preview_videos`,
        resource_type: 'video',
        public_id: jobId,
      },
    );

    this.logger.log(`Video uploaded to Cloudinary: ${cloudinaryResult.secure_url}`);

    return {
      video_url: cloudinaryResult.secure_url,
      duration_seconds: 15, // Default for preview videos
    };
  }
}
