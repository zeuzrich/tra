import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BarChart3, Target, DollarSign, Menu, X, Package, LogOut, Users } from 'lucide-react';
import { Test, FinancialData, Transaction, Offer } from './types';
import { calculateMetrics } from './utils/calculations';
import { signOut } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import { usePermissions } from './hooks/usePermissions';
import { offersService, testsService, financialService } from './services/supabaseService';
import Dashboard from './components/Dashboard';
import TestModule from './components/TestModule';
import FinancialModule from './components/FinancialModule';
import OfferModule from './components/OfferModule';
import MemberManagement from './components/MemberManagement';
import InviteOnboarding from './components/InviteOnboarding';
import LoginForm from './components/Auth/LoginForm';

type ActiveModule = 'dashboard' | 'tests' | 'financial' | 'offers' | 'members';

interface MainAppProps {
  tests: Test[];
  offers: Offer[];
  financial: FinancialData;
  loading: boolean;
  onAddTest: (testData: Omit<Test, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateTest: (testId: string, testData: Partial<Omit<Test, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteTest: (testId: string) => Promise<void>;
  onAddOffer: (offerData: Omit<Offer, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateOffer: (offerId: string, offerData: Partial<Omit<Offer, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteOffer: (offerId: string) => Promise<void>;
  onUpdateFinancial: (data: Partial<FinancialData>) => Promise<void>;
}

function App() {
  const { user, loading: authLoading } = useAuth();
  const { permissions, isOwner, loading: permissionsLoading, canEdit } = usePermissions();
  const [tests, setTests] = useState<Test[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [financial, setFinancial] = useState<FinancialData>({
    initialCapital: 0,
    currentBalance: 0,
    totalInvestment: 0,
    totalRevenue: 0,
    netProfit: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [testsData, offersData, financialData] = await Promise.all([
        testsService.getAll(),
        offersService.getAll(),
        financialService.get()
      ]);
      
      setTests(testsData);
      setOffers(offersData);
      setFinancial(financialData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update financial data when tests change
  useEffect(() => {
    if (tests.length >= 0 && financial && typeof financial.initialCapital === 'number') {
      const totalInvestment = tests.reduce((sum, test) => sum + test.investedAmount, 0);
      const totalRevenue = tests.reduce((sum, test) => sum + test.returnValue, 0);
      const netProfit = totalRevenue - totalInvestment;
      
      // Only update if values have actually changed
      if (financial.totalInvestment !== totalInvestment || 
          financial.totalRevenue !== totalRevenue || 
          financial.netProfit !== netProfit) {
        
        const updatedFinancial = {
          ...financial,
          totalInvestment,
          totalRevenue,
          netProfit,
          currentBalance: financial.initialCapital + netProfit
        };
        
        setFinancial(updatedFinancial);
        
        // Update in database with debounce
        const timeoutId = setTimeout(() => {
          financialService.update(updatedFinancial).catch(console.error);
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [tests, financial.initialCapital]);

  const handleAddTest = async (testData: Omit<Test, 'id' | 'createdAt'>) => {
    try {
      const newTest = await testsService.create(testData);
      setTests(prev => [newTest, ...prev]);
      
      // Add investment transaction
      const investmentTransaction: Omit<Transaction, 'id'> = {
        type: 'investment',
        amount: testData.investedAmount,
        description: `Investimento - ${testData.productName}`,
        date: new Date().toISOString(),
        testId: newTest.id
      };
      
      await financialService.addTransaction(investmentTransaction);
      
      // Add revenue transaction if there's return value
      if (testData.returnValue > 0) {
        const revenueTransaction: Omit<Transaction, 'id'> = {
          type: 'revenue',
          amount: testData.returnValue,
          description: `Receita - ${testData.productName}`,
          date: new Date().toISOString(),
          testId: newTest.id
        };
        
        await financialService.addTransaction(revenueTransaction);
      }
      
      // Reload financial data
      const updatedFinancial = await financialService.get();
      setFinancial(updatedFinancial);
    } catch (error) {
      console.error('Error adding test:', error);
    }
  };

  const handleAddOffer = async (offerData: Omit<Offer, 'id' | 'createdAt'>) => {
    try {
      const newOffer = await offersService.create(offerData);
      setOffers(prev => [newOffer, ...prev]);
    } catch (error) {
      console.error('Error adding offer:', error);
    }
  };

  const handleUpdateOffer = async (offerId: string, offerData: Partial<Omit<Offer, 'id' | 'createdAt'>>) => {
    try {
      const updatedOffer = await offersService.update(offerId, offerData);
      setOffers(prev => prev.map(offer => offer.id === offerId ? updatedOffer : offer));
    } catch (error) {
      console.error('Error updating offer:', error);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      await offersService.delete(offerId);
      setOffers(prev => prev.filter(offer => offer.id !== offerId));
    } catch (error) {
      console.error('Error deleting offer:', error);
    }
  };

  const handleUpdateTest = async (testId: string, testData: Partial<Omit<Test, 'id' | 'createdAt'>>) => {
    try {
      const updatedTest = await testsService.update(testId, testData);
      setTests(prev => prev.map(test => test.id === testId ? updatedTest : test));
      
      // Reload financial data
      const updatedFinancial = await financialService.get();
      setFinancial(updatedFinancial);
    } catch (error) {
      console.error('Error updating test:', error);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      await testsService.delete(testId);
      setTests(prev => prev.filter(test => test.id !== testId));
      
      // Reload financial data
      const updatedFinancial = await financialService.get();
      setFinancial(updatedFinancial);
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  const handleUpdateFinancial = async (data: Partial<FinancialData>) => {
    try {
      const updatedFinancial = { ...financial, ...data };
      setFinancial(updatedFinancial);
      
      // Debounce the database update
      setTimeout(async () => {
        try {
          await financialService.update(updatedFinancial);
        } catch (error) {
          console.error('Error updating financial data:', error);
        }
      }, 300);
    } catch (error) {
      console.error('Error updating financial data:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const metrics = calculateMetrics(tests);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'tests', label: 'Testes', icon: Target },
    { id: 'offers', label: 'Ofertas', icon: Package },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'members', label: 'Membros', icon: Users }
  ];

  const renderActiveModule = () => {
    if (loading || permissionsLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return <Dashboard tests={tests} offers={offers} metrics={metrics} />;
      case 'tests':
        return <TestModule tests={tests} offers={offers} onAddTest={handleAddTest} onUpdateTest={handleUpdateTest} onDeleteTest={handleDeleteTest} />;
      case 'offers':
        return <OfferModule offers={offers} tests={tests} onAddOffer={handleAddOffer} onUpdateOffer={handleUpdateOffer} onDeleteOffer={handleDeleteOffer} />;
      case 'financial':
        return <FinancialModule financial={financial} onUpdateFinancial={handleUpdateFinancial} />;
      case 'members':
        return <MemberManagement canManageMembers={canEdit('members')} />;
      default:
        return <Dashboard tests={tests} metrics={metrics} />;
    }
  };

  if (authLoading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">TrafficFlow Manager</h2>
          <p className="text-gray-500">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onSuccess={() => {}} />;
  }

  // Handle invite routes
  return (
    <Routes>
      <Route path="/" element={
        user ? (
          <MainApp 
            tests={tests}
            offers={offers}
            financial={financial}
            loading={loading}
            onAddTest={handleAddTest}
            onUpdateTest={handleUpdateTest}
            onDeleteTest={handleDeleteTest}
            onAddOffer={handleAddOffer}
            onUpdateOffer={handleUpdateOffer}
            onDeleteOffer={handleDeleteOffer}
            onUpdateFinancial={handleUpdateFinancial}
          />
        ) : (
          <LoginForm onSuccess={() => {}} />
        )
      } />
      <Route path="/invite/:token" element={<InviteOnboarding />} />
      <Route path="/login" element={<LoginForm onSuccess={() => {}} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const MainApp: React.FC<MainAppProps> = ({
  tests,
  offers,
  financial,
  loading,
  onAddTest,
  onUpdateTest,
  onDeleteTest,
  onAddOffer,
  onUpdateOffer,
  onDeleteOffer,
  onUpdateFinancial
}) => {
  const { user } = useAuth();
  const { permissions, isOwner, loading: permissionsLoading, canEdit } = usePermissions();
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const metrics = calculateMetrics(tests);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'tests', label: 'Testes', icon: Target },
    { id: 'offers', label: 'Ofertas', icon: Package },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'members', label: 'Membros', icon: Users }
  ];

  const renderActiveModule = () => {
    if (loading || permissionsLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return <Dashboard tests={tests} offers={offers} metrics={metrics} />;
      case 'tests':
        return <TestModule tests={tests} offers={offers} onAddTest={onAddTest} onUpdateTest={onUpdateTest} onDeleteTest={onDeleteTest} />;
      case 'offers':
        return <OfferModule offers={offers} tests={tests} onAddOffer={onAddOffer} onUpdateOffer={onUpdateOffer} onDeleteOffer={onDeleteOffer} />;
      case 'financial':
        return <FinancialModule financial={financial} onUpdateFinancial={onUpdateFinancial} />;
      case 'members':
        return <MemberManagement canManageMembers={canEdit('members')} />;
      default:
        return <Dashboard tests={tests} metrics={metrics} />;
    }
  };

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">TrafficFlow Manager</h2>
          <p className="text-gray-500">Configurando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">TrafficFlow</h1>
                <p className="text-sm text-gray-500">Manager Pro</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveModule(item.id as ActiveModule);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeModule === item.id
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Logado como:</p>
              <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sair</span>
            </button>
            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Versão 1.1.0</p>
              <p className="mt-1">© 2025 TrafficFlow</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">
          {renderActiveModule()}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;