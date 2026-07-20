import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from './animations';
import { Shield, ArrowRight } from 'lucide-react';
import Hls from 'hls.js';

export const CTA = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const hlsUrl = "https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8";
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
    }
  }, []);

  return (
    <section className="relative py-32 md:py-44 border-t border-zinc-900 overflow-hidden min-h-[650px] flex items-center justify-center text-center font-sans">
      <video ref={videoRef} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0 grayscale brightness-[0.15]" />
      <div className="absolute inset-0 bg-black/50 z-[1]" />

      {/* Top gradient border shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-[2]" />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/[0.04] rounded-full blur-[100px] z-[1] animate-pulse-glow" />

      <div className="relative z-10 px-8 flex flex-col items-center max-w-3xl">
        <motion.div {...fadeUp(0)} className="relative w-16 h-16 flex items-center justify-center mb-10">
          <div className="absolute inset-0 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm" />
          <Shield className="w-7 h-7 text-white/70 relative z-10" strokeWidth={1.5} />
          <div className="absolute inset-0 rounded-2xl border border-white/20 animate-ping opacity-10" />
        </motion.div>

        <motion.h2 {...fadeUp(0.1)} className="text-5xl md:text-7xl font-medium mb-6 text-white tracking-[-2px]">
          Start Your <span className="font-serif italic font-normal">Simulation</span>
        </motion.h2>

        <motion.p {...fadeUp(0.2)} className="text-zinc-400 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
          Connect your GitHub repository and let SentinelAI mathematically prove your security posture.
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white text-black font-semibold rounded-full px-10 py-4 text-sm tracking-wide hover:shadow-lg hover:shadow-white/20 transition-all flex items-center gap-2 group"
          >
            Connect GitHub
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="border border-white/10 text-white/70 hover:text-white font-medium rounded-full px-10 py-4 text-sm tracking-wide hover:bg-white/[0.04] transition-all"
          >
            Read the Docs
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};
