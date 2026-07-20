
import { motion } from 'framer-motion';
import { fadeUp } from './animations';
import { Network, Crosshair, Box, Wrench, ArrowRight } from 'lucide-react';

export const Features = () => {
  const features = [
    {
      title: "Neo4j Knowledge Graph",
      desc: "Maps your entire infrastructure into a mathematical model, calculating the most critical attack paths with graph algorithms.",
      icon: Network,
      color: "text-blue-400",
      bgColor: "from-blue-500/10 to-transparent",
      span: "md:col-span-2 md:row-span-1"
    },
    {
      title: "Advanced Red Team AI",
      desc: "Multi-agent system using Metasploit, Scapy, and ZAP to actively simulate real-world attacks against your Digital Twin.",
      icon: Crosshair,
      color: "text-red-400",
      bgColor: "from-red-500/10 to-transparent",
      span: "md:col-span-1 md:row-span-2"
    },
    {
      title: "Micro-Sandbox Verification",
      desc: "Ephemeral, lightweight Docker containers to safely detonate exploits without risking production systems.",
      icon: Box,
      color: "text-emerald-400",
      bgColor: "from-emerald-500/10 to-transparent",
      span: "md:col-span-1 md:row-span-1"
    },
    {
      title: "Auto-Remediation Engine",
      desc: "The Blue Team AI generates the actual Git diffs, Bash scripts, and configuration files to fix every discovered vulnerability.",
      icon: Wrench,
      color: "text-amber-400",
      bgColor: "from-amber-500/10 to-transparent",
      span: "md:col-span-1 md:row-span-1"
    }
  ];

  return (
    <section className="py-32 md:py-44 border-t border-zinc-900 px-8 md:px-28 bg-black font-sans">
      <div className="max-w-6xl mx-auto">
        <motion.span {...fadeUp(0)} className="text-xs tracking-[3px] uppercase text-zinc-500 block mb-6">THE SOLUTION</motion.span>
        <motion.h2 {...fadeUp(0.1)} className="text-4xl md:text-6xl font-medium mb-6 leading-tight text-white tracking-[-1px]">
          The platform for <span className="font-serif italic font-normal">proactive</span> resilience
        </motion.h2>
        <motion.p {...fadeUp(0.15)} className="text-zinc-400 text-lg mb-16 max-w-2xl leading-relaxed">
          Four pillars working in concert to transform your security posture from reactive scanning to mathematically proven defense.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-4 auto-rows-[220px]">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                {...fadeUp(0.2 + i * 0.08)}
                className={`${feature.span} group gradient-border bento-glow rounded-2xl p-7 flex flex-col justify-between cursor-default transition-all duration-500 hover:shadow-2xl overflow-hidden relative`}
              >
                {/* Subtle gradient background */}
                <div className={`absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl ${feature.bgColor} rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110">
                    <Icon size={20} strokeWidth={1.5} className={`${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-white">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>

                <div className="relative z-10 flex items-center gap-1.5 text-zinc-500 group-hover:text-white text-xs font-medium transition-colors mt-auto pt-4">
                  <span>Learn more</span>
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
