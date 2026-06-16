import { Injectable } from '@nestjs/common';
import type { ModelProvider } from '../domain/provider.interface';

@Injectable()
export class ProviderRegistryService {
  private readonly providers = new Map<string, ModelProvider>();

  register(provider: ModelProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): ModelProvider | undefined {
    return this.providers.get(name);
  }
}
