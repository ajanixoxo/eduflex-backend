import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument, TimestampMixin } from 'src/modules/shared/types';
import { Schema as MongooseSchema } from 'mongoose';
import {
  CourseStatus,
  Language,
  LearningStyle,
  Pace,
  SkillLevel,
} from '../enums';
import { type UserDocument } from 'src/modules/user/schemas';

@Schema({ _id: false })
export class Section {
  @Prop({ required: true })
  section_id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ enum: ['pending', 'completed'], default: 'pending' })
  status: string;
}

const SectionSchema = SchemaFactory.createForClass(Section);

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Course extends TimestampMixin {
  @Prop({ required: true })
  lesson_id: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: UserDocument;

  @Prop({ required: true })
  topic: string;

  @Prop({ type: [SectionSchema], default: [] })
  sections: Section[];

  @Prop({
    type: {
      percent_complete: { type: Number, default: 0 },
    },
  })
  progress: {
    percent_complete: number;
  };

  @Prop({ enum: Object.values(Language), default: Language.EN })
  preferred_language: Language;

  @Prop({ enum: Object.values(Pace), default: Pace.MEDIUM })
  pace: Pace;

  @Prop({ enum: Object.values(SkillLevel), default: SkillLevel.BEGINNER })
  skill_level: SkillLevel;

  @Prop({ enum: Object.values(LearningStyle), default: LearningStyle.CASUAL })
  learning_style: LearningStyle;

  @Prop({ enum: Object.values(CourseStatus), default: CourseStatus.ACTIVE })
  status: CourseStatus;

  @Prop({ default: false })
  is_favourite: boolean;

  @Prop({ default: false })
  is_bookmarked: boolean;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
export type CourseDocument = BaseDocument & Course;
