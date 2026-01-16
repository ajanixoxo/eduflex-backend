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

    // Explicitly dispatch the agent to ensure it joins
    // The agent has a duplicate guard so calling this is safe even if roomConfig.agents also dispatches
    // This is more reliable than relying solely on roomConfig.agents
    this.aiService.dispatchAgent(roomName).catch((err) => {
      console.log('Agent dispatch (may already be in room):', err?.message);
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
