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
      image_urls?: string[];
      history: {
        role: ChatSender;
        content: string;
      }[];
    };
  }): Promise<string | { message: string; video_url?: string; video_thumbnail_url?: string; video_duration?: number }> {
    try {
      // Include image URLs in payload if provided
      const requestPayload: any = {
        question: payload.question,
        history: payload.history,
      };
      
      if (payload.image_urls && payload.image_urls.length > 0) {
        requestPayload.image_urls = payload.image_urls;
      }

      const response = await this.client.post('/chat', requestPayload);
      
      // Handle different response formats
      if (response.data.reply !== undefined && response.data.reply !== null) {
        // If response includes video, return object
        if (response.data.video_url) {
          return {
            message: response.data.reply,
            video_url: response.data.video_url,
            video_thumbnail_url: response.data.video_thumbnail_url,
            video_duration: response.data.video_duration,
          };
        }
        return response.data.reply;
      } else if (response.data.message !== undefined && response.data.message !== null) {
        // Alternative response format
        if (response.data.video_url) {
          return {
            message: response.data.message,
            video_url: response.data.video_url,
            video_thumbnail_url: response.data.video_thumbnail_url,
            video_duration: response.data.video_duration,
          };
        }
        return response.data.message;
      } else {
        throw new Error('AI chat agent returned an invalid response');
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
