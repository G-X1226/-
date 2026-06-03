import { Injectable } from '@nestjs/common';
import type { Pricing } from '../types/pricing.type';

@Injectable()
export class PricingService {
  getDefaultPricing(): Pricing {
    return {
      inputPricePer1MTokensMicro: 150n,
      outputPricePer1MTokensMicro: 600n,
    };
  }
}
