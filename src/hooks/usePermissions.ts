import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { MemberPermissions } from '../types';
import { workspaceService } from '../services/supabaseService';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<MemberPermissions>({});
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPermissions();
    }
  }, [user]);

  const loadPermissions = async () => {
    try {
      const userPermissions = await workspaceService.getUserPermissions();
      setPermissions(userPermissions.permissions);
      setIsOwner(userPermissions.isOwner);
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Default to full access for owners if error (fallback)
      setPermissions({ full_access: true });
      setIsOwner(true);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = (resource: 'tests' | 'offers' | 'financial' | 'members') => {
    if (isOwner || permissions.full_access) return true;
    
    switch (resource) {
      case 'tests':
        return permissions.edit_tests || false;
      case 'offers':
        return permissions.edit_offers || false;
      case 'financial':
        return permissions.edit_financial || false;
      case 'members':
        return permissions.manage_members || false;
      default:
        return false;
    }
  };

  const canView = () => {
    return true; // All members can view
  };

  return {
    permissions,
    isOwner,
    loading,
    canEdit,
    canView,
    refreshPermissions: loadPermissions
  };
};