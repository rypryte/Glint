import React from "react";
import { Shield, Lock } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleScrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("secure-contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-[#0a0b0d] border-t border-white/5 py-12 relative overflow-hidden">
      {/* Subtle bottom grid texture */}
      <div className="absolute inset-0 mesh-grid opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          
          {/* Brand segment & sovereign notice */}
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 rounded border border-blue-500/30 overflow-hidden bg-graphite-900 flex-shrink-0">
                <img
                  src="/src/assets/images/regenerated_image_1779718150435.jpg"
                  alt="Glint Logo"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-display font-bold text-xs tracking-widest text-white uppercase">
                Glint Technology Limited
              </span>
            </div>
            <p className="text-[11px] font-sans text-[#7c8ba1]/70 leading-relaxed uppercase tracking-wider">
              Smart Drones &bull; Secure Cameras &bull; Encrypted Networks &bull; Private Infrastructure.
            </p>
          </div>

          {/* Secure links required by the user: Privacy, Security Notice, Terms, Secure Inquiry */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <a
              href="#privacy"
              className="text-xs font-mono font-medium text-steel-400 hover:text-white transition-colors uppercase tracking-wider block"
              onClick={(e) => {
                e.preventDefault();
                alert("Privacy Policy: All client information is kept on secure, private physical hard drives with no internet connection, in complete compliance with regional storage security guidelines.");
              }}
            >
              Privacy
            </a>
            <a
              href="#security-notice"
              className="text-xs font-mono font-medium text-steel-400 hover:text-white transition-colors uppercase tracking-wider block"
              onClick={(e) => {
                e.preventDefault();
                alert("Security Notice: This portal is continuously monitored to prevent intrusion. Any unauthorized access attempts are immediately logged to help protect our systems.");
              }}
            >
              Security Notice
            </a>
            <a
              href="#terms"
              className="text-xs font-mono font-medium text-steel-400 hover:text-white transition-colors uppercase tracking-wider block"
              onClick={(e) => {
                e.preventDefault();
                alert("Terms of Use: Glint Technology systems must be used in compliance with local rules, authorization guidelines, and standard equipment distribution agreements.");
              }}
            >
              Terms
            </a>
            <a
              href="#secure-inquiry"
              onClick={handleScrollToContact}
              className="text-xs font-mono font-medium text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider block"
            >
              Secure Inquiry
            </a>
          </div>

        </div>

        {/* Dynamic legal & cryptographic stamp */}
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#7c8ba1]/50 gap-4">
          <p>
            &copy; {currentYear} Glint Technology Ltd. All hardware design and software rights reserved.
          </p>
          <div className="flex items-center space-x-1.5 uppercase tracking-widest">
            <Lock className="h-3 w-3 text-blue-500/50" />
            <span>Secure Connection Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
