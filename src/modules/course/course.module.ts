import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schemas/course.schema';
import { LearningProgress, LearningProgressSchema } from './schemas/learning-progress.schema';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { CourseProvider } from './course.provider';
import { LearningProgressService } from './learning-progress.service';
import { LearningProgressController } from './learning-progress.controller';
import { LearningProgressProvider } from './learning-progress.provider';
import { UsersModule } from '../user/user.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => MediaModule),
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: LearningProgress.name, schema: LearningProgressSchema },
    ]),
  ],
  controllers: [CourseController, LearningProgressController],
  providers: [CourseService, CourseProvider, LearningProgressService, LearningProgressProvider],
  exports: [CourseService, LearningProgressService],
})
export class CourseModule {}
