import { Injectable } from '@nestjs/common';
import { Env } from '../constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}
  get isDevelopment(): boolean {
    return Env.NODE_ENV === 'development';
  }

  get isProduction(): boolean {
    return Env.NODE_ENV === 'production';
  }

  get isStaging(): boolean {
    return Env.NODE_ENV === 'staging';
  }
}
