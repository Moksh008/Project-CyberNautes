import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Node3D {
  x: number;
  y: number;
  z: number;
  label: string;
  type: "gateway" | "app" | "db" | "sandbox" | "agent";
  color: string;
  status: string;
  floatOffset: number;
}

export function CyberTwin3DCanvas({ isSignIn }: { isSignIn?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePreset, setActivePreset] = useState<"graph" | "agents" | "sandbox">(
    isSignIn ? "graph" : "agents"
  );
  
  // Smooth mouse position with lerping target
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseCurrentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    // High-DPI resolution scaling for ultra-crisp anti-aliased rendering
    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Initial 3D node positions around a sphere
    const nodes: Node3D[] = [
      { x: 0, y: -115, z: 0, label: "Ingress Gateway", type: "gateway", color: "#38bdf8", status: "Internet Entry", floatOffset: 0 },
      { x: 125, y: 35, z: 45, label: "Apache Web Server", type: "app", color: "#a855f7", status: "CVE-2024-6387", floatOffset: 1.2 },
      { x: -125, y: 45, z: -45, label: "PostgreSQL DB", type: "db", color: "#f43f5e", status: "High Priority Asset", floatOffset: 2.4 },
      { x: 0, y: 135, z: 85, label: "Docker Micro-Sandbox", type: "sandbox", color: "#10b981", status: "Verified Patch", floatOffset: 3.6 },
      { x: 95, y: -55, z: -95, label: "LangGraph Offense", type: "agent", color: "#ef4444", status: "Red Team AI", floatOffset: 4.8 },
      { x: -95, y: -65, z: 95, label: "LangGraph Defense", type: "agent", color: "#3b82f6", status: "Blue Team AI", floatOffset: 6.0 },
    ];

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseTargetRef.current = { x, y };
    };

    const handleMouseLeave = () => {
      mouseTargetRef.current = { x: 0, y: 0 };
    };

    canvas.parentElement?.addEventListener("mousemove", handleMouseMove);
    canvas.parentElement?.addEventListener("mouseleave", handleMouseLeave);

    const render = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      ctx.clearRect(0, 0, displayWidth, displayHeight);
      const cx = displayWidth / 2;
      const cy = displayHeight / 2;

      // Ultra-smooth lerping for mouse parallax
      mouseCurrentRef.current.x += (mouseTargetRef.current.x - mouseCurrentRef.current.x) * 0.04;
      mouseCurrentRef.current.y += (mouseTargetRef.current.y - mouseCurrentRef.current.y) * 0.04;

      angle += 0.005; // Silky smooth rotation rate
      const time = Date.now() * 0.0015;

      const rotX = mouseCurrentRef.current.y * 0.6;
      const rotY = angle + mouseCurrentRef.current.x * 0.6;

      // Project 3D nodes to 2D screen coordinates with floating sinusoidal offset
      const projected = nodes.map((node) => {
        const floatY = node.y + Math.sin(time + node.floatOffset) * 6;

        let x1 = node.x * Math.cos(rotY) - node.z * Math.sin(rotY);
        let z1 = node.x * Math.sin(rotY) + node.z * Math.cos(rotY);

        let y2 = floatY * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = floatY * Math.sin(rotX) + z1 * Math.cos(rotX);

        const scale = 420 / (420 + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        return { ...node, px, py, scale, z2 };
      });

      projected.sort((a, b) => b.z2 - a.z2);

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Draw attack reachability beam lines connecting nodes
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const n1 = projected[i];
          const n2 = projected[j];
          const dist = Math.hypot(n1.px - n2.px, n1.py - n2.py);

          if (dist < 280) {
            ctx.beginPath();
            ctx.moveTo(n1.px, n1.py);
            ctx.lineTo(n2.px, n2.py);
            const alpha = Math.max(0.04, 1 - dist / 280) * 0.35;

            const grad = ctx.createLinearGradient(n1.px, n1.py, n2.px, n2.py);
            grad.addColorStop(0, n1.color);
            grad.addColorStop(1, n2.color);

            ctx.strokeStyle = grad;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 1.6 * Math.min(n1.scale, n2.scale);
            ctx.stroke();

            // Smooth energy particle along line
            const pulseT = (time * 0.6 + i * 0.4 + j * 0.3) % 1;
            const pulseX = n1.px + (n2.px - n1.px) * pulseT;
            const pulseY = n1.py + (n2.py - n1.py) * pulseT;
            ctx.globalAlpha = alpha * 1.8;
            ctx.fillStyle = n1.color;
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 2.5 * n1.scale, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw Central Glowing Cyber Shield Core
      ctx.globalAlpha = 0.75;
      const shieldGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 95);
      shieldGlow.addColorStop(0, "rgba(59, 130, 246, 0.35)");
      shieldGlow.addColorStop(0.5, "rgba(147, 51, 234, 0.18)");
      shieldGlow.addColorStop(1, "transparent");
      ctx.fillStyle = shieldGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 95, 0, Math.PI * 2);
      ctx.fill();

      // Outer smooth cyber ring
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(cx, cy, 125, angle * 0.4, angle * 0.4 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Render 3D Nodes with smooth anti-aliased glows
      for (let n of projected) {
        ctx.globalAlpha = Math.max(0.25, Math.min(1, n.scale));

        const glow = ctx.createRadialGradient(n.px, n.py, 1, n.px, n.py, 20 * n.scale);
        glow.addColorStop(0, n.color);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.px, n.py, 20 * n.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#05070a";
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 2.2 * n.scale;
        ctx.beginPath();
        ctx.arc(n.px, n.py, 7.5 * n.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = `600 ${Math.round(11 * n.scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(n.label, n.px, n.py + 21 * n.scale);

        ctx.fillStyle = n.color;
        ctx.font = `500 ${Math.round(9 * n.scale)}px sans-serif`;
        ctx.fillText(n.status, n.px, n.py + 33 * n.scale);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.parentElement?.removeEventListener("mousemove", handleMouseMove);
      canvas.parentElement?.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activePreset]);

  return (
    <div className="w-full h-full flex flex-col justify-between relative overflow-hidden">
      {/* Top Cyber Mode Preset Switcher */}
      <div className="flex items-center justify-between p-6 z-20 pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-md text-xs font-mono text-blue-300">
          <Activity size={14} className="text-blue-400 animate-pulse" /> 
          <span>SentinelAI 3D Cyber Twin</span>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-1 bg-black/60 border border-white/10 p-1 rounded-xl backdrop-blur-md">
          <button
            onClick={() => setActivePreset("graph")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer",
              activePreset === "graph" ? "bg-blue-600 text-white shadow-md" : "text-zinc-400 hover:text-white"
            )}
          >
            Attack Graph
          </button>
          <button
            onClick={() => setActivePreset("agents")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer",
              activePreset === "agents" ? "bg-purple-600 text-white shadow-md" : "text-zinc-400 hover:text-white"
            )}
          >
            AI Agents
          </button>
          <button
            onClick={() => setActivePreset("sandbox")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer",
              activePreset === "sandbox" ? "bg-emerald-600 text-white shadow-md" : "text-zinc-400 hover:text-white"
            )}
          >
            Docker Sandbox
          </button>
        </div>
      </div>

      {/* Interactive 3D Canvas */}
      <div className="absolute inset-0 z-10">
        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      </div>
    </div>
  );
}

export default CyberTwin3DCanvas;
