import { useState } from "react";
import { Coins, TrendingUp, Flame, BarChart3, Sparkles, CheckCircle } from "lucide-react";
import StatCard from "../components/StatCard";
import SectionCard from "../components/SectionCard";
import DataUnavailable from "../components/DataUnavailable";
import { useWeb3 } from "../../context/Web3Context";

export default function Tokenomics() {
  const {
    hanaPrice,
    hanaReserves,
    hanaBalance,
    usdtBalance,
    buyHana,
    sellHana,
    isTransacting,
  } = useWeb3();

  const [tradeMode, setTradeMode] = useState("buy"); // 'buy' | 'sell'
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeMsg, setTradeMsg] = useState("");

  const numAmount = parseFloat(tradeAmount) || 0;
  const currentPriceNum = parseFloat(hanaPrice) || 0;
  const estimatedOutput =
    tradeMode === "buy"
      ? (currentPriceNum > 0 ? (numAmount / currentPriceNum).toFixed(2) : "0")
      : (numAmount * currentPriceNum).toFixed(2);

  const handleTradeSubmit = async (e) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setTradeMsg("Please enter a valid amount");
      return;
    }

    setTradeMsg("");
    if (tradeMode === "buy") {
      const res = await buyHana(numAmount);
      if (res.success) setTradeAmount("");
    } else {
      const res = await sellHana(numAmount);
      if (res.success) setTradeAmount("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Coins}
          label="HANA Live Price"
          value={`$${parseFloat(hanaPrice || "0").toFixed(4)}`}
          sub="On-chain bonding curve"
          color="gold"
          trend={{ up: true, value: "Active" }}
        />
        <StatCard
          icon={BarChart3}
          label="USDT Reserve"
          value={`$${parseFloat(hanaReserves.usdtReserve || "0").toLocaleString()}`}
          sub="Locked in contract"
          color="blue"
        />
        <StatCard
          icon={Flame}
          label="HANA in Pool"
          value={`${parseFloat(hanaReserves.hanaReserve || "0").toLocaleString()}`}
          sub="Circulating pool"
          color="red"
        />
        <StatCard
          icon={TrendingUp}
          label="Your HANA Balance"
          value={`${parseFloat(hanaBalance || "0").toFixed(2)}`}
          sub={`≈ $${(parseFloat(hanaBalance || "0") * currentPriceNum).toFixed(2)} USDT`}
          color="green"
        />
      </div>

      {/* Interactive Swap / Trade Widget */}
      <SectionCard title="Interactive Token Swap" subtitle="Buy & Sell HANA directly against the smart contract bonding curve">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <form onSubmit={handleTradeSubmit} className="space-y-4 rounded-xl border border-[#333] bg-[#0A0A0A] p-5">
            <div className="flex gap-2 p-1 rounded-lg bg-[#111] border border-[#222]">
              <button
                type="button"
                onClick={() => {
                  setTradeMode("buy");
                  setTradeAmount("");
                  setTradeMsg("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                  tradeMode === "buy"
                    ? "bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] text-black shadow"
                    : "text-[#A3A3A3] hover:text-white"
                }`}
              >
                Buy HANA with USDT
              </button>
              <button
                type="button"
                onClick={() => {
                  setTradeMode("sell");
                  setTradeAmount("");
                  setTradeMsg("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                  tradeMode === "sell"
                    ? "bg-red-500 text-white shadow"
                    : "text-[#A3A3A3] hover:text-white"
                }`}
              >
                Sell HANA for USDT
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#A3A3A3] mb-1">
                <span>You Pay ({tradeMode === "buy" ? "USDT" : "HANA"})</span>
                <span>
                  Balance:{" "}
                  <strong className="text-white">
                    {tradeMode === "buy"
                      ? `$${parseFloat(usdtBalance || "0").toFixed(2)} USDT`
                      : `${parseFloat(hanaBalance || "0").toFixed(2)} HANA`}
                  </strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={tradeAmount}
                  onChange={(e) => {
                    setTradeAmount(e.target.value);
                    setTradeMsg("");
                  }}
                  className="h-11 w-full rounded-lg border border-[#333] bg-[#111] px-4 text-sm font-bold text-white outline-none focus:border-[#FFB51D]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setTradeAmount(tradeMode === "buy" ? usdtBalance : hanaBalance)
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-[#FFB51D]/10 px-2 py-1 text-[11px] font-bold text-[#FFB51D] hover:bg-[#FFB51D]/20"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-[#222] bg-[#111] p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-[#A3A3A3]">
                <span>Estimated Receive</span>
                <span className="font-bold text-white">
                  ≈ {estimatedOutput} {tradeMode === "buy" ? "HANA" : "USDT"}
                </span>
              </div>
              <div className="flex justify-between text-[#A3A3A3]">
                <span>Contract Price</span>
                <span className="text-[#FFB51D] font-mono">1 HANA = ${currentPriceNum.toFixed(4)} USDT</span>
              </div>
            </div>

            {tradeMsg && <p className="text-xs text-red-400">{tradeMsg}</p>}

            <button
              type="submit"
              disabled={isTransacting || numAmount <= 0 || currentPriceNum <= 0}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50 ${
                tradeMode === "buy"
                  ? "bg-gradient-to-r from-[#FFE28A] to-[#FFB51D] text-black hover:brightness-110"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              {isTransacting
                ? "Processing on-chain..."
                : tradeMode === "buy"
                ? "Approve & Buy HANA"
                : "Confirm & Sell HANA (Burn)"}
            </button>
          </form>

          {/* Tokenomics Highlights */}
          <div className="space-y-3">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" /> Constant Liquidity Backing
              </p>
              <p className="mt-1 text-xs text-[#A3A3A3]">
                Price is determined entirely by USDT and HANA reserves inside the smart contract: <code>Price = USDT Reserve / HANA Reserve</code>.
              </p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Flame size={16} className="text-red-400" /> 100% Deflationary Sell Mechanism
              </p>
              <p className="mt-1 text-xs text-[#A3A3A3]">
                Whenever tokens are sold back to the contract, 100% of the sold HANA are permanently burned, reducing the circulating supply.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Data is sourced from current contract reads; no historical indexer is configured. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Token Distribution" subtitle="Allocation data is not exposed by the connected contract">
          <DataUnavailable>
            No allocation percentages are shown because the contract does not provide token distribution data.
          </DataUnavailable>
        </SectionCard>

        <SectionCard title="Price History" subtitle="Historical price events are not indexed">
          <DataUnavailable>
            Only the current on-chain price is available. Historical monthly prices are not loaded.
          </DataUnavailable>
        </SectionCard>
      </div>
    </div>
  );
}
