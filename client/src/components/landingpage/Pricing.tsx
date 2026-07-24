"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles as SparklesComp } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

const plans = [
  {
    name: "Student",
    description:
      "Affordable access for cybersecurity students, CTF players, and independent researchers",
    price: 499,
    yearlyPrice: 399,
    buttonText: "Verify Student ID",
    buttonVariant: "outline" as const,
    includes: [
      "Student includes:",
      "1 Monitored Infrastructure Target",
      "Basic Attack Surface Graphing",
      "Community Support & Hack-The-Box Labs",
      "Live NVD Vulnerability Lookup",
      "POSIX Patch Script Export",
    ],
  },
  {
    name: "Starter",
    description:
      "Great for small dev teams and bootstrapped Indian startups getting started with AI defense",
    price: 1999,
    yearlyPrice: 1599,
    buttonText: "Get started",
    buttonVariant: "outline" as const,
    includes: [
      "Starter includes:",
      "Up to 5 Infrastructure Assets",
      "Automated Attack Surface Graph",
      "NIST NVD & MITRE ATT&CK Mapping",
      "Bash & Git Diff Remediation Patching",
      "Standard Email Support",
    ],
  },
  {
    name: "Business",
    description:
      "Best value for growing tech startups, D2C brands, and SaaS teams with active cloud setups",
    price: 14999,
    yearlyPrice: 11999,
    buttonText: "Get started",
    buttonVariant: "default" as const,
    popular: true,
    includes: [
      "Everything in Starter, plus:",
      "Up to 25 Infrastructure Assets / Cloud Repos",
      "Ephemeral Red-Team Sandbox Exploit Detonation",
      "Multi-Agent AI Offense/Defense Engine",
      "DPDP Act 2023 & CERT-In Audit Reports",
      "Priority AI Remediation Analysis",
    ],
  },
  {
    name: "Enterprise",
    description:
      "Advanced plan with enhanced security, custom SLAs, and air-gapped options for BFSI & large teams",
    price: 39999,
    yearlyPrice: 31999,
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
    includes: [
      "Everything in Business, plus:",
      "Unlimited Monitored Assets & Clusters",
      "On-Premise / Air-Gapped Neo4j & Local LLMs",
      "Dedicated SOC Engineer & 24/7 Monitoring",
      "Custom Security Policy Engine & SLAs",
      "Multi-Tenant Partner & MSSP Access",
    ],
  },
];

const PricingSwitch = ({ onSwitch }: { onSwitch: (value: string) => void }) => {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value: string) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className="flex justify-center">
      <div className="relative z-10 mx-auto flex w-fit rounded-full bg-neutral-900 border border-gray-700 p-1">
        <button
          onClick={() => handleSwitch("0")}
          className={cn(
            "relative z-10 w-fit h-10 rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors cursor-pointer",
            selected === "0" ? "text-white" : "text-gray-200",
          )}
        >
          {selected === "0" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0 h-10 w-full rounded-full border-4 shadow-sm shadow-blue-600 border-blue-600 bg-gradient-to-t from-blue-500 to-blue-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Monthly</span>
        </button>

        <button
          onClick={() => handleSwitch("1")}
          className={cn(
            "relative z-10 w-fit h-10 flex-shrink-0 rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors cursor-pointer",
            selected === "1" ? "text-white" : "text-gray-200",
          )}
        >
          {selected === "1" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0 h-10 w-full rounded-full border-4 shadow-sm shadow-blue-600 border-blue-600 bg-gradient-to-t from-blue-500 to-blue-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">Yearly (Save 20%)</span>
        </button>
      </div>
    </div>
  );
};

