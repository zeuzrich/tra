export interface Test {
  id: string;
  startDate: string;
  productName: string;
  niche: string;
  offerSource: string;
  landingPageUrl: string;
  investedAmount: number;
  clicks: number;
  returnValue: number;
  cpa: number;
  roi: number;
  roas: number;
  ctr: number;
  conversionRate: number;
  cpc: number;
  impressions: number;
  conversions: number;
  status: 'Escalar' | 'Pausar' | 'Encerrar';
  observations: string;
  createdAt: string;
  offerId?: string;
}

export interface Offer {
  id: string;
  name: string;
  libraryLink: string;
  landingPageLink: string;
  checkoutLink: string;
  niche: string;
  createdAt: string;
}

export interface FinancialData {
  initialCapital: number;
  currentBalance: number;
  totalInvestment: number;
  totalRevenue: number;
  netProfit: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'investment' | 'revenue' | 'expense';
  amount: number;
  description: string;
  date: string;
  testId?: string;
}

export interface Metrics {
  totalInvestment: number;
  totalTests: number;
  successRate: number;
  netResult: number;
  avgROI: number;
  avgCPA: number;
}

export interface ChartData {
  date: string;
  roi: number;
  investment: number;
  revenue: number;
}

export interface AIInsight {
  id: string;
  testId: string;
  insight: string;
  recommendations: string[];
  createdAt: string;
}

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  role: 'owner' | 'member';
  permissions: MemberPermissions;
  invitedBy?: string;
  joinedAt: string;
  createdAt: string;
}

export interface MemberPermissions {
  view_only?: boolean;
  edit_tests?: boolean;
  edit_offers?: boolean;
  edit_financial?: boolean;
  manage_members?: boolean;
  full_access?: boolean;
}

export interface MemberInvitation {
  id: string;
  workspaceId: string;
  email: string;
  permissions: MemberPermissions;
  invitedBy: string;
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}