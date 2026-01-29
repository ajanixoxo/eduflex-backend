import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { LessonMaterialService } from './lesson-material.service';
import { CourseService } from './course.service';
import { IApiResponseDto } from '../shared/types';
import {
  CreateLessonMaterialDto,
  GenerateMaterialsDto,
} from './dtos';
import { v2 as cloudinary } from 'cloudinary';
import { Env } from '../shared/constants';
import axios from 'axios';

@Injectable()
export class LessonMaterialProvider {
  constructor(
    private readonly lessonMaterialService: LessonMaterialService,
    private readonly courseService: CourseService,
  ) {
    // Initialize Cloudinary
    cloudinary.config({
      api_key: Env.CLOUDINARY_API_KEY,
      cloud_name: Env.CLOUDINARY_CLOUD_NAME,
      api_secret: Env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Store lesson material (called from AI pod)
   */
  async storeMaterial({
    body,
  }: {
    body: CreateLessonMaterialDto;
  }): Promise<IApiResponseDto> {
    const {
      course_id,
      module_number,
      lesson_number,
      lesson_title,
      learning_objectives,
      sections,
      summary_points,
      quiz,
      estimated_duration,
      difficulty,
    } = body;

    // Verify course exists
    const course = await this.courseService.getCourse({ _id: course_id });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Transform sections to ensure required fields have defaults
    const transformedSections = (sections || []).map((s) => ({
      ...s,
      key_points: s.key_points || [],
      examples: s.examples || [],
    }));

    // Transform quiz to ensure required fields have defaults
    const transformedQuiz = (quiz || []).map((q) => ({
      ...q,
      type: q.type || 'short_answer',
      points: q.points || 1,
    }));

    // Upsert the material
    const material = await this.lessonMaterialService.upsertMaterial(
      course_id,
      module_number,
      lesson_number,
      {
        lesson_title,
        learning_objectives: learning_objectives || [],
        sections: transformedSections,
        summary_points: summary_points || [],
        quiz: transformedQuiz,
        estimated_duration: estimated_duration || 15,
        difficulty: difficulty || 'medium',
        generation_status: 'ready',
      },
    );

    return {
      message: 'Lesson material stored successfully',
      data: material,
    };
  }

  /**
   * Get material for a specific lesson
   */
  async getMaterial({
    courseId,
    moduleNumber,
    lessonNumber,
  }: {
    courseId: string;
    moduleNumber: number;
    lessonNumber: string;
  }): Promise<IApiResponseDto> {
    const material = await this.lessonMaterialService.getMaterialByCourseAndLesson(
      courseId,
      moduleNumber,
      lessonNumber,
    );

    if (!material) {
      throw new NotFoundException(
        `Material not found for module ${moduleNumber}, lesson ${lessonNumber}`,
      );
    }

    return {
      message: 'Material retrieved successfully',
      data: material,
    };
  }

  /**
   * Get all materials for a course
   */
  async getAllMaterials({
    courseId,
  }: {
    courseId: string;
  }): Promise<IApiResponseDto> {
    const materials = await this.lessonMaterialService.getAllMaterialsForCourse(courseId);

    return {
      message: `Retrieved ${materials.length} materials`,
      data: materials,
    };
  }

  /**
   * Generate materials for all lessons in a course
   * Calls the AI pod to generate materials
   */
  async generateMaterials({
    body,
  }: {
    body: GenerateMaterialsDto;
  }): Promise<IApiResponseDto> {
    const { course_id, force_regenerate } = body;

    // Get course with all modules and lessons
    const course = await this.courseService.getCourse({ _id: course_id });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if materials already exist
    if (!force_regenerate) {
      const existingMaterials = await this.lessonMaterialService.getAllMaterialsForCourse(course_id);
      if (existingMaterials.length > 0) {
        return {
          message: `Materials already exist (${existingMaterials.length} lessons). Use force_regenerate=true to regenerate.`,
          data: { existing_count: existingMaterials.length },
        };
      }
    }

    // Build request for AI pod
    const modules = course.modules.map((m) => ({
      module_number: m.module_number,
      title: m.title,
      lessons: m.lessons.map((l) => ({
        lesson_number: l.lesson_number,
        title: l.title,
      })),
    }));

    // Call AI pod to generate materials
    try {
      const aiPodUrl = Env.AI_WEB_URL || 'http://localhost:8002';
      const response = await axios.post(
        `${aiPodUrl}/courses/${course_id}/generate-materials`,
        {
          course_id,
          course_title: course.title,
          modules,
          experience_level: course.experience_level.toLowerCase(),
          language: course.language.toLowerCase(),
          teaching_style: course.teaching_style.toLowerCase(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-API-Key': Env.AGENT_API_KEY || '',
          },
          timeout: 600000, // 10 minutes for full course generation
        },
      );

      // Store each generated material
      const generatedMaterials = response.data?.data?.materials || response.data?.materials || [];
      for (const mat of generatedMaterials) {
        // Transform sections to ensure required fields have defaults
        const transformedSections = (mat.sections || []).map((s: any) => ({
          ...s,
          key_points: s.key_points || [],
          examples: s.examples || [],
        }));

        // Transform quiz to ensure required fields have defaults
        const transformedQuiz = (mat.quiz || []).map((q: any) => ({
          ...q,
          type: q.type || 'short_answer',
          points: q.points || 1,
        }));

        await this.lessonMaterialService.upsertMaterial(
          course_id,
          mat.module_number,
          mat.lesson_number,
          {
            lesson_title: mat.lesson_title,
            learning_objectives: mat.learning_objectives || [],
            sections: transformedSections,
            summary_points: mat.summary_points || [],
            quiz: transformedQuiz,
            estimated_duration: mat.estimated_duration || 15,
            difficulty: mat.difficulty || 'medium',
            generation_status: 'ready',
          },
        );
      }

      return {
        message: `Generated materials for ${generatedMaterials.length} lessons`,
        data: {
          generated_count: generatedMaterials.length,
          course_id,
        },
      };
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to generate materials';
      throw new BadRequestException(message);
    }
  }

  /**
   * Upload PDF to Cloudinary and store URL
   */
  async uploadPdf({
    courseId,
    moduleNumber,
    lessonNumber,
    pdfBuffer,
    filename,
  }: {
    courseId: string;
    moduleNumber: number;
    lessonNumber: string;
    pdfBuffer: Buffer;
    filename: string;
  }): Promise<IApiResponseDto> {
    try {
      // Convert buffer to base64
      const base64Data = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

      // Upload to Cloudinary
      const folder = `eduflexai/courses/${courseId}/materials`;
      const result = await cloudinary.uploader.upload(base64Data, {
        folder,
        resource_type: 'raw',
        public_id: `lesson_${moduleNumber}_${lessonNumber}`,
        overwrite: true,
      });

      // Update material with PDF URL
      const material = await this.lessonMaterialService.updatePdfUrl(
        courseId,
        moduleNumber,
        lessonNumber,
        result.secure_url,
      );

      return {
        message: 'PDF uploaded successfully',
        data: {
          pdf_url: result.secure_url,
          material,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to upload PDF: ${error.message}`);
    }
  }

  /**
   * Delete all materials for a course
   */
  async deleteMaterials({
    courseId,
  }: {
    courseId: string;
  }): Promise<IApiResponseDto> {
    const deletedCount = await this.lessonMaterialService.deleteAllMaterialsForCourse(courseId);

    return {
      message: `Deleted ${deletedCount} materials`,
      data: { deleted_count: deletedCount },
    };
  }
}
