import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  // Verificar se o Supabase está configurado
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon-key')) {
    console.warn('⚠️ Supabase não configurado corretamente!');
    console.warn('Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
  }
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h1>Erro ao carregar a aplicação</h1>
      <p>Verifique se as variáveis de ambiente do Supabase estão configuradas.</p>
      <p>Por favor, recarregue a página após configurar.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Recarregar Página
      </button>
      <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; text-align: left;">
        <h3>Configuração necessária:</h3>
        <p>1. Configure as variáveis no arquivo .env:</p>
        <code style="display: block; background: #e9ecef; padding: 10px; margin: 10px 0;">
          VITE_SUPABASE_URL=https://seu-projeto.supabase.co<br>
          VITE_SUPABASE_ANON_KEY=sua-chave-anonima
        </code>
        <p>2. Ou edite diretamente o arquivo src/lib/supabase.ts</p>
      </div>
    </div>
  `;
}
