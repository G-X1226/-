import { Module } from '@nestjs/common';
import { BalanceTransactionsRepository } from './repositories/balance-transactions.repository';
import { BalanceService } from './services/balance.service';
import { BillingService } from './services/billing.service';
import { CostCalculatorService } from './services/cost-calculator.service';
import { LedgerService } from './services/ledger.service';
import { PricingService } from './services/pricing.service';

@Module({
  providers: [
    BillingService,
    PricingService,
    LedgerService,
    BalanceService,
    CostCalculatorService,
    BalanceTransactionsRepository,
  ],
  exports: [BillingService, PricingService, LedgerService, BalanceService, CostCalculatorService],
})
export class BillingModule {}
