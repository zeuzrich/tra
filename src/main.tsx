import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

console.log('Iniciando aplicação...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  console.log('Root element encontrado, renderizando app...');

  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );

  console.log('App renderizado com sucesso!');
} catch (error) {
  console.error('Failed to render app:', error);
  
  // Fallback UI em caso de erro
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc3545; margin-bottom: 20px;">Erro ao carregar a aplicação</h1>
        <p style="margin-bottom: 20px; color: #6c757d;">Ocorreu um erro durante o carregamento. Verifique o console para mais detalhes.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
          <h3 style="margin-top: 0; color: #495057;">Detalhes do erro:</h3>
          <pre style="background: #e9ecef; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${error.message}</pre>
        </div>
        
        <button 
          onclick="window.location.reload()" 
          style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin: 10px;"
        >
          Recarregar Página
        </button>
        
        <button 
          onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload()" 
          style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin: 10px;"
        >
          Limpar Cache e Recarregar
        </button>
      </div>
    `;
  }
}