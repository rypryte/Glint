import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from the root directory
dotenv.config({ path: path.join(process.cwd(), '.env') });

export const JWT_DEFAULT_SECRET = 'glint-secure-operational-tech-network-fallback';
export const JWT_SECRET = process.env.JWT_SECRET || JWT_DEFAULT_SECRET;

console.log(`[SYSINIT] Glint Core Configuration Verified. Using ${process.env.JWT_SECRET ? 'custom' : 'fallback'} security secrets.`);
