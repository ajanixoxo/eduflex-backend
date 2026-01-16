import { Injectable } from '@nestjs/common';
import { AiService } from './ai.service';
import type { UserDocument } from '../user/schemas';
import { RoomCredentialsDto } from './dtos';
import { Env } from '../shared/constants';

@Injectable()
export class AiProvider {
  constructor(private readonly aiService: AiService) {}

  async getRoomCredentials({
    user,
    query,
  }: {
    user: UserDocument;
    query: RoomCredentialsDto;
  }): Promise<{
    token: string;
    room: string;
    serverUrl: string;
  }> {
    await this.aiService.validateCourseAccess(
      user,
      query.courseId,
      query.moduleNumber,
      query.lessonNumber,
    );

    const roomName = this.aiService.generateRoomName(
      query.courseId,
      query.moduleNumber,
      query.lessonNumber,
    );

    const token = await this.aiService.generateLiveKitToken(user, roomName);

    // Dispatch the agent to the room (for explicit dispatch mode)
    // This is done asynchronously so it doesn't block the response
    this.aiService.dispatchAgent(roomName).catch((err) => {
      console.error('Failed to dispatch agent:', err);
    });

    return {
      token,
      room: roomName,
      serverUrl: Env.LIVEKIT_URL,
    };
  }

  async getRoomContext(roomName: string) {
    return await this.aiService.getRoomContext(roomName);
  }
}
