import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get('me')
  getCurrentUserPlaceholder(): { status: string } {
    return { status: 'reserved_for_step_5_authentication' };
  }
}
