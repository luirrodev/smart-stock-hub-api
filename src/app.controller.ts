import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  getHealthCheck(): { status: string; message: string } {
    return {
      status: 'ok',
      message: 'SMART STORE API is running',
    };
  }
}
