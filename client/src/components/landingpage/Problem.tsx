
import { motion } from 'framer-motion';
import { fadeUp } from './animations';
import { Activity, ShieldAlert, Cpu } from 'lucide-react';

export const Problem = () => {
  const problems = [
    {
      num: "01",
      name: "Overwhelming Alerts",
      icon: Activity,
      desc: "Thousands of vulnerabilities, no context on what actually matters to your business.",
      color: "from-red-500/10 to-transparent",
      iconColor: "text-red-400",
      glowColor: "group-hover:shadow-red-500/10"
    },
    {
      num: "02",
      name: "Static Vulnerability Scans",
      icon: ShieldAlert,
      desc: "Scanners tell you what's broken, but not how an attacker will chain exploits together.",
      color: "from-amber-500/10 to-transparent",
      iconColor: "text-amber-400",
      glowColor: "group-hover:shadow-amber-500/10"
    },
    {
      num: "03",
      name: "Dangerous Patch Testing",
      icon: Cpu,
      desc: "Testing patches directly in production leads to downtime and operational friction.",
      color: "from-blue-500/10 to-transparent",
      iconColor: "text-blue-400",
      glowColor: "group-hover:shadow-blue-500/10"
    }
  ];

  return (
    <section className="py-32 md:py-44 px-8 md:px-28 bg-black font-sans">
      <motion.div {...fadeUp(0)} className="text-center mb-24">
        <span className="text-xs tracking-[3px] uppercase text-zinc-500 block mb-6">THE PROBLEM</span>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-[-1px] mb-8 text-white">
          Cybersecurity has <span className="font-serif italic font-normal">evolved.</span> Have you?
        </h2>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
          The way we secure infrastructure is broken. It's no longer just about listing vulnerabilities, but understanding the actual attack paths that put your organization at risk.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-20 max-w-5xl mx-auto">
        {problems.map((prob, i) => {
          const Icon = prob.icon;
          return (
            <motion.div
              key={i}
              {...fadeUp(0.1 + i * 0.1)}
              className={`group gradient-border bento-glow p-8 rounded-2xl cursor-default transition-all duration-500 hover:shadow-2xl ${prob.glowColor}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${prob.color} flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110`}>
                <Icon size={22} strokeWidth={1.5} className={`${prob.iconColor} transition-colors`} />
              </div>
              <span className="text-zinc-600 text-xs font-mono tracking-wider block mb-3">{prob.num}</span>
              <h3 className="font-semibold text-lg mb-3 text-white">{prob.name}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{prob.desc}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.p {...fadeUp(0.4)} className="text-zinc-600 text-sm text-center tracking-[2px] uppercase">
        If you don't find the attack paths, the adversaries will.
      </motion.p>
    </section>
  );
};
