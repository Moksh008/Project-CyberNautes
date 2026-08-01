import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const Word = ({ word, range, scrollYProgress, isHighlighted }: { word: string, range: [number, number], scrollYProgress: any, isHighlighted?: boolean }) => {
  const opacity = useTransform(scrollYProgress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className={isHighlighted ? "text-white" : "text-slate-500"}>
      {word}{" "}
    </motion.span>
  );
};

export const Mission = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"]
  });

  const words1 = "We're building a space where defense meets intelligence — where analysts find clarity, executives find confidence, and every vulnerability scan becomes an actionable strategy.".split(" ");
  const words2 = "A platform where knowledge graphs, multi-agent AI, and active sandboxes flow together — with less noise, less friction, and mathematically proven security for your infrastructure.".split(" ");
  const highlightWords = ["defense", "meets", "intelligence", "mathematically", "proven", "security"];

  return (
    <section ref={targetRef} className="pt-0 pb-32 md:pb-44 px-8 md:px-28 bg-[#05070a] font-sans">
      <div className="relative w-screen left-1/2 right-1/2 -mx-[50vw] mb-32 overflow-hidden">
        <video autoPlay muted loop playsInline className="w-full h-[60vh] md:h-[70vh] object-cover grayscale brightness-75">
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_132944_a0d124bb-eaa1-4082-aa30-2310efb42b4b.mp4" type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#05070a] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#05070a] to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto space-y-20">
        <div className="text-2xl md:text-4xl lg:text-5xl font-medium tracking-[-1px] leading-tight">
          {words1.map((word, i) => (
            <Word key={i} word={word} range={[i / (words1.length + words2.length), (i + 1) / (words1.length + words2.length)]} scrollYProgress={scrollYProgress} isHighlighted={highlightWords.includes(word.toLowerCase().replace(/[—,.]/g, ''))} />
          ))}
        </div>
        <div className="text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed">
          {words2.map((word, i) => (
            <Word key={i} word={word} range={[(words1.length + i) / (words1.length + words2.length), (words1.length + i + 1) / (words1.length + words2.length)]} scrollYProgress={scrollYProgress} isHighlighted={highlightWords.includes(word.toLowerCase().replace(/[—,.]/g, ''))} />
          ))}
        </div>
      </div>
    </section>
  );
};
