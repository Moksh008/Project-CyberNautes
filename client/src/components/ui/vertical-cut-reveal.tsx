import { motion, type Transition } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";

interface VerticalCutRevealProps {
  children: string | React.ReactNode;
  splitBy?: "words" | "characters" | "lines";
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random";
  reverse?: boolean;
  containerClassName?: string;
  textClassName?: string;
  transition?: Transition;
}

export function VerticalCutReveal({
  children,
  splitBy = "words",
  staggerDuration = 0.1,
  reverse = false,
  containerClassName,
  textClassName,
  transition = { type: "spring", stiffness: 250, damping: 40 },
}: VerticalCutRevealProps) {
  const elements =
    typeof children === "string"
      ? splitBy === "words"
        ? children.split(" ")
        : children.split("")
      : [children];

  const getDelay = (index: number, total: number) => {
    const baseDelay = (transition?.delay as number) || 0;
    if (reverse) {
      return baseDelay + (total - 1 - index) * staggerDuration;
    }
    return baseDelay + index * staggerDuration;
  };

  return (
    <span className={cn("inline-flex flex-wrap gap-x-2 overflow-hidden py-1", containerClassName)}>
      {elements.map((item, index) => (
        <span key={index} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className={cn("inline-block transform-gpu", textClassName)}
            initial={{ y: "100%", opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              ...transition,
              delay: getDelay(index, elements.length),
            }}
          >
            {item}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
