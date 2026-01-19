import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { AiProvider } from './ai.provider';
import { AiService } from './ai.service';
import { RoomCredentialsDto, RoomContextDto, GenerateVideoDto } from './dtos';
import { Auth, IsPublic } from 'src/decorators';
import { Env } from '../shared/constants';
import type { UserDocument } from '../user/schemas';

@Controller('ai')
@ApiTags('AI')
@ApiBearerAuth()
export class AiController {
  constructor(
    private readonly aiProvider: AiProvider,
    private readonly aiService: AiService,
  ) {}

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

  /**
   * Generate a preview video for a course concept
   * This is a blocking endpoint that waits for video generation to complete
   */
  @Post('video/generate')
  @ApiOperation({
    summary: 'Generate preview video',
    description: 'Generates a 10-15 second preview video for a course concept. This is a blocking operation that may take 1-3 minutes.',
  })
  async generateVideo(
    @Auth() user: UserDocument,
    @Body() dto: GenerateVideoDto,
  ) {
    const result = await this.aiService.generatePreviewVideo(dto, user);
    return {
      message: 'Video generated successfully',
      ...result,
    };
  }
}
