import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosInstance } from 'axios';
import { ChatMessage, ChatMessageDocument, ChatSender } from './schemas';
import { ClientSession, FilterQuery, Model } from 'mongoose';
import { Env } from '../shared/constants';
import { ListChatMessages } from './dtos';
import { PaginationService } from '../shared/services';

@Injectable()
export class ChatService {
  protected client: AxiosInstance;

  constructor(
    @InjectModel(ChatMessage.name)
    private readonly _chatModel: Model<ChatMessageDocument>,
    private readonly paginationService: PaginationService,
  ) {
    this.client = axios.create({
      baseURL: Env.AI_CHAT_URL,
    });
  }

  get chatModel() {
    return this._chatModel;
  }
  async getAgentResponse({
    payload,
  }: {
    payload: {
      question: string;
      history: {
        role: ChatSender;
        content: string;
      }[];
    };
  }): Promise<string> {
    try {
      const response = await this.client.post('/chat', payload);
      if (response.data.reply === undefined || response.data.reply === null) {
        throw new Error('AI chat agent returned an invalid response');
      } else {
        return response.data.reply;
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'Failed to send message to AI chat agent';
      throw new Error(message);
    }
  }
  async createChatMessage(
    createDto: Partial<ChatMessage>,
    session?: ClientSession,
  ): Promise<ChatMessageDocument> {
    const created = new this.chatModel(createDto);
    return created.save({ session });
  }
  async getChatMessage(
    filter: FilterQuery<ChatMessageDocument>,
  ): Promise<ChatMessageDocument | null> {
    return this.chatModel.findOne(filter).exec();
  }
  async getAllChatMessages(
    filter: FilterQuery<ChatMessageDocument>,
    listQueryDto: ListChatMessages,
  ) {
    const { page, per_page } = listQueryDto;
    const { items, meta } = await this.paginationService.paginate(
      this.chatModel,
      filter,
      page,
      per_page,
      [
        {
          path: 'user',
          select: 'firstname lastname email',
        },
      ],
    );
    return { items, meta };
  }
}
