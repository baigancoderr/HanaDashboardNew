
import roadmapVideo from "../assets/roadmap.mp4";
import { StaggerGroup, StaggerItem } from "./Motion";

const stages = [
  {
    number: "01",
    title: "Foundation",
    description: [
      "Project architecture",
      "Token infrastructure",
      "Smart-contract framework",
    ],
  },
  {
    number: "02",
    title: "Protocol Launch",
    description: [
      "HANA Token",
      "Staking infrastructure",
      "Liquidity framework",
    ],
  },
  {
    number: "03",
    title: "Stability Layer",
    description: [
      "DSE development",
      "Proof of Reserve",
      "Proof of Burn",
      "Buyback & burn mechanisms",
    ],
  },
  {
    number: "04",
    title: "DAO Expansion",
    description: [
      "DAO membership",
      "Partner program",
      "Governance development",
    ],
  },
  {
    number: "05",
    title: "HANA Wallet",
    description: [
      "HANA Wallet Development",
      "Wallet Integration & Management",
      "Transaction Handling",
    ],
  },
    {
    number: "06",
    title: "Gaming Ecosystem",
    description: [
      "Gaming development",
      "HANA utility integration",
      "Testing and ecosystem expansion",
    ],
  },

    {
    number: "07",
    title: "Blockchain Development ",
    description: [
      "Smart Contract Integration",
      "Blockchain Network Integration",
      "Security Testing & Validation",
    ],
  },

  {
    number: "08",
    title: "Ecosystem Growth",
    description: [
      "Expanded token utility",
      "Strategic partnerships",
      "Global community development",
    ],
  },
];

function CircuitBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 970 782"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="#0B2850"
        strokeWidth="2"
        opacity=".78"
      >
        <path d="M236 0 V346 L144 438 V782" />
        <path d="M568 0 V163 H789 V70 L858 0" />
        <path d="M328 782 V254 L420 163 H697 V622 L605 714 H420 V782" />
        <path d="M384 782 V733 L383 733" />
        <path d="M697 163 V401 L605 493 H346 L254 401 H70" />
        <path d="M697 401 H881" />
        <path d="M605 401 V163" />
        <path d="M420 714 H605" />
        <path d="M144 782 V438" />
        <path d="M259 782 L328 714" />
      </g>

      <g stroke="#16436A" strokeWidth="2" opacity=".9">
        <path d="M70 401 H254 L346 493 H605 L697 401 H881" />
        <path d="M328 254 V714" />
        <path d="M384 733 V782" />
        <path d="M420 714 V782" />
        <path d="M697 163 V438" />
      </g>

      <g
        fill="#030609"
        stroke="#20BCEB"
        strokeWidth="2.8"
      >
        {[
          [70, 401],
          [328, 254],
          [328, 714],
          [383, 733],
          [420, 714],
          [605, 714],
          [697, 438],
          [881, 401],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.8" />
        ))}
      </g>

      <g
        fill="#030609"
        stroke="#16436A"
        strokeWidth="2"
      >
        {[
          [254, 401],
          [346, 493],
          [605, 493],
          [697, 401],
          [605, 163],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.7" />
        ))}
      </g>
    </svg>
  );
}

