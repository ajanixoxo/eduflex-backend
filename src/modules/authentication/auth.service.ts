import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { OTP, OTPDocument, UserAuth, UserAuthDocument } from './schemas';
import { ClientSession, FilterQuery, Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { EmailService, UtilService } from '../shared/services';
import { UserDocument } from '../user/schemas';
import { IJwtPayload } from '../shared/types';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(OTP.name)
    private readonly _otpModel: Model<OTPDocument>,

    @InjectModel(UserAuth.name)
    private readonly _userAuthModel: Model<UserAuthDocument>,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly utilService: UtilService,
    private readonly emailService: EmailService,
  ) {}

  get otpModel() {
    return this._otpModel;
  }

  get userAuthModel() {
    return this._userAuthModel;
  }
  async createUserAuth(createDto: Partial<UserAuth>, session?: ClientSession) {
    return (await this.userAuthModel.create(createDto)).save({ session });
  }
  async getUserAuth(
    filter: FilterQuery<UserAuthDocument>,
  ): Promise<UserAuthDocument | null> {
    return await this.userAuthModel.findOne(filter);
  }

  async generateOTP(length: number = 6): Promise<string> {
    const otp = Array.from({ length }, () =>
      Math.floor(Math.random() * 10),
    ).join('');
    return otp;
  }
  async generateAndSaveOtp(
    user: UserDocument,
    session?: ClientSession,
  ): Promise<OTPDocument> {
    const existingOtp = await this.otpModel.findOne({
      user: user._id,
    });
    if (existingOtp) {
      const timeDifference =
        Date.now() - new Date(existingOtp.createdAt).getTime();
      const sixtySeconds = 60 * 1000;

      if (timeDifference < sixtySeconds) {
        throw new BadRequestException(
          'You can only request a new OTP after 60 seconds.',
        );
      }

      await existingOtp.deleteOne();
    }
    const otp = await this.generateOTP();
    const createdOtp = await new this.otpModel({
      user,
      code: otp,
    }).save({ session });
    return createdOtp;
  }
  async isOtpValid({
    otp,
    user,
  }: {
    otp: string;
    user: UserDocument;
  }): Promise<boolean> {
    const otpDoc = await this.otpModel.findOne({
      code: otp,
      user: user._id,
    });

    if (!otpDoc) {
      return false;
    }
    await otpDoc.deleteOne();

    return true;
  }
  async verifyToken(token: string) {
    return this.jwtService.verifyAsync<IJwtPayload>(token);
  }
  async getToken(data: IJwtPayload): Promise<string> {
    return this.jwtService.signAsync(data);
  }
}
