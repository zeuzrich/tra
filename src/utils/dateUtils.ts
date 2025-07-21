export const formatDateToBrazilianTime = (dateInput: string | Date): string => {
  const date = new Date(dateInput);
  
  // Para datas sem componente de tempo (ex: 'YYYY-MM-DD'),
  // garantir que seja interpretado como meia-noite em São Paulo
  if (typeof dateInput === 'string' && dateInput.length === 10) { // YYYY-MM-DD
    const [year, month, day] = dateInput.split('-').map(Number);
    // Month is 0-indexed in JS Date
    const saoPauloDate = new Date(Date.UTC(year, month - 1, day, 3, 0, 0)); // Adjust for UTC-3
    return saoPauloDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }
  
  // Para timestamps completos
  return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

export const formatDateOnly = (dateInput: string | Date): string => {
  const date = new Date(dateInput);
  
  // Para datas sem componente de tempo (ex: 'YYYY-MM-DD'),
  // garantir que seja interpretado como meia-noite em São Paulo
  if (typeof dateInput === 'string' && dateInput.length === 10) { // YYYY-MM-DD
    const [year, month, day] = dateInput.split('-').map(Number);
    // Month is 0-indexed in JS Date
    const saoPauloDate = new Date(Date.UTC(year, month - 1, day, 3, 0, 0)); // Adjust for UTC-3
    return saoPauloDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }
  
  // Para timestamps completos, mostrar apenas a data
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};