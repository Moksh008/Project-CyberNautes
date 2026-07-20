

export const LandingStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    .ml-liquid-glass {
      background: rgba(255, 255, 255, 0.03);
      background-blend-mode: luminosity;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: none;
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
    }

    .ml-liquid-glass::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1.4px;
      background: linear-gradient(180deg,
        rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
        rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
        rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    /* Gradient border cards */
    .gradient-border {
      position: relative;
      background: rgba(24, 24, 27, 0.8);
      border-radius: 1rem;
      overflow: hidden;
    }
    
    .gradient-border::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    .gradient-border:hover::before {
      background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(59,130,246,0.15) 50%, rgba(255,255,255,0.1) 100%);
    }

    /* Bento card glow on hover */
    .bento-glow {
      position: relative;
      transition: all 0.5s ease;
    }
    
    .bento-glow::after {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      opacity: 0;
      transition: opacity 0.5s ease;
      background: radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59,130,246,0.06), transparent 40%);
      pointer-events: none;
    }
    
    .bento-glow:hover::after {
      opacity: 1;
    }

    /* Scroll-down indicator */
    @keyframes bounce-slow {
      0%, 100% { transform: translateY(0) translateX(-50%); opacity: 0.5; }
      50% { transform: translateY(8px) translateX(-50%); opacity: 1; }
    }
    .scroll-indicator {
      animation: bounce-slow 2s ease-in-out infinite;
    }
  ` }} />
);
