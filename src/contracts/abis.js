// Central ABI exports — import from here for clean access
// Pattern: Same as DCC → src/contracts/abis.ts

export { HANA_TOKEN_ABI } from "./hanaTokenABI";
export { USDT_ABI } from "./usdtABI";
export { STAKING_ABI } from "./stakingABI";

// Lightweight ERC20 ABI for quick approve/allowance/balance checks
export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function totalSupply() view returns (uint256)",
];
