import { Injectable } from '@nestjs/common';
import { calculateTokenCostMicro } from '../../common/utils/money.util';
import type { Pricing } from '../types/pricing.type';

@Injectable()
export class CostCalculatorService {
  calculate(promptTokens: number, completionTokens: number, pricing: Pricing): bigint {
    return calculateTokenCostMicro(
      promptTokens,
      completionTokens,
      pricing.inputPricePer1MTokensMicro,
      pricing.outputPricePer1MTokensMicro,
    );
  }
}
