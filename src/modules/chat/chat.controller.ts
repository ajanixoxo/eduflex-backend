import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Headers,
  UnauthorizedException,
  UseInterceptors,
  UploadedFiles,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiHeader, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { MAX_FILE_SIZE } from '../media/enums';

@Controller('chat')
@ApiTags('Chat')
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatProvider: ChatProvider) {}

  @Post('send-message-to-agent')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      description: 'Send message with optional images and videos. Max file size is 5MB per file.',
      properties: {
        course_id: { type: 'string', example: '690b23088c3c3884ccb65f82' },
        module_number: { type: 'number', example: 1 },
        lesson_number: { type: 'string', example: '1.1' },
        message: { type: 'string', example: 'What is the topic of this lesson?' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Images or videos to attach (up to 10 files)',
        },
      },
      required: ['course_id', 'module_number', 'lesson_number', 'message'],
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // Accept up to 10 files
  async sendMessageToAgent(
    @Auth() user: UserDocument,
    @Body() body: SendChatMessageDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
        fileIsRequired: false, // Files are optional
      }),
    )
    files?: Express.Multer.File[],
  ) {
    // Separate images and videos
    const imageFiles = files?.filter((f) => f.mimetype.startsWith('image/')) || [];
    const videoFiles = files?.filter((f) => f.mimetype.startsWith('video/')) || [];

    const data = await this.chatProvider.sendMessageToAgent({
      user,
      body,
      imageFiles,
      videoFiles,
    });
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

  /**
   * Endpoint for LiveKit agent to get conversation history
   * Returns recent messages for a room to provide context when agent reconnects
   */
  @Get('agent/history/:roomName')
  @IsPublic()
  @ApiHeader({
    name: 'X-Agent-API-Key',
    description:
      'Agent API Key for authentication (optional if AGENT_API_KEY not set in env)',
    required: false,
  })
  async agentGetHistory(
    @Param('roomName') roomName: string,
    @Query('limit') limit?: string,
    @Headers('x-agent-api-key') apiKey?: string,
  ) {
    // Validate API key if configured
    if ((Env as any).AGENT_API_KEY && apiKey !== (Env as any).AGENT_API_KEY) {
      throw new UnauthorizedException('Invalid agent API key');
    }

    const data = await this.chatProvider.getAgentConversationHistory(
      roomName,
      limit ? parseInt(limit, 10) : 10,
    );
    return data;
  }
}
