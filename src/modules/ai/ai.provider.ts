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

    // Note: Agent dispatch is handled automatically via roomConfig in the token
    // which includes agents: [{ agentName: 'eduflex-ai-agent' }]
    // Do NOT call dispatchAgent() here as it causes duplicate agents

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
