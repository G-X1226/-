import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';

// AdminModule 像“后台办公室”，后续所有后台管理功能都会挂在这里。
@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class AdminModule {}
