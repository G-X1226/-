export const CREDITS_MICRO_PER_CREDIT = 1_000_000n;

export function calculateTokenCostMicro(
  promptTokens: number,
  completionTokens: number,
  inputPricePer1MTokensMicro: bigint,
  outputPricePer1MTokensMicro: bigint,
): bigint {
  const promptCost = (BigInt(promptTokens) * inputPricePer1MTokensMicro) / 1_000_000n;
  const completionCost = (BigInt(completionTokens) * outputPricePer1MTokensMicro) / 1_000_000n;
  return promptCost + completionCost;
}
