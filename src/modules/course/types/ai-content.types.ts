import { LessonType, ModuleStatus } from '../enums';

export interface IGeneratedCourseContent {
  title: string;
  estimated_duration: string;
  total_lessons: number;
  time_per_session: string;
  modules: ICourseModule[];
}

export interface ICourseModule {
  title: string;
  module_number: number;
  status?: ModuleStatus;
  lessons: ICourseLesson[];
}

export interface ICourseLesson {
  lesson_number: string;
  title: string;
  type: LessonType;
  resources: string[];
}
