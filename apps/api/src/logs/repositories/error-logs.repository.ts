import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ErrorLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRecent() {
    return this.prisma.errorLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  }
}
