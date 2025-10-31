import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CourseProvider } from './course.provider';
import { CreateCourseDto, ListCoursesDto, UpdateCourseDto } from './dtos';
import { type UserDocument } from '../user/schemas';
import { Auth } from 'src/decorators';

@Controller('courses')
@ApiTags('Course Management')
@ApiBearerAuth()
export class CourseController {
  constructor(private readonly courseProvider: CourseProvider) {}

  @Post()
  createCourse(@Auth() user: UserDocument, @Body() body: CreateCourseDto) {
    return this.courseProvider.createCourse({ user, body });
  }

  @Patch(':courseId')
  updateCourse(@Auth() user: UserDocument, @Body() body: UpdateCourseDto) {
    return this.courseProvider.updateCourse({ user, body });
  }

  @Get(':courseId')
  getCourse(@Auth() user: UserDocument, @Param('courseId') courseId: string) {
    return this.courseProvider.getCourse({ user, courseId });
  }

  @Get(':courseId/sections')
  getCourseSections(
    @Auth() user: UserDocument,
    @Param('courseId') courseId: string,
  ) {
    return this.courseProvider.getCourseSections({ user, courseId });
  }

  @Get(':courseId/sections/:sectionId')
  getCourseSection(
    @Auth() user: UserDocument,
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.courseProvider.getCourseSection({ user, courseId, sectionId });
  }

  @Post(':courseId/sections/:sectionId/complete')
  markSectionCompleted(
    @Auth() user: UserDocument,
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.courseProvider.markSectionCompleted({
      user,
      courseId,
      sectionId,
    });
  }

  @Get('overview')
  getOverview(@Auth() user: UserDocument) {
    return this.courseProvider.getOverview({ user });
  }

  @Get()
  getAllCourses(@Auth() user: UserDocument, @Query() query: ListCoursesDto) {
    return this.courseProvider.getAllCourses({ user, query });
  }

  @Get('active')
  getActiveCourse(@Auth() user: UserDocument) {
    return this.courseProvider.getActiveCourse({ user });
  }

  @Get('categories')
  getCourseCategories() {
    return this.courseProvider.getCourseCategories();
  }

  @Get('explore')
  exploreCourses(@Auth() user: UserDocument) {
    return this.courseProvider.exploreCourses({ user });
  }

  @Get(':courseId/next-section')
  getNextSection(
    @Auth() user: UserDocument,
    @Param('courseId') courseId: string,
    @Query('currentSectionId') currentSectionId: string,
  ) {
    return this.courseProvider.getNextSection({
      user,
      courseId,
      currentSectionId,
    });
  }

  @Get(':courseId/prev-section')
  getPreviousSection(
    @Auth() user: UserDocument,
    @Param('courseId') courseId: string,
    @Query('currentSectionId') currentSectionId: string,
  ) {
    return this.courseProvider.getPreviousSection({
      user,
      courseId,
      currentSectionId,
    });
  }

  @Get('learning/streak')
  getLearningStreak(@Auth() user: UserDocument) {
    return this.courseProvider.getLearningStreak({ user });
  }

  @Get('learning/timer')
  getLearningTimer(@Auth() user: UserDocument) {
    return this.courseProvider.getLearningTimer({ user });
  }

  @Get('learning/motivation')
  getDailyMotivation(@Auth() user: UserDocument) {
    return this.courseProvider.getDailyMotivation({ user });
  }

  @Get('learning/summary')
  getLearningSummary(@Auth() user: UserDocument) {
    return this.courseProvider.getLearningSummary({ user });
  }
}
