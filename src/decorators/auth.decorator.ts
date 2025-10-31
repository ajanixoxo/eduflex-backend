import {
  ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Req } from 'src/modules/shared/types';

export const IS_PUBLIC_ROUTE = 'IS_PUBLIC_ROUTE';
export const SET_ROLES = 'SET_ROLES';

export const IsPublic = () => SetMetadata(IS_PUBLIC_ROUTE, true);
export const SetRoles = (roles: any[] = []) => SetMetadata(SET_ROLES, roles);

export const Auth = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Req>();
    return data ? req.user[data] : req.user;
  },
);
