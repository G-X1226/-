import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ApiKeysRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByPrefix(prefix: string) {
    return this.prisma.apiKey.findMany({
      where: { prefix, status: 'ACTIVE' },
      include: { user: true, rateLimitPolicy: true },
      take: 10,
    });
  }

  create(data: Prisma.ApiKeyUncheckedCreateInput) {
    return this.prisma.apiKey.create({ data });
  }

  listByUserId(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.prisma.apiKey.findFirst({ where: { id, userId } });
  }

  revoke(id: string, userId: string) {
    return this.prisma.apiKey.updateMany({
      where: { id, userId, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
  }

  touchLastUsedAt(id: string) {
    return this.prisma.apiKey.update({ where: { id }, data: { lastUsedAt: new Date() } });
  }
}
