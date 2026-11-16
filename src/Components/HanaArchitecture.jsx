import { createElement } from "react";
import {
  Activity,
  Blocks,
  Bot,
  CircleDollarSign,
  Gamepad2,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Reveal, StaggerGroup, StaggerItem } from "./Motion";
import dseImage from "../assets/stability/dse.png";
import hanaWalletImage from "../assets/ecosystem/eco22.png";
import protocolImage from "../assets/protocol/protocol.png";

const signalFeatures = [
  { icon: Bot, label: "AI intelligence" },
  { icon: Activity, label: "Real-time analysis" },
  { icon: LockKeyhole, label: "Smart contracts" },
  { icon: ShieldCheck, label: "Security & risk" },
  { icon: Gamepad2, label: "Gaming experiences" },
];

const principles = [
  { icon: ShieldCheck, label: "Security by design" },
  { icon: Network, label: "Connected ecosystem" },
  { icon: CircleDollarSign, label: "Real-world utility" },
];

const cardBorderStyle = {
  background:
    "linear-gradient(120deg, #8F5B12 0%, #FFF1A8 28%, #E7AD38 62%, #1B5D9A 100%)",
};

function ArchitectureLayer({
  number,
  icon: Icon,
  title,
  description,
  image,
  imageAlt = "",
  children,
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[#E7AD38]/25 bg-[#111217]/90 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#FFD36A]/60 hover:bg-[#17171A] hover:shadow-[0_12px_30px_rgba(231,173,56,0.08)] sm:p-5">
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#FFF1A8] via-[#E7AD38] to-[#8F5B12] opacity-70 transition-opacity group-hover:opacity-100" />
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E7AD38]/25 bg-[#E7AD38]/10 text-[#FFD36A] md:flex">
          {createElement(Icon, { size: 21, strokeWidth: 1.8, "aria-hidden": true })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="chakra-petch text-[10px] font-semibold uppercase tracking-[0.2em] text-[#DFA52E]">
              Layer {number}
            </span>
            <h3 className="unbounded text-sm font-semibold text-[#F7F2E6] sm:text-base">
              {title}
            </h3>
          </div>
          <p className="chakra-petch text-sm leading-relaxed text-[#AAA7B8] sm:text-[15px]">
            {description}
          </p>
          {children}
        </div>
        {image && (
          <img
            src={image}
            alt={imageAlt}
            loading="lazy"
            className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_0_16px_rgba(231,173,56,0.2)] sm:h-[76px] sm:w-[76px]"
          />
        )}
      </div>
    </article>
  );
}

export default function HanaArchitecture() {
  return (
    <section
      id="architecture"
      aria-labelledby="architecture-heading"
      className="relative isolate overflow-hidden bg-transparent px-4 py-8 text-white sm:px-6 sm:py-8 lg:px-10 lg:py-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-[38%] z-0 h-80 w-80 rounded-full bg-[#1B5D9A]/20 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-24 z-0 h-[28rem] w-[28rem] rounded-full bg-[#C58B24]/20 blur-[120px]"
      />

        <div className="relative z-10 mx-auto max-w-[1600px]">
        <Reveal
          as="header"
          className="mx-auto mb-6 max-w-8xl text-left md:text-center sm:mb-14"
        >
          {/* <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E7AD38]/25 bg-[#E7AD38]/[0.07] px-3 py-1.5">
            <Sparkles size={14} className="text-[#FFD36A]" aria-hidden="true" />
            <span className="chakra-petch text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8C36E]">
              The HANA blueprint
            </span>
          </div> */}

          <h2
            id="architecture-heading"
            className="unbounded text-[24px] font-bold leading-tight tracking-[-0.04em] md:text-[40px] lg:text-[55px]"
          >
            <span className="text-[#F3F3F3]">One connected </span>
            <span className="bg-[linear-gradient(100deg,#FFF1A8_0%,#E7AD38_48%,#A96D18_100%)] bg-clip-text text-transparent">
              HANA Architecture
            </span>
          </h2>
          <p className="chakra-petch mx-0 mt-4 max-w-2xl text-[15px] leading-relaxed text-[#AAA7B8] sm:text-lg md:mx-auto">
            A modular vision connecting intelligent insights, transparent
            blockchain infrastructure, and useful community experiences.
          </p>
        </Reveal>

        <StaggerGroup className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {signalFeatures.map(({ icon: Icon, label }) => (
            <StaggerItem
              key={label}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
            >
              <div className="flex min-h-[54px] items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3 py-2.5 transition-colors duration-300 hover:border-[#E7AD38]/40 hover:bg-white/[0.07] sm:justify-center sm:gap-2.5">
                {createElement(Icon, {
                  size: 17,
                  className: "shrink-0 text-[#E7AD38]",
                  "aria-hidden": true,
                })}
                <span className="chakra-petch text-xs font-medium text-[#D8D4C9] sm:text-sm">
                  {label}
                </span>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <StaggerGroup className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-8">
          <StaggerItem
            className="min-w-0"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <div className="rounded-[13px] p-px" style={cardBorderStyle}>
              <div className="relative rounded-[12px] bg-black p-3 shadow-[0_24px_90px_rgba(0,0,0,0.35)] sm:p-6 lg:p-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="chakra-petch text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C89532]">
                  Modular system map
                </p>
                <h3 className="unbounded mt-1 text-sm font-semibold text-[#F3F3F3] sm:text-base">
                  From signals to experiences
                </h3>
              </div>
              <span className="hidden rounded-full border border-white/10 px-3 py-1 chakra-petch text-[11px] text-[#AAA7B8] sm:inline-flex">
                Architecture vision
              </span>
            </div>

            <div className="grid gap-3">
              <ArchitectureLayer
                number="01"
                icon={Bot}
                title="Intelligence & automation"
                description="Economic signals and analytics can inform risk-aware decisions and eligible protocol actions."
                image={dseImage}
                imageAlt="HANA Dynamic Stability Engine emblem"
              />
              <div
                aria-hidden="true"
                className="mx-auto hidden h-5 w-px bg-gradient-to-b from-[#E7AD38]/70 to-[#E7AD38]/15 md:block"
              />
              <ArchitectureLayer
                number="02"
                icon={ShieldCheck}
                title="Protocol & safeguards"
                description="Smart-contract workflows, security monitoring, and transparent rules form the coordination layer."
              >
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Risk-aware", "Rule-based", "Verifiable"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#E7AD38]/15 bg-[#E7AD38]/[0.06] px-2.5 py-1 chakra-petch text-[10px] text-[#D8C89D]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </ArchitectureLayer>
              <div
                aria-hidden="true"
                className="mx-auto hidden h-5 w-px bg-gradient-to-b from-[#E7AD38]/70 to-[#E7AD38]/15 md:block"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <ArchitectureLayer
                  number="03A"
                  icon={Blocks}
                  title="Blockchain foundation"
                  description="On-chain infrastructure designed for transparent, traceable interactions."
                />
                <ArchitectureLayer
                  number="03B"
                  icon={Gamepad2}
                  title="Community experiences"
                  description="A place for ecosystem participation, utility, and future gaming experiences."
                />
              </div>
              {/* <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#E7AD38]/45 bg-[linear-gradient(100deg,rgba(143,91,18,0.25),rgba(231,173,56,0.10)_55%,rgba(143,91,18,0.16))] px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(255,241,168,0.12)] sm:flex-row sm:gap-4 sm:py-5">
                <img
                  src={protocolImage}
                  alt="HANA DAO Protocol emblem"
                  loading="lazy"
                  className="h-14 w-20 object-contain drop-shadow-[0_0_18px_rgba(38,118,255,0.25)] sm:h-[72px] sm:w-24"
                />
                <div>
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <Sparkles
                      size={16}
                      className="text-[#FFD36A]"
                      aria-hidden="true"
                    />
                    <p className="unbounded text-sm font-bold text-[#FFF1A8] sm:text-base">
                      The HANA Ecosystem
                    </p>
                    <Sparkles
                      size={16}
                      className="text-[#FFD36A]"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="chakra-petch text-xs text-[#C7BFAE] sm:text-sm">
                    Built to connect people, protocol utility, and long-term growth
                  </p>
                </div>
              </div> */}
            </div>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem
            className="min-w-0 lg:mt-6"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <div className="rounded-[13px] p-px" style={cardBorderStyle}>
              <aside className="rounded-[12px] bg-black p-5 sm:p-6">
            <p className="chakra-petch text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C89532]">
              Designed around
            </p>
            <h3 className="unbounded mt-2 text-base font-semibold leading-snug text-[#F3F3F3]">
              Principles that keep the system connected.
            </h3>
            <div className="relative mt-5 h-40 overflow-hidden rounded-2xl border border-[#E7AD38]/20 bg-[#0B0D12] sm:h-48">
              <img
                src={hanaWalletImage}
                alt="HANA wallet and security ecosystem concept"
                loading="lazy"
                className="h-full w-full object-cover object-center opacity-90 transition duration-500 hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090A0D] via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 chakra-petch text-[10px] font-medium uppercase tracking-[0.14em] text-[#F3D889] backdrop-blur-sm">
                Connected ecosystem concept
              </span>
            </div>
            <ul className="mt-5 space-y-3">
              {principles.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7AD38]/10 text-[#E7AD38]">
                    {createElement(Icon, {
                      size: 17,
                      "aria-hidden": true,
                    })}
                  </span>
                  <span className="chakra-petch text-sm font-medium text-[#D8D4C9]">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
            {/* <p className="chakra-petch mt-5 border-t border-white/[0.08] pt-4 text-xs leading-relaxed text-[#888692]">
              A conceptual overview of how HANA components are intended to work
              together as the ecosystem evolves.
            </p> */}
              </aside>
            </div>
          </StaggerItem>
        </StaggerGroup>
      </div>
    </section>
  );
}
