import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class ModelPermissionService {
  assertAllowed(modelName: string, allowedModels?: string[] | null): void {
    if (allowedModels && allowedModels.length > 0 && !allowedModels.includes(modelName)) {
      throw new ForbiddenException(`API key is not allowed to use model ${modelName}.`);
    }
  }
}
