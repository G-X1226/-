import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  live(): { status: string } {
    return this.healthService.live();
  }

  @Get('live')
  liveProbe(): { status: string } {
    return this.healthService.live();
  }

  @Get('ready')
  readyProbe(): Promise<{ status: string; checks: Record<string, boolean> }> {
    return this.healthService.ready();
  }
}
