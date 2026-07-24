"use client";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, Sparkles } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { Navbar1 } from "../landingpage/Navbar";
import { Footer } from "../landingpage/Footer";
import { LandingStyles } from "../landingpage/LandingStyles";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles as SparklesComp } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Student & Researcher",
    badge: "Free Forever",
    description:
      "Free access for verified students, CTF players, and independent security researchers",
    price: 0,
    yearlyPrice: 0,
    isFree: true,
    buttonText: "Verify & Access Free",
    buttonVariant: "outline" as const,
    includes: [
      "Student Free includes:",
      "1 Monitored Target Asset",
      "Basic Attack Surface Graphing",
      "Community Support & Hack-The-Box Labs",
      "Live NVD Vulnerability Lookup",
      "POSIX Patch Script Export",
      "Requires .edu or Student ID Verification",
    ],
  },
  {
    name: "Starter",
    description:
      "Great for small dev teams and bootstrapped Indian startups getting started with AI defense",
    price: 1999,
    yearlyPrice: 1599,
    buttonText: "Start 14-Day Trial",
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
    buttonText: "Get Started Now",
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
    price: 0,
    yearlyPrice: 0,
    customPrice: true,
    buttonText: "Contact Sales Team",
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

const faqs = [
  {
    q: "How do I claim the Free Student & Researcher plan?",
    a: "Simply sign up with your college/university email address (.edu or institute domain) or upload your valid student ID during verification. Student access is free forever for educational & non-commercial research use.",
  },
  {
    q: "How does SentinelAI comply with India's DPDP Act 2023 and CERT-In guidelines?",
    a: "SentinelAI generates automated compliance mapping reports that audit your attack surface against DPDP data processing requirements and CERT-In 6-hour incident reporting criteria, ensuring continuous audit readiness.",
  },
  {
    q: "Can I upgrade or downgrade my plan at any time?",
    a: "Yes! You can seamlessly upgrade, downgrade, or pause your subscription from your billing dashboard. Pro-rated adjustments are automatically calculated.",
  },
  {
    q: "Do you offer On-Premise / Air-Gapped deployments for Indian BFSI & Banks?",
    a: "Yes. Our Enterprise tier includes Helm charts and Docker compose setups for air-gapped, on-premise installation running local Neo4j instances and local LLMs to satisfy strict RBI and SEBI data localization mandates.",
  },
  {
    q: "What payment methods are supported in India?",
    a: "We support UPI (GPay, PhonePe, Paytm), Indian Debit/Credit Cards, Net Banking via Razorpay/Cashfree, and GST-compliant B2B invoices with 18% GST input credit support.",
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
            "relative z-10 w-fit h-10 rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors cursor-pointer text-sm",
            selected === "0" ? "text-white" : "text-gray-400",
          )}
        >
          {selected === "0" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0 h-10 w-full rounded-full border-4 shadow-sm shadow-blue-600 border-blue-600 bg-gradient-to-t from-blue-500 to-blue-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Monthly Billing</span>
        </button>

        <button
          onClick={() => handleSwitch("1")}
          className={cn(
            "relative z-10 w-fit h-10 flex-shrink-0 rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors cursor-pointer text-sm",
            selected === "1" ? "text-white" : "text-gray-400",
          )}
        >
          {selected === "1" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0 h-10 w-full rounded-full border-4 shadow-sm shadow-blue-600 border-blue-600 bg-gradient-to-t from-blue-500 to-blue-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            Annual Billing <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">Save 20%</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.15,
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
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <LandingStyles />
      <div className="grain-overlay" />

      {/* Navigation Bar */}
      <Navbar1 />

      <div
        id="pricing-content"
        className="min-h-screen mx-auto relative bg-black overflow-x-hidden pt-12 pb-24"
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
          className="absolute left-0 top-[-114px] w-full h-[113.625vh] flex flex-col items-start justify-start content-start flex-none flex-nowrap gap-2.5 overflow-hidden p-0 z-0 pointer-events-none"
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
          </div>
        </TimelineContent>

        {/* Hero Header */}
        <article className="text-center mb-8 pt-28 max-w-4xl mx-auto space-y-4 relative z-50 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-mono uppercase tracking-wider mb-2">
            <Sparkles size={14} className="text-blue-400" /> Transparent Pricing for Everyone
          </div>

          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-white">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.12}
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
              Plans Designed for Every Stage of Cyber Security
            </VerticalCutReveal>
          </h1>

          <TimelineContent
            as="p"
            animationNum={0}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed"
          >
            From free access for students & researchers to robust enterprise AI protection for Indian tech teams and BFSI organizations.
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

        {/* Background glow */}
        <div
          className="absolute top-0 left-[10%] right-[10%] w-[80%] h-full z-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at center, #206ce8 0%, transparent 70%)`,
            opacity: 0.4,
            mixBlendMode: "multiply",
          }}
        />

        {/* Pricing Cards Grid */}
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
                    ? "bg-gradient-to-b from-blue-950/40 via-neutral-900 to-neutral-900 border-blue-500/50 shadow-[0px_0px_35px_0px_rgba(49,49,245,0.3)] z-20"
                    : plan.isFree
                      ? "bg-gradient-to-b from-emerald-950/20 via-neutral-900 to-neutral-950 border-emerald-500/30 z-10"
                      : "bg-gradient-to-b from-neutral-900/90 to-neutral-950 z-10"
                }`}
              >
                <div>
                  <CardHeader className="text-left">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-xl md:text-2xl font-semibold tracking-tight">{plan.name}</h3>
                      {plan.popular ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                          Most Popular
                        </span>
                      ) : plan.isFree ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          {plan.badge}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-baseline my-3">
                      {plan.isFree ? (
                        <span className="text-3xl md:text-4xl font-bold text-emerald-400 tracking-tight">
                          Free
                        </span>
                      ) : plan.customPrice ? (
                        <span className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                          Custom
                        </span>
                      ) : (
                        <>
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
                          <span className="text-gray-400 text-xs ml-1.5 font-normal">
                            /month
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 min-h-[40px] leading-relaxed">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <Link
                      to="/login"
                      className={`block text-center w-full mb-6 py-3 px-4 text-xs md:text-sm font-semibold rounded-xl cursor-pointer transition-all ${
                        plan.popular
                          ? "bg-gradient-to-t from-blue-600 to-blue-500 shadow-lg shadow-blue-900/50 border border-blue-400 text-white hover:brightness-110"
                          : plan.isFree
                            ? "bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300"
                            : "bg-neutral-900 hover:bg-neutral-800 shadow-md border border-neutral-700 text-white"
                      }`}
                    >
                      {plan.buttonText}
                    </Link>

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
                            <span className={`h-1.5 w-1.5 mt-1.5 rounded-full shrink-0 ${plan.isFree ? "bg-emerald-400" : "bg-blue-500"}`}></span>
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

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto mt-24 px-4 relative z-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white tracking-tight mb-3">Frequently Asked Questions</h2>
            <p className="text-zinc-400 text-sm">Everything you need to know about SentinelAI plans & compliance in India.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-md overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left cursor-pointer hover:bg-white/[0.02]"
                  >
                    <span className="text-base font-medium text-white flex items-center gap-3">
                      <HelpCircle size={18} className="text-blue-400 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-zinc-400 transition-transform duration-300 shrink-0 ${
                        isOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-6 text-sm text-zinc-400 leading-relaxed pl-11 border-t border-white/5 pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA banner */}
        <div className="max-w-5xl mx-auto mt-24 px-4 text-center relative z-20">
          <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-neutral-900 to-purple-950/40 p-10 md:p-14 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <h3 className="text-3xl font-semibold text-white">Need a custom Security Audit or On-Premise Demo?</h3>
              <p className="text-zinc-400 text-sm max-w-xl mx-auto">
                Talk to our security architects for specialized CERT-In audit support, air-gapped deployments, or enterprise SLAs.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-black bg-white rounded-full hover:bg-white/90 transition-all shadow-lg"
                >
                  Schedule Enterprise Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default PricingPage;
