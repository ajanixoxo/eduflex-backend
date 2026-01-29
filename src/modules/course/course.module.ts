import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schemas/course.schema';
import { LearningProgress, LearningProgressSchema } from './schemas/learning-progress.schema';
import { LessonMaterial, LessonMaterialSchema } from './schemas/lesson-material.schema';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { CourseProvider } from './course.provider';
import { LearningProgressService } from './learning-progress.service';
import { LearningProgressController } from './learning-progress.controller';
import { LearningProgressProvider } from './learning-progress.provider';
import { LessonMaterialService } from './lesson-material.service';
import { LessonMaterialController } from './lesson-material.controller';
import { LessonMaterialProvider } from './lesson-material.provider';
import { UsersModule } from '../user/user.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => MediaModule),
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: LearningProgress.name, schema: LearningProgressSchema },
      { name: LessonMaterial.name, schema: LessonMaterialSchema },
    ]),
  ],
  controllers: [CourseController, LearningProgressController, LessonMaterialController],
  providers: [
    CourseService,
    CourseProvider,
    LearningProgressService,
    LearningProgressProvider,
    LessonMaterialService,
    LessonMaterialProvider,
  ],
  exports: [CourseService, LearningProgressService, LessonMaterialService],
})
export class CourseModule {}
