import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Configuração do Supabase - substitua pelos seus valores reais
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please configure them in .env file or directly in supabase.ts');
  // Não quebrar a aplicação, mas mostrar erro no console
}

if (supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
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