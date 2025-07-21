import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Download } from 'lucide-react';
import { FinancialData, Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';
import { exportFinancialToCSV } from '../utils/export';
import { parseCurrencyInput, createCurrencyInputProps } from '../utils/currency';
import { formatDateToBrazilianTime } from '../utils/dateUtils';
import { useAuth } from '../hooks/useAuth';
import { signIn } from '../lib/supabase';

interface FinancialModuleProps {
  financial: FinancialData;
  onUpdateFinancial: (data: Partial<FinancialData>) => void;
}

const FinancialModule: React.FC<FinancialModuleProps> = ({ financial, onUpdateFinancial }) => {
  const { user } = useAuth();
  const [showCapitalForm, setShowCapitalForm] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [capitalAmount, setCapitalAmount] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense' as const,
    amount: '',
    description: ''
  });

  const handleConfirmUpdateCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.email) {
      setAuthError('Usuário não encontrado');
      return;
    }
    
    setLoading(true);
    setAuthError('');
    
    try {
      // Verificar senha do usuário
      const { error: loginError } = await signIn(user.email, passwordInput);
      
      if (loginError) {
        throw new Error('Senha incorreta. Verifique suas credenciais.');
      }
      
      // Se a senha estiver correta, atualizar o capital
      const amount = parseCurrencyInput(capitalAmount);
      if (amount > 0) {
        const netProfit = financial.totalRevenue - financial.totalInvestment;
        onUpdateFinancial({
          initialCapital: amount,
          currentBalance: amount + netProfit
        });
        
        // Resetar formulários
        setShowPasswordConfirmation(false);
        setShowCapitalForm(false);
        setCapitalAmount('');
        setPasswordInput('');
      }
    } catch (error: any) {
      setAuthError(error.message || 'Erro ao verificar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCapital = (e: React.FormEvent) => {
    e.preventDefault();
    // Agora pede confirmação de senha
    setShowPasswordConfirmation(true);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseCurrencyInput(transactionForm.amount);
    if (amount > 0) {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: transactionForm.type,
        amount,
        description: transactionForm.description,
        date: new Date().toISOString()
      };

      const updatedTransactions = [...financial.transactions, newTransaction];
      let newBalance = financial.currentBalance;
      
      if (transactionForm.type === 'expense') {
        newBalance -= amount;
      } else if (transactionForm.type === 'revenue') {
        newBalance += amount;
      }

      onUpdateFinancial({
        transactions: updatedTransactions,
        currentBalance: newBalance
      });

      setShowTransactionForm(false);
      setTransactionForm({
        type: 'expense',
        amount: '',
        description: ''
      });
    }
  };

  const handleExport = () => {
    exportFinancialToCSV(financial);
  };

  const budgetUsagePercentage = financial.initialCapital > 0 
    ? ((financial.totalInvestment / financial.initialCapital) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestão Financeira</h1>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <button
              onClick={() => setShowCapitalForm(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Atualizar
            </button>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Capital Inicial</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(financial.initialCapital)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Saldo Atual</h3>
          <p className={`text-2xl font-bold ${financial.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(financial.currentBalance)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Investido</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(financial.totalInvestment)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Uso do Orçamento</h3>
          <p className="text-2xl font-bold text-gray-900">{budgetUsagePercentage.toFixed(1)}%</p>
        </div>
      </div>

      {budgetUsagePercentage > 80 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800 font-medium">
              Atenção: Você já utilizou {budgetUsagePercentage.toFixed(1)}% do seu orçamento inicial!
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Fluxo de Caixa</h3>
          <button
            onClick={() => setShowTransactionForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nova Transação
          </button>
        </div>

        <div className="space-y-3">
          {financial.transactions.slice(-10).reverse().map((transaction) => (
            <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  transaction.type === 'revenue' ? 'bg-green-500' :
                  transaction.type === 'expense' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}></div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500">
                    {formatDateToBrazilianTime(transaction.date)}
                  </p>
                </div>
              </div>
              <span className={`font-medium ${
                transaction.type === 'revenue' ? 'text-green-600' :
                transaction.type === 'expense' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
              </span>
            </div>
          ))}
        </div>

        {financial.transactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma transação registrada</p>
          </div>
        )}
      </div>

      {showCapitalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Atualizar Capital Inicial</h2>
            <form onSubmit={handleUpdateCapital}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor do Capital (R$)
                </label>
                <input
                  {...createCurrencyInputProps(
                    capitalAmount,
                    setCapitalAmount
                  )}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCapitalForm(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Atualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Senha</h2>
            <p className="text-gray-600 mb-4">
              Por segurança, confirme sua senha para atualizar o capital inicial.
            </p>
            
            <form onSubmit={handleConfirmUpdateCapital}>
              {authError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{authError}</p>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sua Senha
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite sua senha"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordConfirmation(false);
                    setPasswordInput('');
                    setAuthError('');
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verificando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nova Transação</h2>
            <form onSubmit={handleAddTransaction}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Transação
                </label>
                <select
                  value={transactionForm.type}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="expense">Despesa</option>
                  <option value="revenue">Receita</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$)
                </label>
                <input
                  {...createCurrencyInputProps(
                    transactionForm.amount,
                    (value) => setTransactionForm(prev => ({ ...prev, amount: value }))
                  )}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTransactionForm(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialModule;