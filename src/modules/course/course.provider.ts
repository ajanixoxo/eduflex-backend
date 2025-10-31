import { Injectable } from '@nestjs/common';
import { CourseService } from './course.service';
import { UserDocument } from '../user/schemas';
import { CreateCourseDto, ListCoursesDto, UpdateCourseDto } from './dtos';
import { IApiResponseDto } from '../shared/types';

@Injectable()
export class CourseProvider {
  constructor(private readonly courseService: CourseService) {}

  async createCourse({
    user,
    body,
  }: {
    user: UserDocument;
    body: CreateCourseDto;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Course Created',
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
    return {
      message: 'Course Fetched',
    };
  }

  async getCourseSection({
    user,
    courseId,
    sectionId,
  }: {
    user: UserDocument;
    courseId: string;
    sectionId: string;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Course Section Fetched',
    };
  }

  async markSectionCompleted({
    user,
    courseId,
    sectionId,
  }: {
    user: UserDocument;
    courseId: string;
    sectionId: string;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Section Marked as Completed',
    };
  }
  async getCourseSections({
    user,
    courseId,
  }: {
    user: UserDocument;
    courseId: string;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Course Sections Fetched',
      data: [],
    };
  }
  async getOverview({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Course Overview Fetched',
      data: {
        total_courses: 0,
        completed_courses: 0,
        saved_courses: 0,
        favourite_courses: 0,
        active_courses: 0,
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
    return {
      message: 'All Courses Retrieved',
      data: [],
    };
  }
  async getActiveCourse({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Active Course Retrieved',
      data: null,
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
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Explore Courses Retrieved',
      data: [],
    };
  }
  async getNextSection({
    user,
    courseId,
    currentSectionId,
  }: {
    user: UserDocument;
    courseId: string;
    currentSectionId: string;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Next Section Retrieved',
      data: null,
    };
  }

  async getPreviousSection({
    user,
    courseId,
    currentSectionId,
  }: {
    user: UserDocument;
    courseId: string;
    currentSectionId: string;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Previous Section Retrieved',
      data: null,
    };
  }
  async getLearningStreak({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Learning Streak Retrieved',
      data: { current_streak: 0, longest_streak: 0 },
    };
  }
  async getLearningTimer({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Learning Timer Retrieved',
      data: { total_minutes: 0, today_minutes: 0, minutes_goal: 30 },
    };
  }
  async getDailyMotivation({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Daily Motivation Retrieved',
      data: {
        quote: 'Keep pushing!',
        author: 'Eduflex AI',
      },
    };
  }
  async getLearningSummary({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Learning Summary Retrieved',
      data: {
        value: {
          courses: {
            total: 12,
            growth: '+2 since last week',
          },
          learning: {
            hours: 47,
            growth: '+6h since last week',
          },
          streak: {
            days: 8,
            growth: '+2 days',
          },
          quizzes: {
            completed: 23,
            growth: '+5 since last week',
          },
          chats: {
            tutor: 15,
            growth: '+3 this week',
          },
        },
      },
    };
  }
}
