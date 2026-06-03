import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  createWithInitialCreditGrant(data: Prisma.UserCreateInput, freeCreditsMicro: bigint) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data });

      if (freeCreditsMicro > 0n) {
        await tx.balanceTransaction.create({
          data: {
            userId: user.id,
            type: 'CREDIT_GRANT',
            amountCreditsMicro: freeCreditsMicro,
            balanceAfterCreditsMicro: user.balanceCreditsMicro + user.freeCreditsMicro,
            referenceType: 'SYSTEM',
            referenceId: 'initial_free_credits',
            description: 'Initial free credits granted at registration.',
          },
        });
      }

      return user;
    });
  }

  updateLastLoginAt(id: string, lastLoginAt = new Date()) {
    return this.prisma.user.update({ where: { id }, data: { lastLoginAt } });
  }
}
