
import { motion } from 'framer-motion';
import { fadeUp } from './animations';
import { Shield, ChevronDown } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-8 md:px-28 font-sans bg-black text-white">
      {/* Background video */}
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover grayscale brightness-[0.25]">
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_120549_0cd82c36-56b3-4dd9-b190-069cfc3a623f.mp4" type="video/mp4" />
        </video>
        <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/50 to-transparent" />
      </div>

      {/* Radial glow */}
      <div className="absolute inset-0 z-[1]">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/[0.04] rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center max-w-7xl w-full gap-16 lg:gap-20 pt-20">
        {/* Left side – text */}
        <div className="flex-1 pt-12 md:pt-16">
          <motion.div {...fadeUp(0)} className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-400 text-xs font-medium">1,200+ attacks simulated today</span>
            </div>
          </motion.div>

          <motion.h1 {...fadeUp(0.15)} className="text-5xl md:text-7xl lg:text-[5.5rem] font-medium tracking-[-3px] mb-8 leading-[1.05]">
            Simulate.{' '}
            <span className="font-serif italic font-normal bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Defend.</span>
            <br />Secure.
          </motion.h1>

          <motion.p {...fadeUp(0.3)} className="text-lg md:text-xl text-zinc-400 max-w-lg mb-12 font-light leading-relaxed">
            The AI‑Powered Cyber Defense Twin lets you safely simulate realistic cyber attacks against a digital replica of your infrastructure and automatically generate verifiable patches.
          </motion.p>

          <motion.div {...fadeUp(0.45)} className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white text-black font-semibold rounded-full px-8 py-3.5 text-sm tracking-wide w-full sm:w-auto hover:shadow-lg hover:shadow-white/10 transition-shadow"
            >
              Connect Repository
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="ml-liquid-glass text-white/80 font-medium rounded-full px-8 py-3.5 text-sm tracking-wide w-full sm:w-auto hover:text-white transition-colors border border-white/10"
            >
              Watch Demo
            </motion.button>
          </motion.div>
        </div>

        {/* Right side – animated shield visual */}
        <motion.div
          className="flex-1 hidden lg:flex items-center justify-center relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        >
          <div className="relative w-[400px] h-[400px] flex items-center justify-center">
            {/* Orbit rings */}
            <div className="absolute inset-0 rounded-full border border-white/[0.06] animate-orbit" />
            <div className="absolute inset-6 rounded-full border border-white/[0.08]" style={{ animation: 'orbit 15s linear infinite reverse' }} />
            <div className="absolute inset-16 rounded-full border border-dashed border-white/[0.06] animate-orbit" style={{ animationDuration: '25s' }} />

            {/* Orbiting dots */}
            <div className="absolute inset-0 animate-orbit">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-blue-400/80 shadow-lg shadow-blue-400/50" />
            </div>
            <div className="absolute inset-6" style={{ animation: 'orbit 15s linear infinite reverse' }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400/80 shadow-lg shadow-emerald-400/50" />
            </div>
            <div className="absolute inset-0 animate-orbit" style={{ animationDuration: '25s' }}>
              <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400/80 shadow-lg shadow-amber-400/50" />
            </div>

            {/* Central shield */}
            <div className="relative z-10 w-28 h-28 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center backdrop-blur-sm animate-float">
              <Shield size={42} className="text-white/70" strokeWidth={1} />
              <div className="absolute inset-0 rounded-2xl bg-blue-500/[0.08] blur-xl" />
            </div>

            {/* Status cards floating around */}
            <motion.div
              className="absolute -top-2 -right-4 px-3 py-2 rounded-lg bg-zinc-900/80 border border-white/10 backdrop-blur-sm"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-zinc-300 font-medium">0 Critical</span>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-8 px-3 py-2 rounded-lg bg-zinc-900/80 border border-white/10 backdrop-blur-sm"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-[11px] text-zinc-300 font-medium">47 Paths Mapped</span>
              </div>
            </motion.div>

            <motion.div
              className="absolute top-1/2 -left-16 px-3 py-2 rounded-lg bg-zinc-900/80 border border-white/10 backdrop-blur-sm"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[11px] text-zinc-300 font-medium">3 Patches Ready</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 scroll-indicator z-10">
        <ChevronDown className="text-white/30 w-5 h-5" />
      </div>
    </section>
  );
};
