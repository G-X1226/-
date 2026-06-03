import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getStatus(): string {
    return 'auth_module_initialized';
  }
}
