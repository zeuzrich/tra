import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { WorkspaceMember, MemberInvitation, MemberPermissions } from '../types';
import { workspaceService } from '../services/supabaseService';

interface MemberManagementProps {
  canManageMembers: boolean;
}

const MemberManagement: React.FC<MemberManagementProps> = ({ canManageMembers }) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<MemberInvitation[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    permissions: {
      view_only: true,
      edit_tests: false,
      edit_offers: false,
      edit_financial: false,
      manage_members: false,
      full_access: false
    } as MemberPermissions
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, invitationsData] = await Promise.all([
        workspaceService.getMembers(),
        workspaceService.getPendingInvitations()
      ]);
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workspaceService.inviteMember(inviteForm.email, inviteForm.permissions);
      setShowInviteForm(false);
      setInviteForm({
        email: '',
        permissions: {
          view_only: true,
          edit_tests: false,
          edit_offers: false,
          edit_financial: false,
          manage_members: false,
          full_access: false
        }
      });
      loadData();
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Erro ao convidar membro. Verifique se o email não foi convidado anteriormente.');
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (window.confirm(`Tem certeza que deseja remover ${email}?`)) {
      try {
        await workspaceService.removeMember(memberId);
        loadData();
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const handleRevokeInvitation = async (invitationId: string, email: string) => {
    if (window.confirm(`Tem certeza que deseja revogar o convite para ${email}?`)) {
      try {
        await workspaceService.revokeInvitation(invitationId);
        loadData();
      } catch (error) {
        console.error('Error revoking invitation:', error);
      }
    }
  };

  const handlePermissionChange = (permission: keyof MemberPermissions, value: boolean) => {
    setInviteForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value,
        // Se full_access for marcado, desmarcar outros
        ...(permission === 'full_access' && value ? {
          view_only: false,
          edit_tests: false,
          edit_offers: false,
          edit_financial: false,
          manage_members: false
        } : {}),
        // Se outro for marcado, desmarcar full_access
        ...(permission !== 'full_access' && value ? {
          full_access: false
        } : {})
      }
    }));
  };

  const getPermissionLabel = (permissions: MemberPermissions) => {
    if (permissions.full_access) return 'Acesso Total';
    if (permissions.manage_members) return 'Gerenciar Membros';
    if (permissions.edit_financial) return 'Editar Financeiro';
    if (permissions.edit_offers) return 'Editar Ofertas';
    if (permissions.edit_tests) return 'Editar Testes';
    return 'Apenas Visualizar';
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    alert(`Link de convite copiado!\n\n${inviteUrl}\n\nEste link expira em 7 dias e é de uso único.`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Membros</h1>
        {canManageMembers && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Convidar Membro
          </button>
        )}
      </div>

      {/* Membros Ativos */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Membros Ativos ({members.length})
        </h3>
        
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.email}</p>
                  <p className="text-sm text-gray-500">
                    {getPermissionLabel(member.permissions)} • 
                    Entrou em {new Date(member.joinedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              {canManageMembers && member.role !== 'owner' && (
                <button
                  onClick={() => handleRemoveMember(member.id, member.email)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Remover membro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          
          {members.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhum membro encontrado</p>
          )}
        </div>
      </div>

      {/* Convites Pendentes */}
      {canManageMembers && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Convites Pendentes ({invitations.length})
          </h3>
          
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      {getPermissionLabel(invitation.permissions)} • 
                      Expira em {new Date(invitation.expiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyInviteLink(invitation.token)}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
                  >
                    Copiar Link
                  </button>
                  <button
                    onClick={() => handleRevokeInvitation(invitation.id, invitation.email)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Revogar convite"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {invitations.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum convite pendente</p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Convite */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Convidar Novo Membro</h2>
            
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email do Membro
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="exemplo@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissões
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inviteForm.permissions.view_only || false}
                      onChange={(e) => handlePermissionChange('view_only', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Apenas Visualizar</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inviteForm.permissions.edit_tests || false}
                      onChange={(e) => handlePermissionChange('edit_tests', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Editar Testes</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inviteForm.permissions.edit_offers || false}
                      onChange={(e) => handlePermissionChange('edit_offers', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Editar Ofertas</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inviteForm.permissions.edit_financial || false}
                      onChange={(e) => handlePermissionChange('edit_financial', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Editar Dados Financeiros</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inviteForm.permissions.manage_members || false}
                      onChange={(e) => handlePermissionChange('manage_members', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Gerenciar Membros</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inviteForm.permissions.full_access || false}
                      onChange={(e) => handlePermissionChange('full_access', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-blue-600">Acesso Total</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;