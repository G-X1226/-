export interface AuthenticatedApiKey {
  id: string;
  userId: string;
  userStatus: string;
  scopes: string[];
  allowedModels: string[] | null;
  rateLimitPolicyId: string | null;
  rpmLimit: number | null;
  tpmLimit: number | null;
}
