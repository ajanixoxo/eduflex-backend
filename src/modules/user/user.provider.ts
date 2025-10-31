import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, FilterQuery } from 'mongoose';
import { UserService } from './user.service';
import { AuthService } from '../authentication/auth.service';
import { EmailService, UtilService } from '../shared/services';
import { UserDocument } from './schemas';
import { IApiResponseDto } from '../shared/types';
import { ChangePasswordDto, ListUsersDto, UpdateUsernameDto } from './dtos';
import { formatToGmtPlus1 } from 'src/helpers';
import { endOfDay, format, startOfDay } from 'date-fns';

@Injectable()
export class UserProvider {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly utilService: UtilService,
    private readonly emailService: EmailService,
  ) {}
  async getProfile(user: UserDocument): Promise<IApiResponseDto> {
    const userProfile = await this.userService.getUser({
      _id: user._id,
    });

    if (!userProfile) {
      throw new NotFoundException('User does not exist');
    }
    const signups = await this.userService.userModel.countDocuments({
      referred_by: userProfile._id,
    });
    return {
      message: 'User Profile Fetched Successfully',
      data: {
        user,
      },
    };
  }
  async updateUsername(
    user: UserDocument,
    updateUsernameDto: UpdateUsernameDto,
  ): Promise<IApiResponseDto> {
    const usernameExists = await this.userService.getUser({
      username: updateUsernameDto.username,
    });
    if (
      usernameExists &&
      usernameExists._id.toString() !== user._id.toString()
    ) {
      throw new BadRequestException('Username already taken');
    }
    await this.userService.updateUser(
      {
        _id: user._id,
      },
      {
        username: updateUsernameDto.username,
      },
    );
    return {
      message: 'Username Updated',
    };
  }
  async checkUsername(
    user: UserDocument,
    updateUsernameDto: UpdateUsernameDto,
  ): Promise<IApiResponseDto> {
    const usernameExists = await this.userService.getUser({
      username: updateUsernameDto.username,
    });
    if (
      usernameExists &&
      usernameExists._id.toString() !== user._id.toString()
    ) {
      return {
        message: 'Username Exists',
        data: {
          username_available: false,
        },
      };
    } else {
      return {
        message: 'Username Available',
        data: {
          username_available: true,
        },
      };
    }
  }
  async changePassword(
    user: UserDocument,
    changePasswordDto: ChangePasswordDto,
  ): Promise<IApiResponseDto> {
    const { old_password, new_password, confirm_password } = changePasswordDto;
    const userAuth = await this.authService.getUserAuth({
      user: user._id,
    });
    if (!userAuth) {
      throw new NotFoundException('Auth does not exist');
    }
    const isMatch = await this.utilService.comparePassword(
      old_password,
      userAuth.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Old Password Incorrect');
    }
    if (new_password !== confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }
    if (new_password === old_password) {
      throw new BadRequestException('New Password cannot be same as old');
    }

    userAuth.password = await this.utilService.hashPassword(new_password);
    await userAuth.save();

    return {
      message: 'Password Updated',
    };
  }
  async getUser(userId: string): Promise<IApiResponseDto> {
    const user = await this.userService.getUser({
      _id: userId,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User fetched!',
      data: user,
    };
  }
  async getAllUsers({
    user,
    listQueryDto,
  }: {
    user: UserDocument;
    listQueryDto: ListUsersDto;
  }): Promise<IApiResponseDto> {
    const filterQuery: FilterQuery<UserDocument> = {};

    if (listQueryDto.search) {
      filterQuery.$or = [
        { email: { $regex: listQueryDto.search, $options: 'i' } },
        { firstname: { $regex: listQueryDto.search, $options: 'i' } },
        { lastname: { $regex: listQueryDto.search, $options: 'i' } },
        { phone: { $regex: listQueryDto.search, $options: 'i' } },
      ];
    }
    if (listQueryDto.start_date && listQueryDto.end_date) {
      filterQuery.created_at = {
        $gte: formatToGmtPlus1(startOfDay(new Date(listQueryDto.start_date))),
        $lte: formatToGmtPlus1(endOfDay(new Date(listQueryDto.end_date))),
      };
    }
    if (listQueryDto.status) {
      filterQuery.status = listQueryDto.status;
    }
    if (listQueryDto.role) {
      filterQuery.role = listQueryDto.role;
    }
    if (listQueryDto.sub_package) {
      filterQuery.sub_package = listQueryDto.sub_package;
    }
    if (listQueryDto.account_type) {
      filterQuery.account_type = listQueryDto.account_type;
    }

    if (listQueryDto.is_export) {
      const users = await this.userService.getAllUsers(
        filterQuery,
        listQueryDto,
      );
      const exportData = await Promise.all(
        users.items.map(async (p) => {
          p.id = p._id.toString();
          return {
            id: p.id,
            email: p.email,
            name: `${p.firstname} ${p.lastname}`,
            country: p.country ? p.country.name : 'N/A',
            phone: p.phone ?? 'N/A',
            username: p.username,
            register_date: `${format(new Date(p.created_at), 'PPPP')} - ${format(new Date(p.created_at), 'pp')}`,
          };
        }),
      );
      const attachment = this.emailService.getExportedContent(exportData, [
        { id: 'id', title: 'ID' },
        { id: 'email', title: 'Email' },
        { id: 'name', title: 'Name' },
        { id: 'country', title: 'Country' },
        { id: 'phone', title: 'Phone' },
        { id: 'username', title: 'Username' },
        { id: 'register_date', title: 'Register Date' },
      ]);

      return {
        message: 'Export Successful',
        data: {
          file: attachment,
          filename: `users_export_${Date.now()}.csv`,
          mimeType: 'text/csv',
        },
      };
    }
    const result = await this.userService.getAllUsers(
      filterQuery,
      listQueryDto,
    );

    const itemsWithReferralCount = await Promise.all(
      result.items.map(async (item) => {
        const referralCount = await this.userService.userModel.countDocuments({
          referred_by: item._id,
        });
        return { ...item.toObject(), referralCount };
      }),
    );

    const updatedResult = { ...result, items: itemsWithReferralCount };

    return {
      message: 'Users Fetched',
      data: updatedResult,
    };
  }
}
