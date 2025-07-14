import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Configuração do Supabase - substitua pelos seus valores reais
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vjeillnxklinolsszaki.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZWlsbG54a2xpbm9sc3N6YWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMjAwNzIsImV4cCI6MjA2NzY5NjA3Mn0.qZMw03kiadXC62Y-pdTcPa3Ks1wPDi7r1kKewRy3m2A';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please configure them in .env file or directly in supabase.ts');
  // Não quebrar a aplicação, mas mostrar erro no console
}

if (supabaseUrl.includes('https://vjeillnxklinolsszaki.supabase.co') || supabaseAnonKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZWlsbG54a2xpbm9sc3N6YWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMjAwNzIsImV4cCI6MjA2NzY5NjA3Mn0.qZMw03kiadXC62Y-pdTcPa3Ks1wPDi7r1kKewRy3m2A')) {
  console.warn('⚠️ Supabase não configurado! Configure as variáveis de ambiente ou edite src/lib/supabase.ts');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};