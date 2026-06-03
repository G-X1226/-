export interface AuthenticatedApiKey {
  id: string;
  userId: string;
  scopes: string[];
  allowedModels?: string[];
}
