import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsMongoId,
  IsArray,
  IsBoolean,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TeachingState {
  GREETING = 'greeting',
  EXPLAINING = 'explaining',
  CHECKING_UNDERSTANDING = 'checking_understanding',
  ANSWERING_QUESTION = 'answering_question',
  QUIZ = 'quiz',
  TRANSITIONING = 'transitioning',
  COMPLETED = 'completed',
}

export class SubtopicDto {
  @ApiProperty({ description: 'Subtopic number within the lesson' })
  @IsNumber()
  subtopic_number: number;

  @ApiProperty({ description: 'Title of the subtopic' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Key points to cover' })
  @IsArray()
  @IsString({ each: true })
  key_points: string[];

  @ApiProperty({ description: 'Whether subtopic is completed', default: false })
  @IsBoolean()
  @IsOptional()
  is_completed?: boolean;

  @ApiProperty({ description: 'User confirmed understanding', default: false })
  @IsBoolean()
  @IsOptional()
  understanding_confirmed?: boolean;
}

export class QuizQuestionDto {
  @ApiProperty({ description: 'The quiz question' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'Correct answer' })
  @IsString()
  correct_answer: string;

  @ApiProperty({ description: 'User\'s answer' })
  @IsString()
  user_answer: string;

  @ApiProperty({ description: 'Whether answer was correct' })
  @IsBoolean()
  is_correct: boolean;

  @ApiProperty({ description: 'Explanation of the answer', required: false })
  @IsString()
  @IsOptional()
  explanation?: string;
}

export class GetLearningProgressDto {
  @ApiProperty({ description: 'Course ID' })
  @IsMongoId()
  courseId: string;
}

export class InitializeLearningProgressDto {
  @ApiProperty({ description: 'Course ID' })
  @IsMongoId()
  courseId: string;

  @ApiProperty({ description: 'Starting module number', default: 1 })
  @IsNumber()
  @IsOptional()
  startModule?: number;

  @ApiProperty({ description: 'Starting lesson number', default: '1.1' })
  @IsString()
  @IsOptional()
  startLesson?: string;
}

export class UpdateTeachingStateDto {
  @ApiProperty({ description: 'Course ID' })
  @IsMongoId()
  courseId: string;

  @ApiProperty({ description: 'New teaching state', enum: TeachingState })
  @IsEnum(TeachingState)
  state: TeachingState;

  @ApiProperty({ description: 'Current subtopic index', required: false })
  @IsNumber()
  @IsOptional()
  currentSubtopic?: number;
}

export class UpdateLessonProgressDto {
  @ApiProperty({ description: 'Course ID' })
  @IsMongoId()
  courseId: string;

  @ApiProperty({ description: 'Module number' })
  @IsNumber()
  moduleNumber: number;

  @ApiProperty({ description: 'Lesson number (e.g., "1.1")' })
  @IsString()
  lessonNumber: string;

  @ApiProperty({ description: 'Subtopics for this lesson', required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtopicDto)
  @IsOptional()
  subtopics?: SubtopicDto[];

  @ApiProperty({ description: 'Current subtopic index', required: false })
  @IsNumber()
  @IsOptional()
  currentSubtopicIndex?: number;

  @ApiProperty({ description: 'Understanding score (0-100)', required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  understandingScore?: number;

  @ApiProperty({ description: 'Mark lesson as completed', required: false })
  @IsBoolean()
  @IsOptional()
  markCompleted?: boolean;
}

export class AdvanceToNextLessonDto {
  @ApiProperty({ description: 'Course ID' })
  @IsMongoId()
  courseId: string;
}

export class SaveQuizResultDto {
  @ApiProperty({ description: 'Course ID' })
  @IsMongoId()
  courseId: string;

  @ApiProperty({ description: 'Module number' })
  @IsNumber()
  moduleNumber: number;

  @ApiProperty({ description: 'Quiz questions and answers' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];

  @ApiProperty({ description: 'Quiz score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;
}

export class UpdateTeachingContextDto {
  @ApiProperty({ description: 'Course ID' })
  @IsMongoId()
  courseId: string;

  @ApiProperty({ description: 'Concepts understood', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  understoodConcepts?: string[];

  @ApiProperty({ description: 'Areas where user struggles', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  strugglingAreas?: string[];

  @ApiProperty({ description: 'Last topic taught', required: false })
  @IsString()
  @IsOptional()
  lastTopicTaught?: string;
}

// Agent-specific DTOs (called from LiveKit agent)
export class AgentGetProgressDto {
  @ApiProperty({ description: 'Room name in format course-{id}-module-{n}-lesson-{n}' })
  @IsString()
  room_name: string;
}

export class AgentUpdateProgressDto {
  @ApiProperty({ description: 'Room name' })
  @IsString()
  room_name: string;

  @ApiProperty({ description: 'Teaching state', enum: TeachingState, required: false })
  @IsEnum(TeachingState)
  @IsOptional()
  teaching_state?: TeachingState;

  @ApiProperty({ description: 'Current subtopic index', required: false })
  @IsNumber()
  @IsOptional()
  current_subtopic?: number;

  @ApiProperty({ description: 'Mark current lesson complete', required: false })
  @IsBoolean()
  @IsOptional()
  lesson_complete?: boolean;

  @ApiProperty({ description: 'Understanding confirmed for current subtopic', required: false })
  @IsBoolean()
  @IsOptional()
  understanding_confirmed?: boolean;

  @ApiProperty({ description: 'Concept the user understood', required: false })
  @IsString()
  @IsOptional()
  understood_concept?: string;

  @ApiProperty({ description: 'Area user is struggling with', required: false })
  @IsString()
  @IsOptional()
  struggling_area?: string;
}