export default function Roadmap() {
  return (
    <section id="roadmap" className="relative mx-auto max-w-[1600px] mb-1  md:mb-10  px-5 lg:px-10 isolate min-h-screen overflow-clip text-[#e8f0fb]">
      <video
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-100"
        src={roadmapVideo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

    

      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/25" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 md:grid-cols-[40%_60%]">
        {/* LEFT — 35% */}
        <StaggerGroup as="header" className="flex flex-col items-start px-1 pb-4 md:pb-10 pt-8 sm:px-1 sm:pt-10 md:sticky md:top-[14vh] md:self-start md:px-3 md:pt-5 lg:px-5">
              <div className="mb-5">
            <StaggerItem as="span" className="inline-flex items-center bg-gradient-to-r from-[#F8E096] to-[#FFB01B] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-black [clip-path:polygon(0_0,100%_0,100%_75%,88%_100%,0_100%)]">
              Roadmap
            </StaggerItem>
          </div>

          <StaggerItem as="h1" className="mt-2 md:mt-8 max-w-[450px] unbounded text-[20px] sm:text-[30px] md:text-[40px] xl:text-[55px] font-extrabold leading-[1.2] tracking-normal">
            The vision,
         
            unfolding.
          </StaggerItem>

          <StaggerItem as="p" className="mt-2 md:mt-5 chakra-petch max-w-[500px] text-[15px] leading-[1.4] md:leading-[1.65] text-[#aaa8bc] md:text-[16px] lg:text-[18px]">
            A sequence of intended stages. A direction for the ecosystem, not a
            statement of completion or a commitment to dates.
          </StaggerItem>

          <StaggerItem as="p" className="mt-4 text-[12px] chakra-petch font-medium uppercase tracking-[0.015em] text-[#E7AD38]">
            Intentions / subject to review
          </StaggerItem>
        </StaggerGroup>

        <div className="min-w-0 px-1 pb-1 md:hidden">
          <StaggerGroup as="ol" aria-label="Roadmap stages">
            {stages.map((stage, index) => (
              <StaggerItem
                as="li"
                key={stage.number}
                className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 py-3"
              >
                <div className="relative flex justify-center self-stretch">
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#E7AD38]/50 bg-[#050505] chakra-petch text-xs font-semibold text-[#FFD36A]">
                    {stage.number}
                  </span>
                  {index < stages.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-[-24px] left-1/2 top-8 w-px -translate-x-1/2 bg-gradient-to-b from-[#E7AD38]/70 to-[#1B5D9A]/40"
                    />
                  )}
                </div>

                <div
                  className={`min-w-0 pb-4 ${
                    index < stages.length - 1 ? "border-b border-white/10" : ""
                  }`}
                >
                  <p className="chakra-petch text-[10px] font-semibold uppercase tracking-[0.18em] text-[#DFA52E]">
                    Stage {stage.number}
                  </p>
                  <h2 className="unbounded mt-1 text-base font-semibold leading-tight text-[#F3F3F3]">
                    {stage.title}
                  </h2>
                  <ul className="chakra-petch mt-2 space-y-1 text-sm leading-relaxed text-[#AAA7B8]">
                    {stage.description.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-[0.65em] h-1 w-1 shrink-0 rounded-full bg-[#E7AD38]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>

        {/* RIGHT — 65% */}
        <div className="relative hidden pb-12 pr-1 sm:pr-10 md:block md:px-0 md:pb-10">
          {/* Timeline spine */}
          <div className="absolute bottom-12 left-[27px] top-0 w-px bg-gradient-to-b from-[#8b6a13] via-[#6d5213] to-[#8b6a13] md:bottom-12 md:left-[5.2%] md:top-[9.2%]" />

          <StaggerGroup className="relative md:pt-[9.2%]">
            {stages.map((stage, index) => (
              <StaggerItem
                as="article"
                key={stage.number}
                className="group relative grid grid-cols-[84px_minmax(0,1fr)] gap-x-3 pt-4 sm:grid-cols-[94px_minmax(0,1fr)] md:sticky md:top-[10px] md:ml-[calc(5.2%+14px)] md:grid-cols-[108px_minmax(0,1fr)] md:gap-x-3 md:bg-[#050505]/95 md:pt-[clamp(17px,2vw,29px)] md:shadow-[0_-12px_24px_#00000066]"
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                style={{
                  zIndex: index + 1,
                }}
              >
                {/* Stage number */}
                <div className="relative flex h-[46px] items-center sm:h-[52px] md:h-[60px]">
                  {/* Timeline node */}
                  <span className="absolute -left-[18.5px] top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full bg-[#ffc44a] shadow-[0_0_9px_#ffbd3c55]" />
                  <svg
                    className="h-[46px] w-[84px] sm:h-[52px] sm:w-[94px] md:h-[60px] md:w-[108px]"
                    viewBox="0 0 110 60"
                    role="img"
                    aria-label={`Stage ${stage.number}`}
                  >
                    <defs>
                      <linearGradient
                        id={`roadmap-number-gradient-${stage.number}`}
                        x1="0"
                        y1="0"
                        x2="110"
                        y2="0"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#8F5B12" />
                        <stop offset=".25" stopColor="#DFA52E" />
                        <stop offset=".48" stopColor="#FFF1A8" />
                        <stop offset=".68" stopColor="#E7AD38" />
                        <stop offset="1" stopColor="#9D6415" />
                      </linearGradient>
                    </defs>
                    <text
                      x="1"
                      y="47"
                      fill="none"
                      stroke={`url(#roadmap-number-gradient-${stage.number})`}
                      strokeWidth="1.2"
                      fontFamily="Unbounded, sans-serif"
                      fontSize="48"
                      fontWeight="300"
                      letterSpacing="-2"
                    >
                      {stage.number}
                    </text>
                  </svg>
                </div>

                {/* Stage details */}
                <div className="min-w-0 max-w-[85%] border-b border-transparent pb-4 [border-image-source:linear-gradient(90deg,#8F5B12_0%,#DFA52E_25%,#FFF1A8_48%,#E7AD38_68%,#9D6415_100%)] [border-image-slice:1] md:pb-[clamp(17px,2vw,29px)]">
                  <h2 className="text-[16px] unbounded font-bold leading-tight tracking-[-0.035em] text-[#e8f0fb] transition-colors duration-300 group-hover:text-[#FFD36A] md:text-[18px] lg:text-[24px]">
                    {stage.title}
                  </h2>

                  <ul className="mt-2 max-w-[520px] chakra-petch space-y-1 text-[14px] leading-[1.5] sm:text-[15px] lg:text-[18px]">
                    {stage.description.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}
