import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiService } from './api.service';
import { IsPublic } from 'src/decorators';

@Controller()
@ApiTags('API Base')
@ApiBearerAuth()
export class ApiController {
  constructor(private readonly apiService: ApiService) {}
  @Get()
  @IsPublic()
  apiDefault() {
    return this.apiService.apiDefault();
  }
  @Get('health')
  @IsPublic()
  healthCheck() {
    return this.apiService.healthCheck();
  }
}
