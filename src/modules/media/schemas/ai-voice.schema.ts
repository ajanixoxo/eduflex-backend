import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseDocument, TimestampMixin } from 'src/modules/shared/types';
import { User, type UserDocument } from 'src/modules/user/schemas/user.schema';
import {
  Media,
  type MediaDocument,
} from 'src/modules/media/schemas/media.schema';
import { AIMediaOwner } from '../enums';

export enum VoiceType {
  SYSTEM = 'system',
  CLONED = 'cloned',
}

export enum CloneStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

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
    required: false,  // Not required for system voices
  })
  user?: UserDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Media',
    required: false,  // Not required for system voices
  })
  media?: MediaDocument;

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

  // Voice ID for TTS service (e.g., "guy", "ryan", "thomas" for system, "xtts_abc123" for cloned)
  @Prop({ required: true, trim: true, unique: true })
  voice_id: string;

  // Type of voice: system (Edge TTS) or cloned (XTTS)
  @Prop({
    type: String,
    enum: Object.values(VoiceType),
    required: true,
    default: VoiceType.CLONED,
  })
  voice_type: VoiceType;

  // Cloning status for cloned voices
  @Prop({
    type: String,
    enum: Object.values(CloneStatus),
    default: CloneStatus.READY,
  })
  clone_status?: CloneStatus;
}

export const AIVoiceSchema = SchemaFactory.createForClass(AIVoice);
export type AIVoiceDocument = BaseDocument & AIVoice;
