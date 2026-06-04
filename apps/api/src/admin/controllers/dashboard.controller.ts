import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import type { DashboardSummaryDto } from '../dto/dashboard-summary.dto';
import { DashboardService } from '../services/dashboard.service';

// DashboardController 像“后台仪表盘窗口”：前端来这里取余额、用量、请求日志和错误日志。
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    // DashboardService 像“账房先生”，真正的数据整理工作交给它。
    private readonly dashboardService: DashboardService,
  ) {}

  // GET /admin/dashboard/summary：当前登录用户查看自己的仪表盘数据。
  @Get('summary')
  summary(@CurrentUser() currentUser: AuthenticatedUser): Promise<DashboardSummaryDto> {
    console.log(`[系统提示] 收到前端请求：加载用量与日志面板，用户ID：${currentUser.id}`);
    return this.dashboardService.getSummary(currentUser.id);
  }
}
