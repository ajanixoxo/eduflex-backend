import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiProvider } from './ai.provider';
import { CourseModule } from '../course/course.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [CourseModule, MediaModule, HttpModule],
  controllers: [AiController],
  providers: [AiService, AiProvider],
  exports: [AiService],
})
export class AiModule {}
