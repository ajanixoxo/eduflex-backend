import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MediaType } from '../enums';
import { v4 as uuidv4 } from 'uuid';
import { BaseDocument, TimestampMixin } from 'src/modules/shared/types';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { type UserDocument } from 'src/modules/user/schemas';
@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Media extends TimestampMixin {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: UserDocument;
  @Prop({ required: true, unique: true, default: uuidv4 })
  upload_key: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  mimetype?: string;

  @Prop({
    type: String,
    enum: MediaType,
    default: MediaType.UPLOAD,
  })
  media_type?: MediaType;

  @Prop({ required: false })
  file_size?: number;

  @Prop({ required: false, trim: true })
  file_name?: string;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
export type MediaDocument = BaseDocument & Media;
