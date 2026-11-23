export const REDUCED_WITHDRAWAL_FEE_BPS = 1000;
const REDUCED_FEE_WAIT_SECONDS = 45 * 24 * 60 * 60;

export function isReducedWithdrawalFee(firstStakeTime, nowSeconds = Math.floor(Date.now() / 1000)) {
  const firstStakeTimestamp = Number(firstStakeTime) || 0;
  return firstStakeTimestamp > 0 && nowSeconds >= firstStakeTimestamp + REDUCED_FEE_WAIT_SECONDS;
}

export function calculateWithdrawalFees(amount, config, reducedFee = false) {
  const requestedAmount = Number(amount);
  if (!config || !Number.isFinite(requestedAmount) || requestedAmount < 0) return null;

  const feeParts = reducedFee
    ? [{ label: 'Reduced Protocol Fee', bps: REDUCED_WITHDRAWAL_FEE_BPS }]
    : [
        { label: 'Admin Fee', bps: Number(config.adminFeeBps) },
        { label: 'Swap Fee', bps: Number(config.swapFeeBps) },
        { label: 'Ecosystem Fee', bps: Number(config.ecosystemFeeBps) },
      ];

  if (feeParts.some(({ bps }) => !Number.isFinite(bps) || bps < 0)) return null;

  const totalFeeBps = feeParts.reduce((total, part) => total + part.bps, 0);
  if (totalFeeBps > 10000) return null;

  const fees = feeParts.map((part) => ({
    ...part,
    amount: requestedAmount * part.bps / 10000,
  }));
  const totalFee = fees.reduce((total, part) => total + part.amount, 0);

  return {
    feeParts: fees,
    totalFeeBps,
    totalFee,
    net: requestedAmount - totalFee,
  };
}
