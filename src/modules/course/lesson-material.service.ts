import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { LessonMaterial, LessonMaterialDocument } from './schemas';

@Injectable()
export class LessonMaterialService {
  constructor(
    @InjectModel(LessonMaterial.name)
    private readonly _lessonMaterialModel: Model<LessonMaterialDocument>,
  ) {}

  get lessonMaterialModel() {
    return this._lessonMaterialModel;
  }

  async createMaterial(
    createDto: Partial<LessonMaterial>,
    session?: ClientSession,
  ): Promise<LessonMaterialDocument> {
    const created = new this.lessonMaterialModel(createDto);
    return created.save({ session });
  }

  async updateMaterial(
    filter: FilterQuery<LessonMaterialDocument>,
    update: UpdateQuery<LessonMaterialDocument>,
    session?: ClientSession,
  ): Promise<LessonMaterialDocument | null> {
    return this.lessonMaterialModel
      .findOneAndUpdate(filter, update, { new: true, upsert: true })
      .session(session || null);
  }

  async getMaterial(
    filter: FilterQuery<LessonMaterialDocument>,
  ): Promise<LessonMaterialDocument | null> {
    return this.lessonMaterialModel.findOne(filter);
  }

  async getMaterialByCourseAndLesson(
    courseId: string,
    moduleNumber: number,
    lessonNumber: string,
  ): Promise<LessonMaterialDocument | null> {
    return this.lessonMaterialModel.findOne({
      course: courseId,
      module_number: moduleNumber,
      lesson_number: lessonNumber,
    });
  }

  async getAllMaterialsForCourse(
    courseId: string,
  ): Promise<LessonMaterialDocument[]> {
    return this.lessonMaterialModel
      .find({ course: courseId })
      .sort({ module_number: 1, lesson_number: 1 });
  }

  async upsertMaterial(
    courseId: string,
    moduleNumber: number,
    lessonNumber: string,
    materialData: Partial<LessonMaterial>,
  ): Promise<LessonMaterialDocument> {
    return this.lessonMaterialModel.findOneAndUpdate(
      {
        course: courseId,
        module_number: moduleNumber,
        lesson_number: lessonNumber,
      },
      {
        ...materialData,
        course: courseId,
        module_number: moduleNumber,
        lesson_number: lessonNumber,
      },
      { new: true, upsert: true },
    );
  }

  async deleteMaterial(
    filter: FilterQuery<LessonMaterialDocument>,
  ): Promise<boolean> {
    const result = await this.lessonMaterialModel.deleteOne(filter);
    return result.deletedCount > 0;
  }

  async deleteAllMaterialsForCourse(courseId: string): Promise<number> {
    const result = await this.lessonMaterialModel.deleteMany({
      course: courseId,
    });
    return result.deletedCount;
  }

  async updatePdfUrl(
    courseId: string,
    moduleNumber: number,
    lessonNumber: string,
    pdfUrl: string,
  ): Promise<LessonMaterialDocument | null> {
    return this.lessonMaterialModel.findOneAndUpdate(
      {
        course: courseId,
        module_number: moduleNumber,
        lesson_number: lessonNumber,
      },
      {
        pdf_url: pdfUrl,
        pdf_generated_at: new Date(),
      },
      { new: true },
    );
  }
}
