import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CourseService } from '../course/course.service';
import { MediaProvider } from '../media/media.provider';
import { MediaType } from '../media/enums';
import { UserDocument } from '../user/schemas';
import {
  ListChatMessages,
  SendChatMessageDto,
  SaveTranscriptDto,
  AgentSaveUserTranscriptDto,
  AgentSaveAiTranscriptDto,
  AgentSaveTranscriptDto,
  SpeakerType,
} from './dtos';
import { IApiResponseDto } from '../shared/types';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, FilterQuery } from 'mongoose';
import { ChatMessageDocument, ChatSender } from './schemas';
import { formatToGmtPlus1 } from 'src/helpers';

interface ParsedRoomName {
  course_id: string;
  module_number: number;
  lesson_number: string;
  isValid: boolean;
}

function parseRoomName(roomName: string): ParsedRoomName {
  // Parse format: course-{courseId}-module-{moduleNumber}-lesson-{lessonNumber}
  // Example: course-6925663977e9779b16370bb4-module-1-lesson-1.2
  const pattern = /^course-([a-f0-9]{24})-module-(\d+)-lesson-([\d.]+)$/i;
  const match = roomName.match(pattern);

  if (match) {
    return {
      course_id: match[1],
      module_number: parseInt(match[2], 10),
      lesson_number: match[3],
      isValid: true,
    };
  }

  return {
    course_id: '',
    module_number: 0,
    lesson_number: '',
    isValid: false,
  };
}

