<<<<<<< HEAD
import { useState } from "react";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { bscTestnet } from "@reown/appkit/networks";
import { Navigate } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useIsRegistered } from "../../contracts/hooks";
import { BSC_TESTNET_CHAIN_ID } from "../../contracts/config";

export default function DashboardAccessGate({ children }) {
  const { address, isConnected } = useAppKitAccount({ namespace: "eip155" });
  const { chainId, switchNetwork } = useAppKitNetwork();
  const [isSwitching, setIsSwitching] = useState(false);
  const { isRegistered, isLoading, isError } = useIsRegistered(address);
=======
import { useAppKitAccount, useAppKitState } from "@reown/appkit/react";
import { Navigate } from "react-router-dom";
import { useWeb3 } from "../../context/Web3Context";

export default function DashboardAccessGate({ children }) {
  const { address, isConnected, status } = useAppKitAccount({ namespace: "eip155" });
  const { initialized } = useAppKitState();
  const { isRegistered, isLoading } = useWeb3();

  if (!initialized || status === "connecting" || status === "reconnecting") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090C] text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFB51D]/30 border-t-[#FFB51D]" />
          <p className="text-sm font-medium text-[#A3A3A3]">Restoring wallet connection...</p>
        </div>
      </div>
    );
  }
>>>>>>> a517f8edf55efb225c43ad309cdcbb680f4eadf4

  if (!isConnected || !address) {
    return <Navigate to="/login" replace />;
  }

<<<<<<< HEAD
  // Network check notification
  const isWrongNetwork = chainId && Number(chainId) !== BSC_TESTNET_CHAIN_ID;

  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    try {
      if (switchNetwork) {
        await switchNetwork(bscTestnet);
      }
    } catch (err) {
      console.warn("Could not switch network:", err);
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center text-white font-chakra-petch">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-[#FFB51D]" />
        <p className="text-sm text-neutral-400">Verifying account on BSC Testnet...</p>
=======
  if (isLoading && !isRegistered) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090C] text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFB51D]/30 border-t-[#FFB51D]" />
          <p className="text-sm font-medium text-[#A3A3A3]">Checking on-chain registration...</p>
        </div>
>>>>>>> a517f8edf55efb225c43ad309cdcbb680f4eadf4
      </div>
    );
  }

<<<<<<< HEAD
  if (isError && !isRegistered) {
=======
  if (!isRegistered) {
>>>>>>> a517f8edf55efb225c43ad309cdcbb680f4eadf4
    return <Navigate to="/register" replace />;
  }

  if (!isRegistered) {
    return <Navigate to="/register" replace />;
  }

  return (
    <>
      {isWrongNetwork && (
        <div className="sticky top-0 z-[120] flex items-center justify-between gap-3 bg-amber-500/20 px-4 py-2.5 text-xs text-amber-200 backdrop-blur-md border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-[#FFB51D]" />
            <span>
              You are connected to an unsupported network. Please switch to{" "}
              <strong>BNB Smart Chain Testnet</strong> (Chain ID 97) to use HANA staking.
            </span>
          </div>
          <button
            onClick={handleSwitchNetwork}
            disabled={isSwitching}
            className="rounded bg-[#FFB51D] px-3 py-1 font-semibold text-black transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {isSwitching ? "Switching..." : "Switch Network"}
          </button>
        </div>
      )}
      {children}
    </>
  );
}
