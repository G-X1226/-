import { Injectable } from '@nestjs/common';
import { hash, verify } from 'argon2';

@Injectable()
export class PasswordService {
  hashPassword(password: string): Promise<string> {
    return hash(password, { type: 2 });
  }

  verifyPassword(hashValue: string, password: string): Promise<boolean> {
    return verify(hashValue, password);
  }
}
