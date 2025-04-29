import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}

  getHello(): string {
    return 'NestJS: PlatziCourse buiding the firts API_REST in NestJS';
  }
}
