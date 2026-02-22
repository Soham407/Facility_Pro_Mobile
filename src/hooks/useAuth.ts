import { useCallback, useEffect } from 'react';
import { supabase, authStorage } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { AppUser, AppRole } from '../types/auth';

export function useAuth() {
  const { user, role, isAuthenticated, isLoading, login, logout, setLoading } =
    useAuthStore();

  // Fetch user record + role from public.users JOIN public.roles
  const fetchUserProfile = useCallback(async (authUserId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        id,
        employee_id,
        role_id,
        username,
        full_name,
        email,
        phone,
        is_active,
        supplier_id,
        roles:role_id (
          id,
          role_name,
          role_display_name,
          permissions
        )
      `
      )
      .eq('id', authUserId)
      .single();

    if (error || !data) {
      console.error('Failed to fetch user profile:', error?.message);
      return null;
    }

    const appUser: AppUser = {
      id: data.id,
      employee_id: data.employee_id,
      role_id: data.role_id,
      username: data.username,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      is_active: data.is_active,
      supplier_id: data.supplier_id,
    };

    // roles comes back as object from .single() join
    const roleData = data.roles as unknown as AppRole;
    return { appUser, appRole: roleData };
  }, []);

  // Sign in with email/password
  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({ email, password });

        if (authError) throw authError;
        if (!authData.session || !authData.user) throw new Error('No session returned');

        const profile = await fetchUserProfile(authData.user.id);
        if (!profile) throw new Error('User profile not found in database');
        if (!profile.appUser.is_active) throw new Error('Account is deactivated');

        login(profile.appUser, profile.appRole, {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        });

        return { success: true, role: profile.appRole.role_name };
      } catch (err) {
        setLoading(false);
        const message = err instanceof Error ? err.message : 'Login failed';
        return { success: false, error: message };
      }
    },
    [fetchUserProfile, login, setLoading]
  );

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    authStorage.clearAll();
    logout();
  }, [logout]);

  // Restore session on app start
  const restoreSession = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile && profile.appUser.is_active) {
          login(profile.appUser, profile.appRole, {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          return;
        }
      }
    } catch (err) {
      console.error('Session restore failed:', err);
    }
    logout();
  }, [fetchUserProfile, login, logout]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'SIGNED_OUT') {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, [logout]);

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    restoreSession,
  };
}
