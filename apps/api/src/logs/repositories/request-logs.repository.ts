import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RequestLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByRequestId(requestId: string) {
    return this.prisma.requestLog.findUnique({ where: { requestId } });
  }
}
