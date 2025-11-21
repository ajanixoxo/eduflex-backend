import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Auth, SetRoles } from 'src/decorators';
import { type UserDocument } from './schemas';

import { UserTypes } from './enums';
import { UserProvider } from './user.provider';
import {
  ChangePasswordDto,
  ListUsersDto,
  UpdateUserAvatarDto,
  UpdateUsernameDto,
} from './dtos';
import { ValidateMongoIdPipe } from 'src/validations';

@Controller('users')
@ApiTags('User Management')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userProvider: UserProvider) {}

  @Get()
  @SetRoles([UserTypes.STAFF])
  async getAllUsers(@Auth() user: UserDocument, @Query() query: ListUsersDto) {
    const data = await this.userProvider.getAllUsers({
      user,
      listQueryDto: query,
    });
    return data;
  }

  @Get('me')
  async getProfile(@Auth() user: UserDocument) {
    const data = await this.userProvider.getProfile(user);
    return data;
  }

  @Put('me/update_username')
  async updateUsername(
    @Auth() user: UserDocument,
    @Body() updateUsernameDto: UpdateUsernameDto,
  ) {
    const data = await this.userProvider.updateUsername(
      user,
      updateUsernameDto,
    );
    return data;
  }
  @Put('me/update_password')
  async changePassword(
    @Auth() user: UserDocument,
    @Body() body: ChangePasswordDto,
  ) {
    const data = await this.userProvider.changePassword(user, body);
    return data;
  }
  @Put('me/update_profile_pic')
  async updateProfilePic(
    @Auth() user: UserDocument,
    @Body() updateProfilePicDto: UpdateUserAvatarDto,
  ) {
    const data = await this.userProvider.updateUserAvatar(
      user,
      updateProfilePicDto,
    );
    return data;
  }
  @Get('username/check')
  async checkUsername(
    @Auth() user: UserDocument,
    @Query() updateUsernameDto: UpdateUsernameDto,
  ) {
    const data = await this.userProvider.checkUsername(user, updateUsernameDto);
    return data;
  }

  @Get(':userId')
  @SetRoles([UserTypes.STAFF])
  async getUser(@Param('userId', ValidateMongoIdPipe) userId: string) {
    const data = await this.userProvider.getUser(userId);
    return data;
  }
}
