import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAdjustment(userId: string, amountCreditsMicro: bigint, description: string): Promise<void> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { balanceCreditsMicro: { increment: amountCreditsMicro } },
    });

    await this.prisma.balanceTransaction.create({
      data: {
        userId,
        type: 'ADJUSTMENT',
        amountCreditsMicro,
        balanceAfterCreditsMicro: user.balanceCreditsMicro,
        description,
      },
    });
  }
}
