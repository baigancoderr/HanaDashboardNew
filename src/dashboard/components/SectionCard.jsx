export default function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}) {
  return (
    <div className={`rounded-xl border border-[#222] bg-[#111] p-4 shadow-[inset_0_1px_10px_rgba(255,255,255,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[inset_0_1px_12px_rgba(255,255,255,0.07),0_8px_24px_rgba(0,0,0,0.25)] sm:p-6 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h3 className="text-[14px] sm:text-[16px] font-semibold text-white font-chakra-petch">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-[12px] text-[#737373]">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
