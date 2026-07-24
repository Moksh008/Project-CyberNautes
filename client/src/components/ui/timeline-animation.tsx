import React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimelineContentProps {
  children?: React.ReactNode;
  animationNum?: number;
  timelineRef?: React.RefObject<HTMLDivElement | null>;
  customVariants?: Variants;
  className?: string;
  as?: "div" | "p" | "article" | "section" | "h2" | "h3" | "span";
}

export function TimelineContent({
  children,
  animationNum = 0,
  customVariants,
  className,
  as = "div",
}: TimelineContentProps) {
  const Component = motion[as as keyof typeof motion] as any;

  const defaultVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.5 },
    }),
  };

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      custom={animationNum}
      variants={customVariants || defaultVariants}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}
