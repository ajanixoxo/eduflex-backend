import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { LearningProgressProvider } from './learning-progress.provider';
import { Auth, IsPublic } from 'src/decorators';
import { type UserDocument } from '../user/schemas';
import {
  GetLearningProgressDto,
  InitializeLearningProgressDto,
  UpdateTeachingStateDto,
  UpdateLessonProgressDto,
  AdvanceToNextLessonDto,
  SaveQuizResultDto,
  AgentGetProgressDto,
  AgentUpdateProgressDto,
} from './dtos';
import { Env } from '../shared/constants';

@Controller('learning-progress')
@ApiTags('Learning Progress')
@ApiBearerAuth()
export class LearningProgressController {
  constructor(private readonly learningProgressProvider: LearningProgressProvider) {}

  @Get()
  async getProgress(
    @Auth() user: UserDocument,
    @Query() query: GetLearningProgressDto,
  ) {
    return this.learningProgressProvider.getProgress(user, query);
  }

  @Get('summary')
  async getProgressSummary(
    @Auth() user: UserDocument,
    @Query() query: GetLearningProgressDto,
  ) {
    return this.learningProgressProvider.getProgressSummary(user, query);
  }

  @Post('initialize')
  async initializeProgress(
    @Auth() user: UserDocument,
    @Body() body: InitializeLearningProgressDto,
  ) {
    return this.learningProgressProvider.initializeProgress(user, body);
  }

  @Post('teaching-state')
  async updateTeachingState(
    @Auth() user: UserDocument,
    @Body() body: UpdateTeachingStateDto,
  ) {
    return this.learningProgressProvider.updateTeachingState(user, body);
  }

  @Post('lesson')
  async updateLessonProgress(
    @Auth() user: UserDocument,
    @Body() body: UpdateLessonProgressDto,
  ) {
    return this.learningProgressProvider.updateLessonProgress(user, body);
  }

  @Post('advance')
  async advanceToNextLesson(
    @Auth() user: UserDocument,
    @Body() body: AdvanceToNextLessonDto,
  ) {
    return this.learningProgressProvider.advanceToNextLesson(user, body);
  }

  @Post('quiz')
  async saveQuizResult(
    @Auth() user: UserDocument,
    @Body() body: SaveQuizResultDto,
  ) {
    return this.learningProgressProvider.saveQuizResult(user, body);
  }

  // ========== Agent-specific endpoints ==========

  @Post('agent/get')
  @IsPublic()
  @ApiHeader({
    name: 'X-Agent-API-Key',
    description: 'Agent API Key for authentication',
    required: false,
  })
  async agentGetProgress(
    @Body() body: AgentGetProgressDto,
    @Headers('x-agent-api-key') apiKey?: string,
  ) {
    // Validate API key if configured
    if ((Env as any).AGENT_API_KEY && apiKey !== (Env as any).AGENT_API_KEY) {
      throw new UnauthorizedException('Invalid agent API key');
    }

    return this.learningProgressProvider.agentGetProgress(body);
  }

  @Post('agent/update')
  @IsPublic()
  @ApiHeader({
    name: 'X-Agent-API-Key',
    description: 'Agent API Key for authentication',
    required: false,
  })
  async agentUpdateProgress(
    @Body() body: AgentUpdateProgressDto,
    @Headers('x-agent-api-key') apiKey?: string,
  ) {
    // Validate API key if configured
    if ((Env as any).AGENT_API_KEY && apiKey !== (Env as any).AGENT_API_KEY) {
      throw new UnauthorizedException('Invalid agent API key');
    }

    return this.learningProgressProvider.agentUpdateProgress(body);
  }
}
