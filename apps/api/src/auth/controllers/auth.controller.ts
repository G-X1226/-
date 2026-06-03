import { Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('register')
  registerPlaceholder(): { status: string } {
    return { status: 'reserved_for_step_5_authentication' };
  }
}
