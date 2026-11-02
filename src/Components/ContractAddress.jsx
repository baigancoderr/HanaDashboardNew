import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check, ExternalLink } from "lucide-react";
import contractImage from "../assets/Contract/contract.png";
import { StaggerGroup, StaggerItem } from "./Motion";
import { CONTRACT_ADDRESSES, getExplorerAddressUrl } from "../contracts/config";

const MotionSpan = motion.span;

const CONTRACT_TABS = [
  {
    id: "token",
    label: "HANA Token",
    address: CONTRACT_ADDRESSES.hanaToken,
    description: "Official HANA ERC-20 token on BSC Testnet",
  },
  {
    id: "staking",
    label: "Staking Contract",
    address: CONTRACT_ADDRESSES.stakingContract,
    description: "Core Staking & Registration contract",
  },
  {
    id: "usdt",
    label: "USDT Contract",
    address: CONTRACT_ADDRESSES.usdtToken,
    description: "Testnet DUSDT token for staking",
  },
];

export default function ContractAddress() {
  const [activeTab, setActiveTab] = useState("token");
  const [copied, setCopied] = useState(false);

  const currentContract =
    CONTRACT_TABS.find((t) => t.id === activeTab) || CONTRACT_TABS[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContract.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Unable to copy contract address:", error);
    }
  };

  return (
    <section className="mx-auto my-2 px-4 py-5 w-[95%] max-w-[1600px] font-chakra-petch bg-[linear-gradient(126.37deg,#1B1B1B_1%,#0C0C0C_62.51%,#000000_99.43%)] rounded-2xl text-white sm:px-8 md:py-10 min-[768px]:min-h-[380px] min-[1101px]:relative min-[1101px]:my-6 min-[1101px]:h-[480px] min-[1101px]:px-[60px] min-[1101px]:py-10">
      <StaggerGroup className="flex flex-col items-center gap-5 min-[768px]:h-full min-[768px]:flex-row min-[768px]:justify-between">
        <StaggerItem
          className="group relative flex justify-center w-full min-[768px]:w-[38%] min-[768px]:shrink-0 min-[768px]:justify-start min-[1101px]:absolute min-[1101px]:left-[40px]"
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
          whileHover={{ scale: 1.04, rotate: -1 }}
        >
          <MotionSpan
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[12%] left-1/2 h-16 w-2/3 -translate-x-1/2 rounded-full bg-[#FFB92E]/25 blur-3xl"
            animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
          />
          <img
            src={contractImage}
            alt="Golden HANA blockchain statue"
            className="relative object-contain h-auto w-[min(65%,260px)] drop-shadow-[0_0_18px_rgba(255,185,46,0.12)] transition-[filter] duration-500 group-hover:drop-shadow-[0_0_28px_rgba(255,185,46,0.35)] min-[600px]:w-[min(50%,300px)] min-[768px]:w-[min(100%,300px)] min-[1101px]:w-[min(32vw,415px)]"
          />
        </StaggerItem>

        <StaggerGroup className="flex flex-col items-center w-full min-w-0 min-[768px]:w-[58%] min-[1101px]:ml-auto text-center">
          <StaggerItem
            as="span"
            className="inline-flex items-center px-4 py-2 text-[16px] font-bold text-black bg-gradient-to-r from-[#FFE49A] to-[#FFB92E] [clip-path:polygon(0_0,100%_0,100%_70%,88%_100%,0_100%)] md:text-[20px]"
          >
            BSC Testnet Contracts
          </StaggerItem>

          {/* Contract Switcher Tabs */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {CONTRACT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCopied(false);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-[#FFB92E] text-black shadow-[0_0_12px_rgba(255,185,46,0.4)]"
                    : "border border-white/20 bg-white/5 text-neutral-300 hover:border-[#FFB92E]/60 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="mt-2 text-xs text-[#A3A3A3]">
            {currentContract.description}
          </p>

          <StaggerItem className="group relative mt-4 mb-5 px-3 py-4 w-full max-w-[700px] overflow-hidden min-[1101px]:mt-6 min-[1101px]:mb-6 bg-white/[0.03] rounded-[10px] border-white/80 border sm:px-6">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-[350%]"
            />
            <p className="break-all font-mono text-[clamp(13px,1.6vw,20px)] leading-relaxed tracking-[0.04em] text-white">
              {currentContract.address}
            </p>
          </StaggerItem>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <StaggerItem
              as="button"
              type="button"
              onClick={handleCopy}
              whileHover={{ y: -3, scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 min-h-10 text-sm font-semibold text-black bg-[linear-gradient(90deg,#F8E096_0%,#FFB01B_100%)] rounded-[5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F8E096] transition hover:brightness-110 active:scale-95"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.9 }}
                    className="inline-flex items-center gap-2"
                  >
                    <Check size={16} />
                    Copied!
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.9 }}
                    className="inline-flex items-center gap-2"
                  >
                    <Copy size={15} />
                    Copy Address
                  </motion.span>
                )}
              </AnimatePresence>
            </StaggerItem>

            <a
              href={getExplorerAddressUrl(currentContract.address)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-[5px] border border-white/30 bg-white/10 px-4 py-2 min-h-10 text-sm font-semibold text-white transition hover:border-[#FFB92E] hover:text-[#FFB92E]"
            >
              <span>View on BscScan</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </StaggerGroup>
      </StaggerGroup>
    </section>
  );
}
