import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument, TimestampMixin } from 'src/modules/shared/types';
import { Schema as MongooseSchema } from 'mongoose';
import {
  CourseStatus,
  Language,
  TeachingStyle,
  Pace,
  ExperienceLevel,
  LearningPreference,
  TimeDedication,
  CourseFormatAddons,
  ModuleStatus,
  LessonStatus,
} from '../enums';
import { type UserDocument } from 'src/modules/user/schemas';
import {
  type AIAvatarDocument,
  type AIVoiceDocument,
} from 'src/modules/media/schemas';

@Schema({
  _id: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Lesson {
  @Prop({ required: true })
  lesson_number: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  type: string;

  @Prop({ enum: Object.values(LessonStatus), default: LessonStatus.PENDING })
  status: LessonStatus;

  @Prop({ type: [String], default: [] })
  resources: string[];

  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @Prop({ type: Date, default: Date.now })
  updated_at: Date;
}

const LessonSchema = SchemaFactory.createForClass(Lesson);

@Schema({
  _id: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Module {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  module_number: number;

  @Prop({ enum: Object.values(ModuleStatus), default: ModuleStatus.PENDING })
  status: ModuleStatus;

  @Prop({ type: [LessonSchema], default: [] })
  lessons: Lesson[];

  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @Prop({ type: Date, default: Date.now })
  updated_at: Date;
}

const ModuleSchema = SchemaFactory.createForClass(Module);

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Course extends TimestampMixin {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: UserDocument;

  @Prop({ required: true })
  topic: string;

  @Prop()
  reason: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  estimated_duration: string;

  @Prop({ required: true })
  total_lessons: number;

  @Prop({ required: true })
  time_per_session: string;

  @Prop({ enum: Object.values(Language), default: Language.EN })
  language: Language;

  @Prop({
    enum: Object.values(ExperienceLevel),
    default: ExperienceLevel.BEGINNER,
  })
  experience_level: ExperienceLevel;

  @Prop({ enum: Object.values(TeachingStyle), default: TeachingStyle.CASUAL })
  teaching_style: TeachingStyle;

  @Prop({
    enum: Object.values(LearningPreference),
    default: LearningPreference.MIXED,
  })
  learning_preference: LearningPreference;

  @Prop({ enum: Object.values(TimeDedication), default: TimeDedication.M30 })
  time_dedication: TimeDedication;

  @Prop({ type: Date })
  target_completion: Date;

  @Prop({
    type: [String],
    enum: Object.values(CourseFormatAddons),
    default: [],
  })
  course_format_addons: CourseFormatAddons[];

  @Prop({ type: [ModuleSchema], default: [] })
  modules: Module[];

  @Prop({
    type: {
      percent_complete: { type: Number, default: 0 },
      updated_at: { type: Date, default: Date.now },
    },
    default: () => ({ percent_complete: 0, updated_at: new Date() }),
  })
  progress: {
    percent_complete: number;
    updated_at: Date;
  };

  @Prop({ enum: Object.values(Pace), default: Pace.MEDIUM })
  pace: Pace;

  @Prop({ enum: Object.values(CourseStatus), default: CourseStatus.ACTIVE })
  status: CourseStatus;

  @Prop({ default: false })
  is_favourite: boolean;

  @Prop({ default: false })
  is_bookmarked: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'AIVoice',
    required: false,
  })
  ai_voice?: AIVoiceDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'AIAvatar',
    required: false,
  })
  ai_avatar?: AIAvatarDocument;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
export type CourseDocument = BaseDocument & Course;
