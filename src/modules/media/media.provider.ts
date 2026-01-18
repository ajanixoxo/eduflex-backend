import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { v2 as cloudinary } from 'cloudinary';
import { Env } from '../shared/constants';
import { IApiResponseDto } from '../shared/types';
import {
  AgentUploadImageDto,
  AgentUploadVideoDto,
  CreateAiAvatarDto,
  CreateAiVoiceDto,
  ListAiAvatarsDto,
  ListAiVoicesDto,
  UpdateAiAvatarDto,
  UpdateAiVoiceDto,
  UploadDto,
} from './dtos';
import { UserDocument } from '../user/schemas';
import { UserTypes } from '../user/enums';
import { AIMediaOwner, MediaType } from './enums';
@Injectable()
export class MediaProvider {
  constructor(private readonly mediaService: MediaService) {
    cloudinary.config({
      api_key: Env.CLOUDINARY_API_KEY,
      cloud_name: Env.CLOUDINARY_CLOUD_NAME,
      api_secret: Env.CLOUDINARY_API_SECRET,
    });
  }
  async uploadMedia(
    user: UserDocument,
    file: Express.Multer.File,
    data: UploadDto,
  ): Promise<IApiResponseDto> {
    try {
      console.log('Uploaded file MIME type:', file.mimetype);

      const allowedImageTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ];
      const allowedAudioTypes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/webm',
      ];
      const allowedVideoTypes = [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo', // .avi
        'video/ogg',
      ];
      
      if (
        data.media_type === MediaType.AI_AVATAR ||
        data.media_type === MediaType.PROFILE_PICTURE ||
        data.media_type === MediaType.CHAT_IMAGE
      ) {
        if (
          !file.mimetype.startsWith('image/') ||
          !allowedImageTypes.includes(file.mimetype)
        ) {
          throw new BadRequestException('Unsupported image format');
        }
      }

      if (data.media_type === MediaType.AI_VOICE) {
        if (
          !file.mimetype.startsWith('audio/') ||
          !allowedAudioTypes.includes(file.mimetype)
        ) {
          throw new BadRequestException('Unsupported audio format');
        }
      }

      if (data.media_type === MediaType.CHAT_VIDEO) {
        if (
          !file.mimetype.startsWith('video/') ||
          !allowedVideoTypes.includes(file.mimetype)
        ) {
          throw new BadRequestException('Unsupported video format');
        }
      }

      let originalName = file.originalname;
      if (originalName.endsWith('.mpa'))
        originalName = originalName.replace(/\.mpa$/i, '.mp3');

      const folders: Record<string, string> = {
        [MediaType.AI_AVATAR]: `eduflexai/${user._id}/ai_avatars`,
        [MediaType.AI_VOICE]: `eduflexai/${user._id}/ai_voices`,
        [MediaType.CHAT_IMAGE]: `eduflexai/${user._id}/chat/images`,
        [MediaType.CHAT_VIDEO]: `eduflexai/${user._id}/chat/videos`,
      };
      const folder =
        folders[data.media_type] ?? `eduflexai/${user._id}/uploads`;

      const base64 = file.buffer.toString('base64');
      const resourceType =
        data.media_type === MediaType.AI_VOICE ||
        data.media_type === MediaType.CHAT_VIDEO
          ? 'video'
          : 'auto';
      
