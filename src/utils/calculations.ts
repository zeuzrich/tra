import { Test, FinancialData, Metrics } from '../types';

export const calculateROI = (returnValue: number, investedAmount: number): number => {
  if (investedAmount === 0) return 0;
  return ((returnValue - investedAmount) / investedAmount) * 100;
};

export const calculateROAS = (returnValue: number, investedAmount: number): number => {
  if (investedAmount === 0) return 0;
  return (returnValue / investedAmount) * 100;
};

export const calculateCPA = (investedAmount: number, conversions: number): number => {
  if (conversions === 0) return 0;
  return investedAmount / conversions;
};

export const calculateCTR = (clicks: number, impressions: number): number => {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
};

export const calculateConversionRate = (conversions: number, clicks: number): number => {
  if (clicks === 0) return 0;
  return (conversions / clicks) * 100;
};

export const calculateCPC = (investedAmount: number, clicks: number): number => {
  if (clicks === 0) return 0;
  return investedAmount / clicks;
};

export const calculateMetrics = (tests: Test[]): Metrics => {
  const totalInvestment = tests.reduce((sum, test) => sum + test.investedAmount, 0);
  const totalRevenue = tests.reduce((sum, test) => sum + test.returnValue, 0);
  const successfulTests = tests.filter(test => test.roi > 0).length;
  const successRate = tests.length > 0 ? (successfulTests / tests.length) * 100 : 0;
  const netResult = totalRevenue - totalInvestment;
  const avgROI = tests.length > 0 ? tests.reduce((sum, test) => sum + test.roi, 0) / tests.length : 0;
  const avgCPA = tests.length > 0 ? tests.reduce((sum, test) => sum + test.cpa, 0) / tests.length : 0;

  return {
    totalInvestment,
    totalTests: tests.length,
    successRate,
    netResult,
    avgROI,
    avgCPA
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};