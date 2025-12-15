import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatProvider } from './chat.provider';
import { Auth } from 'src/decorators';
import { type UserDocument } from '../user/schemas';
import { ListChatMessages, SendChatMessageDto, SaveTranscriptDto } from './dtos';

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
    @Body() body: SaveTranscriptDto,
  ) {
    const data = await this.chatProvider.saveVoiceTranscript({ user, body });
    return data;
  }
}
