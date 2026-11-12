import { ExternalLink, Loader2 } from "lucide-react";

export function ExplorerAddressLink({ address, shortLabel, href, fallback = "Network member" }) {
  if (!address || !href) {
    return <span className="text-neutral-400">{fallback}</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={address}
      className="font-mono text-white transition hover:text-[#FFB51D] hover:underline"
    >
      {shortLabel}
    </a>
  );
}

export function ExplorerTxBadge({ txHash, txShort, href }) {
  if (!txHash || !href) {
    return <span className="text-neutral-500">—</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={txHash}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFB51D]/20 bg-[#FFB51D]/5 px-2.5 py-1 font-mono text-[#FFB51D] transition hover:bg-[#FFB51D]/15"
    >
      {txShort}
      <ExternalLink size={12} />
    </a>
  );
}

export default function EventLogTable({
  address,
  connectMessage,
  isLoading,
  loadingMessage,
  error,
  errorPrefix,
  rows,
  columns,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
  tableLabel,
  minWidthClass = "min-w-[680px]",
  getRowKey,
}) {
  if (!address) {
    return (
      <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-400">
        {connectMessage}
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-[#FFB51D]">
        <Loader2 size={20} className="mr-2 animate-spin" />
        <span className="text-xs">{loadingMessage}</span>
      </div>
    );
  }

  if (error) {
    return (
      <p
        className="rounded-lg border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-300"
        role="alert"
      >
        {errorPrefix}: {error}
      </p>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 p-6 text-center">
        {EmptyIcon && <EmptyIcon size={26} className="mx-auto mb-2 text-neutral-500" />}
        <p className="text-sm font-medium text-white">{emptyTitle}</p>
        <p className="mt-1 text-xs text-neutral-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${minWidthClass} text-left text-xs`} aria-label={tableLabel}>
        <thead>
          <tr className="border-b border-[#222] text-[11px] uppercase tracking-wider text-[#737373]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`pb-3 font-semibold ${col.align === "right" ? "text-right" : ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#222]">
          {rows.map((row, index) => (
            <tr
              key={getRowKey ? getRowKey(row, index) : `${row.txHash || "row"}-${index}`}
              className="transition hover:bg-white/[0.02]"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-3 ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

