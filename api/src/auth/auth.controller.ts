import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from '@/auth/auth.service';
import type { AuthenticatedRequest } from '@/auth/authenticated-request';
import { LocalAuthGuard } from '@/auth/local-auth.guard';
import { Public } from '@/auth/public.decorator';
import { LoginDto } from '@/auth/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiBody({ type: LoginDto })
  login(@Request() req: AuthenticatedRequest) {
    return this.authService.login(req.user);
  }
}
