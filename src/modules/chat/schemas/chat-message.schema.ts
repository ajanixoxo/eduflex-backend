import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseDocument, TimestampMixin } from 'src/modules/shared/types';
import { type UserDocument } from 'src/modules/user/schemas';
import { type CourseDocument } from 'src/modules/course/schemas';

export enum ChatSender {
  USER = 'user',
  AI = 'ai',
}

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class ChatMessage extends TimestampMixin {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: UserDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Course',
    required: true,
  })
  course: CourseDocument;

  @Prop({
    type: Number,
    required: true,
  })
  module_number: number;

  @Prop({
    type: String,
    required: true,
  })
  lesson_number: string;

  @Prop({
    type: new MongooseSchema({
      sender: {
        type: String,
        enum: Object.values(ChatSender),
        default: ChatSender.USER,
      },
      message: { type: String, required: true },
      images: [
        {
          type: new MongooseSchema(
            {
              url: { type: String, required: true },
              media_id: {
                type: MongooseSchema.Types.ObjectId,
                ref: 'Media',
                required: false,
              },
              thumbnail_url: { type: String, required: false },
            },
            { _id: false },
          ),
        },
      ],
      videos: [
        {
          type: new MongooseSchema(
            {
              url: { type: String, required: true },
              media_id: {
                type: MongooseSchema.Types.ObjectId,
                ref: 'Media',
                required: false,
              },
              thumbnail_url: { type: String, required: false },
              duration: { type: Number, required: false }, // in seconds
            },
            { _id: false },
          ),
        },
      ],
      metadata: { type: Object, default: null },
    }),
    required: true,
  })
  user_message: {
    sender: ChatSender;
    message: string;
    images?: Array<{
      url: string;
      media_id?: string;
      thumbnail_url?: string;
    }>;
    videos?: Array<{
      url: string;
      media_id?: string;
      thumbnail_url?: string;
      duration?: number;
    }>;
    metadata?: Record<string, any>;
  };

  @Prop({
    type: new MongooseSchema({
      sender: {
        type: String,
        enum: Object.values(ChatSender),
        default: ChatSender.AI,
      },
      message: { type: String, required: true },
      images: [
        {
          type: new MongooseSchema(
            {
              url: { type: String, required: true },
              media_id: {
                type: MongooseSchema.Types.ObjectId,
                ref: 'Media',
                required: false,
              },
              thumbnail_url: { type: String, required: false },
            },
            { _id: false },
          ),
        },
      ],
      videos: [
        {
          type: new MongooseSchema(
            {
              url: { type: String, required: true },
              media_id: {
                type: MongooseSchema.Types.ObjectId,
                ref: 'Media',
                required: false,
              },
              thumbnail_url: { type: String, required: false },
              duration: { type: Number, required: false }, // in seconds
            },
            { _id: false },
          ),
        },
      ],
      is_error: { type: Boolean, default: false },
      metadata: { type: Object, default: null },
    }),
    required: true,
  })
  ai_reply: {
    sender: ChatSender;
    message: string;
    images?: Array<{
      url: string;
      media_id?: string;
      thumbnail_url?: string;
    }>;
    videos?: Array<{
      url: string;
      media_id?: string;
      thumbnail_url?: string;
      duration?: number;
    }>;
    is_error: boolean;
    metadata?: Record<string, any>;
  };
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
export type ChatMessageDocument = BaseDocument & ChatMessage;
