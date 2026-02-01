import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { PaginationService } from '../shared/services';
import { Course, CourseDocument } from './schemas';
import axios, { AxiosInstance } from 'axios';
import { Env } from '../shared/constants';
import { CreateCourseDto, GenerateExamTopicsResponse, ListCoursesDto } from './dtos';
import { GradeLevel, Language, LessonType } from './enums';
import { IGeneratedCourseContent } from './types';
import { UserService } from '../user/user.service';

@Injectable()
export class CourseService {
  protected client: AxiosInstance;

  constructor(
    @InjectModel(Course.name)
    private readonly _courseModel: Model<CourseDocument>,
    private readonly paginationService: PaginationService,
    private readonly userService: UserService,
  ) {
    this.client = axios.create({
      baseURL: Env.AI_WEB_URL,
    });
  }

  get courseModel() {
    return this._courseModel;
  }

  async generateCourseOutline({
    payload,
  }: {
    payload: CreateCourseDto;
  }): Promise<IGeneratedCourseContent> {
    try {
      const response = await this.client.post(
        '/generate-course-outline',
        payload,
      );
      return response.data;
    } catch (error: any) {
      console.warn(
        `AI service unavailable for course outline generation, using fallback for topic: ${payload.topic}`,
      );
      // Return a fallback course outline when AI service is unavailable
      return this.generateFallbackCourseOutline(payload);
    }
  }

  /**
   * Generate fallback course outline when AI service is unavailable
   */
  private generateFallbackCourseOutline(
    payload: CreateCourseDto,
  ): IGeneratedCourseContent {
    const topic = payload.topic;
    const isExamPrep = payload.course_mode === 'exam_prep';
    const examTopics = payload.exam_topics || [];

    // Use exam topics if available, otherwise generate generic modules
    const moduleTopics =
      examTopics.length > 0
        ? examTopics
        : [
            `Introduction to ${topic}`,
            `Core Concepts of ${topic}`,
            `${topic} in Practice`,
            `Advanced ${topic}`,
          ];

    const modules = moduleTopics.map((moduleTopic, index) => ({
      module_number: index + 1,
      title: moduleTopic,
      status: 'pending' as const,
      lessons: [
        {
          lesson_number: '1',
          title: `Understanding ${moduleTopic}`,
          type: isExamPrep ? LessonType.PRACTICE_QUIZ : LessonType.VIDEO,
          resources: [],
        },
        {
          lesson_number: '2',
          title: `Key Principles of ${moduleTopic}`,
          type: isExamPrep ? LessonType.PRACTICE_QUIZ : LessonType.VIDEO,
          resources: [],
        },
        {
          lesson_number: '3',
          title: `Applying ${moduleTopic}`,
          type: isExamPrep ? LessonType.PRACTICE_QUIZ : LessonType.VIDEO,
          resources: [],
        },
      ],
    }));

    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

    return {
      title: isExamPrep ? `${topic} Exam Preparation` : `Learn ${topic}`,
      estimated_duration: `${totalLessons * 15} minutes`,
      total_lessons: totalLessons,
      time_per_session: payload.time_dedication || '30m',
      modules,
    };
  }

  async generateExamSubtopics({
    topic,
    grade_level,
    language,
  }: {
    topic: string;
    grade_level: GradeLevel;
    language?: Language;
  }): Promise<GenerateExamTopicsResponse> {
    try {
      const response = await this.client.post('/generate-exam-topics', {
        topic,
        grade_level,
        language: language || Language.EN,
      });
      return response.data;
    } catch (error: any) {
      // Fallback: Generate basic subtopics if AI service is unavailable
      console.warn(
        `AI service unavailable for topic generation, using fallback for topic: ${topic}`,
      );
      return this.generateFallbackSubtopics(topic, grade_level);
    }
  }

  /**
   * Generate fallback subtopics when AI service is unavailable
   */
  private generateFallbackSubtopics(
    topic: string,
    grade_level: GradeLevel,
  ): GenerateExamTopicsResponse {
    // Generate generic subtopics based on the main topic
    const subtopics = [
      {
        name: `Introduction to ${topic}`,
        description: `Basic concepts and fundamentals of ${topic}`,
      },
      {
        name: `Core Principles of ${topic}`,
        description: `Key principles and theories related to ${topic}`,
      },
      {
        name: `${topic} Applications`,
        description: `Real-world applications and examples`,
      },
      {
        name: `${topic} Problem Solving`,
        description: `Practice problems and exercises`,
      },
      {
        name: `Advanced ${topic} Concepts`,
        description: `More complex topics and advanced material`,
      },
    ];

    return {
      topic,
      grade_level,
      subtopics,
    };
  }

