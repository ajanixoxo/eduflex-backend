import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AIAvatar,
  AIAvatarDocument,
  AIVoice,
  AIVoiceDocument,
  Media,
  MediaDocument,
  VoiceType,
  CloneStatus,
} from './schemas';
import { FilterQuery, Model } from 'mongoose';
import { PaginationService } from '../shared/services';
import { ListAiAvatarsDto, ListAiVoicesDto, ListMediaDto } from './dtos';
import { AIMediaOwner } from './enums';

// Edge TTS System Voices to seed on startup
const SYSTEM_VOICES = [
  {
    name: 'Professor Alex',
    voice_id: 'guy',
    description: 'Deep, professional US male voice',
    accent: 'American',
    owner: AIMediaOwner.SYSTEM,
    voice_type: VoiceType.SYSTEM,
    clone_status: CloneStatus.READY,
  },
  {
    name: 'Dr. Ryan',
    voice_id: 'ryan',
    description: 'British professional male voice',
    accent: 'British',
    owner: AIMediaOwner.SYSTEM,
    voice_type: VoiceType.SYSTEM,
    clone_status: CloneStatus.READY,
  },
  {
    name: 'Mr. Thomas',
    voice_id: 'thomas',
    description: 'British warm male voice',
    accent: 'British',
    owner: AIMediaOwner.SYSTEM,
    voice_type: VoiceType.SYSTEM,
    clone_status: CloneStatus.READY,
  },
];

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectModel(Media.name)
    private readonly _mediaModel: Model<MediaDocument>,
    @InjectModel(AIAvatar.name)
    private readonly _aiAvatarModel: Model<AIAvatarDocument>,
    @InjectModel(AIVoice.name)
    private readonly _aiVoiceModel: Model<AIVoiceDocument>,
    private readonly paginationService: PaginationService,
  ) {}

  async onModuleInit() {
    await this.seedSystemVoices();
  }

  private async seedSystemVoices() {
    try {
      for (const voice of SYSTEM_VOICES) {
        const existing = await this._aiVoiceModel.findOne({ voice_id: voice.voice_id });
        if (!existing) {
          await this._aiVoiceModel.create(voice);
          this.logger.log(`Created system voice: ${voice.name} (${voice.voice_id})`);
        }
      }
      this.logger.log('System voices seeding completed');
    } catch (error) {
      this.logger.error('Failed to seed system voices:', error);
    }
  }

  get mediaModel(): Model<MediaDocument> {
    return this._mediaModel;
  }

  get aiAvatarModel(): Model<AIAvatarDocument> {
    return this._aiAvatarModel;
  }

  get aiVoiceModel(): Model<AIVoiceDocument> {
    return this._aiVoiceModel;
  }

  // Media Management

  async createMedia(data: Partial<MediaDocument>): Promise<MediaDocument> {
    return new this.mediaModel(data).save();
  }
  async getAllMedia(
    filter: FilterQuery<MediaDocument>,
    listQueryDto: ListMediaDto,
  ) {
    const { page, per_page } = listQueryDto;
    return this.paginationService.paginate(
      this.mediaModel,
      filter,
      page,
      per_page,
    );
  }
  async getMedia(
    filter: FilterQuery<MediaDocument>,
  ): Promise<MediaDocument | null> {
    const media = await this.mediaModel.findOne(filter).exec();
    return media;
  }
  async updateMedia(
    filter: FilterQuery<MediaDocument>,
    update: Partial<MediaDocument>,
  ): Promise<MediaDocument | null> {
    return this.mediaModel
      .findOneAndUpdate(filter, update, { new: true })
      .exec();
  }

  async deleteMedia(filter: FilterQuery<MediaDocument>): Promise<boolean> {
    const res = await this.mediaModel.deleteOne(filter).exec();
    return res.deletedCount > 0;
  }

  // AI Avatar Management
  async createAIAvatar(
    data: Partial<AIAvatarDocument>,
  ): Promise<AIAvatarDocument> {
    return new this.aiAvatarModel(data).save();
  }

  async getAIAvatar(
    filter: FilterQuery<AIAvatarDocument>,
  ): Promise<AIAvatarDocument | null> {
    return this.aiAvatarModel
      .findOne(filter)
      .populate(['media', 'user'])
      .exec();
  }
  async listAIAvatars(
    filter: FilterQuery<MediaDocument>,
    listQueryDto: ListAiAvatarsDto,
  ) {
    const { page, per_page } = listQueryDto;
    return this.paginationService.paginate(
      this.aiAvatarModel,
      filter,
      page,
      per_page,
      ['media'],
    );
  }
  async updateAIAvatar(
    filter: FilterQuery<AIAvatarDocument>,
    update: Partial<AIAvatarDocument>,
  ): Promise<AIAvatarDocument | null> {
    return this.aiAvatarModel
      .findOneAndUpdate(filter, update, { new: true })
      .populate('media')
      .exec();
  }
  async deleteAIAvatar(
    filter: FilterQuery<AIAvatarDocument>,
  ): Promise<boolean> {
    const res = await this.aiAvatarModel.deleteOne(filter).exec();
    return res.deletedCount > 0;
  }
  // AI Voice Management
  async createAIVoice(
    data: Partial<AIVoiceDocument>,
  ): Promise<AIVoiceDocument> {
    return new this.aiVoiceModel(data).save();
  }
  async getAIVoice(
    filter: FilterQuery<AIVoiceDocument>,
  ): Promise<AIVoiceDocument | null> {
    return this.aiVoiceModel.findOne(filter).populate(['media', 'user']).exec();
  }
  async listAIVoices(
    filter: FilterQuery<MediaDocument>,
    listQueryDto: ListAiVoicesDto,
  ) {
    const { page, per_page } = listQueryDto;
    return this.paginationService.paginate(
      this.aiVoiceModel,
      filter,
      page,
      per_page,
      ['media', 'user'],
    );
  }
  async updateAIVoice(
    filter: FilterQuery<AIVoiceDocument>,
    update: Partial<AIVoiceDocument>,
  ): Promise<AIVoiceDocument | null> {
    return this.aiVoiceModel
      .findOneAndUpdate(filter, update, { new: true })
      .populate('media', 'user')
      .exec();
  }
  async deleteAIVoice(filter: FilterQuery<AIVoiceDocument>): Promise<boolean> {
    const res = await this.aiVoiceModel.deleteOne(filter).exec();
    return res.deletedCount > 0;
  }
}
