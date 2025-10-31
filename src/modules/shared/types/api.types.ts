import { Request, Response } from 'express';
import { User } from 'src/modules/user/schemas';

export interface IToken {
  accessToken?: string;
  refreshToken?: string;
}

export interface IApiResponseDto {
  message: string;
  data?: any;
  pagination?: PaginationMeta;
  accessToken?: string;
  refreshToken?: string;
}

export interface IJwtPayload {
  sub: string;
  isAccessToken: boolean;
  exp: number;
  [key: string]: any;
}

export type Req = Request & { user: User };
export type Res = Response;

export type PaginationMeta = {
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  [key: string]: any;
};
