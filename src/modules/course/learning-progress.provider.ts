import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { LearningProgressService } from './learning-progress.service';
import { CourseService } from './course.service';
import { UserDocument } from '../user/schemas';
import { IApiResponseDto } from '../shared/types';
import {
  GetLearningProgressDto,
  InitializeLearningProgressDto,
  UpdateTeachingStateDto,
  UpdateLessonProgressDto,
  AdvanceToNextLessonDto,
  SaveQuizResultDto,
  UpdateTeachingContextDto,
  AgentGetProgressDto,
  AgentUpdateProgressDto,
  TeachingState,
} from './dtos';

@Injectable()
export class LearningProgressProvider {
  constructor(
    private readonly learningProgressService: LearningProgressService,
    private readonly courseService: CourseService,
  ) {}

  /**
   * Get learning progress for a course
   */
  async getProgress(
    user: UserDocument,
    query: GetLearningProgressDto,
  ): Promise<IApiResponseDto> {
    const progress = await this.learningProgressService.getOrCreateProgress(
      user,
      query.courseId,
    );

    return {
      message: 'Learning progress retrieved successfully',
      data: progress,
    };
  }

  /**
   * Initialize learning progress for a new course
   */
  async initializeProgress(
    user: UserDocument,
    body: InitializeLearningProgressDto,
  ): Promise<IApiResponseDto> {
    const progress = await this.learningProgressService.getOrCreateProgress(
      user,
      body.courseId,
    );

    return {
      message: 'Learning progress initialized successfully',
      data: progress,
    };
  }

  /**
   * Update teaching state
   */
  async updateTeachingState(
    user: UserDocument,
    body: UpdateTeachingStateDto,
  ): Promise<IApiResponseDto> {
    const progress = await this.learningProgressService.updateTeachingState(
      user._id.toString(),
      body.courseId,
      body.state,
      body.currentSubtopic,
    );

    return {
      message: 'Teaching state updated successfully',
      data: progress,
    };
  }

  /**
   * Update lesson progress
   */
  async updateLessonProgress(
    user: UserDocument,
    body: UpdateLessonProgressDto,
  ): Promise<IApiResponseDto> {
    const updates: any = {};

    if (body.subtopics) updates.subtopics = body.subtopics;
    if (body.currentSubtopicIndex !== undefined) updates.current_subtopic_index = body.currentSubtopicIndex;
    if (body.understandingScore !== undefined) updates.understanding_score = body.understandingScore;
    if (body.markCompleted) updates.status = 'completed';

    const progress = await this.learningProgressService.updateLessonProgress(
      user._id.toString(),
      body.courseId,
      body.moduleNumber,
      body.lessonNumber,
      updates,
    );

    return {
      message: 'Lesson progress updated successfully',
      data: progress,
    };
  }

  /**
   * Advance to next lesson
   */
  async advanceToNextLesson(
    user: UserDocument,
    body: AdvanceToNextLessonDto,
  ): Promise<IApiResponseDto> {
    const result = await this.learningProgressService.advanceToNextLesson(
      user._id.toString(),
      body.courseId,
    );

    return {
      message: result.courseCompleted
        ? 'Course completed!'
        : result.moduleCompleted
        ? 'Module completed! Quiz time.'
        : 'Advanced to next lesson',
      data: result,
    };
  }

  /**
   * Save quiz result
   */
  async saveQuizResult(
    user: UserDocument,
    body: SaveQuizResultDto,
  ): Promise<IApiResponseDto> {
    const passingScore = 70; // 70% to pass
    const passed = body.score >= passingScore;

    const progress = await this.learningProgressService.saveQuizResult(
      user._id.toString(),
      body.courseId,
      {
        module_number: body.moduleNumber,
        questions: body.questions,
        score: body.score,
        passing_score: passingScore,
        passed,
        attempts: 1, // Would need to track attempts properly
        completed_at: new Date(),
        areas_to_review: body.questions
          .filter((q) => !q.is_correct)
          .map((q) => q.question),
      },
    );

    return {
      message: passed
        ? 'Quiz passed! Great job!'
        : 'Quiz completed. Consider reviewing the material.',
      data: {
        passed,
        score: body.score,
        passingScore,
        progress,
      },
    };
  }

