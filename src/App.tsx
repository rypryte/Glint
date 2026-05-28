import React, { useState, useEffect } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import {
  Shield,
  Eye,
  Compass,
  ShieldAlert,
  Tv,
  Activity,
  Cpu,
  Layers,
  Lock,
  Globe,
  Radio,
  Server,
  Terminal,
  Fingerprint,
  Users,
  HardDrive
} from "lucide-react";

import Header from "./components/Header";
import Footer from "./components/Footer";
import RadarBackground from "./components/RadarBackground";
import ProductCatalog from "./components/ProductCatalog";
import SecureContactForm from "./components/SecureContactForm";
import AdminDashboard from "./admin/AdminDashboard";
import CustomCursor from "./components/CustomCursor";

import {
  CAPABILITIES_DATA,
  OPERATIONAL_SECTORS_DATA,
  TRUST_PRINCIPLES
} from "./types";

// Path imports to generated high-quality assets
import droneImg from "./assets/images/aerial_surveillance_drone_1779716643097.png";
import commsImg from "./assets/images/tactical_comms_node_1779716661586.png";
import thermalImg from "./assets/images/thermal_sensor_pod_1779716680879.png";

// Helper component to render capabilities icons dynamically
function CapabilityIcon({ name }: { name: string }) {
  const props = { className: "h-5 w-5 text-blue-500 shrink-0 mt-0.5" };
  switch (name) {
    case "Eye":
      return <Eye {...props} />;
    case "Compass":
      return <Compass {...props} />;
    case "ShieldAlert":
      return <ShieldAlert {...props} />;
    case "Tv":
      return <Tv {...props} />;
    case "Activity":
      return <Activity {...props} />;
    case "Cpu":
      return <Cpu {...props} />;
    case "Layers":
      return <Layers {...props} />;
    default:
      return <Shield {...props} />;
  }
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      setCurrentHash(window.location.hash);
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  const isAdminRoute = 
    currentPath === "/admin" || 
    currentPath === "/admin-dashboard" || 
    currentHash === "#/admin" || 
    currentHash === "#/admin-dashboard";

  const scrollToContact = (e: React.MouseEvent, type?: string) => {
    e.preventDefault();
    const element = document.getElementById("secure-contact");
    if (element) {
      if (type) {
        const selectEl = document.getElementById("inquiryType") as HTMLSelectElement;
        if (selectEl) {
          selectEl.value = type;
          // Trigger state dispatch if event needed
          const event = new Event("change", { bubbles: true });
          selectEl.dispatchEvent(event);
        }
      }
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  if (isAdminRoute) {
    return (
      <>
        <AdminDashboard />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-graphite-950 text-white font-sans selection:bg-blue-500/30 selection:text-white scroll-smooth">
      {/* Precision Holographic Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 origin-left z-[9999] shadow-[0_0_12px_rgba(59,130,246,0.6)]"
        style={{ scaleX }}
      />

      {/* Futuristic Tactical Tracker Cursor (Hides default pointer & builds grid Hud) */}
      <CustomCursor />

      {/* Absolute Header Navigation */}
      <Header />

      {/* 1. HERO SECTION */}
      <section id="hero" className="relative min-h-screen flex items-center pt-24 overflow-hidden">
        {/* Intricate Animated Defense Grid Background */}
        <RadarBackground />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Title & Descriptors Area */}
            <div className="lg:col-span-7 space-y-8 text-left">
              
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center space-x-2.5 bg-graphite-900 border border-white/10 px-3.5 py-1.5 rounded"
              >
                <Fingerprint className="h-4 w-4 text-blue-500" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-steel-400">
                  Secure Local Hardware &amp; AI
                </span>
              </motion.div>

              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="font-display font-medium text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] uppercase"
                >
                  Advanced Security &amp; <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-steel-400">
                    Smart Local Hardware
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="font-sans text-sm md:text-base text-steel-400 leading-relaxed max-w-xl"
                >
                  Secure smart cameras, private networks, autonomous drones, and easy-to-read dashboards designed to protect borders and key infrastructure systems.
                </motion.p>
              </div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
              >
                <button
                  onClick={(e) => scrollToContact(e, "Operational Consultation")}
                  className="px-6 py-3.5 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-[11px] font-mono font-medium tracking-widest text-white uppercase rounded transition-all cursor-pointer text-center"
                >
                  Get Capability Brief
                </button>
                
                <button
                  onClick={(e) => scrollToContact(e, "Strategic Partnership")}
                  className="px-6 py-3.5 bg-graphite-900 hover:bg-graphite-800 border border-white/10 hover:border-white/20 text-[11px] font-mono font-medium tracking-widest text-[#7c8ba1] hover:text-white uppercase rounded transition-all cursor-pointer text-center"
                >
                  Partner With Us
                </button>

                <button
                  onClick={(e) => scrollToContact(e)}
                  className="px-6 py-3.5 bg-transparent hover:bg-white/5 text-[11px] font-mono font-medium tracking-widest text-steel-400 hover:text-white uppercase transition-all cursor-pointer text-center"
                >
                  Secure Contact
                </button>
              </motion.div>

            </div>

            {/* Bento Grid layout - Right Panel (Cols 5-12) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Module 1: 2x2 Bento Capability Matrix */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="grid grid-cols-2 gap-4"
              >
                {/* Cap 1 */}
                <div className="bento-card p-4 flex flex-col justify-between min-h-[110px] bg-graphite-900 border border-white/5 rounded-xl hover:border-blue-500/40 transition-all">
                  <div className="h-7 w-7 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 font-mono text-xs font-semibold select-none">
                    AI
                  </div>
                  <div>
                    <h4 className="font-display font-medium text-xs text-white uppercase tracking-wider">AI Surveillance</h4>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">Operational</span>
                    </div>
                  </div>
                </div>

                {/* Cap 2 */}
                <div className="bento-card p-4 flex flex-col justify-between min-h-[110px] bg-graphite-900 border border-white/5 rounded-xl hover:border-blue-500/40 transition-all">
                  <div className="h-7 w-7 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 font-mono text-xs font-semibold select-none">
                    SC
                  </div>
                  <div>
                    <h4 className="font-display font-medium text-xs text-white uppercase tracking-wider">Secure Comms</h4>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                </div>

                {/* Cap 3 */}
                <div className="bento-card p-4 flex flex-col justify-between min-h-[110px] bg-graphite-900 border border-white/5 rounded-xl hover:border-blue-500/40 transition-all">
                  <div className="h-7 w-7 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 font-mono text-xs font-semibold select-none">
                    AM
                  </div>
                  <div>
                    <h4 className="font-display font-medium text-xs text-white uppercase tracking-wider">Autonomous Mon.</h4>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest">Prototype G3</span>
                    </div>
                  </div>
                </div>

                {/* Cap 4 */}
                <div className="bento-card p-4 flex flex-col justify-between min-h-[110px] bg-graphite-900 border border-white/5 rounded-xl hover:border-blue-500/40 transition-all">
                  <div className="h-7 w-7 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 font-mono text-xs font-semibold select-none">
                    II
                  </div>
                  <div>
                    <h4 className="font-display font-medium text-xs text-white uppercase tracking-wider">Infra Intelligence</h4>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Module 2: System Deployments Card (Bento layout-B) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.35 }}
                className="bento-card p-5 bg-graphite-900 border border-white/5 rounded-xl hover:border-blue-500/40 transition-all space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-steel-400 uppercase tracking-widest">
                    <Layers className="h-3.5 w-3.5 text-blue-500" />
                    <span>ACTIVE SECURITY PROJECTS</span>
                  </div>
                  <span className="text-[9.5px] font-mono text-steel-500">
                    CLASS III
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between p-2 rounded hover:bg-white/2 transition-colors border-b border-white/5 last:border-none pb-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-display font-medium text-white uppercase tracking-wide">
                        G-Sentry v4
                      </div>
                      <div className="text-[10px] text-steel-400 leading-none">
                        Distributed AI sensor network for border integrity.
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider font-semibold">
                      Active
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between p-2 rounded hover:bg-white/2 transition-colors border-b border-white/5 last:border-none pb-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-display font-medium text-white uppercase tracking-wide">
                        Onyx Comm-Link
                      </div>
                      <div className="text-[10px] text-steel-400 leading-none">
                        Encrypted satellite relay infrastructure.
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/30 border border-blue-500/30 text-blue-400 uppercase tracking-wider font-semibold">
                      Ready
                    </span>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between p-2 rounded hover:bg-white/2 transition-colors last:border-none">
                    <div className="space-y-0.5">
                      <div className="text-xs font-display font-medium text-white uppercase tracking-wide">
                        Manta UAV-S
                      </div>
                      <div className="text-[10px] text-steel-400 leading-none">
                        Sub-surface autonomous monitoring system.
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/30 border border-amber-500/30 text-amber-400 uppercase tracking-wider font-semibold">
                      Research
                    </span>
                  </div>
                </div>

                {/* Secure Inquiry Bar Inline (Promoting Handshake) */}
                <div className="bg-graphite-950/80 border border-white/5 p-3 rounded-lg flex items-center justify-between text-xs font-mono mt-2">
                  <span className="text-[10px] text-steel-400 tracking-wide truncate mr-2">
                    Direct offline channels.
                  </span>
                  <a
                    href="#secure-contact"
                    className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 tracking-wider shrink-0"
                    onClick={(e) => scrollToContact(e)}
                  >
                    Contact Us &rarr;
                  </a>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. ABOUT SECTION */}
      <section id="about" className="py-24 border-t border-white/5 bg-[#0e1014] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-3xl space-y-6 text-left"
          >
            <span className="text-xs font-mono font-medium text-blue-500 uppercase tracking-widest block">
              Who We Are
            </span>
            <h2 className="font-display font-medium text-3xl sm:text-4xl text-white tracking-tight uppercase leading-snug">
              Smart local engineering. <br />
              Built for real-world setups.
            </h2>
            <div className="space-y-4 text-sm text-steel-400 leading-relaxed font-sans">
              <p>
                Glint Technology is an engineering firm that builds and maintains smart security systems. We combine secure cameras, private communications, and autonomous drones to help protect communities, facilities, and valuable infrastructure day and night.
              </p>
              <p>
                We focus on creating highly reliable systems that operate completely offline. By building systems that do not depend on external cloud servers, we ensure that our partners maintain full ownership and total control over their security data and physical devices.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. CORE CAPABILITIES */}
      <section id="capabilities" className="py-24 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-2xl text-left space-y-3 mb-16"
          >
            <span className="text-xs font-mono font-medium text-blue-500 uppercase tracking-widest block">
              Our Solutions
            </span>
            <h2 className="font-display font-medium text-2xl md:text-3xl text-white tracking-tight uppercase">
              Key Solutions we provide
            </h2>
            <p className="text-sm text-steel-400 leading-relaxed">
              Our products and services are designed to keep your infrastructure safe. Every system runs on high-quality hardware optimized to handle tough environments.
            </p>
          </motion.div>

          {/* Capabilities Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAPABILITIES_DATA.map((capability, index) => (
              <motion.div
                key={capability.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="bento-card p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Icon Block */}
                  <div className="h-10 w-10 flex items-center justify-center bg-graphite-950 border border-white/5 rounded-lg group-hover:border-blue-500/20 transition-colors">
                    <CapabilityIcon name={capability.iconName} />
                  </div>
                  
                  {/* Title & Desc */}
                  <div className="space-y-2">
                    <h3 className="font-display font-medium text-sm text-white uppercase tracking-wide group-hover:text-blue-400 transition-colors">
                      {capability.title}
                    </h3>
                    <p className="text-xs text-steel-400 leading-relaxed font-sans">
                      {capability.operationalValue}
                    </p>
                  </div>
                </div>

                {/* technical brief footnote */}
                <div className="mt-6 pt-4 border-t border-white/5 text-[10px] font-mono text-[#7c8ba1]/50 group-hover:text-steel-400 transition-colors">
                  <span className="block font-semibold uppercase text-blue-500 mb-0.5">// TECHNICAL BRIEF</span>
                  <span>{capability.technicalBrief}</span>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. PRODUCTS & SYSTEMS SHOWCASE */}
      <section id="systems" className="py-24 border-t border-white/5 bg-[#0e1014] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductCatalog
            droneImg={droneImg}
            commsImg={commsImg}
            thermalImg={thermalImg}
          />
        </div>
      </section>



      {/* 6. OPERATIONAL SECTORS SECTION */}
      <section id="sectors" className="py-24 border-t border-white/5 bg-[#0e1014] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-2xl text-left space-y-3 mb-16"
          >
            <span className="text-xs font-mono font-medium text-blue-500 uppercase tracking-widest block">
              Where We Work
            </span>
            <h2 className="font-display font-medium text-2xl md:text-3xl text-white tracking-tight uppercase">
              Sectors We Support
            </h2>
            <p className="text-sm text-steel-400 leading-relaxed">
              We build specialized hardware and software for various industries requiring high-security levels.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {OPERATIONAL_SECTORS_DATA.map((sector, index) => (
              <motion.div
                key={sector.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="bento-card p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-blue-500 block uppercase tracking-widest">
                    {sector.code}
                  </span>
                  <h4 className="font-display font-medium text-xs text-white uppercase tracking-wider">
                    {sector.name}
                  </h4>
                  <p className="text-[11px] text-steel-400 leading-relaxed">
                    {sector.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-white/5 font-mono text-[9px] text-[#7c8ba1]/40 flex items-center justify-between">
                  <span>STANDARD CLASSIFIED</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. SECURITY & TRUST SECTION */}
      <section className="py-24 border-t border-white/5 relative bg-[#0a0b0d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side text column (5 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="lg:col-span-5 space-y-6 text-left"
            >
              <span className="text-xs font-mono font-medium text-blue-500 uppercase tracking-widest block">
                Our Commitment
              </span>
              <h2 className="font-display font-medium text-2xl md:text-3xl text-white tracking-tight uppercase leading-snug">
                Simple, Secure &amp; Private Networks
              </h2>
              <p className="text-sm text-steel-400 leading-relaxed">
                We believe that physical safety and digital security go hand in hand. All Glint Technology systems follow strict data guidelines. We build devices that save information locally, cutting out data leaks, external trackers, or unauthorized access.
              </p>
              
              <div className="pt-4 border-t border-white/5 flex items-center space-x-3 text-xs font-mono text-steel-400">
                <Lock className="h-4 w-4 text-blue-500" />
                <span>100% Offline &amp; Private Security</span>
              </div>
            </motion.div>

            {/* Right side list column (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {TRUST_PRINCIPLES.map((principle, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  className="bento-card p-5 space-y-2"
                >
                  <h4 className="font-display font-medium text-xs text-white uppercase tracking-wider flex items-center space-x-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span>{principle.title}</span>
                  </h4>
                  <p className="text-[11px] text-steel-400 leading-relaxed font-sans">
                    {principle.description}
                  </p>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 8. SECURE CONTACT SECTION */}
      <section id="secure-contact" className="py-24 border-t border-white/5 bg-[#0e1014] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Context support text block */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="lg:col-span-4 space-y-6 lg:sticky lg:top-28 text-left"
            >
              <div className="space-y-2">
                <span className="text-xs font-mono font-medium text-blue-500 uppercase tracking-widest block">
                  Reach Out
                </span>
                <h2 className="font-display font-medium text-2xl md:text-3xl text-white tracking-tight uppercase">
                  Contact Our Team
                </h2>
              </div>
              
              <p className="text-sm text-steel-400 leading-relaxed">
                To keep our operations private and secure, we do not post public phone numbers, personal rosters, or office addresses. We use secure contact methods to review and respond to official inquiries quickly.
              </p>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-start space-x-3 text-xs">
                  <Shield className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-white block uppercase tracking-wider">Identity Check</span>
                    <span className="text-[11px] text-steel-400 leading-normal block mt-0.5">
                      We verify business and government identities before sending detailed telemetry specs or product files.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs">
                  <Lock className="h-4 w-4 text-[#7c8ba1] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-white block uppercase tracking-wider">System Status</span>
                    <span className="text-[11px] text-[#7c8ba1]/70 leading-normal block mt-0.5">
                      Operational team online. Serving our partners and security sectors with fast responses.
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Interactive Secure Contact Form block */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="lg:col-span-8"
            >
              <SecureContactForm />
            </motion.div>

          </div>
        </div>
      </section>

      {/* 9. SECURE FOOTER REGION */}
      <Footer />
    </div>
  );
}
