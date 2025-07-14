import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Initializing...');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('useAuth: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('useAuth: Error getting session:', error);
        } else {
          console.log('useAuth: Initial session:', !!session);
        }
        
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('useAuth: Exception getting session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    console.log('useAuth: Setting up auth listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed:', event, !!session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      console.log('useAuth: Cleaning up...');
      subscription.unsubscribe();
    };
  }, []);

  console.log('useAuth: Current state:', { user: !!user, loading });

  return { user, loading };
};