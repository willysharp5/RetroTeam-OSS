'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { useAuth } from 'reactfire';
import { parseCookies, destroyCookie } from 'nookies';

import { useApiRequest } from '~/core/hooks/use-api';
import { UserSessionContext } from '~/core/contexts/user-session';
import { IMPERSONATING_CLIENT_COOKIE } from '~/components/admin/users/ImpersonateUserModal';

const EXIT_IMPERSONATION_PATH = '/api/admin/session/exit-impersonation';
const RESTORE_SESSION_PATH = '/api/session/restore-after-impersonation';

export default function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const { userSession } = useContext(UserSessionContext);
  const auth = useAuth();
  const fetcher = useApiRequest<{ customToken: string; restoreToken: string }>();

  // Re-read cookie on mount and when session changes (e.g. after sign-out)
  useEffect(() => {
    const cookies = parseCookies();
    setIsImpersonating(cookies[IMPERSONATING_CLIENT_COOKIE] === '1');
  }, [userSession]);

  const [exiting, setExiting] = useState(false);

  const clearBannerAndCookie = useCallback(() => {
    destroyCookie(null, IMPERSONATING_CLIENT_COOKIE, { path: '/' });
    setIsImpersonating(false);
  }, []);

  const handleExit = async () => {
    if (exiting) return;
    setExiting(true);
    try {
      const { customToken, restoreToken } = await fetcher({
        path: EXIT_IMPERSONATION_PATH,
        method: 'POST',
      });

      // Hide banner and clear client cookie immediately so UI never stays stuck
      clearBannerAndCookie();

      const session = await signInWithCustomToken(auth, customToken);
      const idToken = await session.user.getIdToken();
      const restoreRes = await fetch(RESTORE_SESSION_PATH, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, restoreToken }),
      });
      if (!restoreRes.ok) {
        const err = await restoreRes.json().catch(() => ({}));
        throw new Error(err?.message ?? 'Restore session failed');
      }
      window.location.assign('/admin');
    } catch {
      // 401 or any error: clear cookie and hide banner so banner never stays stuck
      clearBannerAndCookie();
      setExiting(false);
      window.location.assign('/admin');
    }
  };

  // Hide when not impersonating or when user has signed out (no session)
  if (!isImpersonating || !userSession?.auth) return null;

  const label =
    userSession?.data?.fullName ||
    userSession?.auth?.email ||
    userSession?.auth?.uid ||
    'User';

  return (
    <>
      <div className="h-10 flex-shrink-0" aria-hidden />
      <div
        className="fixed top-0 left-0 right-0 z-[9999] flex h-10 items-center justify-center gap-4 bg-amber-500 px-4 py-2 text-sm font-medium text-black shadow"
        role="banner"
      >
      <span>Impersonating: {label}</span>
      <button
        type="button"
        onClick={handleExit}
        disabled={exiting}
        className="rounded bg-black/20 px-3 py-1 font-medium hover:bg-black/30 disabled:opacity-50"
      >
        {exiting ? 'Exiting…' : 'Exit impersonation'}
      </button>
      </div>
    </>
  );
}
