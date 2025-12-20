import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiHeader } from '@nestjs/swagger';
import { ChatProvider } from './chat.provider';
import { Auth, IsPublic } from 'src/decorators';
import { type UserDocument } from '../user/schemas';
import {
  ListChatMessages,
  SendChatMessageDto,
  SaveTranscriptDto,
  AgentSaveUserTranscriptDto,
  AgentSaveAiTranscriptDto,
  AgentSaveTranscriptDto,
} from './dtos';
import { Env } from '../shared/constants';

@Controller('chat')
@ApiTags('Chat')
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatProvider: ChatProvider) {}

  @Post('send-message-to-agent')
  async sendMessageToAgent(
    @Auth() user: UserDocument,
    @Body() body: SendChatMessageDto,
  ) {
    const data = await this.chatProvider.sendMessageToAgent({ user, body });
    return data;
  }

  @Get('list-messages')
  async getChatMessages(
    @Auth() user: UserDocument,
    @Query() query: ListChatMessages,
  ) {
    const data = await this.chatProvider.getChatMessages({ user, query });
    return data;
  }

  @Post('save-transcript')
  async saveTranscript(
    @Auth() user: UserDocument,
    @Body() body: AgentSaveTranscriptDto,
  ) {
    const data = await this.chatProvider.saveVoiceTranscript({ user, body });
    return data;
  }

  /**
   * Endpoint for LiveKit agent to save user speech transcript
   * Called when user speaks and agent transcribes the speech
   * Returns message_id to be used when saving AI response
   */
  @Post('agent/save-user-transcript')
  @IsPublic()
  @ApiHeader({
    name: 'X-Agent-API-Key',
    description:
      'Agent API Key for authentication (optional if AGENT_API_KEY not set in env)',
    required: false,
  })
  async agentSaveUserTranscript(
    @Body() body: AgentSaveUserTranscriptDto,
    @Headers('x-agent-api-key') apiKey?: string,
  ) {
    // Validate API key if configured
    if ((Env as any).AGENT_API_KEY && apiKey !== (Env as any).AGENT_API_KEY) {
      throw new UnauthorizedException('Invalid agent API key');
    }

    const data = await this.chatProvider.saveAgentUserTranscript(body);
    return data;
  }

  /**
   * Endpoint for LiveKit agent to save AI response transcript
   * Called when agent generates and speaks the AI response
   * Uses message_id from save-user-transcript endpoint
   */
  @Post('agent/save-ai-transcript')
  @IsPublic()
  @ApiHeader({
    name: 'X-Agent-API-Key',
    description:
      'Agent API Key for authentication (optional if AGENT_API_KEY not set in env)',
    required: false,
  })
  async agentSaveAiTranscript(
    @Body() body: AgentSaveAiTranscriptDto,
    @Headers('x-agent-api-key') apiKey?: string,
  ) {
    // Validate API key if configured
    if ((Env as any).AGENT_API_KEY && apiKey !== (Env as any).AGENT_API_KEY) {
      throw new UnauthorizedException('Invalid agent API key');
    }

    const data = await this.chatProvider.saveAgentAiTranscript(body);
    return data;
  }

  /**
   * Unified endpoint for LiveKit agent to save transcripts
   * Accepts both user and AI messages based on speaker_type
   * Parses room_name to extract course/module/lesson automatically
   */
  @Post('agent/save-transcript')
  @IsPublic()
  @ApiHeader({
    name: 'X-Agent-API-Key',
    description:
      'Agent API Key for authentication (optional if AGENT_API_KEY not set in env)',
    required: false,
  })
  async agentSaveTranscript(
    @Body() body: AgentSaveTranscriptDto,
    @Headers('x-agent-api-key') apiKey?: string,
  ) {
    // Validate API key if configured
    if ((Env as any).AGENT_API_KEY && apiKey !== (Env as any).AGENT_API_KEY) {
      throw new UnauthorizedException('Invalid agent API key');
    }

    const data = await this.chatProvider.saveAgentTranscript(body);
    return data;
  }
}
