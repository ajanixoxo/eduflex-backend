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
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LessonMaterialProvider } from './lesson-material.provider';
import { AuthGuard } from '../authentication/auth.guard';
import {
  CreateLessonMaterialDto,
  GenerateMaterialsDto,
} from './dtos';
import { AgentApiKeyGuard } from '../shared/guards';
import { IsPublic } from 'src/decorators';

@ApiTags('Lesson Materials')
@Controller('lesson-materials')
export class LessonMaterialController {
  constructor(private readonly lessonMaterialProvider: LessonMaterialProvider) {}

  /**
   * Store lesson material - Called by AI pod
   */
  @Post()
  @IsPublic()
  @UseGuards(AgentApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Store lesson material (from AI pod)' })
  async storeMaterial(@Body() body: CreateLessonMaterialDto) {
    return this.lessonMaterialProvider.storeMaterial({ body });
  }

  /**
   * Generate materials for a course - Triggers AI generation (user auth)
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
   * Generate materials for a course - Agent endpoint
   */
  @Post('generate-agent')
  @IsPublic()
  @UseGuards(AgentApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate materials (agent endpoint)' })
  async generateMaterialsAgent(@Body() body: GenerateMaterialsDto) {
    return this.lessonMaterialProvider.generateMaterials({ body });
  }

  /**
   * Get all materials for a course - User endpoint (for frontend)
   */
  @Get('course/:courseId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all materials for a course (user auth)' })
  async getAllMaterials(@Param('courseId') courseId: string) {
    return this.lessonMaterialProvider.getAllMaterials({ courseId });
  }

  /**
   * Get all materials for a course - Agent endpoint
   */
  @Get('agent/course/:courseId')
  @IsPublic()
  @UseGuards(AgentApiKeyGuard)
  @ApiOperation({ summary: 'Get all materials for a course (agent auth)' })
  async getAllMaterialsAgent(@Param('courseId') courseId: string) {
    return this.lessonMaterialProvider.getAllMaterials({ courseId });
  }

  /**
   * Get material for a specific lesson - User endpoint (for frontend)
   */
  @Get('course/:courseId/module/:moduleNumber/lesson/:lessonNumber')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get material for a specific lesson (user auth)' })
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
   * Get material for a specific lesson - Agent endpoint
   */
  @Get('agent/course/:courseId/module/:moduleNumber/lesson/:lessonNumber')
  @IsPublic()
  @UseGuards(AgentApiKeyGuard)
  @ApiOperation({ summary: 'Get material for a specific lesson (agent auth)' })
  async getMaterialAgent(
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
   * Download lesson material as PDF
   */
  @Get('course/:courseId/module/:moduleNumber/lesson/:lessonNumber/download')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download lesson material as PDF' })
  async downloadPdf(
    @Param('courseId') courseId: string,
    @Param('moduleNumber') moduleNumber: number,
    @Param('lessonNumber') lessonNumber: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return this.lessonMaterialProvider.downloadPdf({
      courseId,
      moduleNumber: Number(moduleNumber),
      lessonNumber,
      res,
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
