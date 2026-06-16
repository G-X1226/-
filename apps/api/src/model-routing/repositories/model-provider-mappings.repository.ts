import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ModelProviderMappingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveMappings(modelId: string) {
    return this.prisma.modelProviderMapping.findMany({
      where: { modelId, status: 'ACTIVE', provider: { status: 'ACTIVE' } },
      include: { provider: true },
      orderBy: [{ isPrimary: 'desc' }, { priority: 'asc' }],
    });
  }
}
