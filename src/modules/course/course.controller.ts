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
import {
  ChangeCourseAIAvatarDto,
  ChangeCourseAIVoiceDto,
  CreateCourseDto,
  LessonNavDto,
  ListCoursesDto,
  MarkLessonCompleteDto,
  UpdateCourseDto,
} from './dtos';
import { type UserDocument } from '../user/schemas';
import { Auth } from 'src/decorators';

@Controller('courses')
@ApiTags('Course Management')
@ApiBearerAuth()
export class CourseController {
  constructor(private readonly courseProvider: CourseProvider) {}

  @Post('generate-outline')
  createCourse(@Auth() user: UserDocument, @Body() body: CreateCourseDto) {
    return this.courseProvider.createCourse({ user, body });
  }

  @Patch(':courseId')
  updateCourse(@Auth() user: UserDocument, @Body() body: UpdateCourseDto) {
    return this.courseProvider.updateCourse({ user, body });
  }
  @Patch('update-ai-avatar')
  updateCourseAIAvatar(
    @Auth() user: UserDocument,
    @Body() body: ChangeCourseAIAvatarDto,
  ) {
    return this.courseProvider.changeCourseAIAvatar({ user, body });
  }
  @Patch('update-ai-voice')
  updateCourseAIVoice(
    @Auth() user: UserDocument,
    @Body() body: ChangeCourseAIVoiceDto,
  ) {
    return this.courseProvider.changeCourseAIVoice({ user, body });
  }

  @Get(':courseId/modules')
  getCourseModules(
    @Auth() user: UserDocument,
    @Param('courseId') courseId: string,
  ) {
    return this.courseProvider.getCourseModules({ user, courseId });
  }

  @Get(':courseId/modules/:moduleNumber')
  getCourseModule(
    @Auth() user: UserDocument,
    @Param('courseId') courseId: string,
    @Param('moduleNumber') moduleNumber: number,
  ) {
    return this.courseProvider.getCourseModule({
      user,
      courseId,
      moduleNumber,
    });
  }

  @Post('lesson/complete')
  markModuleCompleted(
    @Auth() user: UserDocument,
    @Body() body: MarkLessonCompleteDto,
  ) {
    return this.courseProvider.markLessonCompleted({
      user,
      body,
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

  @Get('explore')
  exploreCourses(@Auth() user: UserDocument, @Query() query: ListCoursesDto) {
    return this.courseProvider.exploreCourses({ user, query });
  }

  @Get(':courseId/next-section')
  getNextSection(
    @Auth() user: UserDocument,
    @Param('courseId') courseId: string,
    @Query() currentSection: LessonNavDto,
  ) {
    return this.courseProvider.getNextSection({
      user,
      courseId,
      currentSection,
    });
  }

  @Get(':courseId/prev-section')
  getPreviousSection(
    @Auth() user: UserDocument,
    @Param('courseId') courseId: string,
    @Query() currentSection: LessonNavDto,
  ) {
    return this.courseProvider.getPreviousSection({
      user,
      courseId,
      currentSection,
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
  @Post(':courseId/toggle-favourite')
  toggleFavourite(
    @Auth() user: UserDocument,
    @Param('courseId') courseId: string,
  ) {
    return this.courseProvider.toggleFavourite({ user, courseId });
  }

  @Post(':courseId/toggle-bookmark')
  toggleBookmark(
    @Auth() user: UserDocument,
    @Param('courseId') courseId: string,
  ) {
    return this.courseProvider.toggleBookmark({ user, courseId });
  }
  @Get(':courseId')
  getCourse(@Auth() user: UserDocument, @Param('courseId') courseId: string) {
    return this.courseProvider.getCourse({ user, courseId });
  }
  @Get(':courseId/overview')
  getCourseOverview(
    @Auth() user: UserDocument,
    @Param('courseId') courseId: string,
  ) {
    return this.courseProvider.getCourseOverview({ user, courseId });
  }
}
