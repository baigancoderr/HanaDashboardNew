
import React from "react";
import hanaWallet from "../assets/ecosystem/eco22.png";
import hanaGaming from "../assets/ecosystem/eco11.png";

const features = [
  {
    id: 1,
    title: "Hana AI Wallet",
    description:
      "A proposed wallet initiative exploring AI-assisted digitalasset management. Final features, security architectureand availability remain to be confirmed by DAO Members.",
    image: hanaWallet,
    imageAlt: "Hana AI Wallet",
    imageClass: "max-w-[530px]",
  },
  {
    id: 2,
    title: "Hana Gaming",
    description:
      "More than a token. A growing gaming community. A DAOvoted gaming initiative intended to bring interactive digital experiences into the HANA ecosystem, and a utility designed to help the token reach new heights. Game features, launch timing and rewards will be announced once finalized by DAO Members.",
    image: hanaGaming,
    imageAlt: "Hana Gaming",
    imageClass: "max-w-[580px]",
  },
];

const HanaFeatures = () => {
  return (
    <section className="w-full overflow-hidden bg-[#050309] px-5 py-4 sm:px-8 md:px-10 lg:px-12 lg:py-6">
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-10 md:gap-y-7">

        {features.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-1 items-center gap-5 sm:gap-6 md:grid-cols-2 md:gap-5"
          >
            {/* Content */}
            <div
              className={`order-1 min-w-0 border-t-2 border-solid pt-3 md:pt-6 ${
                index === 0
                  ? "md:col-start-1 md:row-start-1"
                  : "md:col-start-2 md:row-start-1"
              }`}
              style={{
                borderImage:
                  "linear-gradient(90deg, #8F5B12 0%, #DFA52E 25%, #FFF1A8 48%, #E7AD38 68%, #9D6415 100%) 1",
              }}
            >
              <h2
                className="mb-2 text-[22px] font-bold leading-tight md:text-2xl lg:text-[26px]"
                style={{
                  background:
                    "linear-gradient(90deg, #F8E096 0%, #FFB01B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {item.title}
              </h2>

              <p className="text-justify max-w-[630px] text-[16px] font-normal leading-[1.5] md:leading-[1.6] text-[#B7AFC8] md:text-[18px]">
                {item.description}
              </p>
            </div>

            {/* Image */}
            <div
              className={`order-2 flex w-full items-center justify-center ${
                index === 0
                  ? "md:col-start-2 md:row-start-1"
                  : "md:col-start-1 md:row-start-1"
              }`}
            >
              <img
                src={item.image}
                alt={item.imageAlt}
                loading="lazy"
                className={`h-auto w-full ${item.imageClass} object-contain`}
              />
            </div>
          </div>
        ))}

      </div>
    </section>
  );
};

export default HanaFeatures;
