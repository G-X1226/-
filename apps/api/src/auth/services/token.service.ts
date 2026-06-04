import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../types/jwt-payload.type';

export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60;

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, { expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS });
  }
}
