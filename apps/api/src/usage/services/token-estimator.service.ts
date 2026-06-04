import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenEstimatorService {
  estimateFromText(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
