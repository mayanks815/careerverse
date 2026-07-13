import crypto from 'crypto';

// Get or derive a 32-byte key from the environment PIN
const getSecretKey = (): Buffer => {
  const pin = process.env.MISSION_CONTROL_PIN || 'fallback-dev-pin-1234';
  // Derive a 32-byte key using scrypt sync
  return crypto.scryptSync(pin, 'mission-control-salt-3982', 32);
};

export interface SessionPayload {
  expiresAt: number;
}

/**
 * Encrypt session payload into a token string
 */
export function encryptSession(payload: SessionPayload): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a token string back into the session payload
 */
export function decryptSession(token: string): SessionPayload | null {
  try {
    const parts = token.split(':');
    if (parts.length !== 2) return null;
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = getSecretKey();
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const parsed = JSON.parse(decrypted);
    if (parsed && typeof parsed.expiresAt === 'number') {
      return parsed as SessionPayload;
    }
    return null;
  } catch (error) {
    return null;
  }
}
