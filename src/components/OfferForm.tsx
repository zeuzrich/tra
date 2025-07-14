import React, { useState } from 'react';
import { Offer } from '../types';

interface OfferFormProps {
  onSubmit: (offer: Omit<Offer, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  editingOffer?: Offer;
}

const OfferForm: React.FC<OfferFormProps> = ({ onSubmit, onCancel, editingOffer }) => {
  const [formData, setFormData] = useState({
    name: editingOffer?.name || '',
    libraryLink: editingOffer?.libraryLink || '',
    landingPageLink: editingOffer?.landingPageLink || '',
    checkoutLink: editingOffer?.checkoutLink || '',
    niche: editingOffer?.niche || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {editingOffer ? 'Editar Oferta' : 'Nova Oferta'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Oferta *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Curso de Marketing Digital"
              />
            </div>
            
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
                placeholder="Ex: Marketing Digital"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link da Biblioteca *
            </label>
            <input
              type="url"
              name="libraryLink"
              value={formData.libraryLink}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://exemplo.com/biblioteca"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link da Página de Vendas (PV) *
            </label>
            <input
              type="url"
              name="landingPageLink"
              value={formData.landingPageLink}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://exemplo.com/pv"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link do Checkout *
            </label>
            <input
              type="url"
              name="checkoutLink"
              value={formData.checkoutLink}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://exemplo.com/checkout"
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
              {editingOffer ? 'Atualizar Oferta' : 'Salvar Oferta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferForm;