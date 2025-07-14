import React from 'react';
import { TrendingUp, Target, DollarSign, BarChart3, Trophy, Star } from 'lucide-react';
import { Test, Metrics, Offer } from '../types';
import { formatCurrency, formatPercentage } from '../utils/calculations';
import MetricCard from './MetricCard';
import ROIChart from './ROIChart';

interface DashboardProps {
  tests: Test[];
  offers: Offer[];
  metrics: Metrics;
}

const Dashboard: React.FC<DashboardProps> = ({ tests, offers, metrics }) => {
  const chartData = tests.map(test => ({
    date: test.startDate,
    roi: test.roi,
    investment: test.investedAmount,
    revenue: test.returnValue
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calcular ranking das ofertas
  const getOfferRanking = () => {
    const offerStats = offers.map(offer => {
      const relatedTests = tests.filter(test => test.offerId === offer.id);
      
      if (relatedTests.length === 0) {
        return {
          offer,
          totalTests: 0,
          totalInvestment: 0,
          totalRevenue: 0,
          avgROI: 0,
          avgROAS: 0,
          successRate: 0,
          netProfit: 0,
          score: 0
        };
      }

      const totalInvestment = relatedTests.reduce((sum, test) => sum + test.investedAmount, 0);
      const totalRevenue = relatedTests.reduce((sum, test) => sum + test.returnValue, 0);
      const avgROI = relatedTests.reduce((sum, test) => sum + test.roi, 0) / relatedTests.length;
      const avgROAS = relatedTests.reduce((sum, test) => sum + test.roas, 0) / relatedTests.length;
      const successfulTests = relatedTests.filter(test => test.roi > 0).length;
      const successRate = (successfulTests / relatedTests.length) * 100;
      const netProfit = totalRevenue - totalInvestment;
      
      // Score baseado em múltiplos fatores (ROI, taxa de sucesso, lucro líquido)
      const score = (avgROI * 0.4) + (successRate * 0.3) + (netProfit > 0 ? (netProfit / 1000) * 0.3 : 0);

      return {
        offer,
        totalTests: relatedTests.length,
        totalInvestment,
        totalRevenue,
        avgROI,
        avgROAS,
        successRate,
        netProfit,
        score
      };
    });

    return offerStats.sort((a, b) => b.score - a.score).slice(0, 5);
  };

  const topOffers = getOfferRanking();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Investimento Total"
          value={formatCurrency(metrics.totalInvestment)}
          icon={DollarSign}
          color="blue"
          subtitle="Valor total investido"
        />
        
        <MetricCard
          title="Total de Testes"
          value={metrics.totalTests.toString()}
          icon={Target}
          color="green"
          subtitle="Testes executados"
        />
        
        <MetricCard
          title="Taxa de Sucesso"
          value={formatPercentage(metrics.successRate)}
          icon={TrendingUp}
          color={metrics.successRate >= 50 ? 'green' : 'red'}
          subtitle="Testes lucrativos"
        />
        
        <MetricCard
          title="Resultado Líquido"
          value={formatCurrency(metrics.netResult)}
          icon={BarChart3}
          color={metrics.netResult >= 0 ? 'green' : 'red'}
          subtitle="Lucro/Prejuízo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ROIChart data={chartData} />
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Ranking das Melhores Ofertas
          </h3>
          <div className="space-y-3">
            {topOffers.length > 0 ? (
              topOffers.map((offerStat, index) => (
                <div key={offerStat.offer.id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{offerStat.offer.name}</h4>
                        <p className="text-xs text-gray-500">{offerStat.offer.niche}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        {offerStat.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">ROI Médio:</span>
                      <span className={`font-medium ${offerStat.avgROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(offerStat.avgROI)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Taxa Sucesso:</span>
                      <span className="font-medium text-blue-600">
                        {formatPercentage(offerStat.successRate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lucro Líquido:</span>
                      <span className={`font-medium ${offerStat.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(offerStat.netProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Testes:</span>
                      <span className="font-medium text-gray-700">
                        {offerStat.totalTests}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Nenhuma oferta com testes encontrada</p>
                <p className="text-gray-400 text-xs mt-1">Adicione ofertas e execute testes para ver o ranking</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {tests.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimos Testes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Produto</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Data</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Investimento</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">ROI</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {tests.slice(-5).reverse().map((test) => (
                  <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium text-gray-900">{test.productName}</td>
                    <td className="py-2 px-4 text-gray-600">{new Date(test.startDate).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 px-4 text-gray-600">{formatCurrency(test.investedAmount)}</td>
                    <td className="py-2 px-4">
                      <span className={`font-medium ${test.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(test.roi)}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        test.status === 'Escalar' ? 'bg-green-100 text-green-800' :
                        test.status === 'Pausar' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {test.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;