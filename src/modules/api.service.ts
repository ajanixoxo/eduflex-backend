import { HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class ApiService {
  constructor() {}
  apiDefault() {
    return {
      status: HttpStatus.OK,
      message: 'Welcome to Eduflex API',
    };
  }
  healthCheck() {
    return {
      status: HttpStatus.OK,
      message: 'API Running Normally',
    };
  }
}
