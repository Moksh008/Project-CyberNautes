
import { Shield } from 'lucide-react';

const footerLinks = {
  Product: ["Digital Twin", "Simulations", "Agents", "Knowledge Graph", "API"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Resources: ["Documentation", "Changelog", "Status", "Support"],
  Legal: ["Privacy", "Terms", "Security", "DPA"]
};

export const Footer = () => {
  return (
    <footer className="pt-20 pb-12 px-8 md:px-28 border-t border-zinc-900 bg-black font-sans">
      {/* Gradient divider */}
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/15 to-white/5 border border-white/10 flex items-center justify-center">
                <Shield size={16} className="text-white/80" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">SentinelAI</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-[260px] mb-6">
              AI-Powered Cyber Defense Twin. Simulate attacks, discover vulnerabilities, remediate automatically.
            </p>

            {/* Newsletter */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <button className="bg-white text-black text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-white/90 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs tracking-[2px] uppercase text-zinc-500 mb-5 font-medium">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs">© 2026 SentinelAI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {["GitHub", "Twitter", "Discord", "LinkedIn"].map((social) => (
              <a key={social} href="#" className="text-zinc-600 hover:text-white transition-colors text-xs">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
