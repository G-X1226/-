import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ApiKeysRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByPrefix(prefix: string) {
    return this.prisma.apiKey.findFirst({
      where: { prefix, status: 'ACTIVE' },
      include: { user: true, rateLimitPolicy: true },
    });
  }
}
