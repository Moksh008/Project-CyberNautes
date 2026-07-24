import { WorkspaceView } from './views/WorkspaceView';
import DarkVeil from '../ui/DarkVeil';

export default function SentinelDashboard() {
  return (
    <div className="h-screen w-full overflow-hidden bg-[#05070a] text-white font-sans relative">
      {/* DarkVeil Animated WebGL Cyber Shader Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <DarkVeil 
          hueShift={210} 
          noiseIntensity={0.02} 
          scanlineIntensity={0.1} 
          speed={0.3} 
          warpAmount={0.15} 
          resolutionScale={1}
        />
      </div>

      {/* Main Interactive Dashboard Workbench */}
      <div className="relative z-10 h-full w-full">
        <WorkspaceView />
      </div>
    </div>
  );
}
