import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Setup types mirroring database models
export interface Admin {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  createdAt: Date;
}

export interface Inquiry {
  id: string;
  ticketId: string;
  name: string;
  organization: string;
  email: string;
  inquiryType: string;
  message: string;
  timestamp: Date;
  status: 'PENDING' | 'REVIEWED' | 'ARCHIVED' | 'CONVERTED';
  ipAddress?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  paymentRequestSent?: boolean;
  paymentInvoiceId?: string;
}

// 1. WORKSPACE SCHEMAS
export interface WorkspaceUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  fullName: string; // Synonym for multi-model capability
  organization?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT' | 'TEAM_MEMBER';
  onboardingToken?: string;
  onboardingTokenExpiresAt?: Date;
  onboardingTokenUsed?: boolean;
  lastLoginAt?: Date;
  isActive: boolean;
  alias: string; // e.g., "OPERATOR-CHARLIE-8"
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  projectCode: string; // Format: GLT-YYYY-XXXXX
  inquiryId?: string;
  clientId: string;
  title: string;
  name: string; // Synonym for compatibility
  description: string;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'PROVISIONING' | 'ARCHIVED' | 'awaiting_payment' | 'active' | 'in_progress' | 'completed';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectAssignment {
  id: string;
  projectId: string;
  userId: string;
  role: 'designer' | 'frontend developer' | 'backend developer' | 'project manager' | 'QA tester';
  status: 'active' | 'completed';
  createdAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  assignedTo?: string; // userId of team member
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceRoom {
  id: string;
  projectId: string;
  state: 'LOCKED' | 'PROVISIONING' | 'ACTIVATED' | 'SUSPENDED';
  activatedAt?: Date;
  suspendedAt?: Date;
  suspendedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  projectId: string; // compatibility
  workspaceId?: string;
  milestoneId?: string;
  senderId?: string;
  senderName: string;
  senderRole: 'CLIENT' | 'ADMIN' | 'SYSTEM';
  content: string;
  isEncrypted: boolean;
  isSystemMessage: boolean;
  readBy: string; // JSONB formatted stringified array "[]"
  timestamp: Date;
  createdAt: Date;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  orderIndex: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAYMENT_RELEASED';
  threadState: 'LOCKED' | 'UNLOCKED';
  amount?: number;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentInvoice {
  id: string;
  projectId: string;
  inquiryId?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'FAILED' | 'REFUNDED' | 'UNPAID' | 'PAID'; // Support both sets
  paymentType: 'PROJECT_FEE' | 'MILESTONE';
  milestoneId?: string;
  paymentReference?: string;
  gateway: string;
  gatewayResponse?: any;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date; // synonym
  onboardingTokenGenerated?: string; // synonym
  description?: string; // synonym
}

export interface ProjectFile {
  id: string;
  projectId: string; // compatibility
  workspaceId: string;
  uploadedBy: string;
  filename: string;
  fileName: string; // synonym
  originalFilename?: string;
  fileSize: string | number;
  mimeType?: string;
  storagePath: string;
  isEncrypted: boolean;
  accessLevel: 'WORKSPACE' | 'MILESTONE' | 'ADMIN_ONLY';
  uploadedAt: Date; // synonym
  createdAt: Date;
}

export interface Permission {
  id: string;
  userId: string;
  workspaceId: string;
  permissionFlags: string[];
  grantedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  action: string;
  targetType?: string; // inquiry | project | payment | workspace | user
  targetId?: string;
  metadata?: any;
  ipAddress: string;
  createdAt: Date;
  timestamp: Date; // synonym for WorkspaceLog
}

export interface WorkspaceLog {
  id: string;
  timestamp: Date;
  action: string;
  ipAddress: string;
}

const DATA_DIR = path.join(process.cwd(), 'backend', 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

class DatabaseManager {
  private admins: Admin[] = [];
  private inquiries: Inquiry[] = [];
  
  // Workspace entities
  private workspaceUsers: WorkspaceUser[] = [];
  private projects: Project[] = [];
  private workspaceRooms: WorkspaceRoom[] = [];
  private messages: Message[] = [];
  private milestones: Milestone[] = [];
  private payments: PaymentInvoice[] = [];
  private projectFiles: ProjectFile[] = [];
  private permissions: Permission[] = [];
  private sessions: Session[] = [];
  private auditLogs: AuditLog[] = [];
  private workspaceLogs: WorkspaceLog[] = [];
  private projectAssignments: ProjectAssignment[] = [];
  private tasks: Task[] = [];

  constructor() {
    this.ensureDataDirectory();
    this.loadData();
    this.seedDefaultAdmin();
    this.seedInteractiveSandbox();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        
        this.admins = (parsed.admins || []).map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt)
        }));
        
        this.inquiries = (parsed.inquiries || []).map((i: any) => ({
          ...i,
          timestamp: new Date(i.timestamp),
          reviewedAt: i.reviewedAt ? new Date(i.reviewedAt) : undefined
        }));

        this.workspaceUsers = (parsed.workspaceUsers || []).map((wu: any) => ({
          ...wu,
          onboardingTokenExpiresAt: wu.onboardingTokenExpiresAt ? new Date(wu.onboardingTokenExpiresAt) : undefined,
          lastLoginAt: wu.lastLoginAt ? new Date(wu.lastLoginAt) : undefined,
          createdAt: new Date(wu.createdAt),
          updatedAt: wu.updatedAt ? new Date(wu.updatedAt) : new Date(wu.createdAt)
        }));

        this.projects = (parsed.projects || []).map((p: any) => ({
          ...p,
          approvedAt: p.approvedAt ? new Date(p.approvedAt) : undefined,
          createdAt: new Date(p.createdAt),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(p.createdAt)
        }));

        this.workspaceRooms = (parsed.workspaceRooms || []).map((wr: any) => ({
          ...wr,
          activatedAt: wr.activatedAt ? new Date(wr.activatedAt) : undefined,
          suspendedAt: wr.suspendedAt ? new Date(wr.suspendedAt) : undefined,
          createdAt: new Date(wr.createdAt),
          updatedAt: wr.updatedAt ? new Date(wr.updatedAt) : new Date(wr.createdAt)
        }));

        this.messages = (parsed.messages || []).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(m.timestamp)
        }));

        this.milestones = (parsed.milestones || []).map((ms: any) => ({
          ...ms,
          dueDate: ms.dueDate ? new Date(ms.dueDate) : undefined,
          completedAt: ms.completedAt ? new Date(ms.completedAt) : undefined,
          createdAt: ms.createdAt ? new Date(ms.createdAt) : new Date(),
          updatedAt: new Date(ms.updatedAt)
        }));

        this.payments = (parsed.payments || []).map((pay: any) => ({
          ...pay,
          createdAt: new Date(pay.createdAt),
          updatedAt: pay.updatedAt ? new Date(pay.updatedAt) : new Date(pay.createdAt),
          paidAt: pay.paidAt ? new Date(pay.paidAt) : undefined,
          verifiedAt: pay.verifiedAt ? new Date(pay.verifiedAt) : undefined
        }));

        this.projectFiles = (parsed.projectFiles || []).map((f: any) => ({
          ...f,
          uploadedAt: new Date(f.uploadedAt),
          createdAt: f.createdAt ? new Date(f.createdAt) : new Date(f.uploadedAt)
        }));

        this.permissions = (parsed.permissions || []).map((pem: any) => ({
          ...pem,
          createdAt: new Date(pem.createdAt),
          updatedAt: pem.updatedAt ? new Date(pem.updatedAt) : new Date(pem.createdAt)
        }));

        this.sessions = (parsed.sessions || []).map((se: any) => ({
          ...se,
          expiresAt: new Date(se.expiresAt),
          revokedAt: se.revokedAt ? new Date(se.revokedAt) : undefined,
          createdAt: new Date(se.createdAt)
        }));

        this.auditLogs = (parsed.auditLogs || []).map((al: any) => ({
          ...al,
          createdAt: new Date(al.createdAt),
          timestamp: new Date(al.timestamp)
        }));

        this.workspaceLogs = (parsed.workspaceLogs || []).map((wl: any) => ({
          ...wl,
          timestamp: new Date(wl.timestamp)
        }));

        this.projectAssignments = (parsed.projectAssignments || []).map((pa: any) => ({
          ...pa,
          createdAt: pa.createdAt ? new Date(pa.createdAt) : new Date()
        }));

        this.tasks = (parsed.tasks || []).map((t: any) => ({
          ...t,
          deadline: t.deadline ? new Date(t.deadline) : undefined,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date()
        }));

        console.log(`[Database] Cached DB Synchronized successfully. Users: ${this.workspaceUsers.length}, Projects: ${this.projects.length}, Payments: ${this.payments.length}`);
      } catch (err) {
        console.error('[Database] Sync error, falling back', err);
        this.saveData();
      }
    } else {
      this.saveData();
    }
  }

  public saveData() {
    try {
      const payload = {
        admins: this.admins,
        inquiries: this.inquiries,
        workspaceUsers: this.workspaceUsers,
        projects: this.projects,
        workspaceRooms: this.workspaceRooms,
        messages: this.messages,
        milestones: this.milestones,
        payments: this.payments,
        projectFiles: this.projectFiles,
        permissions: this.permissions,
        sessions: this.sessions,
        auditLogs: this.auditLogs,
        workspaceLogs: this.workspaceLogs,
        projectAssignments: this.projectAssignments,
        tasks: this.tasks
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Failed to save store cache files', err);
    }
  }

  private seedDefaultAdmin() {
    // Purge former logins completely as requested by the user
    this.admins = [];

    const email = 'ryamypritere@gmail.com';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('12345678', salt);
    
    const newAdmin: Admin = {
      id: 'adm-evaluation-lead',
      email,
      passwordHash,
      name: 'Workspace Lead Evaluator',
      role: 'SUPER_ADMIN',
      createdAt: new Date()
    };
    
    this.admins.push(newAdmin);
    console.log(`[Database] Seeded Developer Admin: ${email}`);

    this.saveData();
  }

  private seedInteractiveSandbox() {
    const email = 'ryamypritere@gmail.com';
    
    // Purge any accounts using the old email or matching the custom ID to ensure a clean overwrite
    this.workspaceUsers = this.workspaceUsers.filter(u => u.id !== 'cli-apex-director' && u.email.toLowerCase() !== 'apex.director@defense.gov' && u.email.toLowerCase() !== email.toLowerCase());

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('12345678', salt);
    const userId = 'cli-apex-director';

    const user: WorkspaceUser = {
      id: userId,
      email: email,
      passwordHash,
      name: 'Apex Director',
      fullName: 'Apex Director',
      alias: 'OPERATOR-APEX-91',
      role: 'CLIENT',
      onboardingToken: 'GNT-ONB-534U9ZH2',
      onboardingTokenUsed: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workspaceUsers.push(user);

    // Create pre-seeded project if not already exists
    const prjId = 'prj-apex-alpha';
    if (!this.projects.some(p => p.id === prjId)) {
      const project: Project = {
        id: prjId,
        projectCode: 'GLT-2026-98C32',
        clientId: userId,
        title: 'Defense Systems - Cyber Threat Chamber',
        name: 'Defense Systems - Cyber Threat Chamber',
        description: 'Tactical military consultation & deployment chamber Alpha setup.',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.projects.push(project);
    } else {
      // Ensure existing project references the correct client
      const idx = this.projects.findIndex(p => p.id === prjId);
      this.projects[idx].clientId = userId;
    }

    // Create active Workspace Room if not already exists
    if (!this.workspaceRooms.some(r => r.id === 'room-apex-alpha')) {
      const room: WorkspaceRoom = {
        id: 'room-apex-alpha',
        projectId: prjId,
        state: 'ACTIVATED',
        activatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.workspaceRooms.push(room);
    }

    // Create milestones if not already exist
    if (!this.milestones.some(m => m.projectId === prjId)) {
      const milestonesList: Milestone[] = [
        {
          id: 'ms-apex-1',
          projectId: prjId,
          title: 'Secure Environment Handshake',
          description: 'Initialization of independent cryptographic micro-chamber.',
          orderIndex: 1,
          status: 'COMPLETED',
          threadState: 'UNLOCKED',
          amount: 500000,
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'ms-apex-2',
          projectId: prjId,
          title: 'Quantum Ledger Installation',
          description: 'Deploying secure decentralised storage modules.',
          orderIndex: 2,
          status: 'IN_PROGRESS',
          threadState: 'UNLOCKED',
          amount: 750000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'ms-apex-3',
          projectId: prjId,
          title: 'Operational Transmission Key Delivery',
          description: 'Exporting hardware keys to field operators.',
          orderIndex: 3,
          status: 'PENDING',
          threadState: 'LOCKED',
          amount: 310000,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      this.milestones.push(...milestonesList);
    }

    // Seed messages if not already exist
    if (!this.messages.some(m => m.projectId === prjId)) {
      const msgs: Message[] = [
        {
          id: 'msg-apex-1',
          projectId: prjId,
          workspaceId: 'room-apex-alpha',
          senderName: 'SYSTEM CONTROL',
          senderRole: 'SYSTEM',
          content: 'Secure chamber provisioned. Hardware nodes linked with zero external access vectors.',
          isEncrypted: true,
          isSystemMessage: true,
          readBy: '[]',
          timestamp: new Date(Date.now() - 3600000 * 5),
          createdAt: new Date(Date.now() - 3600000 * 5)
        },
        {
          id: 'msg-apex-2',
          projectId: prjId,
          workspaceId: 'room-apex-alpha',
          senderName: 'Glint Support',
          senderRole: 'ADMIN',
          content: 'Welcome Director. Upload your current installation manifests in the vault below; we are auditing the network configurations now.',
          isEncrypted: false,
          isSystemMessage: false,
          readBy: '[]',
          timestamp: new Date(Date.now() - 3600000 * 3),
          createdAt: new Date(Date.now() - 3600000 * 3)
        }
      ];
      this.messages.push(...msgs);
    }

    // Seed payment invoice if not already exist
    if (!this.payments.some(p => p.projectId === prjId)) {
      const payment: PaymentInvoice = {
        id: 'pay-apex-1',
        projectId: prjId,
        amount: 1560000,
        currency: 'NGN',
        status: 'VERIFIED',
        paymentType: 'PROJECT_FEE',
        paymentReference: 'TXN-918237-DEFENSE',
        gateway: 'PAYSTACK',
        verifiedBy: 'adm-sys',
        verifiedAt: new Date(),
        createdAt: new Date(Date.now() - 3600000 * 12),
        updatedAt: new Date(Date.now() - 3600000 * 12)
      };
      this.payments.push(payment);
    }

    // Seed files if not already exist
    if (!this.projectFiles.some(f => f.projectId === prjId)) {
      const secureFile: ProjectFile = {
        id: 'file-apex-1',
        projectId: prjId,
        workspaceId: 'room-apex-alpha',
        uploadedBy: 'OPERATOR-APEX-91',
        filename: 'defense_node_specifications.pdf',
        fileName: 'defense_node_specifications.pdf',
        fileSize: '4.2 MB',
        storagePath: '/secure/vault/file-apex-1',
        isEncrypted: true,
        accessLevel: 'WORKSPACE',
        uploadedAt: new Date(),
        createdAt: new Date()
      };
      this.projectFiles.push(secureFile);
    }

    // Seed Team Members with predictable credentials and proper roles
    const teamSeedList = [
      { email: 'designer@glint.tech', name: 'Devon Designer', alias: 'STAFF-DES-101' },
      { email: 'frontend@glint.tech', name: 'Fiona Frontend', alias: 'STAFF-FE-202' },
      { email: 'backend@glint.tech', name: 'Barney Backend', alias: 'STAFF-BE-303' },
      { email: 'pm@glint.tech', name: 'Pamela Manager', alias: 'STAFF-PM-404' },
      { email: 'qa@glint.tech', name: 'Quincy Quality', alias: 'STAFF-QA-505' }
    ];

    teamSeedList.forEach(item => {
      if (!this.workspaceUsers.some(u => u.email.toLowerCase() === item.email.toLowerCase())) {
        const teamMemberHash = bcrypt.hashSync('password123', salt);
        this.workspaceUsers.push({
          id: `usr-${item.email.split('@')[0]}`,
          email: item.email,
          passwordHash: teamMemberHash,
          name: item.name,
          fullName: item.name,
          alias: item.alias,
          role: 'TEAM_MEMBER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    this.saveData();
    console.log(`[Database] Seeded apex dashboard sandbox user successfully with email ${email} and 5 team staff profiles.`);
  }

  // Transaction support simulator (returns states)
  public async txn(callback: () => Promise<any>): Promise<any> {
    const backup = JSON.stringify({
      admins: this.admins,
      inquiries: this.inquiries,
      workspaceUsers: this.workspaceUsers,
      projects: this.projects,
      workspaceRooms: this.workspaceRooms,
      messages: this.messages,
      milestones: this.milestones,
      payments: this.payments,
      projectFiles: this.projectFiles,
      permissions: this.permissions,
      sessions: this.sessions,
      auditLogs: this.auditLogs,
      workspaceLogs: this.workspaceLogs,
      projectAssignments: this.projectAssignments,
      tasks: this.tasks
    });

    try {
      const result = await callback();
      this.saveData();
      return result;
    } catch (err) {
      console.error('[Database Transaction] Operation failed, executing complete state rollback!', err);
      const parsed = JSON.parse(backup);
      this.restoreParsed(parsed);
      this.saveData();
      throw err;
    }
  }

  private restoreParsed(parsed: any) {
    this.admins = parsed.admins;
    this.inquiries = parsed.inquiries;
    this.workspaceUsers = parsed.workspaceUsers;
    this.projects = parsed.projects;
    this.workspaceRooms = parsed.workspaceRooms;
    this.messages = parsed.messages;
    this.milestones = parsed.milestones;
    this.payments = parsed.payments;
    this.projectFiles = parsed.projectFiles;
    this.permissions = parsed.permissions;
    this.sessions = parsed.sessions;
    this.auditLogs = parsed.auditLogs;
    this.workspaceLogs = parsed.workspaceLogs;
    this.projectAssignments = parsed.projectAssignments || [];
    this.tasks = parsed.tasks || [];
  }

  // --- ADMIN AUTH METHODS ---
  public async getAdminByEmail(email: string): Promise<Admin | null> {
    const admin = this.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    return admin ? { ...admin } : null;
  }

  public async getAdminById(id: string): Promise<Admin | null> {
    const admin = this.admins.find(a => a.id === id);
    return admin ? { ...admin } : null;
  }

  public async createAdmin(email: string, passwordPlain: string, name: string): Promise<Admin> {
    const exists = await this.getAdminByEmail(email);
    if (exists) throw new Error('Admin already exists');

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(passwordPlain, salt);

    const newAdmin: Admin = {
      id: `adm-${Math.random().toString(36).substr(2, 9)}`,
      email,
      passwordHash,
      name,
      role: 'ADMIN',
      createdAt: new Date()
    };
    this.admins.push(newAdmin);
    this.saveData();
    return newAdmin;
  }

  // --- GENERAL INQUIRY METHODS ---
  public async createInquiry(data: {
    name: string;
    organization: string;
    email: string;
    inquiryType: string;
    message: string;
    ipAddress?: string;
  }): Promise<Inquiry> {
    const ticketId = `GLINT-REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInquiry: Inquiry = {
      id: `inq-${Math.random().toString(36).substr(2, 9)}`,
      ticketId,
      name: data.name,
      organization: data.organization,
      email: data.email,
      inquiryType: data.inquiryType,
      message: data.message,
      timestamp: new Date(),
      status: 'PENDING',
      ipAddress: data.ipAddress || '127.0.0.1'
    };

    this.inquiries.push(newInquiry);
    this.saveData();
    return newInquiry;
  }

  public async getInquiries(filters?: {
    status?: string;
    type?: string;
    searchTerm?: string;
  }): Promise<Inquiry[]> {
    let list = [...this.inquiries];

    if (filters) {
      if (filters.status) {
        list = list.filter(i => i.status === filters.status);
      }
      if (filters.type) {
        list = list.filter(i => i.inquiryType === filters.type);
      }
      if (filters.searchTerm) {
        const query = filters.searchTerm.toLowerCase();
        list = list.filter(i => 
          i.name.toLowerCase().includes(query) ||
          i.organization.toLowerCase().includes(query) ||
          i.email.toLowerCase().includes(query) ||
          i.ticketId.toLowerCase().includes(query) ||
          i.message.toLowerCase().includes(query)
        );
      }
    }

    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async getInquiryById(id: string): Promise<Inquiry | null> {
    const inq = this.inquiries.find(i => i.id === id);
    return inq ? { ...inq } : null;
  }

  public async updateInquiryStatus(
    id: string, 
    status: 'PENDING' | 'REVIEWED' | 'ARCHIVED' | 'CONVERTED',
    reviewedBy: string,
    notes?: string
  ): Promise<Inquiry | null> {
    const idx = this.inquiries.findIndex(i => i.id === id);
    if (idx === -1) return null;

    this.inquiries[idx] = {
      ...this.inquiries[idx],
      status,
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: notes !== undefined ? notes : this.inquiries[idx].reviewNotes
    };
    this.saveData();
    return { ...this.inquiries[idx] };
  }

  public async updateInquiryPaymentDetails(
    id: string,
    payload: { paymentRequestSent: boolean; paymentInvoiceId?: string }
  ): Promise<Inquiry | null> {
    const idx = this.inquiries.findIndex(i => i.id === id);
    if (idx === -1) return null;

    this.inquiries[idx] = {
      ...this.inquiries[idx],
      ...payload
    };
    this.saveData();
    return { ...this.inquiries[idx] };
  }

  public async deleteInquiry(id: string): Promise<boolean> {
    const initialLen = this.inquiries.length;
    this.inquiries = this.inquiries.filter(i => i.id !== id);
    if (this.inquiries.length < initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- WORKSPACE CUSTOMERS & CLIENTS AUTH ---
  public async getWorkspaceUserByEmail(email: string): Promise<WorkspaceUser | null> {
    const user = this.workspaceUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? { ...user } : null;
  }

  public async getWorkspaceUserById(id: string): Promise<WorkspaceUser | null> {
    const user = this.workspaceUsers.find(u => u.id === id);
    return user ? { ...user } : null;
  }

  public async getWorkspaceUserByToken(token: string): Promise<WorkspaceUser | null> {
    const user = this.workspaceUsers.find(u => u.onboardingToken === token);
    return user ? { ...user } : null;
  }

  public async registerWorkspaceUser(data: {
    email: string;
    passwordPlain: string;
    name: string;
    alias: string;
    onboardingToken?: string;
    onboardingTokenExpiresAt?: Date;
    role?: 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT';
    organization?: string;
  }): Promise<WorkspaceUser> {
    const idx = this.workspaceUsers.findIndex(u => u.email.toLowerCase() === data.email.toLowerCase());
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.passwordPlain, salt);

    if (idx !== -1) {
      // Correctly update existing user credentials and onboarding state
      const updatedUser: WorkspaceUser = {
        ...this.workspaceUsers[idx],
        passwordHash,
        name: data.name || this.workspaceUsers[idx].name,
        fullName: data.name || this.workspaceUsers[idx].fullName,
        onboardingToken: data.onboardingToken !== undefined ? data.onboardingToken : this.workspaceUsers[idx].onboardingToken,
        onboardingTokenUsed: data.onboardingToken === '' ? true : this.workspaceUsers[idx].onboardingTokenUsed,
        updatedAt: new Date()
      };
      this.workspaceUsers[idx] = updatedUser;
      this.saveData();
      return { ...updatedUser };
    }

    const newUser: WorkspaceUser = {
      id: `cli-${Math.random().toString(36).substr(2, 9)}`,
      email: data.email,
      passwordHash,
      name: data.name,
      fullName: data.name,
      alias: data.alias,
      role: data.role || 'CLIENT',
      organization: data.organization,
      onboardingToken: data.onboardingToken,
      onboardingTokenExpiresAt: data.onboardingTokenExpiresAt,
      onboardingTokenUsed: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workspaceUsers.push(newUser);
    this.saveData();
    return { ...newUser };
  }

  // --- WORKSPACE PROJECTS ---
  public async getProjectsByClientId(clientId: string): Promise<Project[]> {
    return this.projects.filter(p => p.clientId === clientId);
  }

  public async getProjectById(projectId: string): Promise<Project | null> {
    const p = this.projects.find(p => p.id === projectId);
    return p ? { ...p } : null;
  }

  public async createProject(data: {
    name: string;
    title?: string;
    description: string;
    clientId: string;
    inquiryId?: string;
    projectCode?: string;
    status?: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  }): Promise<Project> {
    const code = data.projectCode || `GLT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newProject: Project = {
      id: `prj-${Math.random().toString(36).substr(2, 9)}`,
      projectCode: code,
      inquiryId: data.inquiryId,
      clientId: data.clientId,
      title: data.title || data.name,
      name: data.name,
      description: data.description,
      status: data.status || 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.push(newProject);

    // Bootstrap default milestones for newly created space if not done by provisioning service
    if (!data.status) {
      await this.seedDefaultMilestones(newProject.id);
    }

    this.saveData();
    return newProject;
  }

  private async seedDefaultMilestones(projectId: string) {
    const milestonesList: string[] = [
      'Glint Hardware Node Provisioned',
      'Quantum Link Cryptography Setup',
      'Local Sandbox Testing Verified',
      'Operations Handover Cert'
    ];

    milestonesList.forEach((title, idx) => {
      this.milestones.push({
        id: `mil-${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        title,
        orderIndex: idx,
        status: idx === 0 ? 'COMPLETED' : idx === 1 ? 'IN_PROGRESS' : 'PENDING',
        threadState: idx === 0 ? 'UNLOCKED' : 'LOCKED',
        updatedAt: new Date(),
        createdAt: new Date()
      });
    });
  }

  // --- WORKSPACE ROOMS ---
  public async getWorkspaceRoomByProjectId(projectId: string): Promise<WorkspaceRoom | null> {
    const room = this.workspaceRooms.find(r => r.projectId === projectId);
    return room ? { ...room } : null;
  }

  public async getWorkspaceRoomById(id: string): Promise<WorkspaceRoom | null> {
    const room = this.workspaceRooms.find(r => r.id === id);
    return room ? { ...room } : null;
  }

  public async createWorkspaceRoom(data: {
    projectId: string;
    state?: 'LOCKED' | 'PROVISIONING' | 'ACTIVATED' | 'SUSPENDED';
  }): Promise<WorkspaceRoom> {
    const newRoom: WorkspaceRoom = {
      id: `wrk-${Math.random().toString(36).substr(2, 9)}`,
      projectId: data.projectId,
      state: data.state || 'LOCKED',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workspaceRooms.push(newRoom);
    this.saveData();
    return newRoom;
  }

  public async updateWorkspaceRoomState(
    id: string,
    state: 'LOCKED' | 'PROVISIONING' | 'ACTIVATED' | 'SUSPENDED',
    reason?: string
  ): Promise<WorkspaceRoom | null> {
    const idx = this.workspaceRooms.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const current = this.workspaceRooms[idx];
    const prevStatus = current.state;

    this.workspaceRooms[idx] = {
      ...current,
      state,
      activatedAt: state === 'ACTIVATED' ? new Date() : current.activatedAt,
      suspendedAt: state === 'SUSPENDED' ? new Date() : current.suspendedAt,
      suspendedReason: state === 'SUSPENDED' ? reason || 'Administrative suspension' : current.suspendedReason,
      updatedAt: new Date()
    };

    // System audit logging
    await this.addAuditLog({
      action: 'WORKSPACE_STATUS_SYNC',
      targetType: 'workspace',
      targetId: id,
      metadata: { from: prevStatus, to: state, reason: reason || 'State Machine Triggered' },
      ipAddress: '127.0.0.1'
    });

    this.saveData();
    return { ...this.workspaceRooms[idx] };
  }

  // --- WORKSPACE COMMUNICATIONS ---
  public async getMessages(projectId: string): Promise<Message[]> {
    return this.messages
      .filter(m => m.projectId === projectId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  public async createMessage(data: {
    projectId: string;
    senderName: string;
    senderRole: 'CLIENT' | 'ADMIN' | 'SYSTEM';
    content: string;
  }): Promise<Message> {
    const newMsg: Message = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      projectId: data.projectId,
      workspaceId: data.projectId, // synonym
      senderName: data.senderName,
      senderRole: data.senderRole,
      content: data.content,
      isEncrypted: false,
      isSystemMessage: data.senderRole === 'SYSTEM',
      readBy: '[]',
      timestamp: new Date(),
      createdAt: new Date()
    };
    this.messages.push(newMsg);
    this.saveData();
    return newMsg;
  }

  // --- WORKSPACE MILESTONES ---
  public async getMilestones(projectId: string): Promise<Milestone[]> {
    return this.milestones.filter(m => m.projectId === projectId).sort((a,b) => a.orderIndex - b.orderIndex);
  }

  public async createMilestone(data: {
    projectId: string;
    title: string;
    description?: string;
    orderIndex: number;
    amount?: number;
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAYMENT_RELEASED';
    threadState?: 'LOCKED' | 'UNLOCKED';
  }): Promise<Milestone> {
    const newMilestone: Milestone = {
      id: `mil-${Math.random().toString(36).substr(2, 9)}`,
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      orderIndex: data.orderIndex,
      status: data.status || 'PENDING',
      threadState: data.threadState || 'LOCKED',
      amount: data.amount,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.milestones.push(newMilestone);
    this.saveData();
    return newMilestone;
  }

  public async updateMilestoneStatus(
    id: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAYMENT_RELEASED'
  ): Promise<Milestone | null> {
    const idx = this.milestones.findIndex(m => m.id === id);
    if (idx === -1) return null;

    const m = this.milestones[idx];
    this.milestones[idx] = {
      ...m,
      status,
      completedAt: status === 'COMPLETED' || status === 'PAYMENT_RELEASED' ? new Date() : m.completedAt,
      updatedAt: new Date()
    };
    this.saveData();
    return { ...this.milestones[idx] };
  }

  public async updateMilestoneThreadState(id: string, threadState: 'LOCKED' | 'UNLOCKED'): Promise<Milestone | null> {
    const idx = this.milestones.findIndex(m => m.id === id);
    if (idx === -1) return null;

    this.milestones[idx] = {
      ...this.milestones[idx],
      threadState,
      updatedAt: new Date()
    };
    this.saveData();
    return { ...this.milestones[idx] };
  }

  // --- WORKSPACE SECURE PAYMENT COORDINATION & INVOICES ---
  public async getPayments(projectId: string): Promise<PaymentInvoice[]> {
    return this.payments.filter(p => p.projectId === projectId);
  }

  public async getPaymentById(id: string): Promise<PaymentInvoice | null> {
    const pay = this.payments.find(p => p.id === id);
    return pay ? { ...pay } : null;
  }

  public async getPaymentByOnboardingToken(token: string): Promise<PaymentInvoice | null> {
    return this.payments.find(p => p.onboardingTokenGenerated === token) || null;
  }

  public async createPaymentInvoice(data: {
    projectId: string;
    inquiryId?: string;
    amount: number;
    description: string;
    onboardingTokenGenerated?: string;
    currency?: string;
    status?: 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';
    paymentType?: 'PROJECT_FEE' | 'MILESTONE';
    milestoneId?: string;
  }): Promise<PaymentInvoice> {
    const id = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment: PaymentInvoice = {
      id,
      projectId: data.projectId,
      inquiryId: data.inquiryId,
      amount: data.amount,
      currency: data.currency || 'NGN',
      status: data.status || 'PENDING',
      paymentType: data.paymentType || 'PROJECT_FEE',
      milestoneId: data.milestoneId,
      gateway: 'MANUAL',
      description: data.description,
      onboardingTokenGenerated: data.onboardingTokenGenerated || `TOK-${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.payments.push(newPayment);
    this.saveData();
    return newPayment;
  }

  public async settlePaymentInvoice(id: string): Promise<PaymentInvoice | null> {
    const idx = this.payments.findIndex(p => p.id === id);
    if (idx === -1) return null;

    this.payments[idx] = {
      ...this.payments[idx],
      status: 'VERIFIED', // Standardize status
      paidAt: new Date(),
      verifiedAt: new Date(),
      updatedAt: new Date()
    };

    // If there is an associated Inquiry, update its state
    if (this.payments[idx].inquiryId) {
      const inqId = this.payments[idx].inquiryId!;
      const inqIdx = this.inquiries.findIndex(i => i.id === inqId);
      if (inqIdx !== -1) {
        this.inquiries[inqIdx].status = 'REVIEWED';
        this.inquiries[inqIdx].reviewNotes = `Payment settled securely on invoice: ${id}. Client account is provisioned dynamically.`;
      }
    }

    this.saveData();
    return { ...this.payments[idx] };
  }

  public async updatePaymentStatus(
    id: string,
    status: 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'FAILED' | 'REFUNDED',
    verifierId?: string,
    gatewayResponse?: any
  ): Promise<PaymentInvoice | null> {
    const idx = this.payments.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const current = this.payments[idx];
    this.payments[idx] = {
      ...current,
      status,
      verifiedBy: verifierId || current.verifiedBy,
      verifiedAt: status === 'VERIFIED' ? new Date() : current.verifiedAt,
      paidAt: status === 'VERIFIED' ? new Date() : current.paidAt,
      gatewayResponse: gatewayResponse || current.gatewayResponse,
      updatedAt: new Date()
    };

    this.saveData();
    return { ...this.payments[idx] };
  }

  // --- WORKSPACE SECURE FILE LOCKER ---
  public async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    return this.projectFiles.filter(f => f.projectId === projectId || f.workspaceId === projectId);
  }

  public async addProjectFile(data: {
    projectId: string;
    workspaceId?: string;
    fileName: string;
    fileNameCompat?: string;
    fileSize: string | number;
    uploadedBy: string;
    storagePath?: string;
  }): Promise<ProjectFile> {
    const newFile: ProjectFile = {
      id: `fil-${Math.random().toString(36).substr(2, 9)}`,
      projectId: data.projectId,
      workspaceId: data.workspaceId || data.projectId,
      fileName: data.fileName,
      filename: data.fileName,
      originalFilename: data.fileName,
      fileSize: data.fileSize || '3.4 MB',
      uploadedBy: data.uploadedBy,
      storagePath: data.storagePath || `/comms/vault/${data.fileName}`,
      isEncrypted: true,
      accessLevel: 'WORKSPACE',
      uploadedAt: new Date(),
      createdAt: new Date()
    };
    this.projectFiles.push(newFile);
    this.saveData();
    return newFile;
  }

  public async deleteProjectFile(id: string): Promise<boolean> {
    const initialLen = this.projectFiles.length;
    this.projectFiles = this.projectFiles.filter(f => f.id !== id);
    if (this.projectFiles.length < initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- PERMISSIONS ---
  public async getPermissions(userId: string, workspaceId: string): Promise<Permission | null> {
    const perm = this.permissions.find(p => p.userId === userId && p.workspaceId === workspaceId);
    return perm ? { ...perm } : null;
  }

  public async grantPermissions(data: {
    userId: string;
    workspaceId: string;
    permissionFlags: string[];
    grantedBy?: string;
  }): Promise<Permission> {
    const idx = this.permissions.findIndex(p => p.userId === data.userId && p.workspaceId === data.workspaceId);
    if (idx !== -1) {
      this.permissions[idx] = {
        ...this.permissions[idx],
        permissionFlags: data.permissionFlags,
        grantedBy: data.grantedBy,
        updatedAt: new Date()
      };
      this.saveData();
      return { ...this.permissions[idx] };
    }

    const newPem: Permission = {
      id: `pem-${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      workspaceId: data.workspaceId,
      permissionFlags: data.permissionFlags,
      grantedBy: data.grantedBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.permissions.push(newPem);
    this.saveData();
    return newPem;
  }

  // --- SESSIONS ---
  public async createSession(data: {
    userId: string;
    tokenHash: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }): Promise<Session> {
    const newSession: Session = {
      id: `ses-${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      tokenHash: data.tokenHash,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt: data.expiresAt,
      createdAt: new Date()
    };
    this.sessions.push(newSession);
    this.saveData();
    return newSession;
  }

  // --- AUDITING & WORKSPACE LOGS ---
  public async getWorkspaceLogs(): Promise<WorkspaceLog[]> {
    return this.workspaceLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async addWorkspaceLog(action: string, ipAddress?: string): Promise<WorkspaceLog> {
    const newLog: WorkspaceLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action,
      ipAddress: ipAddress || '127.0.0.1'
    };
    this.workspaceLogs.push(newLog);
    this.saveData();
    return newLog;
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.auditLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async addAuditLog(data: {
    actorId?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: any;
    ipAddress?: string;
  }): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: `aud-${Math.random().toString(36).substr(2, 9)}`,
      actorId: data.actorId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      metadata: data.metadata,
      ipAddress: data.ipAddress || '127.0.0.1',
      createdAt: new Date(),
      timestamp: new Date()
    };
    this.auditLogs.push(newLog);
    
    // Maintain synonym compliance in ancient logs stream
    await this.addWorkspaceLog(`[Audit: ${data.action}] targetId: ${data.targetId || 'N/A'}. metadata: ${JSON.stringify(data.metadata || {})}`, data.ipAddress);

    this.saveData();
    return newLog;
  }

  public async getAllProjects(): Promise<Project[]> {
    return [...this.projects];
  }

  public async getAllPayments(): Promise<PaymentInvoice[]> {
    return [...this.payments];
  }

  public async updateProjectStatus(projectId: string, status: any): Promise<Project> {
    const idx = this.projects.findIndex(p => p.id === projectId);
    if (idx === -1) {
      throw new Error(`Project ${projectId} not found`);
    }
    this.projects[idx] = {
      ...this.projects[idx],
      status: status,
      updatedAt: new Date()
    };
    this.saveData();
    return { ...this.projects[idx] };
  }

  // --- TEAM USER & TEAM ASSIGNMENT DATA ACCESS ---
  public async getWorkspaceUsers(): Promise<WorkspaceUser[]> {
    return [...this.workspaceUsers];
  }

  public async getProjectAssignments(projectId?: string): Promise<ProjectAssignment[]> {
    if (projectId) {
      return this.projectAssignments.filter(pa => pa.projectId === projectId);
    }
    return [...this.projectAssignments];
  }

  public async createProjectAssignment(data: {
    projectId: string;
    userId: string;
    role: 'designer' | 'frontend developer' | 'backend developer' | 'project manager' | 'QA tester';
    status?: 'active' | 'completed';
  }): Promise<ProjectAssignment> {
    const id = `asg-${Math.random().toString(36).substr(2, 9)}`;
    const newAssignment: ProjectAssignment = {
      id,
      projectId: data.projectId,
      userId: data.userId,
      role: data.role,
      status: data.status || 'active',
      createdAt: new Date()
    };
    this.projectAssignments.push(newAssignment);
    this.saveData();
    return newAssignment;
  }

  public async deleteProjectAssignmentsByProject(projectId: string): Promise<void> {
    this.projectAssignments = this.projectAssignments.filter(pa => pa.projectId !== projectId);
    this.saveData();
  }

  public async deleteProjectAssignment(assignmentId: string): Promise<void> {
    this.projectAssignments = this.projectAssignments.filter(pa => pa.id !== assignmentId);
    this.saveData();
  }

  // --- KANBAN TASKS SYSTEM ---
  public async getTasks(projectId?: string): Promise<Task[]> {
    if (projectId) {
      return this.tasks.filter(t => t.projectId === projectId);
    }
    return [...this.tasks];
  }

  public async getTasksByAssignedUser(userId: string): Promise<Task[]> {
    return this.tasks.filter(t => t.assignedTo === userId);
  }

  public async createTask(data: {
    projectId: string;
    assignedTo?: string;
    title: string;
    description?: string;
    status: 'backlog' | 'in_progress' | 'review' | 'completed';
    priority: 'low' | 'medium' | 'high';
    deadline?: Date;
  }): Promise<Task> {
    const id = `tsk-${Math.random().toString(36).substr(2, 9)}`;
    const newTask: Task = {
      id,
      projectId: data.projectId,
      assignedTo: data.assignedTo,
      title: data.title,
      description: data.description,
      status: data.status || 'backlog',
      priority: data.priority || 'medium',
      deadline: data.deadline,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.push(newTask);
    this.saveData();
    return newTask;
  }

  public async updateTaskStatus(taskId: string, status: 'backlog' | 'in_progress' | 'review' | 'completed'): Promise<Task | null> {
    const idx = this.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return null;
    this.tasks[idx] = {
      ...this.tasks[idx],
      status,
      updatedAt: new Date()
    };
    this.saveData();
    return { ...this.tasks[idx] };
  }

  public async updateTask(taskId: string, data: Partial<Task>): Promise<Task | null> {
    const idx = this.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return null;
    this.tasks[idx] = {
      ...this.tasks[idx],
      ...data,
      updatedAt: new Date()
    };
    this.saveData();
    return { ...this.tasks[idx] };
  }
}

export const dbDataStore = new DatabaseManager();
