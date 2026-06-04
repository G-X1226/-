import { Injectable } from '@nestjs/common';

@Injectable()
export class RateLimitPolicyService {
  getDefaultRpm(): number {
    return 60;
  }
}
