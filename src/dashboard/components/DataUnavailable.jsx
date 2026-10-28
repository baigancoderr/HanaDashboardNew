import { Info } from "lucide-react";

export default function DataUnavailable({ children }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-[#333] bg-[#0A0A0A] p-5 text-center">
      <div className="max-w-xl">
        <Info size={18} className="mx-auto mb-2 text-[#FFB51D]" />
        <p className="text-[13px] leading-relaxed text-[#A3A3A3]">{children}</p>
      </div>
    </div>
  );
}
