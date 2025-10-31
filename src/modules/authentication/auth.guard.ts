import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthService } from './auth.service';

import { IS_PUBLIC_ROUTE, SET_ROLES } from 'src/decorators';
import { UserService } from '../user/user.service';
import { UserRoles, UserStatus, UserTypes } from '../user/enums';
import { Req } from '../shared/types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_ROUTE,
      context.getHandler(),
    );

    if (isPublic) {
      return true;
    }
    const roles = this.reflector.get<UserRoles | UserTypes>(
      SET_ROLES,
      context.getHandler(),
    );
    const req = context.switchToHttp().getRequest<Req>();
    const payload = await this.getPayload(req);

    const user = await this.userService.getUser({
      _id: payload.sub,
    });
    if (!user) {
      throw new UnauthorizedException('User account does not exist or deleted');
    }
    if (user && user.status === UserStatus.BANNED) {
      throw new ForbiddenException(
        'You have been banned! Contact support if you feel this is a mistake',
      );
    }
    if (user && user.status === UserStatus.DELETED) {
      throw new ForbiddenException('User account does not exist or deleted');
    }

    if (roles?.length) {
      if (!roles.includes(user.account_type) && !roles.includes(user.role)) {
        throw new ForbiddenException('unauthorised endpoint');
      }
    }
    await this.userService.updateUser(
      {
        _id: user._id,
      },
      {
        last_activity: Date.now(),
      },
    );
    req.user = user;
    return true;
  }
  async getPayload(req: Req) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('token not provided');
    }

    try {
      const payload = await this.authService.verifyToken(token);
      if (!payload.isAccessToken) {
        throw new UnauthorizedException('invalid token');
      }
      return payload;
    } catch (err) {
      throw new UnauthorizedException(err.message);
    }
  }
}
