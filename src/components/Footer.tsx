import React from "react";
import { Shield, Lock } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [modalType, setModalType] = React.useState<'PRIVACY' | 'SECURITY' | 'TERMS' | null>(null);

  const handleScrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("secure-contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getModalContent = () => {
    switch (modalType) {
      case 'PRIVACY':
        return {
          title: "PRIVACY POLICY & DATA SOVEREIGNTY",
          text: "All client configurations, hardware logs, personal operator alias registries, and system diagnostics are stored exclusively on secure local media with physical air-gapped protection. We guarantee 100% digital confidentiality: zero external telemetry trackers, zero third-party script integrations, and zero remote server transmissions are ever enabled on your private equipment grid."
        };
      case 'SECURITY':
        return {
          title: "SYSTEM SECURITY OPERATIONS NOTICE",
          text: "Authorized Access Only. This local node operates with advanced cryptographic signatures. All transactions, operational triggers, and login attempts are strictly verified using local hash audits. Any invalid credential signatures or tampering anomalies are immediately stored in the local hardware vault to assist local administrator personnel."
        };
      case 'TERMS':
        return {
          title: "STANDARD INFRASTRUCTURE TERMS OF USE",
          text: "By accessing and deploying Glint Technology solutions, operators agree to operate products within regional safety rules and approved server/camera hardware environments. Copying micro-kernel firmware versions or reverse-engineering proprietary sensor layouts is strictly prohibited under the sovereign system infrastructure distribution certificate."
        };
      default:
        return null;
    }
  };

  const modalData = getModalContent();

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
                setModalType('PRIVACY');
              }}
            >
              Privacy
            </a>
            <a
              href="#security-notice"
              className="text-xs font-mono font-medium text-steel-400 hover:text-white transition-colors uppercase tracking-wider block"
              onClick={(e) => {
                e.preventDefault();
                setModalType('SECURITY');
              }}
            >
              Security Notice
            </a>
            <a
              href="#terms"
              className="text-xs font-mono font-medium text-[#7c8ba1]-400 hover:text-white tracking-widest uppercase tracking-wider block"
              onClick={(e) => {
                e.preventDefault();
                setModalType('TERMS');
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

      {/* Styled Security Modal Overlay */}
      {modalData && (
        <div className="fixed inset-0 bg-graphite-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-graphite-900 border border-white/10 rounded-xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-3">
              <Shield className="h-5 w-5" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider">{modalData.title}</h3>
            </div>
            <p className="text-xs text-steel-300 leading-relaxed font-sans font-medium text-left">
              {modalData.text}
            </p>
            <div className="pt-3 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-mono text-[10px] uppercase font-bold tracking-widest rounded cursor-pointer transition-colors"
              >
                Acknowledge and Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
