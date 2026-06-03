import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { Pricing } from '../types/pricing.type';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  getDefaultPricing(): Pricing {
    return {
      inputPricePer1MTokensMicro: 150n,
      outputPricePer1MTokensMicro: 600n,
    };
  }

  async getModelPricing(modelId?: string): Promise<Pricing> {
    if (!modelId) return this.getDefaultPricing();

    const model = await this.prisma.model.findUnique({ where: { id: modelId } });
    if (!model) {
      throw new NotFoundException('Model pricing was not found.');
    }

    return {
      inputPricePer1MTokensMicro: model.inputPricePer1MTokensMicro,
      outputPricePer1MTokensMicro: model.outputPricePer1MTokensMicro,
    };
  }
}
