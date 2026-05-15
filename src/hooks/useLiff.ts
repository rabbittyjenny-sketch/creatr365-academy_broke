import { useEffect, useState, useCallback } from 'react';
import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID as string;

export type LiffProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

type LiffState = {
  ready: boolean;
  loggedIn: boolean;
  profile: LiffProfile | null;
  accessToken: string | null;
  error: string | null;
};

export function useLiff() {
  const [state, setState] = useState<LiffState>({
    ready: false,
    loggedIn: false,
    profile: null,
    accessToken: null,
    error: null,
  });

  useEffect(() => {
    if (!LIFF_ID) {
      setState(s => ({ ...s, ready: true, error: 'VITE_LINE_LIFF_ID is not configured' }));
      return;
    }

    liff
      .init({ liffId: LIFF_ID })
      .then(async () => {
        const loggedIn = liff.isLoggedIn();
        if (loggedIn) {
          const [profile, accessToken] = await Promise.all([
            liff.getProfile(),
            Promise.resolve(liff.getAccessToken()),
          ]);
          setState({ ready: true, loggedIn: true, profile, accessToken, error: null });
        } else {
          setState({ ready: true, loggedIn: false, profile: null, accessToken: null, error: null });
        }
      })
      .catch((err: Error) => {
        setState(s => ({ ...s, ready: true, error: err.message }));
      });
  }, []);

  const login = useCallback(() => {
    liff.login({ redirectUri: window.location.href });
  }, []);

  const logout = useCallback(() => {
    liff.logout();
    setState(s => ({ ...s, loggedIn: false, profile: null, accessToken: null }));
  }, []);

  const isInClient = liff.isInClient?.() ?? false;

  return { ...state, login, logout, isInClient };
}
