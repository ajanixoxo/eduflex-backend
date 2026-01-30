import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitQuizAnswerDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'q1',
  })
  @IsString()
  @IsNotEmpty()
  question_id: string;

  @ApiProperty({
    description: 'User answer',
    example: 'B',
  })
  @IsString()
  @IsNotEmpty()
  user_answer: string;
}

export interface QuizQuestion {
  question_id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizQuestionsResponse {
  course_id: string;
  total_questions: number;
  questions: QuizQuestion[];
}

export interface QuizAnswerResponse {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  score: {
    correct: number;
    total: number;
  };
}

// Internal interface that includes the correct answer (not exposed to client)
export interface QuizQuestionWithAnswer extends QuizQuestion {
  correct_answer: string;
  explanation: string;
}
