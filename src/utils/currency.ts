export const formatCurrencyInput = (value: string): string => {
  // Remove tudo que não é dígito
  const numericValue = value.replace(/\D/g, '');
  
  // Se não há valor, retorna vazio
  if (!numericValue) return '';
  
  // Converte para número e divide por 100 para ter centavos
  const numberValue = parseFloat(numericValue) / 100;
  
  // Formata como moeda brasileira
  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const parseCurrencyInput = (value: string): number => {
  // Remove símbolos de moeda e espaços, mantém apenas números e vírgula
  const cleanValue = value.replace(/[R$\s]/g, '').replace(/\./g, '');
  
  // Converte vírgula para ponto decimal
  const numberValue = parseFloat(cleanValue.replace(',', '.')) || 0;
  
  return numberValue;
};

export const handleCurrencyInput = (
  inputValue: string,
  onChange: (value: string) => void
) => {
  // Remove tudo que não é dígito
  const numericOnly = inputValue.replace(/\D/g, '');
  
  // Se não há dígitos, limpa o campo
  if (!numericOnly) {
    onChange('');
    return;
  }
  
  // Converte para número (centavos)
  const cents = parseInt(numericOnly);
  const reais = cents / 100;
  
  // Formata como moeda
  const formatted = reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  onChange(formatted);
};

export const createCurrencyInputProps = (
  value: string,
  onChange: (value: string) => void
) => ({
  type: 'text' as const,
  value,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCurrencyInput(e.target.value, onChange);
  },
  placeholder: 'R$ 0,00'
});