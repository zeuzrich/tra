import React, { useState } from 'react';
import { Test, Offer } from '../types';
import { calculateROI, calculateROAS, calculateCPA, calculateCTR, calculateConversionRate, calculateCPC } from '../utils/calculations';
import { parseCurrencyInput, createCurrencyInputProps } from '../utils/currency';

interface TestFormProps {
  offers: Offer[];
  onSubmit: (test: Omit<Test, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  editingTest?: Test;
}

const TestForm: React.FC<TestFormProps> = ({ offers, onSubmit, onCancel, editingTest }) => {
  const [formData, setFormData] = useState({
    startDate: editingTest?.startDate || '',
    productName: editingTest?.productName || '',
    niche: editingTest?.niche || '',
    offerSource: editingTest?.offerSource || '',
    landingPageUrl: editingTest?.landingPageUrl || '',
    investedAmount: editingTest ? editingTest.investedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
    clicks: editingTest?.clicks.toString() || '',
    returnValue: editingTest ? editingTest.returnValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
    impressions: editingTest?.impressions.toString() || '',
    conversions: editingTest?.conversions.toString() || '',
    status: editingTest?.status || 'Pausar' as const,
    observations: editingTest?.observations || '',
    offerId: editingTest?.offerId || ''
  });

  const handleOfferSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const offerId = e.target.value;
    const selectedOffer = offers.find(offer => offer.id === offerId);
    
    if (selectedOffer) {
      setFormData(prev => ({
        ...prev,
        offerId,
        productName: selectedOffer.name,
        niche: selectedOffer.niche,
        offerSource: selectedOffer.libraryLink,
        landingPageUrl: selectedOffer.landingPageLink
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        offerId: '',
        productName: '',
        niche: '',
        offerSource: '',
        landingPageUrl: ''
      }));
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const investedAmount = parseCurrencyInput(formData.investedAmount);
    const returnValue = parseCurrencyInput(formData.returnValue);
    const clicks = parseInt(formData.clicks);
    const impressions = parseInt(formData.impressions) || 0;
    const conversions = parseInt(formData.conversions) || 0;
    
    const roi = calculateROI(returnValue, investedAmount);
    const roas = calculateROAS(returnValue, investedAmount);
    const cpa = calculateCPA(investedAmount, conversions);
    const ctr = calculateCTR(clicks, impressions);
    const conversionRate = calculateConversionRate(conversions, clicks);
    const cpc = calculateCPC(investedAmount, clicks);
    
    onSubmit({
      startDate: formData.startDate,
      productName: formData.productName,
      niche: formData.niche,
      offerSource: formData.offerSource,
      landingPageUrl: formData.landingPageUrl,
      status: formData.status,
      observations: formData.observations,
      offerId: formData.offerId || undefined,
      investedAmount,
      returnValue,
      clicks,
      impressions,
      conversions,
      ctr,
      conversionRate,
      cpc,
      roi,
      roas,
      cpa
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {editingTest ? 'Editar Teste de Campanha' : 'Novo Teste de Campanha'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selecionar Oferta Cadastrada
            </label>
            <select
              value={formData.offerId}
              onChange={handleOfferSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione uma oferta ou preencha manualmente</option>
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.name} - {offer.niche}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Início *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nicho de Mercado *
              </label>
              <input
                type="text"
                name="niche"
                value={formData.niche}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origem da Oferta *
              </label>
              <input
                type="text"
                name="offerSource"
                value={formData.offerSource}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL da Landing Page *
            </label>
            <input
              type="url"
              name="landingPageUrl"
              value={formData.landingPageUrl}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Investido (R$) *
              </label>
              <input
                {...createCurrencyInputProps(
                  formData.investedAmount,
                  (value) => setFormData(prev => ({ ...prev, investedAmount: value }))
                )}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Impressões *
              </label>
              <input
                type="number"
                name="impressions"
                value={formData.impressions}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Cliques *
              </label>
              <input
                type="number"
                name="clicks"
                value={formData.clicks}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conversões *
              </label>
              <input
                type="number"
                name="conversions"
                value={formData.conversions}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor de Retorno (R$) *
              </label>
              <input
                {...createCurrencyInputProps(
                  formData.returnValue,
                  (value) => setFormData(prev => ({ ...prev, returnValue: value }))
                )}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status do Teste *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Escalar">Escalar</option>
              <option value="Pausar">Pausar</option>
              <option value="Encerrar">Encerrar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações e Insights
            </label>
            <textarea
              name="observations"
              value={formData.observations}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Adicione observações importantes sobre este teste..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingTest ? 'Atualizar Teste' : 'Salvar Teste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestForm;