import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseService } from './course.service';
import { UserDocument } from '../user/schemas';
import {
  CreateCourseDto,
  LessonNavDto,
  ListCoursesDto,
  MarkLessonCompleteDto,
  UpdateCourseDto,
} from './dtos';
import { IApiResponseDto } from '../shared/types';
import { FilterQuery } from 'mongoose';
import { CourseDocument } from './schemas';
import { UserTypes } from '../user/enums';
import {
  differenceInMinutes,
  endOfWeek,
  formatDistanceToNowStrict,
  isSameDay,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { formatToGmtPlus1 } from 'src/helpers';
import { CourseStatus } from './enums';
import { UserService } from '../user/user.service';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class CourseProvider {
  protected client: AxiosInstance;
  constructor(
    private readonly courseService: CourseService,
    private readonly userService: UserService,
  ) {
    this.client = axios.create({});
  }

  async createCourse({
    user,
    body,
  }: {
    user: UserDocument;
    body: CreateCourseDto;
  }): Promise<IApiResponseDto> {
    const generated = await this.courseService.generateCourseOutline({
      payload: body,
    });

    const courseData = {
      user: user._id,
      topic: body.topic,
      reason: body.reason,
      title: generated.title,
      estimated_duration: generated.estimated_duration,
      total_lessons: generated.total_lessons,
      time_per_session: generated.time_per_session,
      language: body.language,
      experience_level: body.experience_level,
      teaching_style: body.teaching_style,
      learning_preference: body.learning_preference,
      time_dedication: body.time_dedication,
      target_completion: body.target_completion,
      course_format_addons: body.course_format_addons || [],
      modules: generated.modules.map((m) => ({
        title: m.title,
        module_number: m.module_number,
        status: m.status || 'pending',
        lessons: m.lessons.map((l) => ({
          lesson_number: l.lesson_number,
          title: l.title,
          type: l.type,
          resources: l.resources || [],
        })),
      })),
    };

    const createdCourse =
      await this.courseService.courseModel.create(courseData);

    return {
      message: 'Course created successfully',
      data: createdCourse,
    };
  }

  async updateCourse({
    user,
    body,
  }: {
    user: UserDocument;
    body: UpdateCourseDto;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Course Updated',
    };
  }

  async getCourse({
    user,
    courseId,
  }: {
    user: UserDocument;
    courseId: string;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = {
      _id: courseId,
    };
    if (user.account_type !== UserTypes.STAFF) {
      filter.user = user._id;
    }
    const course = await this.courseService.getCourse(filter);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return {
      message: 'Course Fetched',
      data: course,
    };
  }
  async getCourseModules({
    user,
    courseId,
  }: {
    user: UserDocument;
    courseId: string;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = {
      _id: courseId,
    };
    if (user.account_type !== UserTypes.STAFF) {
      filter.user = user._id;
    }
    const course = await this.courseService.getCourse(filter);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return {
      message: 'Course Modules Fetched',
      data: course.modules ?? [],
    };
  }

  async getCourseModule({
    user,
    courseId,
    moduleNumber,
  }: {
    user: UserDocument;
    courseId: string;
    moduleNumber: number;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = {
      _id: courseId,
    };
    if (user.account_type !== UserTypes.STAFF) {
      filter.user = user._id;
    }
    const module = await this.courseService.getCourseModule({
      filter,
      moduleNumber,
    });
    if (!module) {
      throw new NotFoundException('Module may have been deleted or removed');
    }
    return {
      message: 'Course Section Fetched',
      data: module,
    };
  }

  async markLessonCompleted({
    user,
    body,
  }: {
    user: UserDocument;
    body: MarkLessonCompleteDto;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = {
      _id: body.course_id,
      user,
    };

    const course = await this.courseService.markLessonCompleted({
      filter,
      moduleNumber: body.module_number,
      lessonNumber: body.lesson_number,
    });
    return {
      message: 'Lesson Marked as Completed',
      data: course,
    };
  }
  async getCourseOverview({
    user,
    courseId,
  }: {
    user: UserDocument;
    courseId: string;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = {
      _id: courseId,
      user,
    };

    const course = await this.courseService.getCourse(filter);
    if (!course) {
      throw new NotFoundException('Course Not Found');
    }

    const modules = course.modules || [];
    const lessons = modules.flatMap((m) => m.lessons || []);

    const totalModules = modules.length;
    const totalLessons = lessons.length;
    const completedModules = modules.filter(
      (m) => m.status === 'completed',
    ).length;
    const completedLessons = lessons.filter(
      (l) => (l as any).status === 'completed',
    ).length;

    const progressPercent = course.progress?.percent_complete || 0;

    const lessonDates = lessons
      .map((l) => new Date(l.updated_at).getTime())
      .filter(Boolean)
      .sort((a, b) => a - b);

    let avgDurationPerLesson = 0;
    if (lessonDates.length > 1) {
      const totalDiff = lessonDates
        .slice(1)
        .reduce((sum, date, i) => sum + (date - lessonDates[i]), 0);
      const avgMs = totalDiff / (lessonDates.length - 1);
      avgDurationPerLesson = Math.floor(avgMs / (1000 * 60 * 60));
    }

    let timeUntilTargetCompletion = 'N/A';
    if (course.target_completion) {
      const target = new Date(course.target_completion);
      const now = new Date();

      if (target > now) {
        timeUntilTargetCompletion = formatDistanceToNowStrict(target, {
          addSuffix: false,
        });
      } else {
        timeUntilTargetCompletion = 'Target date reached or passed';
      }
    }

    return {
      message: 'Course Overview Fetched',
      data: {
        title: course.title,
        total_modules: totalModules,
        total_lessons: totalLessons,
        completed_modules: completedModules,
        completed_lessons: completedLessons,
        progress: `${progressPercent}%`,
        avg_duration_per_lesson: `${avgDurationPerLesson} hour(s)`,
        language: course.language,
        experience_level: course.experience_level,
        pace: course.pace,
        target_completion: course.target_completion,
        time_until_target_completion: timeUntilTargetCompletion,
      },
    };
  }
  async getOverview({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = { user: user._id };

    const [
      totalCourses,
      completedCourses,
      savedCourses,
      favouriteCourses,
      activeCourses,
    ] = await Promise.all([
      this.courseService.courseModel.countDocuments(filter),
      this.courseService.courseModel.countDocuments({
        ...filter,
        status: CourseStatus.COMPLETED,
      }),
      this.courseService.courseModel.countDocuments({
        ...filter,
        is_bookmarked: true,
      }),
      this.courseService.courseModel.countDocuments({
        ...filter,
        is_favourite: true,
      }),
      this.courseService.courseModel.countDocuments({
        ...filter,
        'progress.percent_complete': { $gt: 0, $lt: 100 },
      }),
    ]);

    return {
      message: 'Course Overview Fetched',
      data: {
        total_courses: totalCourses,
        completed_courses: completedCourses,
        saved_courses: savedCourses,
        favourite_courses: favouriteCourses,
        active_courses: activeCourses,
      },
    };
  }
  async getAllCourses({
    user,
    query,
  }: {
    user: UserDocument;
    query: ListCoursesDto;
  }): Promise<IApiResponseDto> {
    const {
      page,
      per_page,
      search,
      user_id,
      pace,
      language,
      experience_level,
      teaching_style,
      is_favourite,
      is_bookmarked,
      start_date,
      end_date,
      status,
    } = query;

    const filter: FilterQuery<CourseDocument> = {};

    if (user.account_type !== UserTypes.STAFF) {
      filter.user = user._id;
    } else if (user.account_type === UserTypes.STAFF && user_id) {
      filter.user = user_id;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;
    if (pace) filter.pace = pace;
    if (language) filter.language = language;
    if (experience_level) filter.experience_level = experience_level;
    if (teaching_style) filter.teaching_style = teaching_style;
    if (is_favourite !== undefined) filter.is_favourite = is_favourite;
    if (is_bookmarked !== undefined) filter.is_bookmarked = is_bookmarked;

    if (start_date && end_date) {
      filter.created_at = {
        $gte: formatToGmtPlus1(new Date(start_date)),
        $lte: formatToGmtPlus1(new Date(end_date)),
      };
    }

    const { items, meta } = await this.courseService.getAllCourses(filter, {
      page,
      per_page,
    });

    return {
      message: 'All Courses Retrieved',
      data: {
        items,
        meta,
      },
    };
  }
  async toggleFavourite({
    user,
    courseId,
  }: {
    user: UserDocument;
    courseId: string;
  }): Promise<IApiResponseDto> {
    const course = await this.courseService.courseModel.findOne({
      _id: courseId,
      user: user._id,
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    course.is_favourite = !course.is_favourite;
    await course.save();

    return {
      message: `Course ${course.is_favourite ? 'added to' : 'removed from'} favourites`,
      data: {
        course_id: course._id,
        is_favourite: course.is_favourite,
      },
    };
  }

  async toggleBookmark({
    user,
    courseId,
  }: {
    user: UserDocument;
    courseId: string;
  }): Promise<IApiResponseDto> {
    const course = await this.courseService.courseModel.findOne({
      _id: courseId,
      user: user._id,
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    course.is_bookmarked = !course.is_bookmarked;
    await course.save();

    return {
      message: `Course ${course.is_bookmarked ? 'bookmarked' : 'unbookmarked'}`,
      data: {
        course_id: course._id,
        is_bookmarked: course.is_bookmarked,
      },
    };
  }
  async getActiveCourse({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    const filter = { user };

    const activeCourse = await this.courseService.courseModel
      .findOne({ ...filter, 'progress.percent_complete': { $gt: 0 } })
      .sort({ updated_at: -1 });

    const fallbackCourse =
      activeCourse ||
      (await this.courseService.courseModel
        .findOne(filter)
        .sort({ updated_at: -1 }));

    return {
      message: 'Active Course Retrieved',
      data: fallbackCourse || null,
    };
  }
  async getCourseCategories(): Promise<IApiResponseDto> {
    return {
      message: 'Course Categories Retrieved',
      data: [],
    };
  }
  async exploreCourses({
    user,
    query,
  }: {
    user: UserDocument;
    query: ListCoursesDto;
  }): Promise<IApiResponseDto> {
    const {
      page,
      per_page,
      search,
      pace,
      language,
      experience_level,
      teaching_style,
      start_date,
      end_date,
      status,
    } = query;

    const filter: FilterQuery<CourseDocument> = {
      user: { $ne: user._id },
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (pace) {
      filter.pace = pace;
    }

    if (language) {
      filter.language = language;
    }

    if (experience_level) {
      filter.experience_level = experience_level;
    }

    if (teaching_style) {
      filter.teaching_style = teaching_style;
    }

    if (start_date && end_date) {
      filter.created_at = {
        $gte: formatToGmtPlus1(new Date(start_date)),
        $lte: formatToGmtPlus1(new Date(end_date)),
      };
    }

    const { items, meta } = await this.courseService.getAllCourses(filter, {
      page,
      per_page,
    });

    return {
      message: 'Explore Courses Retrieved',
      data: {
        items,
        meta,
      },
    };
  }
  async getNextSection({
    user,
    courseId,
    currentSection,
  }: {
    user: UserDocument;
    courseId: string;
    currentSection: LessonNavDto;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = { _id: courseId, user };
    const course = await this.courseService.getCourse(filter);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const modules = course.modules.sort(
      (a, b) => a.module_number - b.module_number,
    );
    const currentModuleIndex = modules.findIndex(
      (m) => m.module_number === currentSection.module_number,
    );

    if (currentModuleIndex === -1) {
      return { message: 'Next Section Retrieved', data: null };
    }

    const currentModule = modules[currentModuleIndex];
    const lessons = currentModule.lessons;
    const currentLessonIndex = lessons.findIndex(
      (l) => l.lesson_number === currentSection.lesson_number,
    );

    if (currentLessonIndex >= 0 && currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1];
      return {
        message: 'Next Section Retrieved',
        data: {
          module_number: currentModule.module_number,
          lesson_number: nextLesson.lesson_number,
          title: nextLesson.title,
          type: nextLesson.type,
        },
      };
    }

    const nextModule = modules[currentModuleIndex + 1];
    if (nextModule && nextModule.lessons.length) {
      const nextLesson = nextModule.lessons[0];
      return {
        message: 'Next Section Retrieved',
        data: {
          module_number: nextModule.module_number,
          lesson_number: nextLesson.lesson_number,
          title: nextLesson.title,
          type: nextLesson.type,
        },
      };
    }

    return { message: 'Next Section Retrieved', data: null };
  }

  async getPreviousSection({
    user,
    courseId,
    currentSection,
  }: {
    user: UserDocument;
    courseId: string;
    currentSection: LessonNavDto;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = { _id: courseId, user };
    const course = await this.courseService.getCourse(filter);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const modules = course.modules.sort(
      (a, b) => a.module_number - b.module_number,
    );
    const currentModuleIndex = modules.findIndex(
      (m) => m.module_number === currentSection.module_number,
    );

    if (currentModuleIndex === -1) {
      return { message: 'Previous Section Retrieved', data: null };
    }

    const currentModule = modules[currentModuleIndex];
    const lessons = currentModule.lessons;
    const currentLessonIndex = lessons.findIndex(
      (l) => l.lesson_number === currentSection.lesson_number,
    );

    if (currentLessonIndex > 0) {
      const previousLesson = lessons[currentLessonIndex - 1];
      return {
        message: 'Previous Section Retrieved',
        data: {
          module_number: currentModule.module_number,
          lesson_number: previousLesson.lesson_number,
          title: previousLesson.title,
          type: previousLesson.type,
        },
      };
    }

    const previousModule = modules[currentModuleIndex - 1];
    if (previousModule && previousModule.lessons.length) {
      const previousLesson =
        previousModule.lessons[previousModule.lessons.length - 1];
      return {
        message: 'Previous Section Retrieved',
        data: {
          module_number: previousModule.module_number,
          lesson_number: previousLesson.lesson_number,
          title: previousLesson.title,
          type: previousLesson.type,
        },
      };
    }

    return { message: 'Previous Section Retrieved', data: null };
  }
  async getLearningStreak({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    const foundUser = await this.userService.userModel
      .findById(user._id)
      .select('streak');

    if (!foundUser) throw new NotFoundException('User not found');

    const streak = foundUser.streak || {
      current_streak: 0,
      longest_streak: 0,
      last_streak_update: null,
    };

    return {
      message: 'Learning Streak Retrieved',
      data: {
        current_streak: streak.current_streak,
        longest_streak: streak.longest_streak,
        last_streak_update: streak.last_streak_update,
      },
    };
  }
  async getLearningTimer({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    const userId = user._id;

    const courses = await this.courseService.courseModel
      .find({ user: userId })
      .select('modules time_dedication updated_at')
      .lean();

    if (!courses.length) {
      return {
        message: 'Learning Timer Retrieved',
        data: { total_minutes: 0, today_minutes: 0, minutes_goal: 30 },
      };
    }

    const allLessonDates: Date[] = [];
    const todayLessonDates: Date[] = [];

    for (const course of courses) {
      for (const module of course.modules || []) {
        for (const lesson of module.lessons || []) {
          if (lesson.updated_at) {
            const updatedAt = new Date(lesson.updated_at);
            allLessonDates.push(updatedAt);
            if (isSameDay(updatedAt, new Date())) {
              todayLessonDates.push(updatedAt);
            }
          }
        }
      }
    }

    const calculateAverageGap = (dates: Date[]): number => {
      if (dates.length < 2) return 0;
      const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
      const gaps: number[] = [];

      for (let i = 1; i < sorted.length; i++) {
        gaps.push(differenceInMinutes(sorted[i], sorted[i - 1]));
      }

      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      return Math.round(avg);
    };

    const totalMinutes = calculateAverageGap(allLessonDates);
    const todayMinutes = calculateAverageGap(todayLessonDates);

    const latestCourse = courses
      .filter((c) => c.time_dedication)
      .sort(
        (a, b) =>
          (b.updated_at?.getTime?.() || 0) - (a.updated_at?.getTime?.() || 0),
      )[0];

    const dedicationMap: Record<string, number> = {
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '2h': 120,
    };

    const minutesGoal =
      dedicationMap[
        latestCourse?.time_dedication as keyof typeof dedicationMap
      ] || 30;

    return {
      message: 'Learning Timer Retrieved',
      data: {
        total_minutes: totalMinutes,
        today_minutes: todayMinutes,
        minutes_goal: minutesGoal,
      },
    };
  }
  async getDailyMotivation({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    try {
      const response = await this.client.get('https://zenquotes.io/api/today');
      const quoteData = response.data?.[0];
      return {
        message: 'Daily Motivation Retrieved',
        data: {
          quote:
            quoteData?.q ||
            'Discipline is the bridge between goals and accomplishment.',
          author: quoteData?.a || 'Jim Rohn',
        },
      };
    } catch (error: any) {
      return {
        message: 'Daily Motivation Retrieved',
        data: {
          quote: 'Discipline is the bridge between goals and accomplishment.',
          author: 'Jim Rohn',
        },
      };
    }
  }
  async getLearningSummary({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    const now = new Date();
    const startCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });
    const startLastWeek = subWeeks(startCurrentWeek, 1);
    const endLastWeek = subWeeks(endCurrentWeek, 1);

    const filter: FilterQuery<CourseDocument> = { user: user._id };

    const totalCourses =
      await this.courseService.courseModel.countDocuments(filter);
    const coursesLastWeek = await this.courseService.courseModel.countDocuments(
      {
        ...filter,
        created_at: { $gte: startLastWeek, $lte: endLastWeek },
      },
    );
    const courseGrowth = totalCourses - coursesLastWeek;
    const courseGrowthText = `${courseGrowth >= 0 ? '+' : ''}${courseGrowth} since last week`;

    const courses = await this.courseService.courseModel
      .find(filter)
      .select('modules time_dedication')
      .lean();
    const dedicationMap: Record<string, number> = {
      '15m': 0.25,
      '30m': 0.5,
      '1h': 1,
      '2h': 2,
    };
    const totalHours = courses.reduce((acc, course) => {
      const courseHours =
        course.modules?.reduce((modAcc, mod) => {
          const lessonsCount = mod.lessons?.length || 0;
          return (
            modAcc + lessonsCount * (dedicationMap[course.time_dedication] || 0)
          );
        }, 0) || 0;
      return acc + courseHours;
    }, 0);

    const lastWeekCourses = courses.filter((c) =>
      c.modules?.some((m) =>
        m.lessons?.some(
          (l) =>
            l.updated_at &&
            l.updated_at >= startLastWeek &&
            l.updated_at <= endLastWeek,
        ),
      ),
    );
    const lastWeekHours = lastWeekCourses.reduce((acc, course) => {
      const courseHours =
        course.modules?.reduce((modAcc, mod) => {
          const lessonsCount =
            mod.lessons?.filter(
              (l) =>
                l.updated_at >= startLastWeek && l.updated_at <= endLastWeek,
            ).length || 0;
          return (
            modAcc + lessonsCount * (dedicationMap[course.time_dedication] || 0)
          );
        }, 0) || 0;
      return acc + courseHours;
    }, 0);
    const learningGrowth = totalHours - lastWeekHours;
    const learningGrowthText = `${learningGrowth >= 0 ? '+' : ''}${learningGrowth}h since last week`;

    const currentStreak = user.streak?.current_streak || 0;
    const streakGrowth = 0;

    const completedQuizzes = 0;
    const quizzesGrowth = 0;

    const tutorChats = 0;
    const chatsGrowth = 0;

    return {
      message: 'Learning Summary Retrieved',
      data: {
        value: {
          courses: {
            total: totalCourses,
            growth: courseGrowthText,
          },
          learning: {
            hours: totalHours,
            growth: learningGrowthText,
          },
          streak: {
            days: currentStreak,
            growth: `${streakGrowth >= 0 ? '+' : ''}${streakGrowth} days`,
          },
          quizzes: {
            completed: completedQuizzes,
            growth: `${quizzesGrowth >= 0 ? '+' : ''}${quizzesGrowth} since last week`,
          },
          chats: {
            tutor: tutorChats,
            growth: `${chatsGrowth >= 0 ? '+' : ''}${chatsGrowth} this week`,
          },
        },
      },
    };
  }
}
