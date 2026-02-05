import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseDocument } from 'src/modules/shared/types';
import { User, type UserDocument } from 'src/modules/user/schemas';

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class CalendarSubscription {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
    index: true,
  })
  user: UserDocument;

  @Prop({ required: true, unique: true, index: true })
  token: string;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Date })
  last_accessed?: Date;
}

export const CalendarSubscriptionSchema =
  SchemaFactory.createForClass(CalendarSubscription);

export type CalendarSubscriptionDocument = BaseDocument & CalendarSubscription;