export default function PricingSection6() {
  const [isYearly, setIsYearly] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.2,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  const togglePricingPeriod = (value: string) =>
    setIsYearly(Number.parseInt(value) === 1);

  return (
    <div
      id="pricing"
      className="min-h-screen mx-auto relative bg-black overflow-x-hidden py-12"
      ref={pricingRef}
    >
      <TimelineContent
        animationNum={4}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute top-0 h-96 w-screen overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)] "
      >
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#ffffff2c_1px,transparent_1px),linear-gradient(to_bottom,#3a3a3a01_1px,transparent_1px)] bg-[size:70px_80px] "></div>
        <SparklesComp
          density={1800}
          direction="bottom"
          speed={1}
          color="#FFFFFF"
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </TimelineContent>
      <TimelineContent
        animationNum={5}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute left-0 top-[-114px] w-full h-[113.625vh] flex flex-col items-start justify-start content-start flex-none flex-nowrap gap-2.5 overflow-hidden p-0 z-0"
      >
        <div className="framer-1i5axl2">
          <div
            className="absolute left-[-568px] right-[-568px] top-0 h-[2053px] flex-none rounded-full pointer-events-none"
            style={{
              border: "200px solid #3131f5",
              filter: "blur(92px)",
              WebkitFilter: "blur(92px)",
            }}
            data-border="true"
            data-framer-name="Ellipse 1"
          ></div>
          <div
            className="absolute left-[-568px] right-[-568px] top-0 h-[2053px] flex-none rounded-full pointer-events-none"
            style={{
              border: "200px solid #3131f5",
              filter: "blur(92px)",
              WebkitFilter: "blur(92px)",
            }}
            data-border="true"
            data-framer-name="Ellipse 2"
          ></div>
        </div>
      </TimelineContent>

      <article className="text-center mb-6 pt-24 max-w-3xl mx-auto space-y-2 relative z-50 px-4">
        <h2 className="text-4xl md:text-5xl font-medium text-white">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.15}
            staggerFrom="first"
            reverse={true}
            containerClassName="justify-center"
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 40,
              delay: 0,
            }}
          >
            Flexible Plans for India's Security Leaders
          </VerticalCutReveal>
        </h2>

        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="text-gray-300 text-base"
        >
          From students & researchers to growing startups and enterprise BFSI teams.
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={1}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="pt-4"
        >
          <PricingSwitch onSwitch={togglePricingPeriod} />
        </TimelineContent>
      </article>

      <div
        className="absolute top-0 left-[10%] right-[10%] w-[80%] h-full z-0 pointer-events-none"
        style={{
          backgroundImage: `
        radial-gradient(circle at center, #206ce8 0%, transparent 70%)
      `,
          opacity: 0.6,
          mixBlendMode: "multiply",
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl gap-5 py-6 mx-auto relative z-10 px-4">
        {plans.map((plan, index) => (
          <TimelineContent
            key={plan.name}
            as="div"
            animationNum={2 + index}
            timelineRef={pricingRef}
            customVariants={revealVariants}
          >
            <Card
              className={`relative h-full flex flex-col justify-between text-white border-neutral-800 transition-all duration-300 hover:border-neutral-700 ${
                plan.popular
                  ? "bg-gradient-to-b from-blue-950/40 via-neutral-900 to-neutral-900 border-blue-500/50 shadow-[0px_0px_30px_0px_rgba(49,49,245,0.3)] z-20"
                  : "bg-gradient-to-b from-neutral-900/90 to-neutral-950 z-10"
              }`}
            >
              <div>
                <CardHeader className="text-left">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-2xl font-semibold tracking-tight">{plan.name}</h3>
                    {plan.popular && (
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline my-3">
                    <span className="text-3xl md:text-4xl font-bold flex items-center tracking-tight">
                      ₹
                      <NumberFlow
                        format={{
                          notation: "standard",
                          useGrouping: true,
                        }}
                        value={isYearly ? plan.yearlyPrice : plan.price}
                        className="text-3xl md:text-4xl font-bold inline-block ml-0.5"
                      />
                    </span>
                    <span className="text-gray-400 text-sm ml-1 font-normal">
                      /mo
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 min-h-[36px] leading-relaxed">{plan.description}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  <button
                    className={`w-full mb-6 py-3 px-4 text-sm font-semibold rounded-xl cursor-pointer transition-all ${
                      plan.popular
                        ? "bg-gradient-to-t from-blue-600 to-blue-500 shadow-lg shadow-blue-900/50 border border-blue-400 text-white hover:brightness-110"
                        : plan.buttonVariant === "outline"
                          ? "bg-neutral-900/80 hover:bg-neutral-800 shadow-md border border-neutral-700 text-white"
                          : ""
                    }`}
                  >
                    {plan.buttonText}
                  </button>

                  <div className="space-y-3 pt-4 border-t border-neutral-800">
                    <h4 className="font-medium text-xs text-gray-400 uppercase tracking-wider mb-2">
                      {plan.includes[0]}
                    </h4>
                    <ul className="space-y-2.5">
                      {plan.includes.slice(1).map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start gap-2 text-left"
                        >
                          <span className="h-1.5 w-1.5 mt-1.5 bg-blue-500 rounded-full shrink-0"></span>
                          <span className="text-xs text-gray-300 leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </div>
            </Card>
          </TimelineContent>
        ))}
      </div>
    </div>
  );
}
export { PricingSection6 as Pricing };
