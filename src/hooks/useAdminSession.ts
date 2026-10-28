import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase, supabaseConfigured } from '@/lib/supabase';

type AdminCheck = { email: string | null; isAdmin: boolean; error?: string };

/**
 * Supabase Auth session + whether that user is listed in `admin_users`.
 * Only starts once `enabled` is true (the owner opens the login), keeping auth off the first load.
 */
export function useAdminSession(enabled: boolean) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(supabaseConfigured);

  const check = useCallback(async (sb: SupabaseClient): Promise<AdminCheck> => {
    try {
      const { data, error: sessionError } = await sb.auth.getSession();
      if (sessionError) throw new Error(`Could not read your sign-in session: ${sessionError.message}`);
      const user = data.session?.user ?? null;
      const userEmail = user?.email ?? null;
      setEmail(userEmail);
      if (!user) {
        setIsAdmin(false);
        setChecking(false);
        return { email: null, isAdmin: false };
      }

      const { data: ok, error: adminError } = await sb.rpc('is_admin');
      if (adminError) {
        setIsAdmin(false);
        setChecking(false);
        return { email: userEmail, isAdmin: false, error: `Your credentials were accepted, but the media-admin permission check failed: ${adminError.message}` };
      }
      const authorized = ok === true;
      setIsAdmin(authorized);
      setChecking(false);
      return { email: userEmail, isAdmin: authorized };
    } catch (error) {
      setIsAdmin(false);
      setChecking(false);
      return { email, isAdmin: false, error: error instanceof Error ? error.message : 'Could not verify the sign-in session.' };
    }
  }, [email]);

  useEffect(() => {
    if (!enabled) return undefined;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void getSupabase().then((sb) => {
      if (cancelled) return;
      if (!sb) {
        setChecking(false);
        return;
      }
      setClient(sb);
      void check(sb);
      unsubscribe = sb.auth.onAuthStateChange(() => { void check(sb); }).data.subscription.unsubscribe;
    }).catch((error: unknown) => {
      if (cancelled) return;
      setChecking(false);
      setIsAdmin(false);
      console.error('[Media admin auth initialization]', error);
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled, check]);

  const signIn = useCallback(async (e: string, password: string) => {
    if (!client) return 'The sign-in connection is still loading. Please wait a moment and try again.';
    const { error } = await client.auth.signInWithPassword({ email: e.trim(), password });
    if (error) return `Sign-in failed: ${error.message}`;
    const result = await check(client);
    if (result.error) {
      await client.auth.signOut();
      return result.error;
    }
    if (!result.isAdmin) {
      await client.auth.signOut();
      return 'Your credentials were accepted, but this account is not authorised to manage website media.';
    }
    return null;
  }, [client, check]);

  const signOut = useCallback(async () => {
    await client?.auth.signOut();
  }, [client]);

  return { client, email, isAdmin, checking, signIn, signOut };
}
