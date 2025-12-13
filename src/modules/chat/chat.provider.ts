import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CourseService } from '../course/course.service';
import { UserDocument } from '../user/schemas';
import { ListChatMessages, SendChatMessageDto } from './dtos';
import { IApiResponseDto } from '../shared/types';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, FilterQuery } from 'mongoose';
import { ChatMessageDocument, ChatSender } from './schemas';
import { formatToGmtPlus1 } from 'src/helpers';

@Injectable()
export class ChatProvider {
  constructor(
    private readonly chatService: ChatService,
    private readonly courseService: CourseService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async sendMessageToAgent({
    user,
    body,
  }: {
    user: UserDocument;
    body: SendChatMessageDto;
  }): Promise<IApiResponseDto> {
    const course = await this.courseService.getCourse({
      user,
      _id: body.course_id,
    });
    if (!course) throw new NotFoundException('Course not found');

    const module = course.modules.find(
      (m) => m.module_number === body.module_number,
    );
    if (!module) throw new NotFoundException('Module not found');

    const currentLesson = module.lessons.find(
      (l) => l.lesson_number === body.lesson_number,
    );
    if (!currentLesson) throw new NotFoundException('Lesson not found');

    const context = `You are an intelligent AI assisting with the course: ${course.title}, Module: ${module.title}, Lesson: ${currentLesson.title}. The lesson content is as follows: ${currentLesson.title}. Please provide a helpful response based on this context. Responses should be concise and relevant to the lesson. If a user asks a question outside the scope of this lesson, politely inform them that you can only assist with questions related to the current lesson.`;

    const pastMessages = await this.chatService.chatModel
      .find({
        course: body.course_id,
        user,
      })
      .sort({ created_at: -1 })
      .limit(5)
      .lean();

    const formattedPastMessages = pastMessages.flatMap((msg) => [
      {
        role: msg.user_message.sender,
        content: msg.user_message.message,
      },
      {
        role: msg.ai_reply.sender,
        content: msg.ai_reply.message,
      },
    ]);

    const agentResponse = await this.chatService.getAgentResponse({
      payload: {
        question: body.message,
        history: [
          ...formattedPastMessages,
          {
            role: ChatSender.USER,
            content: `${context}\n\nUser Question: ${body.message}`,
          },
        ],
      },
    });

    await this.chatService.createChatMessage({
      course,
      user,
      module_number: body.module_number,
      lesson_number: body.lesson_number,
      user_message: {
        sender: ChatSender.USER,
        message: body.message,
      },
      ai_reply: {
        sender: ChatSender.AI,
        message: agentResponse,
        is_error: false,
      },
    });

    return {
      message: 'Message sent to AI chat agent successfully',
      data: {
        your_message: body.message,
        ai_reply: agentResponse,
      },
    };
  }
  async getChatMessages({
    user,
    query,
  }: {
    user: UserDocument;
    query: ListChatMessages;
  }): Promise<IApiResponseDto> {
    const {
      page,
      per_page,
      search,
      course_id,
      start_date,
      end_date,
      sender,
      module_number,
      lesson_number,
    } = query;

    const filter: FilterQuery<ChatMessageDocument> = {
      user: user._id,
    };

    if (start_date && end_date) {
      filter.created_at = {
        $gte: formatToGmtPlus1(new Date(start_date)),
        $lte: formatToGmtPlus1(new Date(end_date)),
      };
    }
    if (course_id) {
      filter.course = course_id;
    }
    if (module_number !== undefined) {
      filter.module_number = module_number;
    }
    if (lesson_number) {
      filter.lesson_number = lesson_number;
    }
    if (sender) {
      filter.sender = sender;
    }
    if (search) {
      filter.message = { $regex: search, $options: 'i' };
    }

    const { items, meta } = await this.chatService.getAllChatMessages(filter, {
      page,
      per_page,
    });
    return {
      message: 'Chat messages retrieved successfully',
      data: {
        items,
        meta,
      },
    };
  }
}