  async createCourse(
    createDto: Partial<Course>,
    session?: ClientSession,
  ): Promise<CourseDocument> {
    const created = new this.courseModel(createDto);
    return created.save({ session });
  }

  async updateCourse(
    filter: FilterQuery<CourseDocument>,
    update: UpdateQuery<CourseDocument>,
    session?: ClientSession,
  ): Promise<CourseDocument | null> {
    return this.courseModel
      .findOneAndUpdate(filter, update, { new: true })
      .session(session || null);
  }

  async getCourse(
    filter: FilterQuery<CourseDocument>,
  ): Promise<CourseDocument | null> {
    return this.courseModel.findOne(filter).populate([
      {
        path: 'user',
        select: 'firstname lastname email',
      },
      {
        path: 'ai_avatar',
        populate: 'media',
      },
      {
        path: 'ai_voice',
        populate: 'media',
      },
    ]);
  }

  async getAllCourses(
    filter: FilterQuery<CourseDocument>,
    listQueryDto: ListCoursesDto,
  ) {
    const { page, per_page } = listQueryDto;
    const { items, meta } = await this.paginationService.paginate(
      this.courseModel,
      filter,
      page,
      per_page,
      [
        {
          path: 'user',
          select: 'firstname lastname email',
        },
      ],
    );
    return { items, meta };
  }

  async getCourseModule({
    filter,
    moduleNumber,
  }: {
    filter: FilterQuery<CourseDocument>;
    moduleNumber: number;
  }) {
    const course = await this.courseModel.findOne(filter, 'modules');
    if (!course?.modules?.length) return null;
    return course.modules.find((m) => m.module_number === moduleNumber) || null;
  }
  async markLessonCompleted({
    filter,
    moduleNumber,
    lessonNumber,
  }: {
    filter: FilterQuery<CourseDocument>;
    moduleNumber: number;
    lessonNumber: string;
  }): Promise<CourseDocument | null> {
    const course = await this.courseModel.findOne(filter);
    if (!course) throw new NotFoundException('Course not found');

    const module = course.modules.find((m) => m.module_number === moduleNumber);
    if (!module) throw new NotFoundException('Module not found');

    const lesson = module.lessons.find((l) => l.lesson_number === lessonNumber);
    if (!lesson) throw new NotFoundException('Lesson not found');

    if ((lesson as any).status === 'completed') return course;

    (lesson as any).status = 'completed';
    lesson.updated_at = new Date();

    const allLessonsCompleted = module.lessons.every(
      (l) => (l as any).status === 'completed',
    );
    if (allLessonsCompleted) {
      (module as any).status = 'completed';
      module.updated_at = new Date();
    }

    const totalLessons = course.modules.reduce(
      (acc, m) => acc + m.lessons.length,
      0,
    );
    const completedLessons = course.modules.reduce(
      (acc, m) =>
        acc + m.lessons.filter((l) => (l as any).status === 'completed').length,
      0,
    );

    const percentComplete = totalLessons
      ? Math.min(100, Math.floor((completedLessons / totalLessons) * 100))
      : 0;

    course.progress = {
      percent_complete: percentComplete,
      updated_at: new Date(),
    };

    const allModulesCompleted = course.modules.every(
      (m) => (m as any).status === 'completed',
    );
    if (allModulesCompleted) {
      (course as any).status = 'completed';
    }

    await course.save();

    const user = await this.userService.userModel.findById(course.user);
    if (user) {
      const today = new Date();
      const lastUpdate = user.streak?.last_streak_update
        ? new Date(user.streak.last_streak_update)
        : null;

      const isNewDay =
        !lastUpdate || today.toDateString() !== lastUpdate.toDateString();

      if (isNewDay) {
        const isConsecutive =
          lastUpdate &&
          (today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24) <= 1;

        user.streak.current_streak = isConsecutive
          ? user.streak.current_streak + 1
          : 1;

        if (user.streak.current_streak > user.streak.longest_streak) {
          user.streak.longest_streak = user.streak.current_streak;
        }

        user.streak.last_streak_update = today;
        await user.save();
      }
    }

    return course;
  }
}
