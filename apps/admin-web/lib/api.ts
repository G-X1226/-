export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
    balanceCreditsMicro: string;
    freeCreditsMicro: string;
    createdAt: string;
  };
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  suffix: string;
  status: string;
  environment: string;
  scopes: string[];
  allowedModels: string[] | null;
  allowedIps: string[] | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface CreatedApiKeyRecord extends ApiKeyRecord {
  key: string;
}

export interface ModelListResponse {
  object: 'list';
  data: Array<{
    id: string;
    object: 'model';
    created: number;
    owned_by: string;
  }>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DashboardSummary {
  balance: {
    balanceCreditsMicro: string;
    freeCreditsMicro: string;
    totalCreditsMicro: string;
  };
  usageTotals: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costCreditsMicro: string;
  };
  recentRequests: Array<{
    requestId: string;
    model: string | null;
    provider: string | null;
    status: string;
    latencyMs: number | null;
    stream: boolean;
    createdAt: string;
    errorCode: string | null;
  }>;
  recentErrors: Array<{
    requestId: string | null;
    errorType: string;
    errorCode: string;
    message: string;
    providerName: string | null;
    createdAt: string;
  }>;
}

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  register(email: string, password: string): Promise<AuthResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  login(email: string, password: string): Promise<AuthResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  listApiKeys(jwt: string): Promise<ApiKeyRecord[]> {
    return this.request('/api-keys', { headers: this.authHeaders(jwt) });
  }

  getDashboardSummary(jwt: string): Promise<DashboardSummary> {
    return this.request('/admin/dashboard/summary', { headers: this.authHeaders(jwt) });
  }

  createApiKey(jwt: string, name: string, allowedModels: string[]): Promise<CreatedApiKeyRecord> {
    return this.request('/api-keys', {
      method: 'POST',
      headers: this.authHeaders(jwt),
      body: JSON.stringify({
        name,
        environment: 'LIVE',
        scopes: ['chat.completions:create'],
        allowedModels,
      }),
    });
  }

  revokeApiKey(jwt: string, id: string): Promise<{ revoked: true }> {
    return this.request(`/api-keys/${id}`, {
      method: 'DELETE',
      headers: this.authHeaders(jwt),
    });
  }

  listModels(apiKey: string): Promise<ModelListResponse> {
    return this.request('/v1/models', { headers: this.authHeaders(apiKey) });
  }

  chat(apiKey: string, model: string, messages: ChatMessage[]): Promise<unknown> {
    return this.request('/v1/chat/completions', {
      method: 'POST',
      headers: this.authHeaders(apiKey),
      body: JSON.stringify({ model, messages }),
    });
  }

  async streamChat(
    apiKey: string,
    model: string,
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const headers = new Headers(this.authHeaders(apiKey));
    headers.set('content-type', 'application/json');

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!response.ok || !response.body) {
      throw new Error(await this.readErrorMessage(response));
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        const data = frame
          .split(/\r?\n/)
          .find((line) => line.startsWith('data:'))
          ?.slice('data:'.length)
          .trim();
        if (!data || data === '[DONE]') continue;
        const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onChunk(content);
      }
    }
  }

  private authHeaders(token: string): Record<string, string> {
    return {
      authorization: `Bearer ${token}`,
    };
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('content-type', 'application/json');

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    const text = await response.text();
    const payload = this.parseJson(text);

    if (!response.ok) {
      const message = payload?.error?.message ?? payload?.message ?? response.statusText;
      throw new Error(message);
    }

    return payload as T;
  }

  private parseJson(text: string): any {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  private async readErrorMessage(response: Response): Promise<string> {
    const text = await response.text();
    const payload = this.parseJson(text);
    return payload?.error?.message ?? payload?.message ?? response.statusText;
  }
}
