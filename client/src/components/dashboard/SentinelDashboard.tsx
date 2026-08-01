import { WorkspaceView } from './views/WorkspaceView';
import DarkVeil from '../ui/DarkVeil';
import { LandingStyles } from '../landingpage/LandingStyles';

export default function SentinelDashboard() {
  return (
    <div className="h-screen w-full overflow-hidden bg-[#05070a] text-white font-sans relative">
      <LandingStyles />
      <div className="grain-overlay" />
      
      {/* DarkVeil Animated WebGL Cyber Shader Background */}
      {/* Desaturated to grayscale so the shader reads as jet black/white instead of its native warm nebula palette */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-80 grayscale">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0.02}
          scanlineIntensity={0.1}
          speed={0.45}
          warpAmount={0.35}
          resolutionScale={1}
        />
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="aurora-wave" />
      </div>

      {/* Main Interactive Dashboard Workbench */}
      <div className="relative z-10 h-full w-full">
        {/* Apply the glassmorphism Tailwind classes directly to the sidebar container inside this component */}
        <WorkspaceView />
      </div>
    </div>
  );
}