import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BalanceService {
  constructor(private readonly prisma: PrismaService) {}

  async hasPositiveBalance(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return Boolean(user && (user.balanceCreditsMicro > 0n || user.freeCreditsMicro > 0n));
  }
}