      const res = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${base64}`,
        {
          folder,
          resource_type: resourceType,
        },
      );
      const media = await this.mediaService.createMedia({
        user,
        location: res.url,
        url: res.secure_url,
        mimetype: file.mimetype,
        media_type: data.media_type,
        file_name: originalName,
        file_size: file.size,
      });

      return {
        message: 'File uploaded successfully',
        data: media,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        error?.message ?? 'Failed to upload media',
      );
    }
  }

  async uploadAiAvatar({
    user,
    body,
  }: {
    user: UserDocument;
    body: CreateAiAvatarDto;
  }): Promise<IApiResponseDto> {
    try {
      const media = await this.mediaService.getMedia({
        _id: body.media_id,
        user: user._id,
      });

      if (!media) {
        throw new NotFoundException('Uploaded media not found');
      }
      if (!media.mimetype?.startsWith('image/')) {
        throw new BadRequestException(
          'Please select an image file for AI Avatar generation',
        );
      }

      const aiAvatar = await this.mediaService.createAIAvatar({
        user,
        media,
        name: body.name ?? media.file_name ?? 'AI Avatar',
        description: body.description ?? 'Uploaded Avatar.',
        owner:
          user.account_type === UserTypes.CUSTOMER
            ? AIMediaOwner.USER
            : AIMediaOwner.SYSTEM,
      });

      return {
        message: 'AI Avatar uploaded successfully',
        data: aiAvatar,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.message ?? 'Failed to upload AI avatar',
      );
    }
  }
  async updateAiAvatar({
    user,
    avatarId,
    body,
  }: {
    user: UserDocument;
    avatarId: string;
    body: UpdateAiAvatarDto;
  }): Promise<IApiResponseDto> {
    try {
      const aiAvatar = await this.mediaService.getAIAvatar({
        _id: avatarId,
        user: user._id,
      });

      if (!aiAvatar) {
        throw new NotFoundException('AI Avatar not found');
      }

      if (body.name) aiAvatar.name = body.name;
      if (body.description) aiAvatar.description = body.description;
      if (body.media_id) {
        const media = await this.mediaService.getMedia({
          _id: body.media_id,
          user: user._id,
        });

        if (!media) {
          throw new NotFoundException('Provided media not found');
        }

        if (!media.mimetype?.startsWith('image/')) {
          throw new BadRequestException(
            'Provided media must be an image file for AI Avatar',
          );
        }

        aiAvatar.media = media;

        if (!body.name) aiAvatar.name = media.file_name ?? aiAvatar.name;
      }

      const updated = await aiAvatar.save();

      return {
        message: 'AI Avatar updated successfully',
        data: updated,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error?.message ?? 'Failed to update AI Avatar',
      );
    }
  }

  async deleteAiAvatar({
    user,
    avatarId,
  }: {
    user: UserDocument;
    avatarId: string;
  }): Promise<IApiResponseDto> {
    try {
      const deleted = await this.mediaService.aiAvatarModel.findOneAndDelete({
        _id: avatarId,
        user: user._id,
      });

      if (!deleted) {
        throw new NotFoundException('AI Avatar not found');
      }

      return {
        message: 'AI Avatar deleted successfully',
        data: deleted,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        error?.message ?? 'Failed to delete AI Avatar',
      );
    }
  }
  async getSystemAiAvatars(query: ListAiAvatarsDto): Promise<IApiResponseDto> {
    const filter = { owner: AIMediaOwner.SYSTEM };
    const data = await this.mediaService.listAIAvatars(filter, query);

    return {
      message: 'System AI Avatars retrieved successfully',
      data,
    };
  }
  async getMyAiAvatars({
    user,
    query,
  }: {
    user: UserDocument;
    query: ListAiAvatarsDto;
  }): Promise<IApiResponseDto> {
    const filter = { user: user._id };
    const data = await this.mediaService.listAIAvatars(filter, query);

    return {
      message: 'User AI Avatars retrieved successfully',
      data,
    };
  }
  async uploadAiVoice({
    user,
    body,
  }: {
    user: UserDocument;
    body: CreateAiVoiceDto;
  }): Promise<IApiResponseDto> {
    try {
      const media = await this.mediaService.getMedia({
        _id: body.media_id,
        user: user._id,
      });

      if (!media) {
        throw new NotFoundException('Uploaded media not found');
      }

      if (!media.mimetype?.startsWith('audio/')) {
        throw new BadRequestException(
          'Please select an audio file for AI Voice generation',
        );
      }

      const aiVoice = await this.mediaService.createAIVoice({
        user,
        media,
        name: body.name ?? media.file_name ?? 'AI Voice',
        description: body.description ?? 'Uploaded AI Voice.',
        accent: body.accent ?? 'OTHER',
        owner:
          user.account_type === UserTypes.CUSTOMER
            ? AIMediaOwner.USER
            : AIMediaOwner.SYSTEM,
      });

      return {
        message: 'AI Voice uploaded successfully',
        data: aiVoice,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.message ?? 'Failed to upload AI voice',
      );
    }
  }
  async updateAiVoice({
    user,
    voiceId,
    body,
  }: {
    user: UserDocument;
    voiceId: string;
    body: UpdateAiVoiceDto;
  }): Promise<IApiResponseDto> {
    try {
      const aiVoice = await this.mediaService.getAIVoice({
        _id: voiceId,
        user: user._id,
      });

      if (!aiVoice) {
        throw new NotFoundException('AI Voice not found');
      }

      if (body.name) aiVoice.name = body.name;
      if (body.description) aiVoice.description = body.description;
      if (body.accent) aiVoice.accent = body.accent;
      if (body.media_id) {
        const media = await this.mediaService.getMedia({
          _id: body.media_id,
          user: user._id,
        });

        if (!media) {
          throw new NotFoundException('Provided media not found');
        }

        if (!media.mimetype?.startsWith('audio/')) {
          throw new BadRequestException(
            'Provided media must be an audio file for AI Voice',
          );
        }

        aiVoice.media = media;
        if (!body.name) aiVoice.name = media.file_name ?? aiVoice.name;
      }

      const updated = await aiVoice.save();

      return {
        message: 'AI Voice updated successfully',
        data: updated,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;

      throw new InternalServerErrorException(
        error?.message ?? 'Failed to update AI Voice',
      );
    }
  }
  async deleteAiVoice({
    user,
    voiceId,
  }: {
    user: UserDocument;
    voiceId: string;
  }): Promise<IApiResponseDto> {
    try {
      const deleted = await this.mediaService.aiVoiceModel.findOneAndDelete({
        _id: voiceId,
        user: user._id,
      });

      if (!deleted) {
        throw new NotFoundException('AI Voice not found');
      }

      return {
        message: 'AI Voice deleted successfully',
        data: deleted,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        error?.message ?? 'Failed to delete AI Voice',
      );
    }
  }
  async getSystemAiVoices(query: ListAiVoicesDto): Promise<IApiResponseDto> {
    const filter = { owner: AIMediaOwner.SYSTEM };
    const data = await this.mediaService.listAIVoices(filter, query);

    return {
      message: 'System AI Voices retrieved successfully',
      data,
    };
  }
  async getMyAiVoices({
    user,
    query,
  }: {
    user: UserDocument;
    query: ListAiVoicesDto;
  }): Promise<IApiResponseDto> {
    const filter = { user: user._id };
    const data = await this.mediaService.listAIVoices(filter, query);

    return {
      message: 'User AI Voices retrieved successfully',
      data,
    };
  }

  /**
   * Upload an AI-generated image to Cloudinary
   * Used by the LiveKit agent to upload generated images and get a URL
   * This endpoint does not require user authentication - uses agent API key
   */
  async agentUploadImage(body: AgentUploadImageDto): Promise<IApiResponseDto> {
    try {
      const { image_base64, prompt, room_name } = body;

      // Validate base64 data
      if (!image_base64 || image_base64.length === 0) {
        throw new BadRequestException('image_base64 is required');
      }

      // Determine folder based on room_name or use default
      let folder = 'eduflexai/agent/generated_images';
      if (room_name) {
        // Extract course ID from room_name if possible
        const courseMatch = room_name.match(/course-([a-f0-9]+)/i);
        if (courseMatch) {
          folder = `eduflexai/courses/${courseMatch[1]}/ai_images`;
        }
      }

      // Upload to Cloudinary
      // The image_base64 should be raw base64, we add the data URI prefix
      const dataUri = `data:image/png;base64,${image_base64}`;

      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'image',
        // Add metadata
        context: prompt ? `prompt=${prompt.substring(0, 500)}` : undefined,
      });

      return {
        message: 'Image uploaded successfully',
        data: {
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
          prompt: prompt,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      console.error('Agent image upload error:', error);
      throw new InternalServerErrorException(
        error?.message ?? 'Failed to upload agent image',
      );
    }
  }

  async agentUploadVideo(body: AgentUploadVideoDto): Promise<IApiResponseDto> {
    try {
      const { video_base64, title, topic, duration, room_name, job_id } = body;

      // Validate base64 data
      if (!video_base64 || video_base64.length === 0) {
        throw new BadRequestException('video_base64 is required');
      }

      // Determine folder based on room_name or use default
      let folder = 'eduflexai/agent/generated_videos';
      if (room_name) {
        // Extract course ID from room_name if possible
        const courseMatch = room_name.match(/course-([a-f0-9]+)/i);
        if (courseMatch) {
          folder = `eduflexai/courses/${courseMatch[1]}/ai_videos`;
        }
      }

      // Upload to Cloudinary
      // The video_base64 should be raw base64, we add the data URI prefix
      const dataUri = `data:video/mp4;base64,${video_base64}`;

      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'video',
        // Add metadata
        context: topic ? `topic=${topic.substring(0, 500)}` : undefined,
      });

      // Generate thumbnail URL from Cloudinary video
      const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 640, height: 360, crop: 'fill' },
          { start_offset: '0' }
        ]
      });

      return {
        message: 'Video uploaded successfully',
        data: {
          url: uploadResult.secure_url,
          thumbnail_url: thumbnailUrl,
          public_id: uploadResult.public_id,
          duration: uploadResult.duration || duration,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
          width: uploadResult.width,
          height: uploadResult.height,
          title: title,
          topic: topic,
          job_id: job_id,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      console.error('Agent video upload error:', error);
      throw new InternalServerErrorException(
        error?.message ?? 'Failed to upload agent video',
      );
    }
  }
}
