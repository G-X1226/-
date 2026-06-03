import { Injectable, TooManyRequestsException } from '@nestjs/common';
import { BalanceService } from './balance.service';

@Injectable()
export class BillingService {
  constructor(private readonly balanceService: BalanceService) {}

  async assertCanSpend(userId: string): Promise<void> {
    if (!(await this.balanceService.hasPositiveBalance(userId))) {
      throw new TooManyRequestsException('Insufficient quota.');
    }
  }
}
