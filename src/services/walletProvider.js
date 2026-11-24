import { BSC } from "../config/contracts";

const wrappedProviders = new WeakSet();

const PUBLIC_RPC_METHODS = new Set([
  "eth_call",
  "eth_estimateGas",
  "eth_blockNumber",
  "eth_getBalance",
  "eth_getCode",
  "eth_getLogs",
  "eth_getBlockByNumber",
  "eth_getBlockByHash",
  "eth_getTransactionReceipt",
  "eth_getTransactionByHash",
  "eth_getTransactionCount",
  "eth_gasPrice",
  "eth_maxPriorityFeePerGas",
  "eth_feeHistory",
  "eth_getStorageAt",
]);

let activeWalletProvider = null;
let rpcRequestId = 1;

async function sendViaPublicRpc(method, params = []) {
  let lastError = null;

  for (const url of BSC.rpcUrls) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: rpcRequestId++,
          method,
          params,
        }),
        signal: controller.signal,
      });
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`RPC HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (payload.error) {
        throw new Error(payload.error.message ?? "RPC error");
      }
      return payload.result;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new Error(`All ${BSC.name} RPC endpoints failed`);
}

export function wrapWalletProvider(provider) {
  if (!provider || wrappedProviders.has(provider)) return provider;

  const request = async (args) => {
    if (PUBLIC_RPC_METHODS.has(args.method)) {
      const params = Array.isArray(args.params) ? args.params : [];
      return sendViaPublicRpc(args.method, params);
    }
    return provider.request(args);
  };

  const wrapped = new Proxy(provider, {
    get(target, prop, receiver) {
      if (prop === "request") return request;
      return Reflect.get(target, prop, receiver);
    },
  });

  wrappedProviders.add(wrapped);
  return wrapped;
}

export function setActiveWalletProvider(provider) {
  activeWalletProvider = provider ? wrapWalletProvider(provider) : null;
}

export function getActiveWalletProvider() {
  return activeWalletProvider;
}

export function clearActiveWalletProvider() {
  activeWalletProvider = null;
}
