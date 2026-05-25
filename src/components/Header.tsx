import React, { useState, useEffect } from "react";
import { Shield, Menu, X, Terminal, Radio } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { label: "Home", id: "hero" },
    { label: "What We Do", id: "capabilities" },
    { label: "Our Products", id: "systems" },
    { label: "Future Projects", id: "research" },
    { label: "Sectors", id: "sectors" },
    { label: "Contact", id: "secure-contact" },
  ];

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-graphite-950/90 backdrop-blur-md border-b border-white/5 py-4 shadow-lg shadow-black/20"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand/Logo - Modern minimalist styling */}
          <div
            onClick={() => scrollToSection("hero")}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded border border-blue-500/30 bg-graphite-900 overflow-hidden group-hover:border-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/10 transition-all duration-300">
              <img
                src="/src/assets/images/regenerated_image_1779718150435.jpg"
                alt="Glint Logo"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-display font-bold text-sm tracking-[0.25em] text-white select-none whitespace-nowrap">
                GLINT
              </span>
              <span className="font-sans text-[9px] font-medium tracking-[0.35em] text-blue-500/80 block mt-[-3px] select-none uppercase">
                TECHNOLOGY
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-xs font-mono font-medium tracking-wider text-steel-400 hover:text-white transition-colors uppercase cursor-pointer relative py-1 group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-blue-500 group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </nav>

          {/* Secure Handshake operational indicator */}
          <div className="hidden sm:flex items-center space-x-2 bg-graphite-900 border border-white/5 px-3 py-1.5 rounded-full select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span className="font-mono text-[9px] text-[#10b981] font-semibold tracking-widest uppercase">
              SECURE NETWORK ACTIVE
            </span>
          </div>

          {/* Mobile menu trigger */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 px-2 border border-white/10 rounded bg-graphite-900 hover:bg-graphite-800 text-steel-400 hover:text-white transition-colors cursor-pointer"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-b border-white/5 bg-graphite-950 absolute top-full left-0 right-0 overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-6 space-y-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left px-4 py-2 border-l border-white/5 text-xs font-mono tracking-widest text-[#7c8ba1] hover:text-white hover:border-blue-500 transition-all uppercase cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
              
              <div className="pt-4 border-t border-white/5 px-4 flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#7c8ba1]/70 tracking-widest uppercase flex items-center">
                  <Shield className="h-3.5 w-3.5 text-blue-500 mr-1.5" />
                  Secure local systems
                </span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
