"use client";

import { cn } from "../../utils/cn";
import { Globe, Brain, BarChart3, Code2 } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { fadeUp } from "./animations";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <Globe className="size-4 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  titleClassName = "text-white",
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl glass-panel px-5 py-4 transition-all duration-700 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-slate-950 after:to-transparent after:content-[''] [&>*]:flex [&>*]:items-center [&>*]:gap-2 text-white",
        className
      )}
    >
      <div>
        <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-lg glass-pill">
          {icon}
        </span>
        <p className={cn("text-base font-semibold", titleClassName)}>{title}</p>
      </div>
      <p className="text-sm text-slate-400 whitespace-normal line-clamp-2 leading-relaxed">{description}</p>
    </div>
  );
}

export function FeatureCards() {
  const features = [
    {
      title: "Digital Twin Engine",
      description: "Full replica of your infrastructure — test attacks without touching production.",
      icon: <Globe className="size-3.5 text-cyan-400" />
    },
    {
      title: "Multi-Agent AI",
      description: "Red & Blue team agents that think like real attackers and defenders.",
      icon: <Brain className="size-3.5 text-violet-400" />
    },
    {
      title: "Real-time Dashboard",
      description: "Live attack path visualization and risk scoring across your stack.",
      icon: <BarChart3 className="size-3.5 text-emerald-400" />
    },
    {
      title: "API-First Platform",
      description: "Integrate SentinelAI into your CI/CD pipelines and DevSecOps workflow.",
      icon: <Code2 className="size-3.5 text-amber-400" />
    }
  ];

  const defaultStyles = [
    {
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-zinc-800 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-black/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-zinc-800 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-black/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-zinc-800 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-black/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-36 translate-y-30 hover:translate-y-20",
    },
  ];

  const displayCards = features.map((feature, i) => ({
    ...feature,
    className: defaultStyles[i].className
  }));

  return (
    <section className="py-24 md:py-32 border-t border-slate-900 px-8 md:px-28 bg-[#05070a] font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
        {/* Text Content */}
        <div className="flex-1 w-full text-left">
          <motion.span {...fadeUp(0)} className="text-xs tracking-[3px] uppercase text-slate-500 block mb-6">
            COMPREHENSIVE COVERAGE
          </motion.span>
          <motion.h2 {...fadeUp(0.1)} className="text-4xl md:text-5xl lg:text-6xl font-medium mb-8 leading-tight text-white tracking-[-1px]">
            Every layer of your{' '}
            <span className="font-serif italic font-normal bg-gradient-to-r from-zinc-400 to-zinc-600 bg-clip-text text-transparent">
              infrastructure
            </span>
            , secured.
          </motion.h2>
          <motion.p {...fadeUp(0.2)} className="text-lg text-slate-400 mb-10 max-w-xl leading-relaxed">
            From the core network to the application edge, SentinelAI provides a unified defense matrix that continuously simulates attacks, discovers vulnerabilities, and remediates them automatically.
          </motion.p>
          <motion.button
            {...fadeUp(0.3)}
            className="bg-blue-600 text-white font-semibold rounded-full px-8 py-3.5 text-sm tracking-wide hover:shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-[1.03]"
          >
            Explore Capabilities
          </motion.button>
        </div>

        {/* 3D Cards */}
        <motion.div {...fadeUp(0.4)} className="flex-1 w-full relative h-[400px] flex items-center justify-center">
          <div className="grid [grid-template-areas:'stack'] place-items-center max-w-lg mx-auto py-10 lg:pr-36 scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100">
            {displayCards.map((cardProps, index) => (
              <DisplayCard key={index} {...cardProps} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
