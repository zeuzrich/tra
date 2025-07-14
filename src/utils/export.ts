import { Test, FinancialData, Offer } from '../types';

export const exportTestsToCSV = (tests: Test[]): void => {
  const headers = [
    'Data de Início',
    'Produto',
    'Nicho',
    'Fonte da Oferta',
    'URL da Landing Page',
    'Investimento (R$)',
    'Cliques',
    'Retorno (R$)',
    'CPA (R$)',
    'ROI (%)',
    'ROAS (%)',
    'Status',
    'Observações'
  ];

  const csvContent = [
    headers.join(','),
    ...tests.map(test => [
      test.startDate,
      `"${test.productName}"`,
      `"${test.niche}"`,
      `"${test.offerSource}"`,
      `"${test.landingPageUrl}"`,
      test.investedAmount.toFixed(2),
      test.clicks,
      test.returnValue.toFixed(2),
      test.cpa.toFixed(2),
      test.roi.toFixed(2),
      test.roas.toFixed(2),
      test.status,
      `"${test.observations}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `testes_trafico_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportOffersToCSV = (offers: Offer[]): void => {
  const headers = [
    'Nome',
    'Nicho',
    'Link da Biblioteca',
    'Link da PV',
    'Link do Checkout',
    'Data de Criação'
  ];

  const csvContent = [
    headers.join(','),
    ...offers.map(offer => [
      `"${offer.name}"`,
      `"${offer.niche}"`,
      `"${offer.libraryLink}"`,
      `"${offer.landingPageLink}"`,
      `"${offer.checkoutLink}"`,
      offer.createdAt
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `ofertas_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportFinancialToCSV = (financial: FinancialData): void => {
  const headers = [
    'Data',
    'Tipo',
    'Valor (R$)',
    'Descrição',
    'ID do Teste'
  ];

  const csvContent = [
    headers.join(','),
    ...financial.transactions.map(transaction => [
      transaction.date,
      transaction.type,
      transaction.amount.toFixed(2),
      `"${transaction.description}"`,
      transaction.testId || ''
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `financeiro_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};