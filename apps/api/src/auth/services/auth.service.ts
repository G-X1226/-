import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthResponseDto, AuthUserResponseDto } from '../dto/auth-response.dto';
import type { LoginDto } from '../dto/login.dto';
import type { RegisterDto } from '../dto/register.dto';
import { UsersService } from '../../users/services/users.service';
import { ACCESS_TOKEN_EXPIRES_IN_SECONDS, TokenService } from './token.service';
import { PasswordService } from './password.service';

const DEFAULT_FREE_CREDITS_MICRO = 1_000_000n;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const user = await this.usersService.createWithInitialCreditGrant(
      {
        email,
        passwordHash: await this.passwordService.hashPassword(dto.password),
        freeCreditsMicro: DEFAULT_FREE_CREDITS_MICRO,
        balanceCreditsMicro: 0n,
      },
      DEFAULT_FREE_CREDITS_MICRO,
    );

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.usersService.findByEmail(email);

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const validPassword = await this.passwordService.verifyPassword(user.passwordHash, dto.password);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const updatedUser = await this.usersService.updateLastLoginAt(user.id);
    return this.createAuthResponse(updatedUser);
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private async createAuthResponse(user: {
    id: string;
    email: string;
    role: string;
    status: string;
    balanceCreditsMicro: bigint;
    freeCreditsMicro: bigint;
    createdAt: Date;
  }): Promise<AuthResponseDto> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      accessToken: await this.tokenService.signAccessToken(payload),
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      user: this.toAuthUserResponse(user),
    };
  }

  private toAuthUserResponse(user: {
    id: string;
    email: string;
    role: string;
    status: string;
    balanceCreditsMicro: bigint;
    freeCreditsMicro: bigint;
    createdAt: Date;
  }): AuthUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      balanceCreditsMicro: user.balanceCreditsMicro.toString(),
      freeCreditsMicro: user.freeCreditsMicro.toString(),
      createdAt: user.createdAt,
    };
  }
}
