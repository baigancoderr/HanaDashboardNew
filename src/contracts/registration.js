import { Contract, getAddress, isAddress } from "ethers";
import { CONTRACT_ADDRESSES, getReadOnlyProvider } from "./config";
import { HANA_STAKING_ABI } from "./abis";

/**
 * ethers can hand back a Result object for a single bool. A Result is always
 * truthy, so Boolean(result) would mark an unregistered wallet as registered.
 */
export function coerceRegisteredFlag(value) {
  if (value === true) return true;
  if (value === false || value == null) return false;
  if (typeof value === "bigint") return value === 1n;
  if (typeof value === "number") return value === 1;
  if (typeof value === "object") {
    if (typeof value.toArray === "function") {
      const items = value.toArray();
      if (items.length > 0) return coerceRegisteredFlag(items[0]);
    }
    if ("0" in value) return coerceRegisteredFlag(value[0]);
  }
  return false;
}

/**
 * Live isRegistered read against the current staking contract only.
 * Does not use localStorage or a previous wallet's result.
 */
export async function readStakingIsRegistered(address) {
  if (!address || !isAddress(address)) return false;

  const normalized = getAddress(address);
  const provider = getReadOnlyProvider();
  const staking = new Contract(
    CONTRACT_ADDRESSES.stakingContract,
    HANA_STAKING_ABI,
    provider
  );
  const blockTag = await provider.getBlockNumber();
  const registered = await staking.isRegistered(normalized, { blockTag });
  return coerceRegisteredFlag(registered);
}
