// 这个文件像“仪表盘数据说明书”，告诉前端每个字段长什么样。
export interface DashboardSummaryDto {
  // 当前登录用户的余额信息，全部用字符串返回，避免 BigInt 在 JSON 里报错。
  balance: {
    // 用户自己充值或后台发放的付费余额。
    balanceCreditsMicro: string;
    // 注册赠送或活动赠送的免费额度。
    freeCreditsMicro: string;
    // 免费额度 + 付费余额，前端可以直接展示总额度。
    totalCreditsMicro: string;
  };
  // 当前用户的历史用量汇总。
  usageTotals: {
    // 总 prompt tokens。
    promptTokens: number;
    // 总 completion tokens。
    completionTokens: number;
    // 总 tokens。
    totalTokens: number;
    // 总扣费，仍然用字符串返回。
    costCreditsMicro: string;
  };
  // 最近的请求日志，像快递单一样帮我们追踪每次调用。
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
  // 最近的错误日志，像事故记录本一样帮我们排查问题。
  recentErrors: Array<{
    requestId: string | null;
    errorType: string;
    errorCode: string;
    message: string;
    providerName: string | null;
    createdAt: string;
  }>;
}