  /**
   * Get progress summary
   */
  async getProgressSummary(
    user: UserDocument,
    query: GetLearningProgressDto,
  ): Promise<IApiResponseDto> {
    const summary = await this.learningProgressService.getProgressSummary(
      user._id.toString(),
      query.courseId,
    );

    return {
      message: 'Progress summary retrieved successfully',
      data: summary,
    };
  }

  // ========== Agent-specific endpoints ==========

  /**
   * Agent: Get progress by room name
   */
  async agentGetProgress(body: AgentGetProgressDto): Promise<IApiResponseDto> {
    const { progress, courseId, moduleNumber, lessonNumber } =
      await this.learningProgressService.getProgressByRoomName(body.room_name);

    if (!progress) {
      return {
        message: 'No existing progress found',
        data: {
          exists: false,
          courseId,
          moduleNumber,
          lessonNumber,
          teaching_state: 'greeting',
          current_subtopic: 0,
        },
      };
    }

    // Get the lesson progress for the current lesson
    const lessonProgress = progress.lesson_progress.find(
      (lp) => lp.module_number === moduleNumber && lp.lesson_number === lessonNumber,
    );

    return {
      message: 'Progress retrieved successfully',
      data: {
        exists: true,
        courseId,
        moduleNumber,
        lessonNumber,
        teaching_state: progress.teaching_state,
        current_subtopic: lessonProgress?.current_subtopic_index || 0,
        subtopics: lessonProgress?.subtopics || [],
        understanding_score: lessonProgress?.understanding_score || 0,
        teaching_context: progress.teaching_context,
        is_last_lesson_in_module: await this.isLastLessonInModule(
          courseId,
          moduleNumber,
          lessonNumber,
        ),
      },
    };
  }

  /**
   * Agent: Update progress
   */
  async agentUpdateProgress(body: AgentUpdateProgressDto): Promise<IApiResponseDto> {
    const { progress, courseId, moduleNumber, lessonNumber } =
      await this.learningProgressService.getProgressByRoomName(body.room_name);

    if (!progress) {
      return {
        message: 'Progress not found - please initialize first',
        data: { success: false },
      };
    }

    const userId = progress.user.toString();

    // Update teaching state
    if (body.teaching_state) {
      await this.learningProgressService.updateTeachingState(
        userId,
        courseId,
        body.teaching_state as TeachingState,
        body.current_subtopic,
      );
    }

    // Update subtopic understanding
    if (body.understanding_confirmed && body.current_subtopic !== undefined) {
      await this.learningProgressService.confirmSubtopicUnderstanding(
        userId,
        courseId,
        moduleNumber,
        lessonNumber,
        body.current_subtopic,
      );
    }

    // Mark lesson complete
    if (body.lesson_complete) {
      await this.learningProgressService.updateLessonProgress(
        userId,
        courseId,
        moduleNumber,
        lessonNumber,
        { status: 'completed' },
      );
    }

    // Update teaching context
    if (body.understood_concept || body.struggling_area) {
      await this.learningProgressService.updateTeachingContext(
        userId,
        courseId,
        {
          understoodConcept: body.understood_concept,
          strugglingArea: body.struggling_area,
        },
      );
    }

    return {
      message: 'Progress updated successfully',
      data: { success: true },
    };
  }

  /**
   * Helper: Check if lesson is the last in its module
   */
  private async isLastLessonInModule(
    courseId: string,
    moduleNumber: number,
    lessonNumber: string,
  ): Promise<boolean> {
    try {
      const course = await this.courseService.getCourse({ _id: courseId });
      if (!course) return false;

      const module = course.modules?.find((m) => m.module_number === moduleNumber);
      if (!module || !module.lessons) return false;

      const lessonIndex = module.lessons.findIndex((l) => l.lesson_number === lessonNumber);
      return lessonIndex === module.lessons.length - 1;
    } catch {
      return false;
    }
  }
}
