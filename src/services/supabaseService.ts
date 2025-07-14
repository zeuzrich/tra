import { supabase } from '../lib/supabase';
import { Test, Offer, FinancialData, Transaction, AIInsight, Workspace, WorkspaceMember, MemberInvitation, MemberPermissions } from '../types';

// Offers Service
export const offersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(offer: Omit<Offer, 'id' | 'createdAt'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('offers')
      .insert({
        user_id: user.id,
        name: offer.name,
        library_link: offer.libraryLink,
        landing_page_link: offer.landingPageLink,
        checkout_link: offer.checkoutLink,
        niche: offer.niche
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      libraryLink: data.library_link,
      landingPageLink: data.landing_page_link,
      checkoutLink: data.checkout_link,
      niche: data.niche,
      createdAt: data.created_at
    } as Offer;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async update(id: string, offer: Partial<Omit<Offer, 'id' | 'createdAt'>>) {
    const { data, error } = await supabase
      .from('offers')
      .update({
        name: offer.name,
        library_link: offer.libraryLink,
        landing_page_link: offer.landingPageLink,
        checkout_link: offer.checkoutLink,
        niche: offer.niche
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      libraryLink: data.library_link,
      landingPageLink: data.landing_page_link,
      checkoutLink: data.checkout_link,
      niche: data.niche,
      createdAt: data.created_at
    } as Offer;
  }
};

// Tests Service
export const testsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(test => ({
      id: test.id,
      startDate: test.start_date,
      productName: test.product_name,
      niche: test.niche,
      offerSource: test.offer_source,
      landingPageUrl: test.landing_page_url,
      investedAmount: test.invested_amount,
      clicks: test.clicks,
      returnValue: test.return_value,
      cpa: test.cpa,
      roi: test.roi,
      roas: test.roas,
      ctr: test.ctr || 0,
      conversionRate: test.conversion_rate || 0,
      cpc: test.cpc || 0,
      impressions: test.impressions || 0,
      conversions: test.conversions || 0,
      status: test.status,
      observations: test.observations,
      createdAt: test.created_at,
      offerId: test.offer_id
    })) as Test[];
  },

  async create(test: Omit<Test, 'id' | 'createdAt'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tests')
      .insert({
        user_id: user.id,
        offer_id: test.offerId || null,
        start_date: test.startDate,
        product_name: test.productName,
        niche: test.niche,
        offer_source: test.offerSource,
        landing_page_url: test.landingPageUrl,
        invested_amount: test.investedAmount,
        clicks: test.clicks,
        return_value: test.returnValue,
        cpa: test.cpa,
        roi: test.roi,
        roas: test.roas,
        ctr: test.ctr,
        conversion_rate: test.conversionRate,
        cpc: test.cpc,
        impressions: test.impressions,
        conversions: test.conversions,
        status: test.status,
        observations: test.observations
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      startDate: data.start_date,
      productName: data.product_name,
      niche: data.niche,
      offerSource: data.offer_source,
      landingPageUrl: data.landing_page_url,
      investedAmount: data.invested_amount,
      clicks: data.clicks,
      returnValue: data.return_value,
      cpa: data.cpa,
      roi: data.roi,
      roas: data.roas,
      ctr: data.ctr || 0,
      conversionRate: data.conversion_rate || 0,
      cpc: data.cpc || 0,
      impressions: data.impressions || 0,
      conversions: data.conversions || 0,
      status: data.status,
      observations: data.observations,
      createdAt: data.created_at,
      offerId: data.offer_id
    } as Test;
  },

  async update(id: string, test: Partial<Omit<Test, 'id' | 'createdAt'>>) {
    const { data, error } = await supabase
      .from('tests')
      .update({
        offer_id: test.offerId || null,
        start_date: test.startDate,
        product_name: test.productName,
        niche: test.niche,
        offer_source: test.offerSource,
        landing_page_url: test.landingPageUrl,
        invested_amount: test.investedAmount,
        clicks: test.clicks,
        return_value: test.returnValue,
        cpa: test.cpa,
        roi: test.roi,
        roas: test.roas,
        ctr: test.ctr,
        conversion_rate: test.conversionRate,
        cpc: test.cpc,
        impressions: test.impressions,
        conversions: test.conversions,
        status: test.status,
        observations: test.observations
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      startDate: data.start_date,
      productName: data.product_name,
      niche: data.niche,
      offerSource: data.offer_source,
      landingPageUrl: data.landing_page_url,
      investedAmount: data.invested_amount,
      clicks: data.clicks,
      returnValue: data.return_value,
      cpa: data.cpa,
      roi: data.roi,
      roas: data.roas,
      ctr: data.ctr || 0,
      conversionRate: data.conversion_rate || 0,
      cpc: data.cpc || 0,
      impressions: data.impressions || 0,
      conversions: data.conversions || 0,
      status: data.status,
      observations: data.observations,
      createdAt: data.created_at,
      offerId: data.offer_id
    } as Test;
  },

  async delete(id: string) {
    // First, delete related transactions
    const { error: transError } = await supabase
      .from('transactions')
      .delete()
      .eq('test_id', id);

    if (transError) throw transError;

    // Then delete the test
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Financial Service
export const financialService = {
  async get() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('financial_data')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      // Create initial financial data
      const { data: newData, error: createError } = await supabase
        .from('financial_data')
        .upsert({
          user_id: user.id,
          initial_capital: 0,
          current_balance: 0,
          total_investment: 0,
          total_revenue: 0,
          net_profit: 0
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (createError) throw createError;
      
      return {
        initialCapital: newData.initial_capital,
        currentBalance: newData.current_balance,
        totalInvestment: newData.total_investment,
        totalRevenue: newData.total_revenue,
        netProfit: newData.net_profit,
        transactions: []
      } as FinancialData;
    }

    // Get transactions
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (transError) throw transError;

    return {
      initialCapital: data.initial_capital,
      currentBalance: data.current_balance,
      totalInvestment: data.total_investment,
      totalRevenue: data.total_revenue,
      netProfit: data.net_profit,
      transactions: (transactions || []).map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.date,
        testId: t.test_id
      }))
    } as FinancialData;
  },

  async update(financial: Partial<FinancialData>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {};
    if (financial.initialCapital !== undefined) updateData.initial_capital = financial.initialCapital;
    if (financial.currentBalance !== undefined) updateData.current_balance = financial.currentBalance;
    if (financial.totalInvestment !== undefined) updateData.total_investment = financial.totalInvestment;
    if (financial.totalRevenue !== undefined) updateData.total_revenue = financial.totalRevenue;
    if (financial.netProfit !== undefined) updateData.net_profit = financial.netProfit;

    const { error } = await supabase
      .from('financial_data')
      .upsert({
        user_id: user.id,
        ...updateData
      });

    if (error) throw error;
  },

  async addTransaction(transaction: Omit<Transaction, 'id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        test_id: transaction.testId || null,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date,
      testId: data.test_id
    } as Transaction;
  }
};

