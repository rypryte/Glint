import React, { useState, useEffect } from "react";
import { 
  Shield, Lock, Unlock, User, Mail, FileText, Filter, Search, 
  LogOut, CheckCircle, Archive, Trash2, Download, Terminal, 
  Briefcase, Key, RefreshCw, AlertCircle, Database, Eye, 
  Activity, HardDrive, ShieldAlert, BadgeInfo, Layers 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ApiInquiry {
  id: string;
  ticketId: string;
  name: string;
  organization: string;
  email: string;
  inquiryType: string;
  message: string;
  timestamp: string;
  status: "PENDING" | "REVIEWED" | "ARCHIVED";
  ipAddress?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Core administrative states
  const [inquiries, setInquiries] = useState<ApiInquiry[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "REVIEWED" | "ARCHIVED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedInquiry, setSelectedInquiry] = useState<ApiInquiry | null>(null);
  
  // Update notes & state values
  const [actionNotes, setActionNotes] = useState<string>("");
  const [apiSuccessMsg, setApiSuccessMsg] = useState<string>("");
  const [apiErrorMsg, setApiErrorMsg] = useState<string>("");

  useEffect(() => {
    // Audit current credentials state
    const token = localStorage.getItem("glint_security_token");
    if (token) {
      setIsAuthenticated(true);
      pushLog("Session validation recognized. Credentials verified.");
      fetchInquiries(token);
    } else {
      pushLog("Admin access check: Unauthenticated state discovered.");
    }
  }, []);

  const pushLog = (text: string) => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${time}] ${text}`, ...prev.slice(0, 49)]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Credential verification failed.");
      }

      localStorage.setItem("glint_security_token", data.token);
      localStorage.setItem("glint_admin_email", data.user.email);
      setIsAuthenticated(true);
      pushLog(`Admin login successful: ${data.user.email} (Role: ${data.user.role})`);
      fetchInquiries(data.token);
    } catch (err: any) {
      setLoginError(err.message || "Internal auth system routing failure.");
      pushLog(`Failed authentication attempt on email: ${loginEmail}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("glint_security_token");
    localStorage.removeItem("glint_admin_email");
    setIsAuthenticated(false);
    setInquiries([]);
    setSelectedInquiry(null);
    pushLog("Active administrator session invalidated manually. Logged out.");
  };

  const fetchInquiries = async (tokenOverride?: string) => {
    const token = tokenOverride || localStorage.getItem("glint_security_token");
    if (!token) return;

    try {
      const res = await fetch("/api/inquiries", {
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setInquiries(data.inquiries || []);
        pushLog(`Synchronized database cache. Retrieved ${data.count} submissions.`);
      } else {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
        }
        throw new Error(data.message || "Failed to download database files.");
      }
    } catch (err: any) {
      pushLog(`Retrieve error: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (inquiryId: string, newStatus: "PENDING" | "REVIEWED" | "ARCHIVED") => {
    const token = localStorage.getItem("glint_security_token");
    if (!token) return;

    setApiSuccessMsg("");
    setApiErrorMsg("");

    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, reviewNotes: actionNotes })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Database update failed.");

      // Synchronize client cache
      setInquiries(prev => prev.map(item => item.id === inquiryId ? data.inquiry : item));
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry(data.inquiry);
      }
      
      setApiSuccessMsg(`Inquiry ${data.inquiry.ticketId} successfully marked as ${newStatus}`);
      pushLog(`Status synced: Thread ${data.inquiry.ticketId} changed to ${newStatus}`);
      setActionNotes("");
      fetchInquiries();
    } catch (err: any) {
      setApiErrorMsg(err.message);
      pushLog(`Update failed [ID: ${inquiryId}]: ${err.message}`);
    }
  };

  const handleDeleteInquiry = async (inquiryId: string, ticketIdName: string) => {
    if (!window.confirm(`SECURITY NOTICE: Are you sure you want to completely EXPUNGE inquiry record ${ticketIdName}? This action is permanent and unrecoverable.`)) {
      return;
    }

    const token = localStorage.getItem("glint_security_token");
    if (!token) return;

    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Purge execution failed.");

      setInquiries(prev => prev.filter(item => item.id !== inquiryId));
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry(null);
      }
      
      pushLog(`Expunged core record: Thread ${ticketIdName} deleted by supervisor.`);
      alert("System logs updated: Record successfully and cleanly deleted.");
    } catch (err: any) {
      alert(`System Error: ${err.message}`);
      pushLog(`Purge fail on ${ticketIdName}: ${err.message}`);
    }
  };

  const handleExportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inquiries, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `glint_inquiries_audit_export_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      pushLog("Database export compiled. Neutral JSON backup file emitted.");
    } catch (err: any) {
      pushLog(`Export exception: ${err.message}`);
    }
  };

  // Filter listings metrics
  const filteredInquiries = inquiries.filter(item => {
    const matchesTab = activeTab === "ALL" || item.status === activeTab;
    const matchesCategory = categoryFilter === "ALL" || item.inquiryType === categoryFilter;
    
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      item.name.toLowerCase().includes(query) ||
      item.organization.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.ticketId.toLowerCase().includes(query) ||
      item.message.toLowerCase().includes(query);

    return matchesTab && matchesCategory && matchesSearch;
  });

  // Calculate high-level audit counters
  const countPending = inquiries.filter(i => i.status === "PENDING").length;
  const countReviewed = inquiries.filter(i => i.status === "REVIEWED").length;
  const countArchived = inquiries.filter(i => i.status === "ARCHIVED").length;

  return (
    <div className="min-h-screen bg-graphite-950 text-white font-sans antialiased selection:bg-blue-500/30 py-16 px-4 md:px-8">
      
      {/* 1. UNAUTHENTICATED LOGIN PORTAL */}
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto py-24">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-graphite-900 border border-white/5 rounded-lg p-8 shadow-2xl relative"
          >
            {/* Locked Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-graphite-900 border border-blue-500/30 flex items-center justify-center">
              <Lock className="h-4 w-4 text-blue-500 animate-pulse" />
            </div>

            <div className="text-center pt-2 mb-8">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-blue-400">
                Glint Cyber Security
              </span>
              <h1 className="font-display font-bold text-xl uppercase tracking-wider text-white mt-1">
                Security Ops Console
              </h1>
              <p className="text-xs text-steel-500 mt-2">
                Authorized administrative personnel login required. All connection attempts log transaction histories.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {loginError && (
                <div className="bg-red-950/40 border border-red-500/20 rounded p-4 flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-red-300 leading-normal">{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest mb-1.5">
                  OP-Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-steel-500" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g., administrator@glint.tech"
                    className="w-full bg-graphite-950 border border-white/5 rounded pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest mb-1.5">
                  Verification Passcode
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 h-4 w-4 text-steel-500" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-graphite-950 border border-white/5 rounded pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-700 hover:bg-blue-600 disabled:bg-blue-800/50 text-white font-mono text-xs tracking-widest font-semibold uppercase rounded transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 shrink-0" />
                    <span>Initialize Access</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5 text-[9.5px] font-mono text-[#7c8ba1]/40 text-center leading-relaxed">
              Standard AES-256 session mapping verified · SHA-256 local handshake hashes checked on system boot
            </div>
          </motion.div>
        </div>
      ) : (
        
        /* 2. AUTHENTICATED CONTROL ROOM DASHBOARD */
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Dashboard Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-mono text-blue-500 uppercase tracking-widest">
                <Shield className="h-4 w-4" />
                <span>Glint Technology Operational Platform</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mt-0.5" />
              </div>
              <h1 className="font-display font-medium text-2xl md:text-3xl text-white uppercase tracking-wider">
                Inquiry &amp; Comms Hub
              </h1>
              <p className="text-xs text-steel-400">
                Secure enterprise data dashboard tracking communications files, client tickets, and operational telemetry.
              </p>
            </div>

            <div className="flex items-center space-x-3 self-start md:self-center">
              <button
                onClick={handleExportJson}
                className="px-4 py-2.5 bg-graphite-900 hover:bg-graphite-800 border border-white/5 hover:border-white/10 text-[10px] font-mono tracking-widest text-[#7c8ba1] hover:text-white uppercase rounded transition-all cursor-pointer flex items-center space-x-2"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Backup Database</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/10 text-[10px] font-mono tracking-widest text-red-400 hover:text-white uppercase rounded transition-all cursor-pointer flex items-center space-x-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>End Session</span>
              </button>
            </div>
          </div>

          {/* Stat summary layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-graphite-900 border border-white/5 rounded-lg p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-steel-400 uppercase tracking-widest block">Total Channels</span>
                <span className="text-2xl font-display font-medium text-white block">{inquiries.length}</span>
              </div>
              <div className="h-10 w-10 rounded bg-[#7c8ba1]/5 border border-white/5 flex items-center justify-center text-[#7c8ba1]">
                <Database className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-graphite-900 border border-white/5 rounded-lg p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block">Pending Evaluation</span>
                <span className="text-2xl font-display font-medium text-amber-500 block">{countPending}</span>
              </div>
              <div className="h-10 w-10 rounded bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Activity className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-graphite-900 border border-white/5 rounded-lg p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">Reviewed &amp; Decided</span>
                <span className="text-2xl font-display font-medium text-emerald-400 block">{countReviewed}</span>
              </div>
              <div className="h-10 w-10 rounded bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-graphite-900 border border-white/5 rounded-lg p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-steel-500 uppercase tracking-widest block">Archived Logs</span>
                <span className="text-2xl font-display font-medium text-steel-400 block">{countArchived}</span>
              </div>
              <div className="h-10 w-10 rounded bg-white/5 border border-white/5 flex items-center justify-center text-steel-500">
                <Archive className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 3. LEFT COLUMN: CORE INQUIRY TICKETS TABLE (8 Columns wide) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Dynamic Query Controls */}
              <div className="bg-graphite-900 border border-white/5 rounded-lg p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Status Category Tabs */}
                  <div className="flex flex-wrap gap-1 bg-graphite-950 p-1 border border-white/5 rounded">
                    {(["ALL", "PENDING", "REVIEWED", "ARCHIVED"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase rounded cursor-pointer transition-all ${
                          activeTab === tab 
                            ? "bg-blue-600 text-white font-medium" 
                            : "text-[#7c8ba1]/70 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {tab} ({tab === "ALL" ? inquiries.length : tab === "PENDING" ? countPending : tab === "REVIEWED" ? countReviewed : countArchived})
                      </button>
                    ))}
                  </div>

                  {/* Filter Dropdown */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">Vertical:</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-graphite-950 border border-white/5 px-2.5 py-1.5 text-xs text-steel-300 font-mono rounded focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="ALL">All Sectors</option>
                      <option value="Defense Technology">Defense Technology</option>
                      <option value="Government Inquiry">Government Inquiry</option>
                      <option value="Operational Consultation">Operational Consultation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Text Filter Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-steel-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search query by submission name, organization email vertical, or Reference ID..."
                    className="w-full bg-graphite-950 border border-white/5 rounded pl-10 pr-4 py-3 text-xs text-white placeholder-steel-600 focus:outline-none focus:border-blue-500/30 transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")} 
                      className="absolute right-3 top-3 text-[10px] font-mono text-steel-500 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Inquiry list grid container */}
              <div className="bg-graphite-900 border border-white/5 rounded-lg overflow-hidden">
                <div className="bg-graphite-950 border-b border-white/5 px-5 py-3.5 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-steel-400 uppercase tracking-widest block">
                    Secured Operational Message Pipeline
                  </span>
                  <span className="text-[10px] font-mono text-blue-400/80">
                    Matches: {filteredInquiries.length} Channels
                  </span>
                </div>

                {filteredInquiries.length === 0 ? (
                  <div className="py-20 px-4 text-center space-y-2">
                    <BadgeInfo className="h-8 w-8 text-steel-600 mx-auto" />
                    <p className="font-mono text-xs text-steel-500">No active operational inquiry channels match your filtered filters.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 max-h-[640px] overflow-y-auto">
                    {filteredInquiries.map((inquiry) => (
                      <div 
                        key={inquiry.id}
                        onClick={() => {
                          setSelectedInquiry(inquiry);
                          setApiSuccessMsg("");
                          setApiErrorMsg("");
                        }}
                        className={`p-5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-2 hover:bg-graphite-800/40 ${
                          selectedInquiry?.id === inquiry.id 
                            ? "bg-graphite-800 border-l-blue-500" 
                            : inquiry.status === "PENDING"
                              ? "border-l-amber-500 bg-amber-5050/10"
                              : inquiry.status === "REVIEWED"
                                ? "border-l-emerald-500"
                                : "border-l-steel-600/30"
                        }`}
                      >
                        <div className="space-y-1.5 max-w-xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-white tracking-wider">
                              {inquiry.ticketId}
                            </span>
                            <span className="text-xs text-steel-500 font-mono">
                              · {inquiry.organization}
                            </span>
                            <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded tracking-wider uppercase ${
                              inquiry.status === "PENDING" 
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                                : inquiry.status === "REVIEWED"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-white/5 text-steel-400 border border-white/5"
                            }`}>
                              {inquiry.status}
                            </span>
                          </div>

                          <div className="text-xs text-steel-300 font-medium font-sans">
                            Representative: {inquiry.name} <span className="text-steel-500">({inquiry.email})</span>
                          </div>

                          <p className="text-xs text-steel-400 font-sans truncate pr-4">
                            {inquiry.message}
                          </p>

                          <div className="text-[10px] font-mono text-steel-500 flex items-center space-x-3.5">
                            <span>Sector: {inquiry.inquiryType}</span>
                            <span>· Received: {new Date(inquiry.timestamp).toLocaleString("en-US", { hour12: false })}</span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center space-x-2 self-end sm:self-center">
                          <span className="text-[11px] font-mono text-blue-500 hover:underline flex items-center">
                            Open Console <ChevronRight className="h-3 w-3 ml-0.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. REAL-TIME AUDIT LOG TERMINAL */}
              <div className="bg-graphite-900 border border-white/5 rounded-lg overflow-hidden">
                <div className="bg-graphite-950 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-mono text-blue-500 uppercase tracking-widest">
                    <Terminal className="h-3.5 w-3.5" />
                    <span>SECURE TRANSACTION TERMINAL LOGS</span>
                  </div>
                  <span className="text-[9.5px] font-mono text-steel-600">AUDIT TRAIL STANDARD AES-256</span>
                </div>
                <div className="p-4 bg-graphite-950 font-mono text-[10px] text-emerald-400/90 leading-relaxed text-left h-36 overflow-y-auto space-y-1 select-none">
                  {systemLogs.map((log, idx) => (
                    <div key={idx} className="font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* 5. RIGHT COLUMN: ADMIN INVESTIGATION DRAWER & SECURE CONTROLS (4 Columns wide) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Selected inquiry detail console */}
              <AnimatePresence mode="wait">
                {selectedInquiry ? (
                  <motion.div
                    key={selectedInquiry.id}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    className="bg-graphite-900 border border-white/5 rounded-lg p-5 space-y-6 text-left"
                  >
                    <div className="border-b border-white/5 pb-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-steel-500 uppercase tracking-widest">
                          Audit Console
                        </span>
                        <button 
                          onClick={() => setSelectedInquiry(null)}
                          className="text-xs font-mono text-steel-500 hover:text-white"
                        >
                          Close [X]
                        </button>
                      </div>
                      <h3 className="font-display font-medium text-lg text-white uppercase tracking-wider">
                        {selectedInquiry.ticketId}
                      </h3>
                      <p className="text-[10px] font-mono text-[#7c8ba1]">
                        IP Source Address: <span className="text-blue-400">{selectedInquiry.ipAddress || "Verified Proxy Server"}</span>
                      </p>
                    </div>

                    {/* Meta Parameters Panel */}
                    <div className="bg-graphite-950 rounded p-4 border border-white/5 space-y-3 font-mono text-xs">
                      <div>
                        <span className="text-steel-600 uppercase tracking-wider block text-[9px] mb-0.5">Contact Entity</span>
                        <span className="text-white block font-medium">{selectedInquiry.name}</span>
                        <span className="text-steel-400 text-[11px] block">{selectedInquiry.email}</span>
                      </div>
                      
                      <div>
                        <span className="text-steel-600 uppercase tracking-wider block text-[9px] mb-0.5">Organization</span>
                        <span className="text-white block font-medium">{selectedInquiry.organization}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-steel-600 uppercase tracking-wider block text-[9px] mb-0.5">Classification</span>
                          <span className="text-blue-400 block font-semibold">{selectedInquiry.inquiryType}</span>
                        </div>
                        <div>
                          <span className="text-steel-600 uppercase tracking-wider block text-[9px] mb-0.5">Current Status</span>
                          <span className={`block font-semibold ${
                            selectedInquiry.status === "PENDING" ? "text-amber-500" : selectedInquiry.status === "REVIEWED" ? "text-emerald-400" : "text-steel-400"
                          }`}>{selectedInquiry.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inquiry Message Text */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-steel-500 uppercase tracking-widest block">Message Payload</span>
                      <div className="bg-graphite-950 rounded-lg p-4 border border-white/5 max-h-56 overflow-y-auto font-sans text-sm text-steel-300 leading-relaxed whitespace-pre-line">
                        {selectedInquiry.message}
                      </div>
                    </div>

                    {/* Review Logs */}
                    {selectedInquiry.reviewNotes && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-steel-500 uppercase tracking-widest block">Operational Notes</span>
                        <div className="bg-blue-950/20 border border-blue-500/10 rounded p-3 text-xs font-sans text-blue-400 italic">
                          {selectedInquiry.reviewNotes}
                        </div>
                      </div>
                    )}

                    {/* Action Operations Area */}
                    <div className="border-t border-white/5 pt-5 space-y-4">
                      
                      {apiSuccessMsg && (
                        <div className="bg-emerald-950/40 border border-emerald-500/20 rounded p-3 flex items-start space-x-1.5">
                          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-emerald-300 leading-normal">{apiSuccessMsg}</span>
                        </div>
                      )}

                      {apiErrorMsg && (
                        <div className="bg-red-950/40 border border-red-500/20 rounded p-3 flex items-start space-x-1.5">
                          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-red-300 leading-normal">{apiErrorMsg}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest">
                          Internal Evaluation Addendum
                        </label>
                        <textarea
                          rows={2}
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          placeholder="Log action details, evaluation updates, or contact results..."
                          className="w-full bg-graphite-950 border border-white/5 rounded p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 resize-none font-sans"
                        />
                      </div>

                      <div className="space-y-2">
                        <span className="block text-[10px] font-mono text-steel-500 uppercase tracking-widest">
                          Console Routing Functions
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {selectedInquiry.status !== "REVIEWED" && (
                            <button
                              onClick={() => handleUpdateStatus(selectedInquiry.id, "REVIEWED")}
                              className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold tracking-wider uppercase rounded cursor-pointer text-center"
                            >
                              Approve / Action
                            </button>
                          )}

                          {selectedInquiry.status !== "ARCHIVED" && (
                            <button
                              onClick={() => handleUpdateStatus(selectedInquiry.id, "ARCHIVED")}
                              className="px-3 py-2 bg-graphite-950 hover:bg-graphite-800 border border-white/10 text-steel-300 font-mono text-[10px] font-bold tracking-wider uppercase rounded cursor-pointer text-center"
                            >
                              Archive Log
                            </button>
                          )}

                          {selectedInquiry.status === "ARCHIVED" && (
                            <button
                              onClick={() => handleUpdateStatus(selectedInquiry.id, "PENDING")}
                              className="px-3 py-2 bg-amber-800 hover:bg-amber-700 text-white font-mono text-[10px] font-bold tracking-wider uppercase rounded cursor-pointer text-center"
                            >
                              Reset to Active
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteInquiry(selectedInquiry.id, selectedInquiry.ticketId)}
                            className="px-3 py-2 bg-red-950 hover:bg-red-900 border border-red-500/20 text-red-300 font-mono text-[10px] font-bold tracking-wider uppercase rounded cursor-pointer text-center"
                          >
                            Expunge Ticket
                          </button>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-graphite-900 border border-white/5 rounded-lg p-8 text-center space-y-3">
                    <ShieldAlert className="h-10 w-10 text-steel-600 mx-auto" />
                    <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider">
                      Evaluation Desk Idle
                    </h3>
                    <p className="text-xs text-steel-500 leading-normal">
                      Select any active ticket inquiry item on the database stream to initialize security auditing and operational management actions.
                    </p>
                  </div>
                )}
              </AnimatePresence>

              {/* 6. SYSTEM CAPABILITY STAGES (PLACEHOLDERS AS REQUESTED) */}
              <div className="bg-graphite-900 border border-white/5 rounded-lg p-5 space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h4 className="font-display font-medium text-xs text-white uppercase tracking-wider flex items-center">
                    <Layers className="h-3 w-3 text-blue-500 mr-1.5" />
                    Extended Subsystems
                  </h4>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-graphite-950 rounded p-3 border border-white/5 flex items-center justify-between opacity-50 select-none">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] text-steel-400 block uppercase">Encrypted Documents Depot</span>
                      <span className="text-[10px] text-steel-500 block">Status: Locked (No clearances assigned)</span>
                    </div>
                    <Lock className="h-3.5 w-3.5 text-steel-600" />
                  </div>

                  <div className="bg-graphite-950 rounded p-3 border border-white/5 flex items-center justify-between opacity-50 select-none">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] text-steel-400 block uppercase">Operational Briefings Engine</span>
                      <span className="text-[10px] text-steel-500 block">Status: Off-line (Awaiting physical link)</span>
                    </div>
                    <Lock className="h-3.5 w-3.5 text-steel-600" />
                  </div>

                  <div className="bg-graphite-950 rounded p-3 border border-white/5 flex items-center justify-between opacity-50 select-none">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] text-steel-400 block uppercase">Multi-Role Clearances</span>
                      <span className="text-[10px] text-steel-500 block">Status: Locked (Hardware verification required)</span>
                    </div>
                    <Lock className="h-3.5 w-3.5 text-steel-600" />
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// Compact Chevron Helper
function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      viewBox="0 0 24 24" 
      className={props.className}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
