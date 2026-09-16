import { createHmac, timingSafeEqual } from 'crypto';

const IMPERSONATION_SECRET =
  process.env.IMPERSONATION_RESTORE_SECRET || process.env.SECRET_KEY || 'impersonation-restore-fallback';
const COOKIE_MAX_AGE_SEC = 3600; // 1 hour

export interface ImpersonationRestorePayload {
  adminUid: string;
  exp: number;
}

function getSecret(): Buffer {
  return Buffer.from(IMPERSONATION_SECRET, 'utf8');
}

export function createImpersonationRestoreToken(adminUid: string): string {
  const payload: ImpersonationRestorePayload = {
    adminUid,
    exp: Date.now() + COOKIE_MAX_AGE_SEC * 1000,
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, 'utf8').toString('base64url');
  const sig = createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyImpersonationRestoreToken(token: string): ImpersonationRestorePayload | null {
  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;
    const expectedSig = createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
    if (expectedSig.length !== sig.length || !timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))) {
      return null;
    }
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr) as ImpersonationRestorePayload;
    if (payload.exp < Date.now() || !payload.adminUid) return null;
    return payload;
  } catch {
    return null;
  }
}

export const IMPERSONATION_RESTORE_COOKIE_NAME = 'impersonation_restore';
export const IMPERSONATION_RESTORE_MAX_AGE = COOKIE_MAX_AGE_SEC;

/** One-time token for POST /api/session/restore-after-impersonation (no CSRF). Short TTL. */
const SESSION_RESTORE_TTL_MS = 60 * 1000; // 60s

export interface SessionRestorePayload {
  adminUid: string;
  purpose: 'session-restore';
  exp: number;
}

export function createOneTimeSessionRestoreToken(adminUid: string): string {
  const payload: SessionRestorePayload = {
    adminUid,
    purpose: 'session-restore',
    exp: Date.now() + SESSION_RESTORE_TTL_MS,
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, 'utf8').toString('base64url');
  const sig = createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyOneTimeSessionRestoreToken(token: string): SessionRestorePayload | null {
  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;
    const expectedSig = createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
    if (expectedSig.length !== sig.length || !timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))) {
      return null;
    }
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr) as SessionRestorePayload;
    if (payload.exp < Date.now() || payload.purpose !== 'session-restore' || !payload.adminUid) return null;
    return payload;
  } catch {
    return null;
  }
}
