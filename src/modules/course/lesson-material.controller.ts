import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LessonMaterialProvider } from './lesson-material.provider';
import { AuthGuard } from '../authentication/auth.guard';
import {
  CreateLessonMaterialDto,
  GenerateMaterialsDto,
} from './dtos';
import { AgentApiKeyGuard } from '../shared/guards';

@ApiTags('Lesson Materials')
@Controller('lesson-materials')
export class LessonMaterialController {
  constructor(private readonly lessonMaterialProvider: LessonMaterialProvider) {}

  /**
   * Store lesson material - Called by AI pod
   */
  @Post()
  @UseGuards(AgentApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Store lesson material (from AI pod)' })
  async storeMaterial(@Body() body: CreateLessonMaterialDto) {
    return this.lessonMaterialProvider.storeMaterial({ body });
  }

  /**
   * Generate materials for a course - Triggers AI generation
   */
  @Post('generate')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate materials for all lessons in a course' })
  async generateMaterials(@Body() body: GenerateMaterialsDto) {
    return this.lessonMaterialProvider.generateMaterials({ body });
  }

  /**
   * Get all materials for a course
   */
  @Get('course/:courseId')
  @UseGuards(AgentApiKeyGuard)
  @ApiOperation({ summary: 'Get all materials for a course' })
  async getAllMaterials(@Param('courseId') courseId: string) {
    return this.lessonMaterialProvider.getAllMaterials({ courseId });
  }

  /**
   * Get material for a specific lesson
   */
  @Get('course/:courseId/module/:moduleNumber/lesson/:lessonNumber')
  @UseGuards(AgentApiKeyGuard)
  @ApiOperation({ summary: 'Get material for a specific lesson' })
  async getMaterial(
    @Param('courseId') courseId: string,
    @Param('moduleNumber') moduleNumber: number,
    @Param('lessonNumber') lessonNumber: string,
  ) {
    return this.lessonMaterialProvider.getMaterial({
      courseId,
      moduleNumber: Number(moduleNumber),
      lessonNumber,
    });
  }

  /**
   * Delete all materials for a course
   */
  @Delete('course/:courseId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all materials for a course' })
  async deleteMaterials(@Param('courseId') courseId: string) {
    return this.lessonMaterialProvider.deleteMaterials({ courseId });
  }
}
