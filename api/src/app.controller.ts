import { Controller, Get, Redirect } from '@nestjs/common';
import { Public } from '@/auth/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  @Redirect('/docs', 302)
  root() {}

  @Public()
  @Get('health')
  health(): string {
    return 'Ok';
  }
}