// AI Insights Service
export const aiInsightsService = {
  async generateInsight(test: Test): Promise<string> {
    try {
      const { generateTrafficInsight } = await import('./openaiService');
      return await generateTrafficInsight(test);
    } catch (error) {
      console.error('Error generating AI insight:', error);
      throw error;
    }
  }
};

// Workspace Service
export const workspaceService = {
  async getCurrentWorkspace() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as Workspace;
  },

  async getMembers() {
    const workspace = await this.getCurrentWorkspace();
    
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(member => ({
      id: member.id,
      workspaceId: member.workspace_id,
      userId: member.user_id,
      email: member.email,
      role: member.role,
      permissions: member.permissions,
      invitedBy: member.invited_by,
      joinedAt: member.joined_at,
      createdAt: member.created_at
    })) as WorkspaceMember[];
  },

  async inviteMember(email: string, permissions: MemberPermissions) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const workspace = await this.getCurrentWorkspace();

    const { data, error } = await supabase
      .from('member_invitations')
      .insert({
        workspace_id: workspace.id,
        email,
        permissions,
        invited_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      workspaceId: data.workspace_id,
      email: data.email,
      permissions: data.permissions,
      invitedBy: data.invited_by,
      token: data.token,
      expiresAt: data.expires_at,
      createdAt: data.created_at
    } as MemberInvitation;
  },

  async getPendingInvitations() {
    const workspace = await this.getCurrentWorkspace();
    
    const { data, error } = await supabase
      .from('member_invitations')
      .select('*')
      .eq('workspace_id', workspace.id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(invitation => ({
      id: invitation.id,
      workspaceId: invitation.workspace_id,
      email: invitation.email,
      permissions: invitation.permissions,
      invitedBy: invitation.invited_by,
      token: invitation.token,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at
    })) as MemberInvitation[];
  },

  async removeMember(memberId: string) {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  },

  async updateMemberPermissions(memberId: string, permissions: MemberPermissions) {
    const { data, error } = await supabase
      .from('workspace_members')
      .update({ permissions })
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      workspaceId: data.workspace_id,
      userId: data.user_id,
      email: data.email,
      role: data.role,
      permissions: data.permissions,
      invitedBy: data.invited_by,
      joinedAt: data.joined_at,
      createdAt: data.created_at
    } as WorkspaceMember;
  },

  async revokeInvitation(invitationId: string) {
    const { error } = await supabase
      .from('member_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) throw error;
  },

  async acceptInvitation(token: string) {
    const { data, error } = await supabase.rpc('accept_invitation', {
      invitation_token: token
    });

    if (error) throw error;
    return data;
  },

  async getUserPermissions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First check if user is workspace owner
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (workspace) {
      return {
        isOwner: true,
        permissions: { full_access: true }
      };
    }

    // If no workspace found, create one for the user (first time setup)
    if (workspaceError && workspaceError.code === 'PGRST116') {
      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          owner_id: user.id,
          name: 'Meu Workspace'
        })
        .select()
        .single();

      if (!createError && newWorkspace) {
        return {
          isOwner: true,
          permissions: { full_access: true }
        };
      }
    }

    // Check if user is a member of any workspace
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('permissions')
      .eq('user_id', user.id)
      .single();

    if (member) {
      return {
        isOwner: false,
        permissions: member.permissions
      };
    }

    // Default fallback - give full access to prevent UI issues
    return {
      isOwner: true,
      permissions: { full_access: true }
    };
  }
}