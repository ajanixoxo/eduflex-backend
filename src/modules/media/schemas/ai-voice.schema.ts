import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseDocument, TimestampMixin } from 'src/modules/shared/types';
import { User, type UserDocument } from 'src/modules/user/schemas/user.schema';
import {
  Media,
  type MediaDocument,
} from 'src/modules/media/schemas/media.schema';
import { AIMediaOwner } from '../enums';

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class AIVoice extends TimestampMixin {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: UserDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Media',
    required: true,
  })
  media: MediaDocument;

  @Prop({
    type: String,
    enum: Object.values(AIMediaOwner),
    required: true,
    default: AIMediaOwner.USER,
  })
  owner: AIMediaOwner;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  accent?: string;

  @Prop({ trim: true })
  description?: string;
}

export const AIVoiceSchema = SchemaFactory.createForClass(AIVoice);
export type AIVoiceDocument = BaseDocument & AIVoice;
