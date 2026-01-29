import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument, TimestampMixin } from 'src/modules/shared/types';
import { Schema as MongooseSchema } from 'mongoose';
import { type CourseDocument } from './course.schema';

/**
 * Checkpoint Question - Asked during lesson to verify understanding
 */
@Schema({ _id: false })
export class CheckpointQuestion {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  expected_answer: string;

  @Prop()
  hint?: string;
}

const CheckpointQuestionSchema = SchemaFactory.createForClass(CheckpointQuestion);

/**
 * Section - A teaching section within a lesson
 */
@Schema({ _id: false })
export class MaterialSection {
  @Prop({ required: true })
  section_number: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string; // Main teaching content

  @Prop({ type: [String], default: [] })
  key_points: string[];

  @Prop({ type: [String], default: [] })
  examples: string[];

  @Prop({ type: CheckpointQuestionSchema })
  checkpoint_question?: CheckpointQuestion;

  @Prop()
  teaching_notes?: string; // Internal notes for AI (not shown to student)
}

const MaterialSectionSchema = SchemaFactory.createForClass(MaterialSection);

/**
 * Quiz Question - End of lesson assessment
 */
@Schema({ _id: false })
export class MaterialQuizQuestion {
  @Prop({ required: true })
  question_id: string;

  @Prop({ required: true })
  question: string;

  @Prop({
    enum: ['multiple_choice', 'true_false', 'short_answer'],
    default: 'short_answer',
  })
  type: string;

  @Prop({ type: [String] })
  options?: string[]; // For multiple choice

  @Prop({ required: true })
  correct_answer: string;

  @Prop()
  explanation?: string;

  @Prop({ default: 1 })
  points: number;
}

const MaterialQuizQuestionSchema = SchemaFactory.createForClass(MaterialQuizQuestion);

/**
 * LessonMaterial - Generated teaching content for a lesson
 *
 * This is the structured content that the AI uses to teach.
 * Generated once per lesson, can be regenerated if needed.
 */
@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class LessonMaterial extends TimestampMixin {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Course',
    required: true,
  })
  course: CourseDocument;

  @Prop({ required: true })
  module_number: number;

  @Prop({ required: true })
  lesson_number: string;

  @Prop({ required: true })
  lesson_title: string;

  // Learning content
  @Prop({ type: [String], default: [] })
  learning_objectives: string[];

  @Prop({ type: [MaterialSectionSchema], default: [] })
  sections: MaterialSection[];

  @Prop({ type: [String], default: [] })
  summary_points: string[];

  @Prop({ type: [MaterialQuizQuestionSchema], default: [] })
  quiz: MaterialQuizQuestion[];

  // Metadata
  @Prop({ default: 15 })
  estimated_duration: number; // minutes

  @Prop({
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  })
  difficulty: string;

  // PDF storage (Cloudinary URL)
  @Prop()
  pdf_url?: string;

  @Prop()
  pdf_generated_at?: Date;

  // Generation metadata
  @Prop({
    enum: ['pending', 'generating', 'ready', 'failed'],
    default: 'pending',
  })
  generation_status: string;

  @Prop()
  generation_error?: string;
}

export const LessonMaterialSchema = SchemaFactory.createForClass(LessonMaterial);

// Indexes for efficient queries
LessonMaterialSchema.index({ course: 1, module_number: 1, lesson_number: 1 }, { unique: true });
LessonMaterialSchema.index({ course: 1 });

export type LessonMaterialDocument = BaseDocument & LessonMaterial;
