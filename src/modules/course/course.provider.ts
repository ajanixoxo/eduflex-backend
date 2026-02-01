import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { UserDocument } from '../user/schemas';
import {
  ChangeCourseAIAvatarDto,
  ChangeCourseAIVoiceDto,
  CreateCourseDto,
  GenerateExamTopicsDto,
  LessonNavDto,
  ListCoursesDto,
  MarkLessonCompleteDto,
  SubmitQuizAnswerDto,
  UpdateCourseDto,
} from './dtos';
import { IApiResponseDto } from '../shared/types';
import { FilterQuery } from 'mongoose';
import { CourseDocument } from './schemas';
import { UserTypes } from '../user/enums';
import {
  differenceInMinutes,
  endOfWeek,
  formatDistanceToNowStrict,
  isSameDay,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { formatToGmtPlus1 } from 'src/helpers';
import { CourseStatus } from './enums';
import { UserService } from '../user/user.service';
import axios, { AxiosInstance } from 'axios';
import { MediaService } from '../media/media.service';
import { AIMediaOwner } from '../media/enums';
import { LessonMaterialService } from './lesson-material.service';
import { Env } from '../shared/constants';

@Injectable()
export class CourseProvider {
  private readonly logger = new Logger(CourseProvider.name);
  protected client: AxiosInstance;
  constructor(
    private readonly courseService: CourseService,
    private readonly userService: UserService,
    private readonly mediaService: MediaService,
    private readonly lessonMaterialService: LessonMaterialService,
  ) {
    this.client = axios.create({});
  }

  async createCourse({
    user,
    body,
  }: {
    user: UserDocument;
    body: CreateCourseDto;
  }): Promise<IApiResponseDto> {
    try {
      this.logger.log(`Creating course for user ${user._id} with voice ${body.ai_voice} and avatar ${body.ai_avatar}`);

      const aiVoice = await this.mediaService.getAIVoice({ _id: body.ai_voice });
      const aiAvatar = await this.mediaService.getAIAvatar({
        _id: body.ai_avatar,
      });

      this.logger.log(`aiVoice found: ${!!aiVoice}, owner: ${aiVoice?.owner}, user: ${aiVoice?.user?._id}`);
      this.logger.log(`aiAvatar found: ${!!aiAvatar}, owner: ${aiAvatar?.owner}, user: ${aiAvatar?.user?._id}`);

      if (!aiVoice) {
        throw new NotFoundException('AI Voice not found');
      }
      if (!aiAvatar) {
        throw new NotFoundException('AI Avatar not found');
      }

      const isVoiceOwnerValid =
        aiVoice.owner === AIMediaOwner.SYSTEM ||
        (aiVoice.user && aiVoice.user._id.equals(user._id));
      const isAvatarOwnerValid =
        aiAvatar.owner === AIMediaOwner.SYSTEM ||
        (aiAvatar.user && aiAvatar.user._id.equals(user._id));

      this.logger.log(`Voice owner valid: ${isVoiceOwnerValid}, Avatar owner valid: ${isAvatarOwnerValid}`);

      if (!isVoiceOwnerValid) {
        throw new BadRequestException('You cannot use this AI Voice');
      }
      if (!isAvatarOwnerValid) {
        throw new BadRequestException('You cannot use this AI Avatar');
      }

      this.logger.log('Calling generateCourseOutline...');
      const generated = await this.courseService.generateCourseOutline({
        payload: body,
      });
      this.logger.log('Course outline generated successfully');

      const courseData: any = {
        user: user._id,
        topic: body.topic,
        reason: body.reason,
        title: generated.title,
        estimated_duration: generated.estimated_duration,
        total_lessons: generated.total_lessons,
        time_per_session: generated.time_per_session,
        language: body.language,
        experience_level: body.experience_level,
        teaching_style: body.teaching_style,
        learning_preference: body.learning_preference,
        time_dedication: body.time_dedication,
        target_completion: body.target_completion,
        course_format_addons: body.course_format_addons || [],
        modules: generated.modules.map((m) => ({
          title: m.title,
          module_number: m.module_number,
          status: m.status || 'pending',
          lessons: m.lessons.map((l) => ({
            lesson_number: l.lesson_number,
            title: l.title,
            type: l.type,
            resources: l.resources || [],
          })),
        })),
        ai_voice: aiVoice._id,
        ai_avatar: aiAvatar._id,
      };

      // Add quiz mode fields if present
      if (body.course_mode) {
        courseData.course_mode = body.course_mode;
      }
      if (body.grade_level) {
        courseData.grade_level = body.grade_level;
      }
      if (body.exam_topics && body.exam_topics.length > 0) {
        courseData.exam_topics = body.exam_topics;
      }

      const createdCourse =
        await this.courseService.courseModel.create(courseData);

      this.logger.log(`Course created successfully: ${createdCourse._id}`);

      // Generate lesson materials in the background (don't await - let it run async)
      this.generateMaterialsInBackground(
        createdCourse._id.toString(),
        createdCourse.title,
        generated.modules,
        body.experience_level,
        body.language,
        body.teaching_style,
        body.course_mode,
        body.grade_level,
        body.exam_topics,
      );

      return {
        message: 'Course created successfully',
        data: createdCourse,
      };
    } catch (error: any) {
      this.logger.error(`Failed to create course: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate lesson materials in the background after course creation.
   * This runs asynchronously so the user doesn't have to wait.
   */
  private async generateMaterialsInBackground(
    courseId: string,
    courseTitle: string,
    modules: any[],
    experienceLevel: string,
    language: string,
    teachingStyle: string,
    courseMode?: string,
    gradeLevel?: string,
    examTopics?: string[],
  ): Promise<void> {
    const isExamPrep = courseMode === 'exam_prep';

    try {
      this.logger.log(`Starting background material generation for course ${courseId}`);

      if (isExamPrep) {
        this.logger.log(`Course is in exam_prep mode, grade_level: ${gradeLevel}, topics: ${examTopics?.join(', ')}`);
      }

      const aiPodUrl = Env.AI_WEB_URL || 'http://localhost:8002';

      // Call AI pod to generate materials for all lessons
      const response = await axios.post(
        `${aiPodUrl}/courses/${courseId}/generate-materials`,
        {
          course_id: courseId,
          course_title: courseTitle,
          modules: modules.map((m) => ({
            module_number: m.module_number,
            title: m.title,
            lessons: m.lessons.map((l: any) => ({
              lesson_number: l.lesson_number,
              title: l.title,
              type: l.type || 'lesson',
              resources: l.resources || [],
            })),
          })),
          experience_level: experienceLevel?.toLowerCase() || 'beginner',
          language: language?.toLowerCase() || 'en',
          teaching_style: teachingStyle?.toLowerCase() || 'friendly',
          // Include exam prep fields for quiz generation
          course_mode: courseMode,
          grade_level: gradeLevel,
          exam_topics: examTopics,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Agent-API-Key': Env.AGENT_API_KEY || '',
          },
          timeout: 600000, // 10 minutes for full course generation
        },
      );

      const generatedMaterials = response.data?.data?.materials || response.data?.materials || [];

      // Store each generated material in the database
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
          courseId,
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

      this.logger.log(`Successfully generated ${generatedMaterials.length} materials for course ${courseId}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to generate materials for course ${courseId}: ${error.message}`,
        error.stack,
      );

      // Generate fallback materials when AI pod fails
      this.logger.log(`Generating fallback materials for course ${courseId}`);
      await this.generateFallbackMaterials(courseId, courseTitle, modules, isExamPrep, examTopics);
    }
  }

  /**
   * Generate fallback lesson materials when AI service is unavailable
   */
  private async generateFallbackMaterials(
    courseId: string,
    courseTitle: string,
    modules: any[],
    isExamPrep: boolean,
    examTopics?: string[],
  ): Promise<void> {
    try {
      for (const module of modules) {
        for (const lesson of module.lessons || []) {
          const lessonTitle = lesson.title || `Lesson ${lesson.lesson_number}`;

          // Generate basic sections based on lesson title
          const sections = [
            {
              section_number: 1,
              title: `Introduction to ${lessonTitle}`,
              content: `In this section, we will introduce the fundamental concepts of ${lessonTitle}. This forms the foundation for understanding the rest of the lesson.`,
              key_points: [
                `Understanding the basics of ${lessonTitle}`,
                `Why ${lessonTitle} is important in ${courseTitle}`,
                `Prerequisites for learning ${lessonTitle}`,
              ],
              examples: [],
            },
            {
              section_number: 2,
              title: `Core Concepts of ${lessonTitle}`,
              content: `Here we explore the main principles and concepts that define ${lessonTitle}. These concepts are essential for practical application.`,
              key_points: [
                `Key principles of ${lessonTitle}`,
                `Common patterns and practices`,
                `How to apply these concepts effectively`,
              ],
              examples: [],
            },
            {
              section_number: 3,
              title: `Practical Applications`,
              content: `This section covers how to apply what you've learned about ${lessonTitle} in real-world scenarios.`,
              key_points: [
                `Real-world use cases`,
                `Best practices for implementation`,
                `Common mistakes to avoid`,
              ],
              examples: [],
            },
          ];

          // Generate quiz questions for the lesson
          const quiz = [
            {
              question_id: `q1_${module.module_number}_${lesson.lesson_number}`,
              question: `What is the main concept introduced in ${lessonTitle}?`,
              type: 'multiple_choice',
              options: [
                `Understanding the fundamentals`,
                `Memorizing formulas`,
                `Skipping prerequisites`,
                `Avoiding practice`,
              ],
              correct_answer: `Understanding the fundamentals`,
              explanation: `The main concept is to understand the fundamentals before moving to advanced topics.`,
              points: 1,
            },
            {
              question_id: `q2_${module.module_number}_${lesson.lesson_number}`,
              question: `Why is ${lessonTitle} important?`,
              type: 'multiple_choice',
              options: [
                `It forms the foundation for advanced concepts`,
                `It has no practical applications`,
                `It is only theoretical`,
                `It can be skipped`,
              ],
              correct_answer: `It forms the foundation for advanced concepts`,
              explanation: `${lessonTitle} is important because it provides the foundation for understanding more advanced topics.`,
              points: 1,
            },
          ];

          await this.lessonMaterialService.upsertMaterial(
            courseId,
            module.module_number,
            lesson.lesson_number,
            {
              lesson_title: lessonTitle,
              learning_objectives: [
                `Understand the basic concepts of ${lessonTitle}`,
                `Apply ${lessonTitle} principles in practice`,
                `Identify common patterns and best practices`,
              ],
              sections,
              summary_points: [
                `${lessonTitle} is a fundamental topic in ${courseTitle}`,
                `Understanding the basics is essential before advancing`,
                `Practice is key to mastering these concepts`,
              ],
              quiz,
              estimated_duration: 15,
              difficulty: 'medium',
              generation_status: 'fallback',
            },
          );
        }
      }
      this.logger.log(`Generated fallback materials for course ${courseId}`);
    } catch (fallbackError: any) {
      this.logger.error(
        `Failed to generate fallback materials for course ${courseId}: ${fallbackError.message}`,
      );
    }
  }

  async generateExamTopics({
    user,
    body,
  }: {
    user: UserDocument;
    body: GenerateExamTopicsDto;
  }): Promise<IApiResponseDto> {
    try {
      this.logger.log(
        `Generating exam topics for user ${user._id}: topic="${body.topic}", grade_level="${body.grade_level}"`,
      );

      const response = await this.courseService.generateExamSubtopics({
        topic: body.topic,
        grade_level: body.grade_level,
        language: body.language,
      });

      this.logger.log(
        `Generated ${response.subtopics.length} subtopics for topic "${body.topic}"`,
      );

      return {
        message: 'Exam topics generated successfully',
        data: response,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to generate exam topics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getQuizQuestions({
    user,
    courseId,
  }: {
    user: UserDocument;
    courseId: string;
  }): Promise<IApiResponseDto> {
    const course = await this.courseService.getCourse({
      _id: courseId,
      user: user._id,
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get all lesson materials for this course and extract quiz questions
    const materials = await this.lessonMaterialService.getAllMaterialsForCourse(courseId);

    let questions: any[] = [];
    let questionIndex = 0;

    for (const material of materials) {
      if (material.quiz && material.quiz.length > 0) {
        for (const q of material.quiz) {
          questions.push({
            question_id: `q_${material.module_number}_${material.lesson_number}_${questionIndex}`,
            question: q.question,
            type: q.type || 'multiple_choice',
            options: q.options || [],
            topic: material.lesson_title || `Module ${material.module_number}`,
            difficulty: material.difficulty || 'medium',
          });
          questionIndex++;
        }
      }
    }

    // If no questions found and this is an exam_prep course, generate fallback questions
    if (questions.length === 0 && (course as any).course_mode === 'exam_prep') {
      this.logger.log(`No quiz questions found for exam_prep course ${courseId}, generating fallback questions`);
      questions = await this.generateFallbackQuizQuestions(course);
    }

    return {
      message: 'Quiz questions retrieved successfully',
      data: {
        course_id: courseId,
        total_questions: questions.length,
        questions,
      },
    };
  }

  /**
   * Generate fallback quiz questions when AI service is unavailable
   */
  private async generateFallbackQuizQuestions(course: CourseDocument): Promise<any[]> {
    const questions: any[] = [];
    const examTopics = (course as any).exam_topics || [];
    const gradeLevel = (course as any).grade_level || 'high_school';
    const courseTopic = course.topic || 'General Knowledge';

    // If no exam_topics, use the course topic
    const topics = examTopics.length > 0 ? examTopics : [courseTopic];

    // Generate questions for each topic
    for (let topicIdx = 0; topicIdx < topics.length; topicIdx++) {
      const topic = topics[topicIdx];

      // Generate 3-4 questions per topic
      const topicQuestions = this.generateQuestionsForTopic(topic, gradeLevel, topicIdx);
      questions.push(...topicQuestions);
    }

    return questions;
  }

  /**
   * Generate sample questions for a given topic
   */
  private generateQuestionsForTopic(topic: string, gradeLevel: string, topicIndex: number): any[] {
    const questions: any[] = [];

    // Question templates based on topic
    const questionTemplates = [
      {
        question: `What is the primary concept behind ${topic}?`,
        options: [
          `Understanding the fundamentals of ${topic}`,
          `Memorizing ${topic} formulas`,
          `Ignoring ${topic} principles`,
          `Avoiding ${topic} applications`,
        ],
        correct_answer: `Understanding the fundamentals of ${topic}`,
        explanation: `The primary concept involves understanding the fundamental principles and how they apply in various contexts.`,
      },
      {
        question: `Which of the following best describes a key principle of ${topic}?`,
        options: [
          `It has no practical applications`,
          `It forms the foundation for advanced concepts`,
          `It is only theoretical`,
          `It cannot be measured or observed`,
        ],
        correct_answer: `It forms the foundation for advanced concepts`,
        explanation: `${topic} principles serve as building blocks for more advanced concepts and real-world applications.`,
      },
      {
        question: `How is ${topic} commonly applied in real-world scenarios?`,
        options: [
          `Through practical problem-solving`,
          `It has no real-world applications`,
          `Only in laboratory settings`,
          `It cannot be applied practically`,
        ],
        correct_answer: `Through practical problem-solving`,
        explanation: `${topic} concepts are regularly applied in solving practical problems and making informed decisions.`,
      },
      {
        question: `What is an important consideration when studying ${topic}?`,
        options: [
          `Understanding the underlying concepts`,
          `Skipping the basics`,
          `Ignoring prerequisites`,
          `Avoiding practice problems`,
        ],
        correct_answer: `Understanding the underlying concepts`,
        explanation: `A solid grasp of underlying concepts is essential for mastering ${topic} and applying it effectively.`,
      },
    ];

    for (let i = 0; i < questionTemplates.length; i++) {
      const template = questionTemplates[i];
      questions.push({
        question_id: `q_fallback_${topicIndex}_${i}`,
        question: template.question,
        type: 'multiple_choice',
        options: template.options,
        topic: topic,
        difficulty: gradeLevel === 'elementary' ? 'easy' : gradeLevel === 'middle_school' ? 'medium' : 'hard',
        correct_answer: template.correct_answer,
        explanation: template.explanation,
      });
    }

    return questions;
  }

  async submitQuizAnswer({
    user,
    courseId,
    body,
  }: {
    user: UserDocument;
    courseId: string;
    body: SubmitQuizAnswerDto;
  }): Promise<IApiResponseDto> {
    const course = await this.courseService.getCourse({
      _id: courseId,
      user: user._id,
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if this is a fallback question (format: q_fallback_<topicIndex>_<questionIndex>)
    if (body.question_id.startsWith('q_fallback_')) {
      // Handle fallback questions - regenerate and find the question
      const fallbackQuestions = await this.generateFallbackQuizQuestions(course);
      const question = fallbackQuestions.find(q => q.question_id === body.question_id);

      if (!question) {
        throw new NotFoundException('Quiz question not found');
      }

      const isCorrect =
        question.correct_answer?.toLowerCase().trim() ===
        body.user_answer?.toLowerCase().trim();

      return {
        message: isCorrect ? 'Correct!' : 'Incorrect',
        data: {
          is_correct: isCorrect,
          correct_answer: question.correct_answer,
          explanation: question.explanation || 'No explanation available.',
          score: {
            correct: isCorrect ? 1 : 0,
            total: 1,
          },
        },
      };
    }

    // Parse question ID to find the question
    // Format: q_<module>_<lesson>_<index>
    const [, moduleNum, lessonNum] = body.question_id.split('_');

    const material = await this.lessonMaterialService.getMaterialByCourseAndLesson(
      courseId,
      parseInt(moduleNum),
      lessonNum,
    );

    if (!material || !material.quiz) {
      throw new NotFoundException('Quiz question not found');
    }

    // Find the question in the quiz array
    const questionIndex = parseInt(body.question_id.split('_').pop() || '0');
    const question = material.quiz[questionIndex];

    if (!question) {
      throw new NotFoundException('Quiz question not found');
    }

    // Check the answer
    const isCorrect =
      question.correct_answer?.toLowerCase().trim() ===
      body.user_answer?.toLowerCase().trim();

    // TODO: Track user's quiz progress in a separate collection

    return {
      message: isCorrect ? 'Correct!' : 'Incorrect',
      data: {
        is_correct: isCorrect,
        correct_answer: question.correct_answer,
        explanation: question.explanation || 'No explanation available.',
        score: {
          correct: isCorrect ? 1 : 0,
          total: 1,
        },
      },
    };
  }

  async changeCourseAIAvatar({
    user,
    body,
  }: {
    user: UserDocument;
    body: ChangeCourseAIAvatarDto;
  }): Promise<IApiResponseDto> {
    const course = await this.courseService.getCourse({
      _id: body.course_id,
      user: user._id,
    });
    if (!course) throw new NotFoundException('Course not found');

    const aiAvatar = await this.mediaService.getAIAvatar({
      _id: body.ai_avatar_id,
    });
    if (!aiAvatar) throw new NotFoundException('AI Avatar not found');

    const isOwnerValid =
      aiAvatar.owner === AIMediaOwner.SYSTEM ||
      aiAvatar.user._id.equals(user._id);
    if (!isOwnerValid)
      throw new BadRequestException('You cannot use this AI Avatar');
    course.ai_avatar = aiAvatar;
    await course.save();

    return {
      message: 'Course AI Avatar updated successfully',
      data: course,
    };
  }
  async changeCourseAIVoice({
    user,
    body,
  }: {
    user: UserDocument;
    body: ChangeCourseAIVoiceDto;
  }): Promise<IApiResponseDto> {
    const course = await this.courseService.getCourse({
      _id: body.course_id,
      user: user._id,
    });
    if (!course) throw new NotFoundException('Course not found');

    const aiVoice = await this.mediaService.getAIVoice({
      _id: body.ai_voice_id,
    });
    if (!aiVoice) throw new NotFoundException('AI Voice not found');

    const isOwnerValid =
      aiVoice.owner === AIMediaOwner.SYSTEM ||
      (aiVoice.user && aiVoice.user._id.equals(user._id));
    if (!isOwnerValid)
      throw new BadRequestException('You cannot use this AI Voice');
    course.ai_voice = aiVoice;
    await course.save();

    return {
      message: 'Course AI Voice updated successfully',
      data: course,
    };
  }

  async updateCourse({
    user,
    body,
  }: {
    user: UserDocument;
    body: UpdateCourseDto;
  }): Promise<IApiResponseDto> {
    return {
      message: 'Course Updated',
    };
  }

  async getCourse({
    user,
    courseId,
  }: {
    user: UserDocument;
    courseId: string;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = {
      _id: courseId,
    };
    if (user.account_type !== UserTypes.STAFF) {
      filter.user = user._id;
    }
    const course = await this.courseService.getCourse(filter);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return {
      message: 'Course Fetched',
      data: course,
    };
  }
  async getCourseModules({
    user,
    courseId,
  }: {
    user: UserDocument;
    courseId: string;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = {
      _id: courseId,
    };
    if (user.account_type !== UserTypes.STAFF) {
      filter.user = user._id;
    }
    const course = await this.courseService.getCourse(filter);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return {
      message: 'Course Modules Fetched',
      data: course.modules ?? [],
    };
  }

  async getCourseModule({
    user,
    courseId,
    moduleNumber,
  }: {
    user: UserDocument;
    courseId: string;
    moduleNumber: number;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = {
      _id: courseId,
    };
    if (user.account_type !== UserTypes.STAFF) {
      filter.user = user._id;
    }
    const module = await this.courseService.getCourseModule({
      filter,
      moduleNumber,
    });
    if (!module) {
      throw new NotFoundException('Module may have been deleted or removed');
    }
    return {
      message: 'Course Section Fetched',
      data: module,
    };
  }

  async markLessonCompleted({
    user,
    body,
  }: {
    user: UserDocument;
    body: MarkLessonCompleteDto;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = {
      _id: body.course_id,
      user,
    };

    const course = await this.courseService.markLessonCompleted({
      filter,
      moduleNumber: body.module_number,
      lessonNumber: body.lesson_number,
    });
    return {
      message: 'Lesson Marked as Completed',
      data: course,
    };
  }
  async getCourseOverview({
    user,
    courseId,
  }: {
    user: UserDocument;
    courseId: string;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = {
      _id: courseId,
      user,
    };

    const course = await this.courseService.getCourse(filter);
    if (!course) {
      throw new NotFoundException('Course Not Found');
    }

    const modules = course.modules || [];
    const lessons = modules.flatMap((m) => m.lessons || []);

    const totalModules = modules.length;
    const totalLessons = lessons.length;
    const completedModules = modules.filter(
      (m) => m.status === 'completed',
    ).length;
    const completedLessons = lessons.filter(
      (l) => (l as any).status === 'completed',
    ).length;

    const progressPercent = course.progress?.percent_complete || 0;

    const lessonDates = lessons
      .map((l) => new Date(l.updated_at).getTime())
      .filter(Boolean)
      .sort((a, b) => a - b);

    let avgDurationPerLesson = 0;
    if (lessonDates.length > 1) {
      const totalDiff = lessonDates
        .slice(1)
        .reduce((sum, date, i) => sum + (date - lessonDates[i]), 0);
      const avgMs = totalDiff / (lessonDates.length - 1);
      avgDurationPerLesson = Math.floor(avgMs / (1000 * 60 * 60));
    }

    let timeUntilTargetCompletion = 'N/A';
    if (course.target_completion) {
      const target = new Date(course.target_completion);
      const now = new Date();

      if (target > now) {
        timeUntilTargetCompletion = formatDistanceToNowStrict(target, {
          addSuffix: false,
        });
      } else {
        timeUntilTargetCompletion = 'Target date reached or passed';
      }
    }

    return {
      message: 'Course Overview Fetched',
      data: {
        title: course.title,
        total_modules: totalModules,
        total_lessons: totalLessons,
        completed_modules: completedModules,
        completed_lessons: completedLessons,
        progress: `${progressPercent}%`,
        avg_duration_per_lesson: `${avgDurationPerLesson} hour(s)`,
        language: course.language,
        experience_level: course.experience_level,
        pace: course.pace,
        target_completion: course.target_completion,
        time_until_target_completion: timeUntilTargetCompletion,
      },
    };
  }
  async getOverview({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = { user: user._id };

    const [
      totalCourses,
      completedCourses,
      savedCourses,
      favouriteCourses,
      activeCourses,
    ] = await Promise.all([
      this.courseService.courseModel.countDocuments(filter),
      this.courseService.courseModel.countDocuments({
        ...filter,
        status: CourseStatus.COMPLETED,
      }),
      this.courseService.courseModel.countDocuments({
        ...filter,
        is_bookmarked: true,
      }),
      this.courseService.courseModel.countDocuments({
        ...filter,
        is_favourite: true,
      }),
      this.courseService.courseModel.countDocuments({
        ...filter,
        'progress.percent_complete': { $gt: 0, $lt: 100 },
      }),
    ]);

    return {
      message: 'Course Overview Fetched',
      data: {
        total_courses: totalCourses,
        completed_courses: completedCourses,
        saved_courses: savedCourses,
        favourite_courses: favouriteCourses,
        active_courses: activeCourses,
      },
    };
  }
  async getAllCourses({
    user,
    query,
  }: {
    user: UserDocument;
    query: ListCoursesDto;
  }): Promise<IApiResponseDto> {
    const {
      page,
      per_page,
      search,
      user_id,
      pace,
      language,
      experience_level,
      teaching_style,
      is_favourite,
      is_bookmarked,
      start_date,
      end_date,
      status,
    } = query;

    const filter: FilterQuery<CourseDocument> = {};

    if (user.account_type !== UserTypes.STAFF) {
      filter.user = user._id;
    } else if (user.account_type === UserTypes.STAFF && user_id) {
      filter.user = user_id;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;
    if (pace) filter.pace = pace;
    if (language) filter.language = language;
    if (experience_level) filter.experience_level = experience_level;
    if (teaching_style) filter.teaching_style = teaching_style;
    if (is_favourite !== undefined) filter.is_favourite = is_favourite;
    if (is_bookmarked !== undefined) filter.is_bookmarked = is_bookmarked;

    if (start_date && end_date) {
      filter.created_at = {
        $gte: formatToGmtPlus1(new Date(start_date)),
        $lte: formatToGmtPlus1(new Date(end_date)),
      };
    }

    const { items, meta } = await this.courseService.getAllCourses(filter, {
      page,
      per_page,
    });

    return {
      message: 'All Courses Retrieved',
      data: {
        items,
        meta,
      },
    };
  }
  async toggleFavourite({
    user,
    courseId,
  }: {
    user: UserDocument;
    courseId: string;
  }): Promise<IApiResponseDto> {
    const course = await this.courseService.courseModel.findOne({
      _id: courseId,
      user: user._id,
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    course.is_favourite = !course.is_favourite;
    await course.save();

    return {
      message: `Course ${course.is_favourite ? 'added to' : 'removed from'} favourites`,
      data: {
        course_id: course._id,
        is_favourite: course.is_favourite,
      },
    };
  }

  async toggleBookmark({
    user,
    courseId,
  }: {
    user: UserDocument;
    courseId: string;
  }): Promise<IApiResponseDto> {
    const course = await this.courseService.courseModel.findOne({
      _id: courseId,
      user: user._id,
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    course.is_bookmarked = !course.is_bookmarked;
    await course.save();

    return {
      message: `Course ${course.is_bookmarked ? 'bookmarked' : 'unbookmarked'}`,
      data: {
        course_id: course._id,
        is_bookmarked: course.is_bookmarked,
      },
    };
  }
  async getActiveCourse({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    const filter = { user };

    const activeCourse = await this.courseService.courseModel
      .findOne({ ...filter, 'progress.percent_complete': { $gt: 0 } })
      .sort({ updated_at: -1 });

    const fallbackCourse =
      activeCourse ||
      (await this.courseService.courseModel
        .findOne(filter)
        .sort({ updated_at: -1 }));

    return {
      message: 'Active Course Retrieved',
      data: fallbackCourse || null,
    };
  }
  async getCourseCategories(): Promise<IApiResponseDto> {
    return {
      message: 'Course Categories Retrieved',
      data: [],
    };
  }
  async exploreCourses({
    user,
    query,
  }: {
    user: UserDocument;
    query: ListCoursesDto;
  }): Promise<IApiResponseDto> {
    const {
      page,
      per_page,
      search,
      pace,
      language,
      experience_level,
      teaching_style,
      start_date,
      end_date,
      status,
    } = query;

    const filter: FilterQuery<CourseDocument> = {
      user: { $ne: user._id },
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (pace) {
      filter.pace = pace;
    }

    if (language) {
      filter.language = language;
    }

    if (experience_level) {
      filter.experience_level = experience_level;
    }

    if (teaching_style) {
      filter.teaching_style = teaching_style;
    }

    if (start_date && end_date) {
      filter.created_at = {
        $gte: formatToGmtPlus1(new Date(start_date)),
        $lte: formatToGmtPlus1(new Date(end_date)),
      };
    }

    const { items, meta } = await this.courseService.getAllCourses(filter, {
      page,
      per_page,
    });

    return {
      message: 'Explore Courses Retrieved',
      data: {
        items,
        meta,
      },
    };
  }
  async getNextSection({
    user,
    courseId,
    currentSection,
  }: {
    user: UserDocument;
    courseId: string;
    currentSection: LessonNavDto;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = { _id: courseId, user };
    const course = await this.courseService.getCourse(filter);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const modules = course.modules.sort(
      (a, b) => a.module_number - b.module_number,
    );
    const currentModuleIndex = modules.findIndex(
      (m) => m.module_number === currentSection.module_number,
    );

    if (currentModuleIndex === -1) {
      return { message: 'Next Section Retrieved', data: null };
    }

    const currentModule = modules[currentModuleIndex];
    const lessons = currentModule.lessons;
    const currentLessonIndex = lessons.findIndex(
      (l) => l.lesson_number === currentSection.lesson_number,
    );

    if (currentLessonIndex >= 0 && currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1];
      return {
        message: 'Next Section Retrieved',
        data: {
          module_number: currentModule.module_number,
          lesson_number: nextLesson.lesson_number,
          title: nextLesson.title,
          type: nextLesson.type,
        },
      };
    }

    const nextModule = modules[currentModuleIndex + 1];
    if (nextModule && nextModule.lessons.length) {
      const nextLesson = nextModule.lessons[0];
      return {
        message: 'Next Section Retrieved',
        data: {
          module_number: nextModule.module_number,
          lesson_number: nextLesson.lesson_number,
          title: nextLesson.title,
          type: nextLesson.type,
        },
      };
    }

    return { message: 'Next Section Retrieved', data: null };
  }

  async getPreviousSection({
    user,
    courseId,
    currentSection,
  }: {
    user: UserDocument;
    courseId: string;
    currentSection: LessonNavDto;
  }): Promise<IApiResponseDto> {
    const filter: FilterQuery<CourseDocument> = { _id: courseId, user };
    const course = await this.courseService.getCourse(filter);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const modules = course.modules.sort(
      (a, b) => a.module_number - b.module_number,
    );
    const currentModuleIndex = modules.findIndex(
      (m) => m.module_number === currentSection.module_number,
    );

    if (currentModuleIndex === -1) {
      return { message: 'Previous Section Retrieved', data: null };
    }

    const currentModule = modules[currentModuleIndex];
    const lessons = currentModule.lessons;
    const currentLessonIndex = lessons.findIndex(
      (l) => l.lesson_number === currentSection.lesson_number,
    );

    if (currentLessonIndex > 0) {
      const previousLesson = lessons[currentLessonIndex - 1];
      return {
        message: 'Previous Section Retrieved',
        data: {
          module_number: currentModule.module_number,
          lesson_number: previousLesson.lesson_number,
          title: previousLesson.title,
          type: previousLesson.type,
        },
      };
    }

    const previousModule = modules[currentModuleIndex - 1];
    if (previousModule && previousModule.lessons.length) {
      const previousLesson =
        previousModule.lessons[previousModule.lessons.length - 1];
      return {
        message: 'Previous Section Retrieved',
        data: {
          module_number: previousModule.module_number,
          lesson_number: previousLesson.lesson_number,
          title: previousLesson.title,
          type: previousLesson.type,
        },
      };
    }

    return { message: 'Previous Section Retrieved', data: null };
  }
  async getLearningStreak({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    const foundUser = await this.userService.userModel
      .findById(user._id)
      .select('streak');

    if (!foundUser) throw new NotFoundException('User not found');

    const streak = foundUser.streak || {
      current_streak: 0,
      longest_streak: 0,
      last_streak_update: null,
    };

    return {
      message: 'Learning Streak Retrieved',
      data: {
        current_streak: streak.current_streak,
        longest_streak: streak.longest_streak,
        last_streak_update: streak.last_streak_update,
      },
    };
  }
  async getLearningTimer({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    const userId = user._id;

    const courses = await this.courseService.courseModel
      .find({ user: userId })
      .select('modules time_dedication updated_at')
      .lean();

    if (!courses.length) {
      return {
        message: 'Learning Timer Retrieved',
        data: { total_minutes: 0, today_minutes: 0, minutes_goal: 30 },
      };
    }

    const allLessonDates: Date[] = [];
    const todayLessonDates: Date[] = [];

    for (const course of courses) {
      for (const module of course.modules || []) {
        for (const lesson of module.lessons || []) {
          if (lesson.updated_at) {
            const updatedAt = new Date(lesson.updated_at);
            allLessonDates.push(updatedAt);
            if (isSameDay(updatedAt, new Date())) {
              todayLessonDates.push(updatedAt);
            }
          }
        }
      }
    }

    const calculateAverageGap = (dates: Date[]): number => {
      if (dates.length < 2) return 0;
      const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
      const gaps: number[] = [];

      for (let i = 1; i < sorted.length; i++) {
        gaps.push(differenceInMinutes(sorted[i], sorted[i - 1]));
      }

      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      return Math.round(avg);
    };

    const totalMinutes = calculateAverageGap(allLessonDates);
    const todayMinutes = calculateAverageGap(todayLessonDates);

    const latestCourse = courses
      .filter((c) => c.time_dedication)
      .sort(
        (a, b) =>
          (b.updated_at?.getTime?.() || 0) - (a.updated_at?.getTime?.() || 0),
      )[0];

    const dedicationMap: Record<string, number> = {
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '2h': 120,
    };

    const minutesGoal =
      dedicationMap[
        latestCourse?.time_dedication as keyof typeof dedicationMap
      ] || 30;

    return {
      message: 'Learning Timer Retrieved',
      data: {
        total_minutes: totalMinutes,
        today_minutes: todayMinutes,
        minutes_goal: minutesGoal,
      },
    };
  }
  async getDailyMotivation({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    try {
      const response = await this.client.get('https://zenquotes.io/api/today');
      const quoteData = response.data?.[0];
      return {
        message: 'Daily Motivation Retrieved',
        data: {
          quote:
            quoteData?.q ||
            'Discipline is the bridge between goals and accomplishment.',
          author: quoteData?.a || 'Jim Rohn',
        },
      };
    } catch (error: any) {
      return {
        message: 'Daily Motivation Retrieved',
        data: {
          quote: 'Discipline is the bridge between goals and accomplishment.',
          author: 'Jim Rohn',
        },
      };
    }
  }
  async getLearningSummary({
    user,
  }: {
    user: UserDocument;
  }): Promise<IApiResponseDto> {
    const now = new Date();
    const startCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });
    const startLastWeek = subWeeks(startCurrentWeek, 1);
    const endLastWeek = subWeeks(endCurrentWeek, 1);

    const filter: FilterQuery<CourseDocument> = { user: user._id };

    const totalCourses =
      await this.courseService.courseModel.countDocuments(filter);
    const coursesLastWeek = await this.courseService.courseModel.countDocuments(
      {
        ...filter,
        created_at: { $gte: startLastWeek, $lte: endLastWeek },
      },
    );
    const courseGrowth = totalCourses - coursesLastWeek;
    const courseGrowthText = `${courseGrowth >= 0 ? '+' : ''}${courseGrowth} since last week`;

    const courses = await this.courseService.courseModel
      .find(filter)
      .select('modules time_dedication')
      .lean();
    const dedicationMap: Record<string, number> = {
      '15m': 0.25,
      '30m': 0.5,
      '1h': 1,
      '2h': 2,
    };
    const totalHours = courses.reduce((acc, course) => {
      const courseHours =
        course.modules?.reduce((modAcc, mod) => {
          const lessonsCount = mod.lessons?.length || 0;
          return (
            modAcc + lessonsCount * (dedicationMap[course.time_dedication] || 0)
          );
        }, 0) || 0;
      return acc + courseHours;
    }, 0);

    const lastWeekCourses = courses.filter((c) =>
      c.modules?.some((m) =>
        m.lessons?.some(
          (l) =>
            l.updated_at &&
            l.updated_at >= startLastWeek &&
            l.updated_at <= endLastWeek,
        ),
      ),
    );
    const lastWeekHours = lastWeekCourses.reduce((acc, course) => {
      const courseHours =
        course.modules?.reduce((modAcc, mod) => {
          const lessonsCount =
            mod.lessons?.filter(
              (l) =>
                l.updated_at >= startLastWeek && l.updated_at <= endLastWeek,
            ).length || 0;
          return (
            modAcc + lessonsCount * (dedicationMap[course.time_dedication] || 0)
          );
        }, 0) || 0;
      return acc + courseHours;
    }, 0);
    const learningGrowth = totalHours - lastWeekHours;
    const learningGrowthText = `${learningGrowth >= 0 ? '+' : ''}${learningGrowth}h since last week`;

    const currentStreak = user.streak?.current_streak || 0;
    const streakGrowth = 0;

    const completedQuizzes = 0;
    const quizzesGrowth = 0;

    const tutorChats = 0;
    const chatsGrowth = 0;

    return {
      message: 'Learning Summary Retrieved',
      data: {
        value: {
          courses: {
            total: totalCourses,
            growth: courseGrowthText,
          },
          learning: {
            hours: totalHours,
            growth: learningGrowthText,
          },
          streak: {
            days: currentStreak,
            growth: `${streakGrowth >= 0 ? '+' : ''}${streakGrowth} days`,
          },
          quizzes: {
            completed: completedQuizzes,
            growth: `${quizzesGrowth >= 0 ? '+' : ''}${quizzesGrowth} since last week`,
          },
          chats: {
            tutor: tutorChats,
            growth: `${chatsGrowth >= 0 ? '+' : ''}${chatsGrowth} this week`,
          },
        },
      },
    };
  }
}
