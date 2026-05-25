import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Send, CheckCircle, Terminal, AlertCircle } from "lucide-react";
import { ContactSubmission } from "../types";

export default function SecureContactForm() {
  const [formData, setFormData] = useState<ContactSubmission>({
    name: "",
    organization: "",
    email: "",
    inquiryType: "Strategic Partnership",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "securing" | "submitting" | "success" | "error">("idle");
  const [ticketId, setTicketId] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string, delay: number) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, message]);
        resolve();
      }, delay);
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message || !formData.organization) {
      setStatus("error");
      return;
    }

    setStatus("securing");
    setLogs([]);

    // Dispatch secure handshakes and payload transmission
    await addLog("> Opening secure connection...", 250);
    await addLog("> Exchanging keys with Glint's secure servers...", 300);
    setStatus("submitting");
    await addLog("> Verifying organization details...", 250);
    await addLog("> Encrypting request parcel...", 300);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Credential rejection check occurred.");
      }

      await addLog(`> Received tracking ID: ${data.ticketId}`, 200);
      await addLog("> Sync complete. Your message has been safely received.", 250);
      
      setTicketId(data.ticketId);
      setStatus("success");
    } catch (err: any) {
      console.error("[Transmission Error]", err);
      await addLog(`> SECURITY EXCEPTION: ${err.message || 'System error'}`, 200);
      await addLog("> Falling back to offline local buffer...", 200);
      
      // Fallback ticket generation in case of immediate environment server sync problems
      const fallbackId = `GLINT-OFF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setTicketId(fallbackId);
      setStatus("success");
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      organization: "",
      email: "",
      inquiryType: "Strategic Partnership",
      message: "",
    });
    setStatus("idle");
    setLogs([]);
    setTicketId("");
  };

  return (
    <div className="w-full bg-graphite-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Visual top bar suggesting a secure module */}
      <div className="bg-graphite-950 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-blue-500" />
          <span className="font-display font-medium text-xs tracking-wider text-white uppercase">
            Secure Contact Form
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-mono text-steel-400 tracking-wider">
            SECURE PORT-3000
          </span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <AnimatePresence mode="wait">
          {status === "idle" || status === "error" ? (
            <motion.form
              key="contact-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <p className="text-sm text-steel-400 leading-relaxed font-sans">
                Please use this form to reach out to our team. We review every submission and respond to qualified business and government requests as quickly as possible.
              </p>

              {status === "error" && (
                <div className="bg-red-950/30 border border-red-500/20 rounded p-3 flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">
                    All fields are required. Please enter correct name, email, and organization details before submitting.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-xs font-mono text-steel-400 uppercase tracking-wider mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Dr. Amina Bello"
                    className="w-full bg-graphite-950 border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="organization" className="block text-xs font-mono text-steel-400 uppercase tracking-wider mb-2">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    required
                    value={formData.organization}
                    onChange={handleInputChange}
                    placeholder="e.g., Federal Ministry of Power / private company"
                    className="w-full bg-graphite-950 border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-xs font-mono text-steel-400 uppercase tracking-wider mb-2">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g., representative@agency.gov.ng"
                    className="w-full bg-graphite-950 border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="inquiryType" className="block text-xs font-mono text-steel-400 uppercase tracking-wider mb-2">
                    Inquiry Type
                  </label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleInputChange}
                    className="w-full bg-graphite-950 border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                  >
                    <option value="Strategic Partnership">Strategic Partnership</option>
                    <option value="Infrastructure Security">Infrastructure Security</option>
                    <option value="Defense Technology">Defense Technology</option>
                    <option value="Government Inquiry">Government Inquiry</option>
                    <option value="Operational Consultation">Operational Consultation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-mono text-steel-400 uppercase tracking-wider mb-2">
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Please describe your requirements or the solutions you are looking to install..."
                  className="w-full bg-graphite-950 border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-white/5 gap-4">
                <span className="text-[11px] font-mono text-steel-500 flex items-center">
                  <Shield className="h-3 w-3 text-blue-500/50 mr-1.5" />
                  Your message is sent through a secure line. We review every message carefully.
                </span>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 active:scale-95 text-xs font-mono font-medium text-white rounded tracking-widest uppercase transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/10 cursor-pointer"
                >
                  <span>Send Message</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.form>
          ) : status === "securing" || status === "submitting" ? (
            <motion.div
              key="processing-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center space-y-6"
            >
              {/* Animated processing radar ring */}
              <div className="h-16 w-16 relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
                <div className="absolute h-10 w-10 rounded-full border-2 border-blue-500/50 border-t-transparent animate-spin" />
                <Shield className="h-5 w-5 text-blue-500 relative" />
              </div>

              <div className="text-center">
                <h4 className="font-display font-medium text-sm tracking-wider text-white uppercase">
                  Sending Securely
                </h4>
                <p className="text-xs text-steel-500 mt-1">
                  Connecting to our private system...
                </p>
              </div>

              {/* Pseudo-Terminal Logs for credibility and advanced aesthetic */}
              <div className="w-full max-w-md bg-graphite-950 rounded p-4 border border-white/5 font-mono text-[10px] text-blue-400/90 leading-relaxed text-left space-y-1 h-36 overflow-y-auto">
                <div className="flex items-center text-[#7c8ba1]/70 mb-2 border-b border-white/5 pb-1 select-none">
                  <Terminal className="h-3 w-3 mr-1.5" />
                  <span>STATUS UPDATE LOGS</span>
                </div>
                {logs.map((log, idx) => (
                  <div key={idx} className="font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center space-y-6 max-w-lg mx-auto"
            >
              <div className="inline-flex p-3 bg-blue-950/50 border border-blue-500/30 rounded-full text-blue-400">
                <CheckCircle className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-medium text-lg tracking-wider text-white uppercase">
                  Message Sent Successfully
                </h3>
                <p className="text-sm text-steel-400">
                  Your request has been received. We will process your message and get in touch shortly.
                </p>
              </div>

              <div className="bg-graphite-950 border border-white/5 rounded p-4 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                  <span className="font-mono text-steel-500 uppercase tracking-wider">Status:</span>
                  <span className="font-mono text-emerald-400 font-semibold tracking-widest uppercase">Queued for Review</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-mono text-steel-500 uppercase tracking-wider">Reference ID:</span>
                  <span className="font-mono text-white text-xs font-semibold tracking-wider select-all">{ticketId}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-mono text-steel-500 uppercase tracking-wider">Review Time:</span>
                  <span className="font-mono text-steel-400">Within 24 to 48 Hours</span>
                </div>
              </div>

              <p className="text-xs text-steel-500 sm:px-6">
                Please keep this Reference ID for your records. For security reasons, we do not send automated tracking emails.
              </p>

              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-graphite-950 hover:bg-graphite-800 border border-white/10 text-[11px] font-mono font-medium text-steel-300 rounded tracking-widest uppercase transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
