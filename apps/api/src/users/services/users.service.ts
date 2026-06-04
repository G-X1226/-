import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { UserResponseDto } from '../dto/user-response.dto';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email.toLowerCase().trim());
  }

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  create(data: Prisma.UserCreateInput) {
    return this.usersRepository.create(data);
  }

  createWithInitialCreditGrant(data: Prisma.UserCreateInput, freeCreditsMicro: bigint) {
    return this.usersRepository.createWithInitialCreditGrant(data, freeCreditsMicro);
  }

  updateLastLoginAt(id: string) {
    return this.usersRepository.updateLastLoginAt(id);
  }

  toResponse(user: {
    id: string;
    email: string;
    role: string;
    status: string;
    balanceCreditsMicro: bigint;
    freeCreditsMicro: bigint;
    emailVerifiedAt: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      balanceCreditsMicro: user.balanceCreditsMicro.toString(),
      freeCreditsMicro: user.freeCreditsMicro.toString(),
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
