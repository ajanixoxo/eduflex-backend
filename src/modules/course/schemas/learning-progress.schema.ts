import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument, TimestampMixin } from 'src/modules/shared/types';
import { Schema as MongooseSchema } from 'mongoose';
import { type UserDocument } from 'src/modules/user/schemas';
import { type CourseDocument } from './course.schema';

/**
 * Subtopic - A smaller concept within a lesson
 * Each lesson is broken into 3-5 subtopics for progressive teaching
 */
@Schema({ _id: false })
export class Subtopic {
  @Prop({ required: true })
  subtopic_number: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  key_points: string[]; // Main points to cover in this subtopic

  @Prop({ default: false })
  is_completed: boolean;

  @Prop({ default: false })
  understanding_confirmed: boolean; // User confirmed they understand

  @Prop({ type: Date })
  completed_at?: Date;
}

const SubtopicSchema = SchemaFactory.createForClass(Subtopic);

/**
 * Lesson Progress - Tracks progress within a single lesson
 */
@Schema({ _id: false })
export class LessonProgress {
  @Prop({ required: true })
  lesson_number: string;

  @Prop({ required: true })
  module_number: number;

  @Prop({ type: [SubtopicSchema], default: [] })
  subtopics: Subtopic[];

  @Prop({ default: 0 })
  current_subtopic_index: number; // Which subtopic we're currently on

  @Prop({
    enum: ['not_started', 'in_progress', 'quiz_pending', 'completed'],
    default: 'not_started',
  })
  status: string;

  @Prop({ type: Date })
  started_at?: Date;

  @Prop({ type: Date })
  completed_at?: Date;

  @Prop({ default: 0 })
  understanding_score: number; // 0-100 based on comprehension checks

  @Prop({ type: [String], default: [] })
  questions_asked: string[]; // User's questions during the lesson

  @Prop({ type: [String], default: [] })
  key_takeaways: string[]; // AI-identified key learnings

  @Prop({ default: 0 })
  time_spent_seconds: number;
}

const LessonProgressSchema = SchemaFactory.createForClass(LessonProgress);

/**
 * Quiz Question Result
 */
@Schema({ _id: false })
export class QuizQuestionResult {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  correct_answer: string;

  @Prop({ required: true })
  user_answer: string;

  @Prop({ required: true })
  is_correct: boolean;

  @Prop()
  explanation?: string;
}

const QuizQuestionResultSchema = SchemaFactory.createForClass(QuizQuestionResult);

/**
 * Module Quiz Result - End-of-module assessment
 */
@Schema({ _id: false })
export class ModuleQuizResult {
  @Prop({ required: true })
  module_number: number;

  @Prop({ type: [QuizQuestionResultSchema], default: [] })
  questions: QuizQuestionResult[];

  @Prop({ required: true, min: 0, max: 100 })
  score: number;

  @Prop({ required: true, min: 0, max: 100 })
  passing_score: number; // Minimum required to pass

  @Prop({ default: false })
  passed: boolean;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ type: Date })
  completed_at?: Date;

  @Prop({ type: [String], default: [] })
  areas_to_review: string[]; // Topics to revisit based on wrong answers
}

const ModuleQuizResultSchema = SchemaFactory.createForClass(ModuleQuizResult);

/**
 * Teaching Context - What the AI should remember about this learner
 */
@Schema({ _id: false })
export class TeachingContext {
  @Prop({ type: [String], default: [] })
  understood_concepts: string[]; // Concepts the user has demonstrated understanding

  @Prop({ type: [String], default: [] })
  struggling_areas: string[]; // Areas where user needed extra help

  @Prop({ type: [String], default: [] })
  learning_preferences: string[]; // How user prefers to learn (examples, visuals, etc.)

  @Prop({ type: String })
  last_topic_taught?: string; // For continuity

  @Prop({ type: String })
  last_example_used?: string; // Avoid repetition

  @Prop({ type: [String], default: [] })
  analogies_used: string[]; // Track what analogies worked

  @Prop({ type: String })
  communication_style?: string; // Formal, casual, etc. based on interaction
}

const TeachingContextSchema = SchemaFactory.createForClass(TeachingContext);

/**
 * Learning Progress - Main schema to track a user's progress in a course
 */
@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class LearningProgress extends TimestampMixin {
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

  // Current position in the course
  @Prop({ required: true, default: 1 })
  current_module: number;

  @Prop({ required: true, default: '1.1' })
  current_lesson: string;

  @Prop({ default: 0 })
  current_subtopic: number;

  // Teaching state machine
  @Prop({
    enum: ['greeting', 'explaining', 'checking_understanding', 'answering_question', 'quiz', 'transitioning', 'completed'],
    default: 'greeting',
  })
  teaching_state: string;

  // Progress tracking
  @Prop({ type: [LessonProgressSchema], default: [] })
  lesson_progress: LessonProgress[];

  @Prop({ type: [ModuleQuizResultSchema], default: [] })
  module_quizzes: ModuleQuizResult[];

  // AI's memory about this learner
  @Prop({ type: TeachingContextSchema, default: () => ({}) })
  teaching_context: TeachingContext;

  // Overall stats
  @Prop({ default: 0 })
  total_time_spent_seconds: number;

  @Prop({ default: 0 })
  total_questions_asked: number;

  @Prop({ default: 0 })
  average_understanding_score: number;

  @Prop({ type: Date })
  last_session_at?: Date;

  // Session management
  @Prop({ type: String })
  active_session_id?: string;
}

export const LearningProgressSchema = SchemaFactory.createForClass(LearningProgress);

// Indexes for efficient queries
LearningProgressSchema.index({ user: 1, course: 1 }, { unique: true });
LearningProgressSchema.index({ user: 1, 'lesson_progress.lesson_number': 1 });

export type LearningProgressDocument = BaseDocument & LearningProgress;
