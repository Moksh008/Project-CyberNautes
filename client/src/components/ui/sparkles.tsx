import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SparklesProps {
  density?: number;
  direction?: "top" | "bottom" | "left" | "right" | "none";
  speed?: number;
  color?: string;
  className?: string;
  minSize?: number;
  maxSize?: number;
}

export function Sparkles({
  density = 1200,
  direction = "bottom",
  speed = 1,
  color = "#FFFFFF",
  className,
  minSize = 0.6,
  maxSize = 1.8,
}: SparklesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const count = Math.floor((window.innerWidth * window.innerHeight) / (2000000 / density));
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      alpha: number;
      speedY: number;
      speedX: number;
      pulseSpeed: number;
    }> = [];

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * (canvas.width || 800),
        y: Math.random() * (canvas.height || 600),
        size: Math.random() * (maxSize - minSize) + minSize,
        alpha: Math.random(),
        speedY: (direction === "bottom" ? 1 : direction === "top" ? -1 : 0) * (Math.random() * 0.5 + 0.2) * speed,
        speedX: (direction === "right" ? 1 : direction === "left" ? -1 : 0) * (Math.random() * 0.5 + 0.2) * speed,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;

      for (let p of particles) {
        p.alpha += p.pulseSpeed;
        if (p.alpha > 1 || p.alpha < 0.1) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y > canvas.height) p.y = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;

        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [density, direction, speed, color, minSize, maxSize]);

  return <canvas ref={canvasRef} className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} />;
}
