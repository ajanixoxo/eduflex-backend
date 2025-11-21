import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AIAvatar,
  AIAvatarDocument,
  AIVoice,
  AIVoiceDocument,
  Media,
  MediaDocument,
} from './schemas';
import { FilterQuery, Model } from 'mongoose';
import { PaginationService } from '../shared/services';
import { ListAiAvatarsDto, ListAiVoicesDto, ListMediaDto } from './dtos';

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name)
    private readonly _mediaModel: Model<MediaDocument>,
    @InjectModel(AIAvatar.name)
    private readonly _aiAvatarModel: Model<AIAvatarDocument>,
    @InjectModel(AIVoice.name)
    private readonly _aiVoiceModel: Model<AIVoiceDocument>,
    private readonly paginationService: PaginationService,
  ) {}

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
