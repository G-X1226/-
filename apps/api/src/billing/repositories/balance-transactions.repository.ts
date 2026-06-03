import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BalanceTransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRecentForUser(userId: string) {
    return this.prisma.balanceTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
