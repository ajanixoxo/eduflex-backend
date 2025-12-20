import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiProvider } from './ai.provider';
import { CourseModule } from '../course/course.module';

@Module({
  imports: [CourseModule],
  controllers: [AiController],
  providers: [AiService, AiProvider],
  exports: [AiService],
})
export class AiModule {}
