import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiHeader } from '@nestjs/swagger';
import { AiProvider } from './ai.provider';
import { RoomCredentialsDto, RoomContextDto } from './dtos';
import { Auth, IsPublic } from 'src/decorators';
import { Env } from '../shared/constants';
import type { UserDocument } from '../user/schemas';

@Controller('ai')
@ApiTags('AI')
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiProvider: AiProvider) {}

  @Get('room-credentials')
  async getRoomCredentials(
    @Auth() user: UserDocument,
    @Query() query: RoomCredentialsDto,
  ) {
    const credentials = await this.aiProvider.getRoomCredentials({
      user,
      query,
    });
    return {
      message: 'Room credentials generated',
      data: credentials,
    };
  }

  /**
   * Endpoint for LiveKit agent to get room context
   * Called when agent joins a room to get course/module/lesson information
   */
  @Post('agent/room-context')
  @IsPublic()
  @ApiHeader({
    name: 'X-Agent-API-Key',
    description:
      'Agent API Key for authentication (optional if AGENT_API_KEY not set in env)',
    required: false,
  })
  async getRoomContext(
    @Body() body: RoomContextDto,
    @Headers('x-agent-api-key') apiKey?: string,
  ) {
    // Validate API key if configured
    if ((Env as any).AGENT_API_KEY && apiKey !== (Env as any).AGENT_API_KEY) {
      throw new UnauthorizedException('Invalid agent API key');
    }

    const context = await this.aiProvider.getRoomContext(body.room_name);
    return {
      message: 'Room context retrieved successfully',
      data: context,
    };
  }
}
