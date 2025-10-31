import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseDocument } from 'src/modules/shared/types';
import { User, type UserDocument } from 'src/modules/user/schemas';

export type OTPDocument = OTP & Document;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class OTP {
  @Prop({ required: true })
  code: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  user: UserDocument;

  @Prop({
    type: Date,
    default: Date.now,
    expires: '15m',
  })
  createdAt: Date;
}

export const OTPSchema = SchemaFactory.createForClass(OTP);
export type OtpDocument = BaseDocument & OTP;
