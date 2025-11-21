import {
  Body,
  Controller,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
  FileTypeValidator,
  Patch,
  Param,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MediaProvider } from './media.provider';
import { MAX_FILE_SIZE, MediaType } from './enums';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CreateAiAvatarDto,
  CreateAiVoiceDto,
  ListAiAvatarsDto,
  ListAiVoicesDto,
  UpdateAiAvatarDto,
  UpdateAiVoiceDto,
  UploadDto,
} from './dtos';
import { Auth } from 'src/decorators';
import { type UserDocument } from '../user/schemas';
import { ValidateMongoIdPipe } from 'src/validations';

@Controller('media')
@ApiTags('Media Management')
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaProvider: MediaProvider) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      description: 'max file size is 5mb',
      properties: {
        file: { type: 'string', format: 'binary' },
        media_type: { type: 'enum', default: Object.values(MediaType) },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,

    @Body() data: UploadDto,
    @Auth() user: UserDocument,
  ) {
    return this.mediaProvider.uploadMedia(user, file, data);
  }

  @Post('ai-avatar')
  async createAiAvatar(
    @Body() body: CreateAiAvatarDto,
    @Auth() user: UserDocument,
  ) {
    const res = await this.mediaProvider.uploadAiAvatar({ user, body });
    return res;
  }
  @Get('ai-avatars/system')
  async getSystemAiAvatars(
    @Auth() user: UserDocument,
    @Query() query: ListAiAvatarsDto,
  ) {
    const res = await this.mediaProvider.getSystemAiAvatars(query);
    return res;
  }
  @Get('ai-avatars/mine')
  async getMyAiAvatars(
    @Auth() user: UserDocument,
    @Query() query: ListAiAvatarsDto,
  ) {
    const res = await this.mediaProvider.getMyAiAvatars({ user, query });
    return res;
  }
  @Patch('ai-avatar/:avatarId')
  async updateAiAvatar(
    @Body() body: UpdateAiAvatarDto,
    @Auth() user: UserDocument,
    @Param('avatarId', ValidateMongoIdPipe) avatarId: string,
  ) {
    const res = await this.mediaProvider.updateAiAvatar({
      user,
      avatarId,
      body,
    });
    return res;
  }
  @Delete('ai-avatar/:avatarId')
  async deleteAiAvatar(
    @Auth() user: UserDocument,
    @Param('avatarId', ValidateMongoIdPipe) avatarId: string,
  ) {
    const res = await this.mediaProvider.deleteAiAvatar({ user, avatarId });
    return res;
  }

  @Post('ai-voice')
  async createAiVoice(
    @Body() body: CreateAiVoiceDto,
    @Auth() user: UserDocument,
  ) {
    const res = await this.mediaProvider.uploadAiVoice({ user, body });
    return res;
  }
  @Get('ai-voices/system')
  async getSystemAiVoices(
    @Auth() user: UserDocument,
    @Query() query: ListAiVoicesDto,
  ) {
    const res = await this.mediaProvider.getSystemAiVoices(query);
    return res;
  }
  @Get('ai-voices/mine')
  async getMyAiVoices(
    @Auth() user: UserDocument,
    @Query() query: ListAiVoicesDto,
  ) {
    const res = await this.mediaProvider.getMyAiVoices({ user, query });
    return res;
  }
  @Patch('ai-voice/:voiceId')
  async updateAiVoice(
    @Body() body: UpdateAiVoiceDto,
    @Auth() user: UserDocument,
    @Param('voiceId', ValidateMongoIdPipe) voiceId: string,
  ) {
    const res = await this.mediaProvider.updateAiVoice({ user, voiceId, body });
    return res;
  }
  @Delete('ai-voice/:voiceId')
  async deleteAiVoice(
    @Auth() user: UserDocument,
    @Param('voiceId', ValidateMongoIdPipe) voiceId: string,
  ) {
    const res = await this.mediaProvider.deleteAiVoice({ user, voiceId });
    return res;
  }
}
