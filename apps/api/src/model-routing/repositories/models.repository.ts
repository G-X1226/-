import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ModelsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByName(name: string) {
    return this.prisma.model.findFirst({ where: { name, status: 'ACTIVE' } });
  }

  listActive() {
    return this.prisma.model.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }
}
