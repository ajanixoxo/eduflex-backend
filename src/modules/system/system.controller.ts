import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { IsPublic } from 'src/decorators';
@Controller('system')
@ApiTags('System Defaults')
@ApiBearerAuth()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}
  @Get('country_list')
  @IsPublic()
  async getCountryList() {
    const response = await this.systemService.getCountryList();
    return response;
  }
}
