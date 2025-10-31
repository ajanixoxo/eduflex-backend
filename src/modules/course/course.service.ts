import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { PaginationService } from '../shared/services';
import { Course, CourseDocument } from './schemas';
import { ListCoursesDto, UpdateCourseSectionDto } from './dtos';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name)
    private readonly _courseModel: Model<CourseDocument>,
    private readonly paginationService: PaginationService,
  ) {}

  get courseModel() {
    return this._courseModel;
  }
  async createCourse(
    createDto: Partial<Course>,
    session?: ClientSession,
  ): Promise<CourseDocument> {
    const created = new this.courseModel(createDto);
    return created.save({ session });
  }

  async updateCourse(
    filter: FilterQuery<CourseDocument>,
    update: UpdateQuery<CourseDocument>,
    session?: ClientSession,
  ): Promise<CourseDocument | null> {
    return this.courseModel
      .findOneAndUpdate(filter, update, { new: true })
      .session(session || null);
  }

  async getCourse(
    filter: FilterQuery<CourseDocument>,
  ): Promise<CourseDocument | null> {
    return this.courseModel
      .findOne(filter)
      .populate('user', 'firstname lastname email');
  }

  async getAllCourses(
    filter: FilterQuery<CourseDocument>,
    listQueryDto: ListCoursesDto,
  ) {
    const { page, per_page } = listQueryDto;
    const { items, meta } = await this.paginationService.paginate(
      this.courseModel,
      filter,
      page,
      per_page,
      [
        {
          path: 'user',
          select: 'firstname lastname email',
        },
      ],
    );
    return { items, meta };
  }

  async getCourseSections(courseId: string) {
    const course = await this.courseModel.findById(courseId, 'sections');
    return course?.sections || [];
  }

  async getCourseSection(courseId: string, sectionId: string) {
    const course = await this.courseModel.findById(courseId, 'sections');
    return course?.sections.find((s) => s.section_id === sectionId) || null;
  }
  async updateCourseSection(
    courseId: string,
    sectionId: string,
    updateDto: UpdateCourseSectionDto,
  ): Promise<CourseDocument | null> {
    return this.courseModel.findOneAndUpdate(
      { _id: courseId, 'sections.section_id': sectionId },
      {
        $set: {
          'sections.$.status': updateDto.status,
        },
      },
      { new: true },
    );
  }
}
