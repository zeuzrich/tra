import React, { useState } from 'react';
import { Plus, Download, Search, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { Offer } from '../types';
import { exportOffersToCSV } from '../utils/export';
import { usePermissions } from '../hooks/usePermissions';
import OfferForm from './OfferForm';

interface OfferModuleProps {
  offers: Offer[];
  tests: Test[];
  onAddOffer: (offer: Omit<Offer, 'id' | 'createdAt'>) => void;
  onUpdateOffer: (id: string, offer: Partial<Omit<Offer, 'id' | 'createdAt'>>) => void;
  onDeleteOffer: (offerId: string) => void;
}

const OfferModule: React.FC<OfferModuleProps> = ({ offers, tests, onAddOffer, onUpdateOffer, onDeleteOffer }) => {
  const { canEdit } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Function to get offer status based on related tests
  const getOfferStatus = (offerId: string) => {
    const relatedTests = tests.filter(test => test.offerId === offerId);
    
    if (relatedTests.length === 0) return 'inactive';
    
    // Check if any test has "Escalar" status
    if (relatedTests.some(test => test.status === 'Escalar')) return 'scale';
    
    // Check if any test has "Pausar" status (in test)
    if (relatedTests.some(test => test.status === 'Pausar')) return 'testing';
    
    // All tests are "Encerrar"
    return 'stopped';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scale': return 'border-green-500 bg-green-50';
      case 'testing': return 'border-yellow-500 bg-yellow-50';
      case 'stopped': return 'border-red-500 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scale': return 'Escalando';
      case 'testing': return 'Em Teste';
      case 'stopped': return 'Encerrado';
      default: return 'Inativo';
    }
  };
  const filteredOffers = offers.filter(offer => 
    offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.niche.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddOffer = (offerData: Omit<Offer, 'id' | 'createdAt'>) => {
    onAddOffer(offerData);
    setShowForm(false);
    setEditingOffer(null);
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setShowForm(true);
  };

  const handleUpdateOffer = (offerData: Omit<Offer, 'id' | 'createdAt'>) => {
    if (editingOffer) {
      onUpdateOffer(editingOffer.id, offerData);
      setShowForm(false);
      setEditingOffer(null);
    }
  };

  const handleExport = () => {
    exportOffersToCSV(filteredOffers);
  };

  const handleDelete = (offerId: string, offerName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a oferta "${offerName}"?`)) {
      onDeleteOffer(offerId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Ofertas</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
          {canEdit('offers') && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Oferta
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
              placeholder="Buscar por nome ou nicho..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className={`rounded-lg p-4 border-2 hover:shadow-md transition-all ${getStatusColor(getOfferStatus(offer.id))}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{offer.name}</h3>
                  <p className="text-sm text-gray-600">{offer.niche}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    getOfferStatus(offer.id) === 'scale' ? 'bg-green-100 text-green-800' :
                    getOfferStatus(offer.id) === 'testing' ? 'bg-yellow-100 text-yellow-800' :
                    getOfferStatus(offer.id) === 'stopped' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusLabel(getOfferStatus(offer.id))}
                  </span>
                </div>
                {canEdit('offers') && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditOffer(offer)}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(offer.id, offer.name)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Biblioteca:</span>
                  <a
                    href={offer.libraryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Página de Vendas:</span>
                  <a
                    href={offer.landingPageLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Checkout:</span>
                  <a
                    href={offer.checkoutLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-xs text-gray-500">
                  Criado em: {new Date(offer.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredOffers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? 'Nenhuma oferta encontrada' : 'Nenhuma oferta cadastrada'}
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <OfferForm
          onSubmit={editingOffer ? handleUpdateOffer : handleAddOffer}
          onCancel={() => {
            setShowForm(false);
            setEditingOffer(null);
          }}
          editingOffer={editingOffer || undefined}
        />
      )}
    </div>
  );
};

export default OfferModule;