import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import type { AuthenticatedRequest } from '@/auth/authenticated-request';
import { LocalAuthGuard } from '@/auth/local-auth.guard';
import { Public } from '@/auth/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: AuthenticatedRequest) {
    return this.authService.login(req.user);
  }
}
