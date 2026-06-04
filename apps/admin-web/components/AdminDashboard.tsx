'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ApiClient } from '../lib/api';
import type { ApiKeyRecord, DashboardSummary, ModelListResponse } from '../lib/api';

const defaultApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export function AdminDashboard() {
  const [apiBaseUrl, setApiBaseUrl] = useState(defaultApiBaseUrl);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('your-secure-password');
  const [jwt, setJwt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [newKeyName, setNewKeyName] = useState('local test key');
  const [allowedModels, setAllowedModels] = useState('deepseek-chat');
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [models, setModels] = useState<ModelListResponse['data']>([]);
  const [chatModel, setChatModel] = useState('deepseek-chat');
  const [prompt, setPrompt] = useState('Hello，简单介绍一下你自己。');
  const [chatResult, setChatResult] = useState('');
  const [streamResult, setStreamResult] = useState('');
  const [status, setStatus] = useState('准备就绪');
  const [error, setError] = useState('');

  const api = useMemo(() => new ApiClient(apiBaseUrl.replace(/\/$/, '')), [apiBaseUrl]);

  useEffect(() => {
    setJwt(localStorage.getItem('ai_gateway_jwt') ?? '');
    setApiKey(localStorage.getItem('ai_gateway_api_key') ?? '');
  }, []);

  function saveJwt(token: string) {
    setJwt(token);
    localStorage.setItem('ai_gateway_jwt', token);
  }

  function saveApiKey(key: string) {
    setApiKey(key);
    localStorage.setItem('ai_gateway_api_key', key);
  }

  async function run(label: string, action: () => Promise<void>) {
    setError('');
    setStatus(`${label}中...`);
    try {
      await action();
      setStatus(`${label}成功`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus(`${label}失败`);
    }
  }

  async function onRegister(event: FormEvent) {
    event.preventDefault();
    await run('注册', async () => {
      const result = await api.register(email, password);
      saveJwt(result.accessToken);
    });
  }

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    await run('登录', async () => {
      const result = await api.login(email, password);
      saveJwt(result.accessToken);
    });
  }

  async function refreshApiKeys() {
    await run('刷新 API Key', async () => {
      setApiKeys(await api.listApiKeys(jwt));
    });
  }

  async function loadDashboard() {
    await run('加载用量与日志面板', async () => {
      setDashboardSummary(await api.getDashboardSummary(jwt));
    });
  }

  async function createApiKey(event: FormEvent) {
    event.preventDefault();
    await run('创建 API Key', async () => {
      const models = allowedModels
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const created = await api.createApiKey(jwt, newKeyName, models);
      saveApiKey(created.key);
      setApiKeys(await api.listApiKeys(jwt));
    });
  }

  async function revokeApiKey(id: string) {
    await run('撤销 API Key', async () => {
      await api.revokeApiKey(jwt, id);
      setApiKeys(await api.listApiKeys(jwt));
    });
  }

  async function loadModels() {
    await run('加载模型', async () => {
      const response = await api.listModels(apiKey);
      setModels(response.data);
      if (response.data[0]) setChatModel(response.data[0].id);
    });
  }

  async function sendChat(stream: boolean) {
    await run(stream ? '流式调用' : '普通调用', async () => {
      if (stream) {
        setStreamResult('');
        await api.streamChat(apiKey, chatModel, [{ role: 'user', content: prompt }], (chunk) => {
          setStreamResult((current) => current + chunk);
        });
        return;
      }

      const response = await api.chat(apiKey, chatModel, [{ role: 'user', content: prompt }]);
      setChatResult(JSON.stringify(response, null, 2));
    });
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">AI API Gateway</p>
          <h1>Admin Dashboard</h1>
          <p className="subtitle">注册登录、管理 API Key、查看模型，并直接测试 OpenAI-compatible 调用。</p>
        </div>
        <div className="statusCard">
          <span>状态</span>
          <strong>{status}</strong>
          {error ? <p className="error">{error}</p> : null}
        </div>
      </section>

      <section className="card fullWidth">
        <div className="rowBetween">
          <div>
            <h2>用量与日志面板</h2>
            <p className="hint">这里像汽车仪表盘：余额、token、最近请求、最近错误都放在一起，方便排查。</p>
          </div>
          <button onClick={loadDashboard} disabled={!jwt}>刷新仪表盘</button>
        </div>

        {dashboardSummary ? (
          <div className="dashboardPanel">
            <div className="metricGrid">
              <MetricCard label="总额度" value={formatMicroCredits(dashboardSummary.balance.totalCreditsMicro)} />
              <MetricCard label="免费额度" value={formatMicroCredits(dashboardSummary.balance.freeCreditsMicro)} />
              <MetricCard label="总 Tokens" value={dashboardSummary.usageTotals.totalTokens.toLocaleString()} />
              <MetricCard label="总花费" value={formatMicroCredits(dashboardSummary.usageTotals.costCreditsMicro)} />
            </div>

            <div className="grid two">
              <div>
                <h3>最近请求</h3>
                <div className="list">
                  {dashboardSummary.recentRequests.map((item) => (
                    <div className="listItem vertical" key={item.requestId}>
                      <strong>{item.model ?? 'unknown'} · {item.provider ?? 'unknown'} · {item.status}</strong>
                      <p>{item.stream ? '流式' : '普通'} · {item.latencyMs ?? 0}ms · {formatDateTime(item.createdAt)}</p>
                      <p>requestId: {item.requestId}</p>
                      {item.errorCode ? <p>错误码：{item.errorCode}</p> : null}
                    </div>
                  ))}
                  {!dashboardSummary.recentRequests.length ? <p className="hint">暂无请求记录，先测试一次 Chat。</p> : null}
                </div>
              </div>

              <div>
                <h3>最近错误</h3>
                <div className="list">
                  {dashboardSummary.recentErrors.map((item) => (
                    <div className="listItem vertical" key={`${item.errorCode}-${item.createdAt}`}>
                      <strong>{item.errorCode} · {item.providerName ?? 'gateway'}</strong>
                      <p>{item.message}</p>
                      <p>{formatDateTime(item.createdAt)}</p>
                    </div>
                  ))}
                  {!dashboardSummary.recentErrors.length ? <p className="hint">暂无错误记录，这是好事。</p> : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="hint">登录后点击“刷新仪表盘”，就能看到余额、用量、请求日志和错误日志。</p>
        )}
      </section>


      <section className="grid two">
        <div className="card">
          <h2>1. 后端地址</h2>
          <label>
            API Base URL
            <input value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} />
          </label>
          <p className="hint">本地开发通常是 http://localhost:3000；Docker Nginx 是 http://localhost:8080。</p>
        </div>

        <div className="card">
          <h2>2. 登录信息</h2>
          <form className="stack" onSubmit={onLogin}>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <div className="actions">
              <button type="button" onClick={onRegister}>注册</button>
              <button type="submit">登录</button>
            </div>
          </form>
          <TokenPreview label="JWT" value={jwt} />
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <h2>3. 创建 API Key</h2>
          <form className="stack" onSubmit={createApiKey}>
            <label>
              名称
              <input value={newKeyName} onChange={(event) => setNewKeyName(event.target.value)} />
            </label>
            <label>
              允许模型，逗号分隔
              <input value={allowedModels} onChange={(event) => setAllowedModels(event.target.value)} />
            </label>
            <button type="submit" disabled={!jwt}>创建 API Key</button>
          </form>
          <TokenPreview label="当前 API Key" value={apiKey} />
        </div>

        <div className="card">
          <div className="rowBetween">
            <h2>4. API Key 列表</h2>
            <button onClick={refreshApiKeys} disabled={!jwt}>刷新</button>
          </div>
          <div className="list">
            {apiKeys.map((item) => (
              <div className="listItem" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.prefix}...{item.suffix} · {item.status}</p>
                </div>
                <button className="danger" onClick={() => revokeApiKey(item.id)} disabled={item.status !== 'ACTIVE'}>撤销</button>
              </div>
            ))}
            {!apiKeys.length ? <p className="hint">暂无 API Key，先创建一个。</p> : null}
          </div>
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <div className="rowBetween">
            <h2>5. 模型列表</h2>
            <button onClick={loadModels} disabled={!apiKey}>加载 /v1/models</button>
          </div>
          <div className="chips">
            {models.map((model) => (
              <button className="chip" key={model.id} onClick={() => setChatModel(model.id)}>{model.id}</button>
            ))}
            {!models.length ? <p className="hint">创建 API Key 后点击加载模型。</p> : null}
          </div>
        </div>

        <div className="card">
          <h2>6. 测试 Chat Completions</h2>
          <div className="stack">
            <label>
              Model
              <input value={chatModel} onChange={(event) => setChatModel(event.target.value)} />
            </label>
            <label>
              Prompt
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
            </label>
            <div className="actions">
              <button onClick={() => sendChat(false)} disabled={!apiKey}>普通调用</button>
              <button onClick={() => sendChat(true)} disabled={!apiKey}>流式调用</button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid two">
        <div className="card output">
          <h2>普通响应</h2>
          <pre>{chatResult || '这里会显示 JSON 响应'}</pre>
        </div>
        <div className="card output">
          <h2>流式响应</h2>
          <pre>{streamResult || '这里会逐字显示 stream 内容'}</pre>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metricCard">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatMicroCredits(value: string): string {
  return `${(Number(value) / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 6 })} credits`;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function TokenPreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="tokenBox">
      <span>{label}</span>
      <code>{value ? `${value.slice(0, 18)}...${value.slice(-8)}` : '未设置'}</code>
    </div>
  );
}
