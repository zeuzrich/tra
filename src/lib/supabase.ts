import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Configuração do Supabase com valores diretos para garantir funcionamento
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vjeillnxklinolsszaki.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZWlsbG54a2xpbm9sc3N6YWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMjAwNzIsImV4cCI6MjA2NzY5NjA3Mn0.qZMw03kiadXC62Y-pdTcPa3Ks1wPDi7r1kKewRy3m2A';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Configurado' : 'Não configurado');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const signUp = async (email: string, password: string) => {
  try {
    console.log('🔐 Attempting to sign up user:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Desabilitar confirmação por email
        data: {
          email_confirm: true // Confirmar email automaticamente
        }
      }
    });
    
    console.log('📝 SignUp result:', { data: !!data, error });
    
    return { data, error };
  } catch (error) {
    console.error('Error in signUp:', error);
    return { data: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    console.error('Error in signIn:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Error in signOut:', error);
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return { user: null, error };
  }
};