import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument, TimestampMixin } from 'src/modules/shared/types';
import { Schema as MongooseSchema } from 'mongoose';
import { type UserDocument } from 'src/modules/user/schemas';
import { type CourseDocument } from './course.schema';

/**
 * Quiz Answer - Individual answer in a quiz session
 */
@Schema({ _id: false })
export class QuizAnswer {
  @Prop({ required: true })
  question_id: string;

  @Prop({ required: true })
  question: string;

  @Prop({ required: true, enum: ['multiple_choice', 'true_false', 'short_answer', 'yes_no'] })
  question_type: string;

  @Prop({ type: [String] })
  options?: string[]; // For multiple choice

  @Prop({ required: true })
  correct_answer: string;

  @Prop({ required: true })
  user_answer: string;

  @Prop({ required: true })
  is_correct: boolean;

  @Prop()
  explanation?: string;

  @Prop()
  teaching_provided?: string; // AI teaching content when wrong

  @Prop({ type: Date, default: Date.now })
  answered_at: Date;

  @Prop()
  topic?: string; // Topic this question belongs to
}

const QuizAnswerSchema = SchemaFactory.createForClass(QuizAnswer);

/**
 * Topic Progress - Track mastery per topic
 */
@Schema({ _id: false })
export class TopicProgress {
  @Prop({ required: true })
  topic: string;

  @Prop({ default: 0 })
  questions_asked: number;

  @Prop({ default: 0 })
  correct_answers: number;

  @Prop({ default: 0 })
  mastery_score: number; // 0-100

  @Prop({ type: [String], default: [] })
  weak_areas: string[]; // Subtopics needing review
}

const TopicProgressSchema = SchemaFactory.createForClass(TopicProgress);

/**
 * Quiz Session - Tracks quiz progress for exam prep courses
 */
@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class QuizSession extends TimestampMixin {
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

  @Prop({ required: true })
  module_number: number;

  @Prop({ required: true })
  lesson_number: string;

  @Prop()
  room_name?: string;

  // Quiz state
  @Prop({ type: [QuizAnswerSchema], default: [] })
  answers: QuizAnswer[];

  @Prop({ default: 0 })
  current_question_index: number;

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: 0 })
  total_questions: number;

  @Prop({
    enum: ['not_started', 'ready_prompt', 'in_progress', 'paused', 'completed'],
    default: 'not_started',
  })
  status: string;

  // Topic mastery tracking
  @Prop({ type: [TopicProgressSchema], default: [] })
  topic_progress: TopicProgress[];

  // Session timing
  @Prop({ type: Date })
  started_at?: Date;

  @Prop({ type: Date })
  completed_at?: Date;

  @Prop({ default: 0 })
  time_spent_seconds: number;

  // Summary stats
  @Prop({ default: 0 })
  total_correct: number;

  @Prop({ default: 0 })
  overall_percentage: number;

  @Prop({ type: [String], default: [] })
  areas_to_review: string[];
}

export const QuizSessionSchema = SchemaFactory.createForClass(QuizSession);

// Indexes for efficient queries
QuizSessionSchema.index({ user: 1, course: 1 });
QuizSessionSchema.index({ user: 1, course: 1, module_number: 1, lesson_number: 1 });
QuizSessionSchema.index({ room_name: 1 });

export type QuizSessionDocument = BaseDocument & QuizSession;
