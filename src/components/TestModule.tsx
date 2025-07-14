import React, { useState } from 'react';
import { Plus, Download, Filter, Search, Edit, Trash2, Brain } from 'lucide-react';
import { Test, Offer } from '../types';
import { formatCurrency, formatPercentage } from '../utils/calculations';
import { exportTestsToCSV } from '../utils/export';
import { aiInsightsService } from '../services/supabaseService';
import { usePermissions } from '../hooks/usePermissions';
import TestForm from './TestForm';

interface TestModuleProps {
  tests: Test[];
  offers: Offer[];
  onAddTest: (test: Omit<Test, 'id' | 'createdAt'>) => void;
  onUpdateTest: (id: string, test: Partial<Omit<Test, 'id' | 'createdAt'>>) => void;
  onDeleteTest: (id: string) => void;
}

const TestModule: React.FC<TestModuleProps> = ({ tests, offers, onAddTest, onUpdateTest, onDeleteTest }) => {
  const { canEdit } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const [loadingInsights, setLoadingInsights] = useState<Record<string, boolean>>({});

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.niche.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddTest = (testData: Omit<Test, 'id' | 'createdAt'>) => {
    onAddTest(testData);
    setShowForm(false);
    setEditingTest(null);
  };

  const handleEditTest = (test: Test) => {
    setEditingTest(test);
    setShowForm(true);
  };

  const handleUpdateTest = (testData: Omit<Test, 'id' | 'createdAt'>) => {
    if (editingTest) {
      onUpdateTest(editingTest.id, testData);
      setShowForm(false);
      setEditingTest(null);
    }
  };

  const handleDeleteTest = (test: Test) => {
    if (window.confirm(`Tem certeza que deseja excluir o teste "${test.productName}"?`)) {
      onDeleteTest(test.id);
    }
  };

  const handleGenerateInsight = async (test: Test) => {
    setLoadingInsights(prev => ({ ...prev, [test.id]: true }));
    try {
      const insight = await aiInsightsService.generateInsight(test);
      setAiInsights(prev => ({ ...prev, [test.id]: insight }));
    } catch (error) {
      console.error('Error generating insight:', error);
      alert('Erro ao gerar insight. Verifique se a API da OpenAI está configurada.');
    } finally {
      setLoadingInsights(prev => ({ ...prev, [test.id]: false }));
    }
  };

  const handleExport = () => {
    exportTestsToCSV(filteredTests);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Testes</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
          {canEdit('tests') && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Teste
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por produto ou nicho..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="Escalar">Escalar</option>
              <option value="Pausar">Pausar</option>
              <option value="Encerrar">Encerrar</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Produto</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Nicho</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Investimento</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">CTR</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Conv. Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">CPC</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Retorno</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">ROI</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test) => (
                <React.Fragment key={test.id}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{test.productName}</td>
                    <td className="py-3 px-4 text-gray-600">{test.niche}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(test.startDate).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-4 text-gray-600">{formatCurrency(test.investedAmount)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatPercentage(test.ctr)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatPercentage(test.conversionRate)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatCurrency(test.cpc)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatCurrency(test.returnValue)}</td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${test.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(test.roi)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        test.status === 'Escalar' ? 'bg-green-100 text-green-800' :
                        test.status === 'Pausar' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleGenerateInsight(test)}
                          disabled={loadingInsights[test.id]}
                          className="text-purple-600 hover:text-purple-800 transition-colors disabled:opacity-50"
                          title="Gerar Insight com IA"
                        >
                          {loadingInsights[test.id] ? (
                            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Brain className="w-4 h-4" />
                          )}
                        </button>
                        {canEdit('tests') && (
                          <>
                            <button
                              onClick={() => handleEditTest(test)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTest(test)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {aiInsights[test.id] && (
                    <tr className="bg-purple-50 border-b border-gray-100">
                      <td colSpan={11} className="py-3 px-4">
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center mb-2">
                            <Brain className="w-4 h-4 text-purple-600 mr-2" />
                            <span className="font-medium text-purple-800">Insight da IA</span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiInsights[test.id]}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum teste encontrado</p>
          </div>
        )}
      </div>

      {showForm && (
        <TestForm
          offers={offers}
          onSubmit={editingTest ? handleUpdateTest : handleAddTest}
          onCancel={() => {
            setShowForm(false);
            setEditingTest(null);
          }}
          editingTest={editingTest || undefined}
        />
      )}
    </div>
  );
};

export default TestModule;