import { User, Copy, CheckCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import SectionCard from "../components/SectionCard";
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";

export default function Settings() {
  const { address, referrer, contracts, network, formatAddress } = useWeb3();
  const [copied, setCopied] = useState("");

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <SectionCard title="Profile & On-Chain Identity" subtitle="Your connected Web3 account and sponsor details">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFE28A] to-[#FFB51D]">
              <User size={36} className="text-black" />
            </div>
            <span className="text-[11px] text-[#A3A3A3]">
              {address ? formatAddress(address) : "Not connected"}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#A3A3A3]">Connected Wallet Address</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={address || "Please connect wallet"}
                  readOnly
                  className="h-[38px] flex-1 rounded-lg border border-[#222] bg-[#0A0A0A] px-3 font-mono text-[12px] text-white outline-none"
                />
                <button
                  onClick={() => handleCopy(address, "wallet")}
                  className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-[#222] bg-[#111] text-[#A3A3A3] hover:text-[#FFB51D] transition-colors"
                >
                  {copied === "wallet" ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#A3A3A3]">Registered Sponsor / Referrer</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referrer && referrer !== "0x0000000000000000000000000000000000000000" ? referrer : "No on-chain referrer"}
                  readOnly
                  className="h-[38px] flex-1 rounded-lg border border-[#222] bg-[#0A0A0A] px-3 font-mono text-[12px] text-white outline-none"
                />
                <button
                  onClick={() => handleCopy(referrer, "sponsor")}
                  className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-[#222] bg-[#111] text-[#A3A3A3] hover:text-[#FFB51D] transition-colors"
                >
                  {copied === "sponsor" ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#A3A3A3]">Active Network</label>
              <input
                type="text"
                value={`${network.name} (Chain ID: ${network.chainId})`}
                readOnly
                className="h-[38px] w-full rounded-lg border border-[#222] bg-[#0A0A0A] px-3 text-[12px] text-green-400 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#A3A3A3]">Block Explorer</label>
              <a
                href={network.blockExplorer}
                target="_blank"
                rel="noreferrer"
                className="flex h-[38px] items-center gap-2 rounded-lg border border-[#222] bg-[#111] px-3 text-[12px] text-[#FFB51D] hover:bg-white/5 transition-colors"
              >
                <span>{network.blockExplorer}</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Contract Addresses */}
      <SectionCard title="Smart Contract Addresses" subtitle="Official Hana Protocol contracts on BSC Testnet">
        <div className="space-y-3">
          {[
            { name: "HANA Token Contract", address: contracts.hanaToken, key: "hanaToken" },
            { name: "USDT Token Contract", address: contracts.usdt, key: "usdt" },
            { name: "Hana Staking Contract", address: contracts.stakingContract, key: "staking" },
          ].map((item) => (
            <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#222] bg-[#0A0A0A] p-3.5">
              <div>
                <p className="text-[13px] font-bold text-white">{item.name}</p>
                <p className="text-[11px] font-mono text-[#A3A3A3] break-all">{item.address}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(item.address, item.key)}
                  className="flex items-center gap-1.5 rounded-lg border border-[#222] bg-[#111] px-3 py-1.5 text-xs text-[#A3A3A3] hover:text-[#FFB51D]"
                >
                  {copied === item.key ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
                  <span>{copied === item.key ? "Copied" : "Copy"}</span>
                </button>
                <a
                  href={`${network.blockExplorer}/address/${item.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-[#FFB51D]/20 bg-[#FFB51D]/10 px-3 py-1.5 text-xs font-semibold text-[#FFB51D] hover:bg-[#FFB51D]/20"
                >
                  <span>BscScan</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications" subtitle="Notification preferences are not connected to a notification service">
        <DataUnavailable>
          The previous toggles were only local UI state and did not save preferences or send alerts. They have been removed until notification delivery is implemented.
        </DataUnavailable>
      </SectionCard>
    </div>
  );
}
