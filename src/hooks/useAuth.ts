import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isInitialized = false;

    // Check for existing session first
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        
        console.log('Initial session check:', session ? 'Found session' : 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        isInitialized = true;
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only set loading to false if we haven't initialized yet
        if (!isInitialized) {
          setLoading(false);
        }
      }
    );

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      setUser(null);
      setSession(null);
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    session,
    loading,
    signOut
  };
}