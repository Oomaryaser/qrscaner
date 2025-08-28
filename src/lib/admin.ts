import crypto from 'crypto';

export const ADMIN_PASSCODE = "match454429";
export const ADMIN_USER_ID = "11111111-1111-1111-1111-111111111111";
export const ADMIN_USERNAME = "admin";

// Function to hash passwords for additional security
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'salt2025').digest('hex');
}

// Function to verify admin passcode
export function verifyAdminPasscode(passcode: string): boolean {
  return passcode === ADMIN_PASSCODE;
}