@Injectable()
export class ChatProvider {
  constructor(
    private readonly chatService: ChatService,
    private readonly courseService: CourseService,
    private readonly mediaProvider: MediaProvider,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async sendMessageToAgent({
    user,
    body,
    imageFiles,
    videoFiles,
  }: {
    user: UserDocument;
    body: SendChatMessageDto;
    imageFiles?: Express.Multer.File[];
    videoFiles?: Express.Multer.File[];
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

    // Upload images to Cloudinary
    const uploadedImages: Array<{
      url: string;
      media_id?: any;
      thumbnail_url?: string;
    }> = [];
    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        try {
          const uploadResult = await this.mediaProvider.uploadMedia(
            user,
            file,
            { media_type: MediaType.CHAT_IMAGE },
          );

          uploadedImages.push({
            url: uploadResult.data.url, // Cloudinary secure_url
            media_id: uploadResult.data._id, // Reference to Media document
            thumbnail_url: uploadResult.data.url, // Can generate thumbnail later
          });
        } catch (error) {
          // Log error but continue with other files
          console.error(`Failed to upload image: ${file.originalname}`, error);
        }
      }
    }

    // Upload videos to Cloudinary
    const uploadedVideos: Array<{
      url: string;
      media_id?: any;
      thumbnail_url?: string;
    }> = [];
    if (videoFiles && videoFiles.length > 0) {
      for (const file of videoFiles) {
        try {
          const uploadResult = await this.mediaProvider.uploadMedia(
            user,
            file,
            { media_type: MediaType.CHAT_VIDEO },
          );

          uploadedVideos.push({
            url: uploadResult.data.url,
            media_id: uploadResult.data._id,
            thumbnail_url: uploadResult.data.url, // Can extract thumbnail from video
          });
        } catch (error) {
          // Log error but continue with other files
          console.error(`Failed to upload video: ${file.originalname}`, error);
        }
      }
    }

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

    // Prepare image URLs for AI vision (if supported)
    const imageUrls = uploadedImages.map((img) => img.url);

    const agentResponse = await this.chatService.getAgentResponse({
      payload: {
        question: body.message,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined, // Pass images for AI vision
        history: [
          ...formattedPastMessages,
          {
            role: ChatSender.USER,
            content: `${context}\n\nUser Question: ${body.message}`,
          },
        ],
      },
    });

    // Parse AI response - check if it includes video URLs
    const aiVideos: Array<{
      url: string;
      thumbnail_url?: string;
      duration?: number;
    }> = [];
    let aiResponseMessage: string = '';
    
    // If agent response is an object with video_url, extract it
    if (typeof agentResponse === 'object' && agentResponse !== null) {
      const responseObj = agentResponse as any;
      aiResponseMessage = responseObj.message || responseObj.reply || JSON.stringify(agentResponse);
      
      if (responseObj.video_url) {
        aiVideos.push({
          url: responseObj.video_url,
          thumbnail_url: responseObj.video_thumbnail_url || responseObj.video_url,
          duration: responseObj.video_duration,
        });
      }
    } else {
      // If it's a string, use it directly
      aiResponseMessage = typeof agentResponse === 'string' ? agentResponse : String(agentResponse);
    }

    await this.chatService.createChatMessage({
      course,
      user,
      module_number: body.module_number,
      lesson_number: body.lesson_number,
      user_message: {
        sender: ChatSender.USER,
        message: body.message,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        videos: uploadedVideos.length > 0 ? uploadedVideos : undefined,
      },
      ai_reply: {
        sender: ChatSender.AI,
        message: aiResponseMessage,
        videos: aiVideos.length > 0 ? aiVideos : undefined,
        is_error: false,
      },
    });

    return {
      message: 'Message sent to AI chat agent successfully',
      data: {
        your_message: body.message,
        ai_reply: aiResponseMessage,
        images: uploadedImages,
        videos: uploadedVideos,
        ai_videos: aiVideos,
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

  async saveVoiceTranscript({
    user,
    body,
  }: {
    user: UserDocument;
    body: AgentSaveTranscriptDto;
  }): Promise<IApiResponseDto> {
    // Parse room_name to extract course/module/lesson
    const parsed = parseRoomName(body.room_name);

    if (!parsed.isValid) {
      throw new BadRequestException(
        `Invalid room_name format. Expected: course-{courseId}-module-{moduleNumber}-lesson-{lessonNumber}, got: ${body.room_name}`,
      );
    }

    const { course_id, module_number, lesson_number } = parsed;

    const course = await this.courseService.getCourse({
      user,
      _id: course_id,
    });
    if (!course) throw new NotFoundException('Course not found');

    const module = course.modules.find(
      (m) => m.module_number === module_number,
    );
    if (!module) throw new NotFoundException('Module not found');

    const currentLesson = module.lessons.find(
      (l) => l.lesson_number === lesson_number,
    );
    if (!currentLesson) throw new NotFoundException('Lesson not found');

    // Determine if this is a user or AI message
    const isUserMessage = body.speaker_type === SpeakerType.USER;
    const isAiMessage =
      body.speaker_type === SpeakerType.AI ||
      body.speaker_type === SpeakerType.AGENT;

    if (isUserMessage) {
      // Create chat message with user transcript and pending AI reply
      const chatMessage = await this.chatService.createChatMessage({
        course,
        user,
        module_number,
        lesson_number,
        user_message: {
          sender: ChatSender.USER,
          message: body.text,
          metadata: {
            room_name: body.room_name,
            language: body.language,
            timestamp: body.timestamp,
          },
        },
        ai_reply: {
          sender: ChatSender.AI,
          message: '[Pending]',
          is_error: false,
        },
      });

      return {
        message: 'User transcript saved successfully',
        data: {
          message_id: chatMessage._id.toString(),
          user_transcript: body.text,
        },
      };
    } else if (isAiMessage) {
      // Handle AI message - update existing message
      if (!body.message_id) {
        throw new BadRequestException('message_id is required for AI messages');
      }

      const chatMessage = await this.chatService.getChatMessage({
        _id: body.message_id,
      });

      if (!chatMessage) {
        throw new NotFoundException('Chat message not found');
      }

      // Verify the message belongs to this user
      if (chatMessage.user.toString() !== user._id.toString()) {
        throw new NotFoundException('Chat message not found');
      }

      chatMessage.ai_reply = {
        sender: ChatSender.AI,
        message: body.text,
        is_error: false,
        metadata: {
          room_name: body.room_name,
          language: body.language,
          timestamp: body.timestamp,
        },
      };

      await chatMessage.save();

      return {
        message: 'AI transcript saved successfully',
        data: {
          message_id: body.message_id,
          ai_response: body.text,
        },
      };
    } else {
      throw new BadRequestException(
        `Invalid speaker_type: ${body.speaker_type}`,
      );
    }
  }

  /**
   * Save user transcript from LiveKit agent
   * Called when user speaks and agent transcribes the speech
   * Returns message_id to be used when saving AI response
   */
  async saveAgentUserTranscript(
    body: AgentSaveUserTranscriptDto,
  ): Promise<IApiResponseDto> {
    // Find user by ID
    const user = await this.connection.models.User.findById(body.user_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate course access
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

    // Create chat message with user transcript and pending AI reply
    const chatMessage = await this.chatService.createChatMessage({
      course,
      user,
      module_number: body.module_number,
      lesson_number: body.lesson_number,
      user_message: {
        sender: ChatSender.USER,
        message: body.user_transcript,
        metadata: { room_name: body.room_name },
      },
      ai_reply: {
        sender: ChatSender.AI,
        message: '[Pending]', // Placeholder until AI responds
        is_error: false,
      },
    });

    return {
      message: 'User transcript saved successfully',
      data: {
        message_id: chatMessage._id.toString(),
        user_transcript: body.user_transcript,
      },
    };
  }

  /**
   * Save AI transcript from LiveKit agent
   * Called when agent generates and speaks the AI response
   * Updates the message created by saveAgentUserTranscript
   */
  async saveAgentAiTranscript(
    body: AgentSaveAiTranscriptDto,
  ): Promise<IApiResponseDto> {
    // Find the chat message by ID
    const chatMessage = await this.chatService.getChatMessage({
      _id: body.message_id,
    });

    if (!chatMessage) {
      throw new NotFoundException('Chat message not found');
    }

    // Update the AI reply
    chatMessage.ai_reply = {
      sender: ChatSender.AI,
      message: body.ai_response,
      is_error: false,
    };

    await chatMessage.save();

    return {
      message: 'AI transcript saved successfully',
      data: {
        message_id: body.message_id,
        ai_response: body.ai_response,
      },
    };
  }

  /**
   * Unified endpoint to save transcripts from LiveKit agent
   * Parses room_name to extract course/module/lesson information
   * Handles both user and AI messages based on speaker_type
   */
  async saveAgentTranscript(
    body: AgentSaveTranscriptDto,
  ): Promise<IApiResponseDto> {
    const {
      room_name,
      speaker_type,
      text,
      user_id,
      message_id,
      language,
      timestamp,
      images,
    } = body;

    // Parse room_name to extract course/module/lesson
    const parsed = parseRoomName(room_name);

    if (!parsed.isValid) {
      throw new BadRequestException(
        `Invalid room_name format. Expected: course-{courseId}-module-{moduleNumber}-lesson-{lessonNumber}, got: ${room_name}`,
      );
    }

    const { course_id, module_number, lesson_number } = parsed;

    // Determine if this is a user or AI message
    const isUserMessage = speaker_type === SpeakerType.USER;
    const isAiMessage =
      speaker_type === SpeakerType.AI || speaker_type === SpeakerType.AGENT;

    if (isUserMessage) {
      // Handle user message
      if (!user_id) {
        throw new BadRequestException('user_id is required for user messages');
      }

      const user = await this.connection.models.User.findById(user_id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Validate course access
      const course = await this.courseService.getCourse({
        user,
        _id: course_id,
      });
      if (!course) throw new NotFoundException('Course not found');

      const module = course.modules.find(
        (m) => m.module_number === module_number,
      );
      if (!module) throw new NotFoundException('Module not found');

      const currentLesson = module.lessons.find(
        (l) => l.lesson_number === lesson_number,
      );
      if (!currentLesson) throw new NotFoundException('Lesson not found');

      // Create chat message with user transcript and pending AI reply
      const chatMessage = await this.chatService.createChatMessage({
        course,
        user,
        module_number,
        lesson_number,
        user_message: {
          sender: ChatSender.USER,
          message: text,
          metadata: {
            room_name,
            language,
            timestamp,
          },
        },
        ai_reply: {
          sender: ChatSender.AI,
          message: '[Pending]', // Placeholder until AI responds
          is_error: false,
        },
      });

      return {
        message: 'User transcript saved successfully',
        data: {
          message_id: chatMessage._id.toString(),
          user_transcript: text,
        },
      };
    } else if (isAiMessage) {
      // Handle AI message
      if (!message_id) {
        throw new BadRequestException('message_id is required for AI messages');
      }

      // Find the chat message by ID
      const chatMessage = await this.chatService.getChatMessage({
        _id: message_id,
      });

      if (!chatMessage) {
        throw new NotFoundException('Chat message not found');
      }

      // Map images from DTO format to schema format
      const mappedImages = images?.map((img) => ({
        url: img.url,
        thumbnail_url: img.url, // Use the same URL as thumbnail for base64 images
        // Note: media_id is optional and not provided by agent
      }));

      // Update the AI reply
      chatMessage.ai_reply = {
        sender: ChatSender.AI,
        message: text,
        is_error: false,
        images: mappedImages && mappedImages.length > 0 ? mappedImages : undefined,
        metadata: {
          room_name,
          language,
          timestamp,
        },
      };

      await chatMessage.save();

      return {
        message: 'AI transcript saved successfully',
        data: {
          message_id: message_id,
          ai_response: text,
          images: mappedImages,
        },
      };
    } else {
      throw new BadRequestException(`Invalid speaker_type: ${speaker_type}`);
    }
  }
}
