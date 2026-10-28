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

  if (!isConnected || !address) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading && !isRegistered) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090C] text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFB51D]/30 border-t-[#FFB51D]" />
          <p className="text-sm font-medium text-[#A3A3A3]">Checking on-chain registration...</p>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return <Navigate to="/register" replace />;
  }

  return children;
}
