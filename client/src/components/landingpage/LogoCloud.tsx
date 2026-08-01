
import { motion } from 'framer-motion';
import { fadeUp } from './animations';

const logos = [
  "Cloudflare", "Stripe", "Vercel", "Datadog", "Palo Alto",
  "CrowdStrike", "Snyk", "HashiCorp", "Supabase", "MongoDB"
];

export const LogoCloud = () => {
  return (
    <section className="py-16 border-t border-slate-900 bg-[#05070a] font-sans overflow-hidden">
      <motion.p {...fadeUp(0)} className="text-center text-xs tracking-[3px] uppercase text-slate-500 mb-10">
        Trusted by security teams at
      </motion.p>

      <div className="relative w-full">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />

        {/* Marquee */}
        <div className="flex animate-marquee whitespace-nowrap">
          {[...logos, ...logos].map((name, i) => (
            <div key={i} className="flex items-center mx-10">
              <span className="text-slate-500 text-lg font-semibold tracking-tight select-none">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
