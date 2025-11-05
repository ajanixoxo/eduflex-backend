import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument, TimestampMixin } from 'src/modules/shared/types';
import { UserPlans, UserRoles, UserStatus, UserTypes } from '../enums';

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class User extends TimestampMixin {
  @Prop({ required: true, lowercase: true, trim: true })
  firstname: string;

  @Prop({ required: true, lowercase: true, trim: true })
  lastname: string;

  @Prop({ required: false, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({
    required: false,
    trim: true,
    unique: true,
    lowercase: true,
    sparse: true,
  })
  username: string;

  @Prop({ required: false, unique: true, trim: true })
  phone: string;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.NEW,
  })
  status: UserStatus;

  @Prop({
    type: {
      name: { type: String, required: true, trim: true },
      code: { type: String, required: true, uppercase: true, trim: true },
      currency: { type: String, required: true, trim: true },
      phone_code: { type: Number, required: true },
      iso_code: { type: String, required: true, uppercase: true, trim: true },
    },
    required: true,
  })
  country: {
    name: string;
    code: string;
    currency: string;
    phone_code: number;
    iso_code: string;
  };

  @Prop({
    enum: Object.values(UserTypes),
    default: UserTypes.CUSTOMER,
  })
  account_type: UserTypes;

  @Prop({
    enum: Object.values(UserRoles),
    type: String,
    default: UserRoles.REGULAR,
  })
  role: UserRoles;

  @Prop({
    enum: Object.values(UserPlans),
    type: String,
    default: UserPlans.FREE,
  })
  sub_package: UserPlans;

  @Prop({ type: Date, required: false, default: Date.now })
  last_activity: Date;

  @Prop({
    type: {
      platform_notifications: { type: Boolean, default: true },
      app_notifications: { type: Boolean, default: true },
      general_notifications: { type: Boolean, default: true },
    },
  })
  notification_preferences: {
    platform_notifications: boolean;
    app_notifications: boolean;
    general_notifications: boolean;
  };

  @Prop({ type: Boolean, default: false })
  is_stub: boolean;

  @Prop({ type: Boolean, default: false })
  is_email_verified: boolean;

  @Prop({
    type: {
      current_streak: { type: Number, default: 0 },
      longest_streak: { type: Number, default: 0 },
      last_streak_update: { type: Date, default: null },
    },
    default: () => ({
      current_streak: 0,
      longest_streak: 0,
      last_streak_update: null,
    }),
  })
  streak: {
    current_streak: number;
    longest_streak: number;
    last_streak_update: Date | null;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & BaseDocument;
