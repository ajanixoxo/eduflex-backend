import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schemas/course.schema';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { CourseProvider } from './course.provider';
import { UsersModule } from '../user/user.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => MediaModule),
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
  ],
  controllers: [CourseController],
  providers: [CourseService, CourseProvider],
  exports: [CourseService],
})
export class CourseModule {}
