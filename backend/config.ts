import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from the root directory
dotenv.config({ path: path.join(process.cwd(), '.env') });

export const JWT_DEFAULT_SECRET = 'glint-secure-operational-tech-network-fallback';

// Bulletproof parsing of JWT_SECRET to remove surrounding quotes, carriage returns, or whitespace
const rawSecret = process.env.JWT_SECRET;
const isValid = (s: string | undefined): boolean => {
  if (!s) return false;
  const t = s.trim().toLowerCase();
  return t !== "" && t !== "undefined" && t !== "null";
};

export const JWT_SECRET = isValid(rawSecret)
  ? rawSecret!.trim().replace(/^['"]|['"]$/g, "")
  : JWT_DEFAULT_SECRET;

console.log(`[SYSINIT] Glint Core Configuration Verified. Using ${process.env.JWT_SECRET ? 'custom' : 'fallback'} security secrets.`);
