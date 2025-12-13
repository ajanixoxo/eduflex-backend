import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiProvider } from './ai.provider';
import { RoomCredentialsDto } from './dtos';
import { Auth } from 'src/decorators';
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
}

