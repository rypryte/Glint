import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, Lock, Unlock, User, Mail, Send, CheckCircle, 
  Trash2, Plus, Terminal, Activity, FileText, Wifi, Video, 
  Phone, PhoneOff, Database, Layers, Key, Check, PlusCircle,
  HelpCircle, CreditCard, RefreshCw, AlertTriangle, ArrowRight,
  DownloadCloud, Clipboard, ExternalLink, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  status: "PROVISIONING" | "ACTIVE" | "ARCHIVED";
  createdAt: string;
}

interface Message {
  id: string;
  projectId: string;
  senderName: string;
  senderRole: "CLIENT" | "ADMIN" | "SYSTEM";
  content: string;
  timestamp: string;
}

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  updatedAt: string;
}

interface PaymentInvoice {
  id: string;
  projectId: string;
  amount: number;
  description: string;
  status: "UNPAID" | "PAID";
  createdAt: string;
  paidAt?: string;
  onboardingTokenGenerated?: string;
}

interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
}

export default function WorkspaceDashboard() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<"LOGIN" | "ONBOARD">("LOGIN");
  
  // Login input states
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [onboardToken, setOnboardToken] = useState<string>("");
  const [onboardEmail, setOnboardEmail] = useState<string>("");
  const [onboardName, setOnboardName] = useState<string>("");
  const [onboardPassword, setOnboardPassword] = useState<string>("");
  
  // Feedback alerts
  const [authError, setAuthError] = useState<string>("");
  const [authSuccess, setAuthSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Authed Client Info
  const [clientProfile, setClientProfile] = useState<{ id: string; email: string; name: string; alias: string } | null>(null);

  // Workspace active features states
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [payments, setPayments] = useState<PaymentInvoice[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"SUMMARY" | "COMMS" | "MILESTONES" | "FILES" | "PAYMENTS" | "VOICE">("SUMMARY");

  // Interactive message dispatch
  const [sendingMsg, setSendingMsg] = useState<boolean>(false);
  const [newMessageText, setNewMessageText] = useState<string>("");

  // Simulated New File uploads
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [uploadFileSize, setUploadFileSize] = useState<string>("2.1 MB");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Secure voice stream feed states (visual demo)
  const [voiceConnected, setVoiceConnected] = useState<boolean>(false);
  const [audioStreamLevel, setAudioStreamLevel] = useState<number[]>([12, 24, 8, 45, 12, 18, 32, 54, 12, 6, 22, 19, 39, 44, 15, 8]);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulation Gate auxiliary tool (for easy previewing)
  const [demoPanelOpen, setDemoPanelOpen] = useState<boolean>(true);
  const [demoCompanyName, setDemoCompanyName] = useState<string>("Apex Defence Systems");
  const [demoClientEmail, setDemoClientEmail] = useState<string>("ryamypritere@gmail.com");
  const [demoRepresentative, setDemoRepresentative] = useState<string>("Dir. Henderson");
  const [demoClassification, setDemoClassification] = useState<string>("Defense Technology");
  const [demoGeneratedReceipt, setDemoGeneratedReceipt] = useState<any>(null);

  useEffect(() => {
    // Validate current Client security authorization token
    const token = localStorage.getItem("glint_workspace_token");
    if (token) {
      pushLog("Analyzing stored client token signature...");
      fetch("/api/workspace/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error("Expired session.");
          return res.json();
        })
        .then(data => {
          setClientProfile(data.user);
          setIsAuthenticated(true);
          pushLog(`Workspace token validated. Handshake authorized as: ${data.user.alias}`);
          loadWorkspaceData(token);
        })
        .catch(() => {
          pushLog("Local workspace credentials expired. Redirecting to login desk.");
          localStorage.removeItem("glint_workspace_token");
          setIsAuthenticated(false);
          setIsCheckingSession(false);
        });
    } else {
      pushLog("Workspace security validation: Standalone unauthenticated layout.");
      setIsCheckingSession(false);
    }
  }, []);

  const pushLog = (txt: string) => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${time}] ${txt}`, ...prev.slice(0, 39)]);
  };

  const loadWorkspaceData = async (tokenOverride?: string) => {
    const token = tokenOverride || localStorage.getItem("glint_workspace_token");
    if (!token) return;

    try {
      const res = await fetch("/api/workspace/projects", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
        if (data.projects && data.projects.length > 0) {
          selectProjectSpace(data.projects[0], token);
        } else {
          pushLog("Notice: Provisioning queue empty. No projects found on profile.");
        }
      }
    } catch (err: any) {
      pushLog(`Fatal workspace sync error: ${err.message}`);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const selectProjectSpace = async (project: Project, tokenOverride?: string) => {
    const token = tokenOverride || localStorage.getItem("glint_workspace_token");
    if (!token) return;

    setActiveProject(project);
    pushLog(`Compartment switched: Initializing secure link to project ${project.id}`);

    // Fetch related messages, milestones, files, payments parallel
    try {
      const [msgRes, milRes, payRes, filRes] = await Promise.all([
        fetch(`/api/workspace/projects/${project.id}/messages`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`/api/workspace/projects/${project.id}/milestones`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`/api/workspace/projects/${project.id}/payments`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`/api/workspace/projects/${project.id}/files`, { headers: { "Authorization": `Bearer ${token}` } }),
      ]);

      const [msgData, milData, payData, filData] = await Promise.all([
        msgRes.json(),
        milRes.json(),
        payRes.json(),
        filRes.json(),
      ]);

      if (msgRes.ok) setMessages(msgData.messages || []);
      if (milRes.ok) setMilestones(milData.milestones || []);
      if (payRes.ok) setPayments(payData.payments || []);
      if (filRes.ok) setFiles(filData.files || []);

      pushLog(`Sync complete. Project metrics downloaded cleanly.`);
    } catch (err: any) {
      pushLog(`Fail fetching workspace channels: ${err.message}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/workspace/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Decryption signature rejection.");

      localStorage.setItem("glint_workspace_token", data.token);
      setClientProfile(data.user);
      setIsAuthenticated(true);
      pushLog(`Manual entry login successful! Operational alias: ${data.user.alias}`);
      loadWorkspaceData(data.token);
    } catch (err: any) {
      setAuthError(err.message || "Credential mapping mismatch.");
      pushLog(`Failed client portal login attempt on email: ${loginEmail}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/workspace/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          onboardingToken: onboardToken.trim(), 
          password: onboardPassword,
          name: onboardName,
          email: onboardEmail
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Token activation failed.");

      setAuthSuccess(`Onboarding handshake verified! Claimed as alias: ${data.user?.alias || "Active Operator"}. Please login using your password.`);
      setOnboardToken("");
      setOnboardPassword("");
      setOnboardName("");
      setOnboardEmail("");
      setAuthMode("LOGIN");
      pushLog(`Onboarding Token claimed successfully. Registration entry verified.`);
    } catch (err: any) {
      setAuthError(err.message || "Invalid onboarding certificate.");
      pushLog(`Failed onboarding activation signature on token: ${onboardToken}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("glint_workspace_token");
    setIsAuthenticated(false);
    setClientProfile(null);
    setProjects([]);
    setActiveProject(null);
    setMessages([]);
    setMilestones([]);
    setPayments([]);
    setFiles([]);
    pushLog("Manual session invalidation. Standard security keys wiped.");
  };

  // Dispatch message to project thread
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newMessageText.trim() || sendingMsg) return;

    setSendingMsg(true);
    const token = localStorage.getItem("glint_workspace_token");
    if (!token) return;

    const originalText = newMessageText;
    setNewMessageText("");

    try {
      const res = await fetch(`/api/workspace/projects/${activeProject.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: originalText })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to dispatch packet.");

      // Append locally
      setMessages(prev => [...prev, data.message]);
      pushLog(`Dispatched secure client signal of size ${originalText.length}B.`);

      // Simulated auto-reload of messages to capture system confirmation response seconds later
      setTimeout(async () => {
        const reloadRes = await fetch(`/api/workspace/projects/${activeProject!.id}/messages`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const reloadData = await reloadRes.json();
        if (reloadRes.ok) {
          setMessages(reloadData.messages || []);
        }
      }, 1600);

    } catch (err: any) {
      pushLog(`Signal transmit error: ${err.message}`);
    } finally {
      setSendingMsg(false);
    }
  };

  // Toggle dynamic milestones checklist
  const handleToggleMilestone = async (mId: string, currentStatus: string) => {
    if (!activeProject) return;
    const token = localStorage.getItem("glint_workspace_token");
    if (!token) return;

    const nextStatus = currentStatus === "COMPLETED" ? "IN_PROGRESS" : currentStatus === "IN_PROGRESS" ? "PENDING" : "COMPLETED";

    try {
      const res = await fetch(`/api/workspace/projects/${activeProject.id}/milestones/${mId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await res.json();
      if (res.ok) {
        setMilestones(prev => prev.map(m => m.id === mId ? data.milestone : m));
        pushLog(`Phase altered: Checked ${data.milestone.title} status to ${nextStatus}`);
      }
    } catch (err: any) {
      pushLog(`Milestone write error: ${err.message}`);
    }
  };

  // Simulate payment settlements instantly
  const handleSettleSandboxPayment = async (payId: string) => {
    if (!activeProject) return;
    pushLog(`Initiating sandbox direct ledger settlement on invoice ${payId}...`);

    try {
      const res = await fetch(`/api/workspace/projects/${activeProject.id}/payments/${payId}/settle`, {
        method: "POST"
      });

      const data = await res.json();
      if (res.ok) {
        setPayments(prev => prev.map(p => p.id === payId ? data.payment : p));
        pushLog(`Settle cleared on ledger: Handshake verification verified. Status: PAID.`);
      }
    } catch (err: any) {
      pushLog(`Gateway clearing error: ${err.message}`);
    }
  };

  // Simulate Add Secure File Blueprint
  const handleAddSecureFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !uploadFileName.trim()) return;

    setIsUploading(true);
    const token = localStorage.getItem("glint_workspace_token");
    if (!token) return;

    try {
      const res = await fetch(`/api/workspace/projects/${activeProject.id}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ fileName: uploadFileName.trim(), fileSize: uploadFileSize })
      });

      const data = await res.json();
      if (res.ok) {
        setFiles(prev => [...prev, data.file]);
        setUploadFileName("");
        pushLog(`Encrypted vault additions committed: blueprint doc ${data.file.fileName}`);
      }
    } catch (err: any) {
      pushLog(`File upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Secure File Blueprint
  const handleDeleteSecureFile = async (fId: string, name: string) => {
    if (!activeProject) return;
    const token = localStorage.getItem("glint_workspace_token");
    if (!token) return;

    try {
      const res = await fetch(`/api/workspace/projects/${activeProject.id}/files/${fId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== fId));
        pushLog(`Wiped blueprint record: Expunged document ${name}`);
      }
    } catch (err: any) {
      pushLog(`Blueprint deletion failed: ${err.message}`);
    }
  };

  // Simulated Voice Feed Activity Loops
  const toggleVoiceRoom = () => {
    if (!voiceConnected) {
      setVoiceConnected(true);
      pushLog("Channel Calibration: Initializing real-time voice operations tunnel...");
      audioIntervalRef.current = setInterval(() => {
        setAudioStreamLevel(prev => prev.map(() => Math.floor(5 + Math.random() * 85)));
      }, 150);
    } else {
      setVoiceConnected(false);
      pushLog("Real-time voice telemetry session invalidated cleanly.");
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
  };

  // Sandbox simulation tool helper (makes a real-time simulate-order payload post)
  const handleSimulationTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const response = await fetch("/api/workspace/simulate-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: demoRepresentative,
          email: demoClientEmail,
          organization: demoCompanyName,
          inquiryType: demoClassification,
          amount: 14750,
          description: `Glint High-Security Hardware Node Deployment Bundle & Encryption Crypt-Lines`
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to trigger automated simulation order.");

      setDemoGeneratedReceipt(result);
      // Auto-pre-fill claim fields to make sandbox testing remarkably fluid
      setOnboardToken(result.onboardingToken);
      setOnboardEmail(result.clientEmail);
      setOnboardName(demoRepresentative);
      setLoginEmail(result.clientEmail);
      setLoginPassword("password123");

      pushLog(`[SANDBOX] Core billing triggered. Client account pre-provisioned. Use token ${result.onboardingToken}`);
    } catch (err: any) {
      setAuthError(err.message || "Billing sandbox simulation fault.");
    } finally {
      setIsLoading(false);
    }
  };

  // Clean Audio state
  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-graphite-950 text-white font-sans antialiased selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. DEMO SANDBOX INSTRUMENT PANEL - ACCESSIBLE FOR CONVENIENT EVALUATION */}
      <div className="relative z-50 bg-[#1e293b] border-b border-blue-500/20 px-4 py-3 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-emerald-400 tracking-wider">
              [SANDBOX MANUAL ROUTING ACCESS PANEL]
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDemoPanelOpen(!demoPanelOpen)}
              className="text-[10.5px] font-mono tracking-widest bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white px-3 py-1 border border-blue-500/30 rounded uppercase transition-all"
            >
              {demoPanelOpen ? "Minimize Instrument" : "Configure Simulation Order"}
            </button>
          </div>
        </div>

        {/* Extended Settings Drawer */}
        <AnimatePresence>
          {demoPanelOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="max-w-7xl mx-auto overflow-hidden mt-2 border-t border-slate-700/60 pt-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-left text-xs text-slate-300">
                
                {/* Simulator Inputs */}
                <form onSubmit={handleSimulationTrigger} className="md:col-span-5 space-y-2.5 bg-slate-900/40 p-3 rounded border border-slate-700">
                  <span className="block font-mono text-[9.5px] uppercase text-blue-400 tracking-widest font-semibold">
                    1. Emplaced Billing Event Trigger
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="block text-[8px] uppercase tracking-wider text-slate-400">Representative</label>
                      <input 
                        type="text" 
                        value={demoRepresentative} 
                        onChange={(e)=>setDemoRepresentative(e.target.value)} 
                        className="w-full bg-slate-950/80 border border-slate-700 rounded p-1 text-white border-white/5" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-wider text-slate-400">Target Email</label>
                      <input 
                        type="email" 
                        value={demoClientEmail} 
                        onChange={(e)=>setDemoClientEmail(e.target.value)} 
                        className="w-full bg-slate-950/80 border border-slate-700 rounded p-1 text-white border-white/5" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="block text-[8px] uppercase tracking-wider text-slate-400">Organization / Agency</label>
                      <input 
                        type="text" 
                        value={demoCompanyName} 
                        onChange={(e)=>setDemoCompanyName(e.target.value)} 
                        className="w-full bg-slate-950/80 border border-slate-700 rounded p-1 text-white border-white/5" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-wider text-slate-400">Classification Sector</label>
                      <select 
                        value={demoClassification} 
                        onChange={(e)=>setDemoClassification(e.target.value)} 
                        className="w-full bg-slate-950/80 border border-slate-700 rounded p-1 text-white text-[10.5px] border-white/5 font-sans"
                      >
                        <option>Defense Technology</option>
                        <option>Government Inquiry</option>
                        <option>Operational Consultation</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 font-mono text-[9px] tracking-widest font-bold text-white rounded uppercase cursor-pointer"
                  >
                    Clear Payment &amp; Auto-Provision Workspace
                  </button>
                </form>

                {/* Simulator Outputs */}
                <div className="md:col-span-7 space-y-2.5">
                  <span className="block font-mono text-[9.5px] uppercase text-emerald-400 tracking-widest font-semibold">
                    2. Provisioning Result Output (Client Receipt Envelope)
                  </span>

                  {!demoGeneratedReceipt ? (
                    <div className="bg-[#0f172a]/80 p-5 rounded border border-slate-800 text-center text-slate-500 text-[11px] h-28 flex flex-col items-center justify-center font-mono">
                      <Database className="h-5 w-5 text-slate-600 mb-1" />
                      Awaiting Sandbox Trigger...
                      <p className="text-[9px] text-slate-600 mt-1 max-w-sm">Pressing "Clear Payment" will simulate invoice checkout, spawn high-security onboarding keys, provision isolated database rooms, and formulate operational templates.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-3 rounded border border-emerald-500/20 text-[#22c55e] h-28 overflow-y-auto font-mono text-[10.5px] space-y-1 relative">
                      <div className="flex items-center justify-between text-[9px] border-b border-emerald-500/10 pb-1 mb-1 text-emerald-500 font-semibold uppercase">
                        <span>HANDSHAKE_PROSECUTED</span>
                        <span>TOKEN APPLIED</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4">
                        <div>&gt; ONBOARDING TOKEN: <span className="text-white underline">{demoGeneratedReceipt.onboardingToken}</span></div>
                        <div>&gt; GENERATED ALIAS: <span className="text-white">{demoGeneratedReceipt.alias}</span></div>
                        <div>&gt; ACCESS EMAIL: <span className="text-white">{demoGeneratedReceipt.clientEmail}</span></div>
                        <div>&gt; DEFAULT PASSWORD: <span className="text-white">{demoGeneratedReceipt.tempPassword}</span></div>
                        <div>&gt; PROJECT DURATION: <span className="text-white">Provisioned - ACTIVE</span></div>
                        <div>&gt; FEE CHARGES: <span className="text-white">${demoGeneratedReceipt.paymentAmount?.toLocaleString()} Paid</span></div>
                      </div>
                      <div className="bg-blue-600 text-white font-mono text-[9px] tracking-wide px-1.5 py-0.5 rounded absolute bottom-2 right-2 flex items-center">
                        Active Keys Spawned <Check className="h-2.5 w-2.5 ml-1" />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. MAIN APPLICATION CONTENT PORTAL */}
      {!isAuthenticated ? (
        
        /* AUTH REGISTRATION / CLIM DESK */
        <div className="max-w-md mx-auto py-24 px-4">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-graphite-900 border border-white/5 rounded-lg p-8 shadow-2xl relative"
          >
            {/* Logo Emblem */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-graphite-900 border border-blue-500/30 flex items-center justify-center">
              <Key className="h-4 w-4 text-blue-500" />
            </div>

            <div className="text-center pt-2 mb-6">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-blue-500 block">
                Glint Workspace Portal
              </span>
              <h1 className="font-display font-bold text-xl uppercase tracking-wider text-white mt-1">
                Secure Client Operations
              </h1>
              <p className="text-xs text-steel-500 mt-2">
                Log into your custom independent execution environment. Protected by state-of-the-art cryptographic signatures and isolated databases.
              </p>
            </div>

            {authError && (
              <div className="mb-5 bg-red-950/40 border border-red-500/20 rounded p-4 flex items-start space-x-2">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs text-red-300 leading-normal">{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-5 bg-emerald-950/40 border border-emerald-500/20 rounded p-4 flex items-start space-x-2 animate-pulse">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-emerald-300 leading-normal">{authSuccess}</span>
              </div>
            )}

            {/* Tab switchers */}
            <div className="flex bg-graphite-950 p-1 border border-white/5 rounded mb-6">
              <button 
                onClick={() => { setAuthMode("LOGIN"); setAuthError(""); }}
                className={`flex-1 py-1.5 text-xs font-mono tracking-wider uppercase rounded ${authMode === "LOGIN" ? "bg-blue-600 text-white font-medium" : "text-[#7c8ba1]/70 hover:text-white"}`}
              >
                Access Login
              </button>
              <button 
                onClick={() => { setAuthMode("ONBOARD"); setAuthError(""); }}
                className={`flex-1 py-1.5 text-xs font-mono tracking-wider uppercase rounded ${authMode === "ONBOARD" ? "bg-blue-600 text-white font-medium" : "text-[#7c8ba1]/70 hover:text-white"}`}
              >
                Onboard Claim
              </button>
            </div>

            {authMode === "LOGIN" ? (
              
              /* login FORM */
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest mb-1.5 text-left">
                    Representative OP-Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-steel-500" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="operator@agency.gov"
                      className="w-full bg-graphite-950 border border-white/5 rounded pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest mb-1.5 text-left">
                    Security Passphrase
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-steel-500" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-graphite-950 border border-white/5 rounded pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <div className="text-right mt-1.5">
                    <span 
                      onClick={() => {
                        setAuthError("For workspace access assistance, please request onboarding token confirmation from your administrator.");
                      }} 
                      className="text-[9px] font-mono text-blue-500 hover:underline cursor-pointer"
                    >
                      Retrieve credentials assistance?
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-700 hover:bg-blue-600 disabled:bg-blue-800/40 text-white font-mono text-xs tracking-widest uppercase font-bold rounded cursor-pointer transition-all flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Verifying signature security...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Authenticate Terminal</span>
                    </>
                  )}
                </button>
              </form>
              
            ) : (
              
              /* ONBOARD SYSTEM FORM */
              <form onSubmit={handleOnboardActivation} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest mb-1.5 text-left">
                    Onboarding Token Key
                  </label>
                  <div className="relative">
                    <Terminal className="absolute left-3 top-3 h-4 w-4 text-[#7c8ba1]" />
                    <input
                      type="text"
                      required
                      value={onboardToken}
                      onChange={(e) => setOnboardToken(e.target.value)}
                      placeholder="GNT-ONB-XXXXX (Use Simulator above!)"
                      className="w-full bg-graphite-950 border border-white/5 rounded pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 text-left placeholder:text-steel-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] font-mono text-steel-400 uppercase tracking-widest mb-1.5 text-left">
                      Client Name
                    </label>
                    <input
                      type="text"
                      required
                      value={onboardName}
                      onChange={(e) => setOnboardName(e.target.value)}
                      placeholder="e.g., Dir. Cooper"
                      className="w-full bg-graphite-950 border border-white/5 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-mono text-steel-400 uppercase tracking-widest mb-1.5 text-left">
                      Account Email
                    </label>
                    <input
                      type="email"
                      required
                      value={onboardEmail}
                      onChange={(e) => setOnboardEmail(e.target.value)}
                      placeholder="cooper@agency.gov"
                      className="w-full bg-graphite-950 border border-white/5 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-steel-400 uppercase tracking-widest mb-1.5 text-left">
                    Establish Secure Passphrase
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#7c8ba1]" />
                    <input
                      type="password"
                      required
                      value={onboardPassword}
                      onChange={(e) => setOnboardPassword(e.target.value)}
                      placeholder="Define account secret code..."
                      className="w-full bg-graphite-950 border border-white/5 rounded pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 text-left placeholder:text-steel-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 disabled:bg-emerald-900/40 text-white font-mono text-xs tracking-widest uppercase font-bold rounded cursor-pointer transition-all flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Activate Workspace Node</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-white/5 text-[9.5px] font-mono text-[#7c8ba1]/40 text-center leading-relaxed">
              Expiring onboarding links · Standard security compartmentalization strictly enforced
            </div>
          </motion.div>
        </div>
        
      ) : (
        
        /* 3. AUTHENTICATED WORKSPACE DESIRED INFRASTRUCTURE */
        <div className="flex flex-col lg:flex-row min-h-screen text-left">
          
          {/* Left Operations Rail */}
          <div className="lg:w-72 bg-graphite-900 border-r border-white/5 flex flex-col pt-12">
            
            {/* Header / Client Identity */}
            <div className="p-6 border-b border-white/5 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="h-7 w-7 bg-blue-600/10 border border-blue-500/30 rounded flex items-center justify-center text-blue-400">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-blue-500 block">System Connected</span>
                  <span className="text-sm font-display font-bold uppercase tracking-wider text-white">Glint Operations</span>
                </div>
              </div>

              {/* Client Profile Box */}
              {clientProfile && (
                <div className="bg-graphite-950 border border-white/5 rounded p-3 space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-steel-300">
                    <User className="h-3.5 w-3.5 text-steel-500" />
                    <span className="font-medium font-mono truncate">{clientProfile.alias}</span>
                  </div>
                  <div className="text-[10px] text-steel-500 block leading-tight truncate">
                    Email: {clientProfile.email}
                  </div>
                </div>
              )}
            </div>

            {/* Project Selection Channels */}
            <div className="p-4 flex-1 space-y-4">
              <span className="block text-[8px] font-mono text-steel-500 uppercase tracking-widest px-2">
                ACTIVE PROJECTS ({projects.length})
              </span>

              {projects.length === 0 ? (
                <div className="p-3 bg-graphite-950/40 border border-white/5 text-center text-[10.5px] text-steel-600 rounded">
                  No operational nodes mapped. Awaiting onboarding clear.
                </div>
              ) : (
                <div className="space-y-1">
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => selectProjectSpace(p)}
                      className={`w-full text-left px-3 py-2.5 rounded text-xs transition-colors flex items-center justify-between font-mono ${activeProject?.id === p.id ? "bg-blue-600/15 border-l-2 border-blue-500 text-white font-semibold" : "text-[#7c8ba1] hover:text-white hover:bg-white/5"}`}
                    >
                      <span className="truncate pr-2">{p.name}</span>
                      <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded shrink-0">{p.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live Navigation Tabs */}
            <div className="p-4 border-t border-white/5 space-y-1">
              <span className="block text-[8px] font-mono text-steel-500 uppercase tracking-widest px-2 mb-2">
                PLATFORM CORE CONTROLS
              </span>
              
              {([
                { id: "SUMMARY", label: "Executive Summary", icon: Layers },
                { id: "COMMS", label: "Communications", icon: Send },
                { id: "MILESTONES", label: "Milestones", icon: CheckCircle },
                { id: "FILES", label: "Crypto Files Locker", icon: FileText },
                { id: "PAYMENTS", label: "Financial Desk", icon: CreditCard },
                { id: "VOICE", label: "Live Voice Room", icon: Phone }
              ] as const).map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveWorkspaceTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition-all flex items-center space-x-2.5 ${activeWorkspaceTab === tab.id ? "bg-white/5 text-white font-medium" : "text-steel-400 hover:text-white hover:bg-white/5"}`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Logout anchor footer */}
            <div className="p-4 bg-graphite-950 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 font-mono text-[10.5px] uppercase tracking-wider rounded transition-colors"
              >
                End Session Keys
              </button>
            </div>
          </div>

          {/* Right Main Panel with dynamic viewport tab rendering */}
          <div className="flex-1 bg-graphite-950 flex flex-col min-h-screen">
            
            {/* Upper Telemetry Bar */}
            <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="text-[#8a99ad] uppercase">Active Channel:</span>
                <span className="text-white font-bold">{activeProject ? activeProject.name : "Unassigned"}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-center space-x-4 text-[10.5px] font-mono select-none text-[#7c8ba1]">
                <span>Sec: <span className="text-blue-500 font-bold">AES-256</span></span>
                <span>DB: <span className="text-emerald-400 font-bold">ISOLATED_LEDGER</span></span>
              </div>
            </div>

            {/* Content Viewport render tab conditions */}
            <div className="p-6 md:p-8 flex-1 max-w-5xl w-full mx-auto space-y-6 overflow-y-auto">
              
              <AnimatePresence mode="wait">
                {activeWorkspaceTab === "SUMMARY" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="space-y-6 text-left"
                  >
                    <div className="border-b border-white/5 pb-4">
                      <h2 className="text-xl font-display font-semibold uppercase tracking-wider">PROJECT EXECUTIVE OVERVIEW</h2>
                      <p className="text-xs text-steel-400 mt-1">Operational specifications and localized node credentials representing this isolated project compartment.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      <div className="bg-graphite-900 border border-white/5 rounded-lg p-5 md:col-span-2 space-y-4">
                        <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-semibold block">Chamber Specifications</span>
                        
                        <div className="space-y-2 text-xs leading-relaxed text-steel-300">
                          <p><span className="text-white font-semibold">Chamber Title:</span> {activeProject?.name}</p>
                          <p><span className="text-white font-semibold">Security Identifier:</span> {activeProject?.id}</p>
                          <p><span className="text-white font-semibold">Provision Date:</span> {activeProject ? new Date(activeProject.createdAt).toLocaleString() : ""}</p>
                          <p><span className="text-white font-semibold font-mono">Active Client Alias:</span> {clientProfile?.alias}</p>
                          <p className="pt-2 text-[11.5px] text-[#8fa0b5] border-t border-slate-800 italic">{activeProject?.description}</p>
                        </div>
                      </div>

                      <div className="bg-graphite-900 border border-white/5 rounded-lg p-5 space-y-4">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold block">Node Telemetry</span>
                        
                        <div className="space-y-3 font-mono text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-steel-400">Node Status:</span>
                            <span className="text-emerald-400 font-semibold">ACTIVE</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-steel-400">Encryption Tunnel:</span>
                            <span className="text-blue-400 font-semibold animate-pulse">ESTABLISHED</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-steel-400">Ledger Keys:</span>
                            <span className="text-slate-400">ROTATING</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-steel-400">Ping Response:</span>
                            <span className="text-emerald-500 font-bold">0.4ms</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Operational Guidelines block */}
                    <div className="bg-graphite-900 border border-white/5 rounded-lg p-6 space-y-3 font-sans text-xs text-steel-400 leading-relaxed">
                      <div className="flex items-center space-x-2 text-white font-mono text-[10.5px] uppercase tracking-widest">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>Security Directive 14-B</span>
                      </div>
                      <p>All communication inside this operational portal is private and double-blind audited. Under absolutely no conditions will details of the physical node configurations, drone layout files, or private consultation briefing tickets be shared on external web networks. Use the direct cryptographic message stream for continuous technical liaison updates.</p>
                    </div>
                  </motion.div>
                )}

                {activeWorkspaceTab === "COMMS" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="space-y-6 text-left"
                  >
                    <div className="border-b border-white/5 pb-4">
                      <h2 className="text-xl font-display font-semibold uppercase tracking-wider">PRIVATE SIGNAL INTERCEPT</h2>
                      <p className="text-xs text-steel-400 mt-1">Secure direct stream to Glint Security Engineers and operational dispatch operators.</p>
                    </div>

                    {/* Message Box */}
                    <div className="bg-graphite-900 border border-white/5 rounded-lg overflow-hidden flex flex-col h-[420px]">
                      
                      {/* Thread Messages */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-4 divide-y divide-[#7c8ba1]/5 h-full">
                        {messages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs font-mono space-y-2">
                            <span>Initializing operational channel...</span>
                          </div>
                        ) : (
                          messages.map((m, idx) => (
                            <div key={m.id} className={`pt-4 ${idx === 0 ? 'pt-0' : ''} space-y-1`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2.5">
                                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${m.senderRole === "SYSTEM" ? "bg-red-950/40 text-red-400 border border-red-500/10" : m.senderRole === "ADMIN" ? "bg-blue-600/10 text-blue-400" : "bg-emerald-900/10 text-emerald-400"}`}>
                                    {m.senderRole}
                                  </span>
                                  <span className="text-xs font-semibold text-white font-mono">{m.senderName}</span>
                                </div>
                                <span className="text-[9px] font-mono text-slate-600">
                                  {new Date(m.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-xs text-[#d1d5db] font-sans pl-1 pt-1 break-words leading-relaxed whitespace-pre-wrap">
                                {m.content}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Transmit Form */}
                      <form onSubmit={handleSendMessage} className="bg-graphite-950 border-t border-white/5 p-3 flex space-x-3">
                        <input
                          type="text"
                          required
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          placeholder="Type cryptographic message to transmit..."
                          className="flex-1 bg-graphite-900 border border-white/5 rounded px-3.5 py-2.5 text-xs text-white placeholder-steel-600 focus:outline-none focus:border-blue-500/50"
                        />
                        <button
                          type="submit"
                          disabled={sendingMsg}
                          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded shrink-0 flex items-center space-x-1.5 cursor-pointer"
                        >
                          {sendingMsg ? (
                            <span className="animate-spin text-white">⋯</span>
                          ) : (
                            <>
                              <span>Send Signal</span>
                              <Send className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      </form>

                    </div>
                  </motion.div>
                )}

                {activeWorkspaceTab === "MILESTONES" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="space-y-6 text-left"
                  >
                    <div className="border-b border-white/5 pb-4">
                      <h2 className="text-xl font-display font-semibold uppercase tracking-wider">MILESTONES TRACKER</h2>
                      <p className="text-xs text-steel-400 mt-1">Keep track of physical provisioning queues, network calibrations, and operational test sessions.</p>
                    </div>

                    <div className="bg-graphite-900 border border-white/5 rounded-lg divide-y divide-white/5">
                      {milestones.length === 0 ? (
                        <div className="py-12 text-center text-xs font-mono text-steel-500">
                          Awaiting milestone generation schema...
                        </div>
                      ) : (
                        milestones.map(m => (
                          <div key={m.id} className="p-5 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="text-xs font-mono font-semibold text-white tracking-wide">{m.title}</h4>
                              <p className="text-[10px] text-[#7c8ba1]">Updated: {new Date(m.updatedAt).toLocaleString()}</p>
                            </div>

                            <button
                              onClick={() => handleToggleMilestone(m.id, m.status)}
                              className={`px-3 py-1.5 rounded font-mono text-[9px] font-bold tracking-widest uppercase cursor-pointer transition-all ${
                                m.status === "COMPLETED" 
                                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" 
                                  : m.status === "IN_PROGRESS"
                                    ? "bg-blue-950/40 text-blue-400 border border-blue-500/20"
                                    : "bg-slate-900 text-[#7c8ba1] border border-slate-800"
                              }`}
                            >
                              {m.status}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {activeWorkspaceTab === "FILES" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="space-y-6 text-left"
                  >
                    <div className="border-b border-white/5 pb-4">
                      <h2 className="text-xl font-display font-semibold uppercase tracking-wider">CRYPTOGRAPHIC VAULT</h2>
                      <p className="text-xs text-steel-400 mt-1">Upload technical drawings, security parameter briefs, and localized zone mapping documents securely.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                      
                      {/* Upload Form Panel */}
                      <div className="bg-graphite-900 border border-white/5 rounded-lg p-5 space-y-4">
                        <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block">Encrypt New Asset</span>
                        
                        <form onSubmit={handleAddSecureFile} className="space-y-3.5">
                          <div>
                            <label className="block text-[8px] font-mono uppercase tracking-wider text-steel-400 mb-1">File Name</label>
                            <input
                              type="text"
                              required
                              value={uploadFileName}
                              onChange={(e) => setUploadFileName(e.target.value)}
                              placeholder="e.g. drone_blueprint_grid_a.zip"
                              className="w-full bg-graphite-950 border border-white/5 rounded px-2.5 py-2 text-xs text-white placeholder-steel-750 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[8px] font-mono uppercase tracking-wider text-steel-400 mb-1">Target Payload Size</label>
                            <select
                              value={uploadFileSize}
                              onChange={(e) => setUploadFileSize(e.target.value)}
                              className="w-full bg-graphite-950 border border-white/5 rounded text-xs text-white p-2 focus:outline-none"
                            >
                              <option>4.2 MB</option>
                              <option>12.8 MB</option>
                              <option>245 KB</option>
                              <option>1.4 GB</option>
                            </select>
                          </div>

                          <button
                            type="submit"
                            disabled={isUploading}
                            className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white font-mono text-xs uppercase tracking-wider font-bold rounded cursor-pointer transition-all"
                          >
                            {isUploading ? "Uploading Tunnel..." : "Commit Secure File"}
                          </button>
                        </form>
                      </div>

                      {/* File Locker List */}
                      <div className="bg-graphite-900 border border-white/5 rounded-lg divide-y divide-white/5 md:col-span-2">
                        <div className="bg-graphite-950 px-4 py-3 border-b border-white/5 font-mono text-[10px] text-steel-400 text-left uppercase">
                          Vault Files Ledger
                        </div>

                        {files.length === 0 ? (
                          <div className="py-16 text-center text-xs font-mono text-steel-600">
                            No blueprint documents in isolated bucket yet.
                          </div>
                        ) : (
                          files.map(f => (
                            <div key={f.id} className="p-4 flex items-center justify-between text-left text-xs">
                              <div className="space-y-1">
                                <span className="text-white font-mono font-medium block truncate max-w-xs">{f.fileName}</span>
                                <span className="text-[9.5px] font-mono text-slate-500 block">
                                  Size: {f.fileSize} · Uploaded By: {f.uploadedBy}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-500/10">Encrypted</span>
                                <button
                                  onClick={() => handleDeleteSecureFile(f.id, f.fileName)}
                                  className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-white/5 transition-all"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}

                {activeWorkspaceTab === "PAYMENTS" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="space-y-6 text-left"
                  >
                    <div className="border-b border-white/5 pb-4">
                      <h2 className="text-xl font-display font-semibold uppercase tracking-wider">FINANCIAL COORDINATION</h2>
                      <p className="text-xs text-steel-400 mt-1">Review ledger billing records, deploy fee clearances, and prosecute pipeline transaction settled flags.</p>
                    </div>

                    <div className="bg-graphite-900 border border-white/5 rounded-lg divide-y divide-white/5">
                      {payments.length === 0 ? (
                        <div className="py-12 text-center text-xs font-mono text-steel-500">
                          No accounting invoices detected on this project node.
                        </div>
                      ) : (
                        payments.map(p => (
                          <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-mono font-semibold text-white tracking-wide">{p.id}</span>
                                <span className="text-xs font-mono text-[#00e1ff] font-bold">${p.amount?.toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-slate-400 font-sans mt-0.5">{p.description}</p>
                              <p className="text-[9.5px] text-slate-500 font-mono">Date: {new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>

                            <div className="flex items-center space-x-3 self-start sm:self-center">
                              {p.status === "PAID" ? (
                                <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded font-mono text-[10px] font-bold tracking-widest uppercase flex items-center">
                                  <span>PAID LEDGER CLEAR</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSettleSandboxPayment(p.id)}
                                  className="px-4 py-2 bg-[#d97706]/20 hover:bg-[#d97706]/40 border border-[#d97706]/40 text-[#f59e0b] font-mono text-[9.5px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all"
                                >
                                  Prosecute Clearing (Settle Sandbox Payment)
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {activeWorkspaceTab === "VOICE" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="space-y-6 text-left"
                  >
                    <div className="border-b border-white/5 pb-4">
                      <h2 className="text-xl font-display font-semibold uppercase tracking-wider">SECURE COLLABORATION ENGINE</h2>
                      <p className="text-xs text-steel-400 mt-1">Simulate encrypted audio streams and physical screen coordination telemetry directly inside the sandbox.</p>
                    </div>

                    <div className="bg-graphite-900 border border-white/5 rounded-lg p-6 space-y-6 flex flex-col items-center text-center">
                      
                      {/* Connection Desk */}
                      <div className="space-y-3 max-w-md">
                        <h4 className="font-mono text-xs uppercase tracking-widest text-slate-400">Cryptographic Audio Feed Simulator</h4>
                        
                        <p className="text-xs text-steel-400 leading-normal">Press the link switch below to establish a simulated military voice conference. Audio signals translate into instant visual frequency response charts.</p>
                      </div>

                      {/* Wave visualizer */}
                      <div className="bg-black/40 border border-slate-800 rounded-lg p-6 w-full max-w-xl h-28 flex items-end justify-center gap-1.5 relative overflow-hidden select-none">
                        
                        {voiceConnected ? (
                          audioStreamLevel.map((level, idx) => (
                            <motion.div
                              key={idx}
                              animate={{ height: `${level}%` }}
                              transition={{ duration: 0.15, ease: "easeInOut" }}
                              className="w-2.5 bg-gradient-to-t from-blue-700 via-blue-500 to-[#1ff0ff] rounded-full shrink-0"
                            />
                          ))
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-mono text-xs">
                            &lt; VOICE FEED SUSPENDED &gt;
                          </div>
                        )}
                      </div>

                      {/* Connection Button */}
                      <button
                        onClick={toggleVoiceRoom}
                        className={`px-6 py-3.5 rounded font-mono text-xs tracking-widest font-bold uppercase transition-all flex items-center space-x-2.5 cursor-pointer ${voiceConnected ? "bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/40" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                      >
                        {voiceConnected ? (
                          <>
                            <PhoneOff className="h-4 w-4 shrink-0" />
                            <span>Sever Voice Feed Tunnel</span>
                          </>
                        ) : (
                          <>
                            <Phone className="h-4 w-4 shrink-0" />
                            <span>Calibrate Voice Feed Tunnel</span>
                          </>
                        )}
                      </button>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Transaction Terminal Logs always displayed at bottom of workspace for transparency */}
              <div className="bg-graphite-900 border border-white/5 rounded-lg overflow-hidden">
                <div className="bg-graphite-950 px-4 py-3 border-b border-white/5 flex items-center justify-between font-mono text-[10px]">
                  <div className="flex items-center space-x-2 text-blue-400">
                    <Terminal className="h-3.5 w-3.5 animate-pulse" />
                    <span className="font-bold tracking-widest uppercase">SECURE COGNITIVE OPERATIONS LOGS</span>
                  </div>
                  <span className="text-slate-600 uppercase">Handshake standard compliant</span>
                </div>
                <div className="p-4 bg-graphite-950 font-mono text-[9px] text-emerald-400/90 leading-relaxed text-left h-32 overflow-y-auto space-y-1 select-none">
                  {systemLogs.map((log, idx) => (
                    <div key={idx} className="font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
