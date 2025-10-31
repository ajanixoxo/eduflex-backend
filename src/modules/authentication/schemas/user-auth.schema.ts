import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseDocument } from 'src/modules/shared/types';
import { type UserDocument } from 'src/modules/user/schemas';

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class UserAuth {
  @Prop({
    unique: true,
    ref: 'User',
    type: MongooseSchema.Types.ObjectId,
    required: true,
  })
  user: UserDocument;

  @Prop({ required: true })
  password: string;

  @Prop()
  token_hash?: string;

  @Prop({
    type: {
      value: { type: String, required: false },
      expires: { type: Date, required: false },
    },
    required: false,
  })
  reset_token?: {
    value?: string;
    expires?: Date;
  };
}

export const UserAuthSchema = SchemaFactory.createForClass(UserAuth);
export type UserAuthDocument = BaseDocument & UserAuth;
