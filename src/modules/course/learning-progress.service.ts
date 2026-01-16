import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import {
  LearningProgress,
  LearningProgressDocument,
  LessonProgress,
  ModuleQuizResult,
} from './schemas';
import { CourseService } from './course.service';
import { UserDocument } from '../user/schemas';
import { TeachingState } from './dtos';

@Injectable()
export class LearningProgressService {
  constructor(
    @InjectModel(LearningProgress.name)
    private learningProgressModel: Model<LearningProgressDocument>,
    private readonly courseService: CourseService,
  ) {}

  /**
   * Get or create learning progress for a user's course
   */
  async getOrCreateProgress(
    user: UserDocument,
    courseId: string,
  ): Promise<LearningProgressDocument> {
    // Check if course exists and user has access
    const course = await this.courseService.getCourse({
      _id: courseId,
      user: user._id,
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Find existing progress
    let progress = await this.learningProgressModel.findOne({
      user: user._id,
      course: courseId,
    });

    // Create new progress if not exists
    if (!progress) {
      progress = await this.learningProgressModel.create({
        user: user._id,
        course: courseId,
        current_module: 1,
        current_lesson: '1.1',
        current_subtopic: 0,
        teaching_state: 'greeting',
        lesson_progress: [],
        module_quizzes: [],
        teaching_context: {
          understood_concepts: [],
          struggling_areas: [],
          learning_preferences: [],
          analogies_used: [],
        },
      });
    }

    return progress;
  }

  /**
   * Get learning progress by room name (for agent use)
   */
  async getProgressByRoomName(roomName: string): Promise<{
    progress: LearningProgressDocument | null;
    courseId: string;
    moduleNumber: number;
    lessonNumber: string;
  }> {
    // Parse room name: course-{courseId}-module-{moduleNumber}-lesson-{lessonNumber}
    const pattern = /^course-(.+)-module-(\d+)-lesson-(.+)$/;
    const match = roomName.match(pattern);

    if (!match) {
      throw new BadRequestException(
        `Invalid room name format: ${roomName}`,
      );
    }

    const courseId = match[1];
    const moduleNumber = parseInt(match[2], 10);
    const lessonNumber = match[3];

    const progress = await this.learningProgressModel.findOne({
      course: courseId,
    });

    return { progress, courseId, moduleNumber, lessonNumber };
  }

  /**
   * Update teaching state
   */
  async updateTeachingState(
    userId: string,
    courseId: string,
    state: TeachingState,
    currentSubtopic?: number,
  ): Promise<LearningProgressDocument> {
    const update: any = {
      teaching_state: state,
      last_session_at: new Date(),
    };

    if (currentSubtopic !== undefined) {
      update.current_subtopic = currentSubtopic;
    }

    const progress = await this.learningProgressModel.findOneAndUpdate(
      { user: userId, course: courseId },
      { $set: update },
      { new: true },
    );

    if (!progress) {
      throw new NotFoundException('Learning progress not found');
    }

    return progress;
  }

  /**
   * Update or create lesson progress
   */
  async updateLessonProgress(
    userId: string,
    courseId: string,
    moduleNumber: number,
    lessonNumber: string,
    updates: Partial<LessonProgress>,
  ): Promise<LearningProgressDocument> {
    const progress = await this.learningProgressModel.findOne({
      user: userId,
      course: courseId,
    });

    if (!progress) {
      throw new NotFoundException('Learning progress not found');
    }

    // Find existing lesson progress or create new
    let lessonProgress = progress.lesson_progress.find(
      (lp) => lp.module_number === moduleNumber && lp.lesson_number === lessonNumber,
    );

    if (!lessonProgress) {
      // Create new lesson progress
      lessonProgress = {
        lesson_number: lessonNumber,
        module_number: moduleNumber,
        subtopics: updates.subtopics || [],
        current_subtopic_index: 0,
        status: 'in_progress',
        started_at: new Date(),
        understanding_score: 0,
        questions_asked: [],
        key_takeaways: [],
        time_spent_seconds: 0,
      } as LessonProgress;
      progress.lesson_progress.push(lessonProgress);
    } else {
      // Update existing
      const idx = progress.lesson_progress.indexOf(lessonProgress);
      if (updates.subtopics) {
        progress.lesson_progress[idx].subtopics = updates.subtopics;
      }
      if (updates.current_subtopic_index !== undefined) {
        progress.lesson_progress[idx].current_subtopic_index = updates.current_subtopic_index;
      }
      if (updates.understanding_score !== undefined) {
        progress.lesson_progress[idx].understanding_score = updates.understanding_score;
      }
      if (updates.status) {
        progress.lesson_progress[idx].status = updates.status;
        if (updates.status === 'completed') {
          progress.lesson_progress[idx].completed_at = new Date();
        }
      }
    }

    await progress.save();
    return progress;
  }

  /**
   * Mark a subtopic as completed with understanding confirmed
   */
  async confirmSubtopicUnderstanding(
    userId: string,
    courseId: string,
    moduleNumber: number,
    lessonNumber: string,
    subtopicIndex: number,
  ): Promise<LearningProgressDocument> {
    const progress = await this.learningProgressModel.findOne({
      user: userId,
      course: courseId,
    });

    if (!progress) {
      throw new NotFoundException('Learning progress not found');
    }

    const lessonProgress = progress.lesson_progress.find(
      (lp) => lp.module_number === moduleNumber && lp.lesson_number === lessonNumber,
    );

    if (lessonProgress && lessonProgress.subtopics[subtopicIndex]) {
      lessonProgress.subtopics[subtopicIndex].is_completed = true;
      lessonProgress.subtopics[subtopicIndex].understanding_confirmed = true;
      lessonProgress.subtopics[subtopicIndex].completed_at = new Date();
      lessonProgress.current_subtopic_index = subtopicIndex + 1;
    }

    await progress.save();
    return progress;
  }

  /**
   * Save module quiz result
   */
  async saveQuizResult(
    userId: string,
    courseId: string,
    quizResult: ModuleQuizResult,
  ): Promise<LearningProgressDocument> {
    const progress = await this.learningProgressModel.findOne({
      user: userId,
      course: courseId,
    });

    if (!progress) {
      throw new NotFoundException('Learning progress not found');
    }

    // Find existing quiz for this module or add new
    const existingQuizIdx = progress.module_quizzes.findIndex(
      (q) => q.module_number === quizResult.module_number,
    );

    if (existingQuizIdx >= 0) {
      progress.module_quizzes[existingQuizIdx] = quizResult;
    } else {
      progress.module_quizzes.push(quizResult);
    }

    await progress.save();
    return progress;
  }

  /**
   * Advance to the next lesson (or module if current lesson is last in module)
   */
  async advanceToNextLesson(
    userId: string,
    courseId: string,
  ): Promise<{
    progress: LearningProgressDocument;
    newModule: number;
    newLesson: string;
    moduleCompleted: boolean;
    courseCompleted: boolean;
  }> {
    const progress = await this.learningProgressModel.findOne({
      user: userId,
      course: courseId,
    }).populate('course');

    if (!progress) {
      throw new NotFoundException('Learning progress not found');
    }

    const course = progress.course as any;
    const currentModule = progress.current_module;
    const currentLesson = progress.current_lesson;

    // Find current module in course
    const moduleData = course.modules?.find(
      (m: any) => m.module_number === currentModule,
    );

    if (!moduleData) {
      throw new NotFoundException('Current module not found in course');
    }

    // Find current lesson index
    const lessonIndex = moduleData.lessons?.findIndex(
      (l: any) => l.lesson_number === currentLesson,
    );

    let newModule = currentModule;
    let newLesson = currentLesson;
    let moduleCompleted = false;
    let courseCompleted = false;

    // Check if there's a next lesson in current module
    if (lessonIndex < moduleData.lessons.length - 1) {
      newLesson = moduleData.lessons[lessonIndex + 1].lesson_number;
    } else {
      // Current module is complete
      moduleCompleted = true;

      // Check if there's a next module
      const nextModule = course.modules?.find(
        (m: any) => m.module_number === currentModule + 1,
      );

      if (nextModule && nextModule.lessons?.length > 0) {
        newModule = nextModule.module_number;
        newLesson = nextModule.lessons[0].lesson_number;
      } else {
        // Course is complete
        courseCompleted = true;
      }
    }

    // Update progress
    progress.current_module = newModule;
    progress.current_lesson = newLesson;
    progress.current_subtopic = 0;
    progress.teaching_state = moduleCompleted ? 'quiz' : 'greeting';

    await progress.save();

    return {
      progress,
      newModule,
      newLesson,
      moduleCompleted,
      courseCompleted,
    };
  }

  /**
   * Update teaching context (AI's memory about the learner)
   */
  async updateTeachingContext(
    userId: string,
    courseId: string,
    updates: {
      understoodConcept?: string;
      strugglingArea?: string;
      lastTopicTaught?: string;
      analogyUsed?: string;
    },
  ): Promise<LearningProgressDocument> {
    const progress = await this.learningProgressModel.findOne({
      user: userId,
      course: courseId,
    });

    if (!progress) {
      throw new NotFoundException('Learning progress not found');
    }

    if (updates.understoodConcept) {
      if (!progress.teaching_context.understood_concepts.includes(updates.understoodConcept)) {
        progress.teaching_context.understood_concepts.push(updates.understoodConcept);
      }
    }

    if (updates.strugglingArea) {
      if (!progress.teaching_context.struggling_areas.includes(updates.strugglingArea)) {
        progress.teaching_context.struggling_areas.push(updates.strugglingArea);
      }
    }

    if (updates.lastTopicTaught) {
      progress.teaching_context.last_topic_taught = updates.lastTopicTaught;
    }

    if (updates.analogyUsed) {
      if (!progress.teaching_context.analogies_used.includes(updates.analogyUsed)) {
        progress.teaching_context.analogies_used.push(updates.analogyUsed);
      }
    }

    await progress.save();
    return progress;
  }

  /**
   * Get progress summary for a course
   */
  async getProgressSummary(
    userId: string,
    courseId: string,
  ): Promise<{
    currentPosition: { module: number; lesson: string; subtopic: number };
    teachingState: string;
    lessonsCompleted: number;
    totalLessons: number;
    modulesCompleted: number;
    totalModules: number;
    averageUnderstanding: number;
    quizResults: ModuleQuizResult[];
  }> {
    const progress = await this.learningProgressModel
      .findOne({ user: userId, course: courseId })
      .populate('course');

    if (!progress) {
      throw new NotFoundException('Learning progress not found');
    }

    const course = progress.course as any;
    const totalModules = course.modules?.length || 0;
    const totalLessons = course.modules?.reduce(
      (acc: number, m: any) => acc + (m.lessons?.length || 0),
      0,
    ) || 0;

    const lessonsCompleted = progress.lesson_progress.filter(
      (lp) => lp.status === 'completed',
    ).length;

    const modulesCompleted = progress.module_quizzes.filter(
      (q) => q.passed,
    ).length;

    const averageUnderstanding =
      progress.lesson_progress.length > 0
        ? progress.lesson_progress.reduce(
            (acc, lp) => acc + (lp.understanding_score || 0),
            0,
          ) / progress.lesson_progress.length
        : 0;

    return {
      currentPosition: {
        module: progress.current_module,
        lesson: progress.current_lesson,
        subtopic: progress.current_subtopic,
      },
      teachingState: progress.teaching_state,
      lessonsCompleted,
      totalLessons,
      modulesCompleted,
      totalModules,
      averageUnderstanding,
      quizResults: progress.module_quizzes,
    };
  }
}
