import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, UpdateQuery } from 'mongoose';
import { User, UserDocument } from './schemas';
import { PaginationService, UtilService } from '../shared/services';
import { UserTypes } from './enums';
import { ListUsersDto } from './dtos';
import { CreateAccountDto } from '../authentication/dtos';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly _userModel: Model<UserDocument>,
    private readonly utilService: UtilService,
    private readonly paginationService: PaginationService,
  ) {}
  get userModel() {
    return this._userModel;
  }

  async createUser(createAccount: CreateAccountDto, session?: ClientSession) {
    const createdUser = await this.userModel.create(createAccount);
    return createdUser.save({ session });
  }
  async updateUser(
    filter: FilterQuery<UserDocument>,
    update: UpdateQuery<UserDocument>,
    session: ClientSession | null = null,
  ): Promise<UserDocument | null> {
    const user = await this.userModel
      .findOneAndUpdate(filter, update, { new: true })
      .session(session);
    return user;
  }
  async getUser(
    filter: FilterQuery<UserDocument>,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findOne(filter);
    if (user) {
      if (!user.username) {
        await this.updateUser(
          { _id: user._id },
          { username: await this.generateUsername() },
        );
      }
      if (!user.notification_preferences) {
        await this.updateUser(
          {
            _id: user._id,
            notification_preferences: { $exists: false },
            account_type: UserTypes.CUSTOMER,
          },
          {
            $set: {
              notification_preferences: {
                platform_notifications: true,
                app_notifications: true,
                general_notifications: true,
              },
            },
          },
        );
      }
    }
    return user;
  }

  async getAllUsers(
    filter: FilterQuery<UserDocument>,
    listQueryDto: ListUsersDto,
  ) {
    const { page, per_page } = listQueryDto;
    const { items, meta } = await this.paginationService.paginate(
      this.userModel,
      filter,
      page,
      per_page,
      [
        {
          path: 'profile_pic',
          select: 'url',
        },
        {
          path: 'lead_management.assigned_to',
          select: 'firstname last_name email role',
        },
      ],
      listQueryDto.is_export,
    );
    return {
      items,
      meta,
    };
  }
  async generateUsername(): Promise<string> {
    const prefix = 'edu';
    let username: string;
    let isUnique = false;
    do {
      username = this.utilService.generateUniqueCode(prefix);
      const existingUsername = await this.getUser({ username });
      if (!existingUsername) {
        isUnique = true;
      }
    } while (!isUnique);
    return username;
  }
}
