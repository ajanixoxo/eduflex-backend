import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './services/app-config.service';
import { EmailService, UtilService } from './services';
import { PaginationService } from './services/pagination.service';
const providers = [
  AppConfigService,
  UtilService,
  PaginationService,
  EmailService,
];
@Global()
@Module({ providers, exports: providers })
export class SharedModule {}
