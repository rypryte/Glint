import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Setup types mirroring Prisma schema shapes
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
  status: 'PENDING' | 'REVIEWED' | 'ARCHIVED';
  ipAddress?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}

const DATA_DIR = path.join(process.cwd(), 'backend', 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Memory/File double-write database for perfect resilience and zero setup in local sandbox
class DatabaseManager {
  private admins: Admin[] = [];
  private inquiries: Inquiry[] = [];

  constructor() {
    this.ensureDataDirectory();
    this.loadData();
    this.seedDefaultAdmin();
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
        console.log(`[Database] Loaded ${this.admins.length} admins and ${this.inquiries.length} inquiries from store.`);
      } catch (err) {
        console.error('[Database] Error loading database file, initializing empty', err);
        this.saveData();
      }
    } else {
      this.saveData();
    }
  }

  private saveData() {
    try {
      const payload = {
        admins: this.admins,
        inquiries: this.inquiries
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Failed to write database to disk', err);
    }
  }

  private seedDefaultAdmin() {
    const defaultEmail = process.env.ADMIN_INITIAL_EMAIL || 'admin@glint.tech';
    const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';

    const exists = this.admins.some(a => a.email.toLowerCase() === defaultEmail.toLowerCase());
    if (!exists) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(defaultPassword, salt);
      
      const newAdmin: Admin = {
        id: `adm-${Math.random().toString(36).substr(2, 9)}`,
        email: defaultEmail,
        passwordHash,
        name: 'Glint Security Administrator',
        role: 'SUPER_ADMIN',
        createdAt: new Date()
      };
      this.admins.push(newAdmin);
      this.saveData();
      console.log(`[Database] Default Admin Seeded successfully: ${defaultEmail} / ${defaultPassword}`);
    }
  }

  // Admin DB Methods
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

  // Inquiry DB Methods
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

    // Sort by descending timestamp
    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async updateInquiryStatus(
    id: string, 
    status: 'PENDING' | 'REVIEWED' | 'ARCHIVED',
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

  public async deleteInquiry(id: string): Promise<boolean> {
    const initialLen = this.inquiries.length;
    this.inquiries = this.inquiries.filter(i => i.id !== id);
    if (this.inquiries.length < initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }
}

export const dbDataStore = new DatabaseManager();
