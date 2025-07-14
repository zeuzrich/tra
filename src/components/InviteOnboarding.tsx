import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Users, Eye, EyeOff, Lock, Mail, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InvitationData {
  valid: boolean;
  invitation_id?: string;
  email?: string;
  workspace_id?: string;
  permissions?: any;
  expires_at?: string;
  error?: string;
  message?: string;
}

const InviteOnboarding: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'validating' | 'create-password' | 'success' | 'error'>('validating');
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      validateInvitation();
    } else {
      setStep('error');
      setInvitationData({
        valid: false,
        error: 'no_token',
        message: 'Token de convite não encontrado.'
      });
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      console.log('Validating invitation with token:', token);
      
      // Buscar convite na tabela
      const { data: invitation, error } = await supabase
        .from('member_invitations')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null)
        .single();

      console.log('Invitation query result:', { invitation, error });

      if (error) {
        console.error('Error fetching invitation:', error);
        throw new Error('Convite não encontrado ou já foi usado');
      }

      if (!invitation) {
        throw new Error('Convite não encontrado');
      }

      // Verificar se não expirou
      const now = new Date();
      const expiresAt = new Date(invitation.expires_at);
      
      if (now > expiresAt) {
        throw new Error('Este convite expirou');
      }

      console.log('Invitation is valid, setting data');
      setInvitationData({
        valid: true,
        invitation_id: invitation.id,
        email: invitation.email,
        workspace_id: invitation.workspace_id,
        permissions: invitation.permissions,
        expires_at: invitation.expires_at
      });
      setStep('create-password');
      
    } catch (error: any) {
      console.error('Error validating invitation:', error);
      setInvitationData({
        valid: false,
        error: 'validation_failed',
        message: error.message || 'Erro ao validar convite. Verifique se o link está correto.'
      });
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('A senha deve ter pelo menos 6 caracteres');
    }
    
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') {
      const passwordErrors = validatePassword(value);
      setErrors(passwordErrors);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationData?.email || !invitationData?.workspace_id) {
      setErrors(['Dados do convite inválidos']);
      return;
    }
    
    // Validar senhas
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setErrors(passwordErrors);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setErrors(['As senhas não coincidem']);
      return;
    }
    
    setLoading(true);
    setErrors([]);
    
    try {
      console.log('Creating account for:', invitationData.email);
      
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitationData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined // Desabilitar confirmação por email
        }
      });

      console.log('Auth signup result:', { authData, authError });

      if (authError) {
        if (authError.message.includes('already_registered') || authError.message.includes('already been registered')) {
          throw new Error('Este email já está registrado. Tente fazer login.');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      console.log('User created, adding to workspace');

      // Adicionar usuário ao workspace
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: invitationData.workspace_id,
          user_id: authData.user.id,
          email: invitationData.email,
          permissions: invitationData.permissions,
          role: 'member'
        });

      if (memberError) {
        console.error('Error adding to workspace:', memberError);
        // Não falhar aqui, pois o usuário já foi criado
      }

      console.log('Marking invitation as accepted');

      // Marcar convite como aceito
      const { error: updateError } = await supabase
        .from('member_invitations')
        .update({ 
          accepted_at: new Date().toISOString(),
          used_at: new Date().toISOString()
        })
        .eq('token', token);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
        // Não falhar aqui, pois o usuário já foi criado
      }

      console.log('Account creation successful');
      setStep('success');
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login?message=account_created');
      }, 3000);
      
    } catch (error: any) {
      console.error('Error creating account:', error);
      
      if (error.message?.includes('already_registered') || error.message?.includes('already been registered')) {
        setErrors(['Este email já está registrado. Tente fazer login.']);
      } else if (error.message?.includes('invalid_email')) {
        setErrors(['Email inválido.']);
      } else {
        setErrors([error.message || 'Erro ao criar conta. Tente novamente.']);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    const errors = validatePassword(password);
    const strength = Math.max(0, 2 - errors.length);
    
    if (strength === 0) return { label: 'Fraca', color: 'bg-red-500', width: '33%' };
    if (strength === 1) return { label: 'Boa', color: 'bg-yellow-500', width: '66%' };
    return { label: 'Forte', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (step === 'validating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Validando Convite</h1>
          <p className="text-gray-600">Verificando a validade do seu convite...</p>
          {loading && (
            <div className="mt-4">
              <div className="text-sm text-gray-500">Token: {token?.substring(0, 10)}...</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Convite Inválido</h1>
          <p className="text-gray-600 mb-6">
            {invitationData?.message || 'Este convite não é válido ou expirou.'}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Ir para Login
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Tentar Novamente
            </button>
            
            <p className="text-sm text-gray-500">
              Se você acredita que isso é um erro, entre em contato com quem enviou o convite.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">Conta Criada!</h1>
          <p className="text-gray-600 mb-4">
            Sua conta foi criada com sucesso. Você será redirecionado para a tela de login.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">Acesso Configurado</span>
            </div>
            <p className="text-sm text-green-700">
              Suas permissões foram aplicadas automaticamente ao workspace.
            </p>
          </div>
          
          <p className="text-sm text-gray-500">
            Redirecionando em alguns segundos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Criar Sua Conta</h1>
          <p className="text-gray-600">
            Você foi convidado para: <strong>{invitationData?.email}</strong>
          </p>
        </div>

        <form onSubmit={handleCreateAccount} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (confirmado)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={invitationData?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criar Senha *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {formData.password && (
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Força da senha:</span>
                  <span className={`font-medium ${
                    passwordStrength.label === 'Forte' ? 'text-green-600' :
                    passwordStrength.label === 'Boa' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handlePasswordChange}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirme sua senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-800 font-medium mb-1">Corrija os seguintes erros:</h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-blue-800 font-medium mb-2">Requisitos de Segurança:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Mínimo de 6 caracteres</li>
              <li>• Use uma senha segura</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || errors.length > 0 || !formData.password || !formData.confirmPassword}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Criando conta...
              </div>
            ) : (
              'Criar Conta e Entrar no Workspace'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Já tem uma conta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InviteOnboarding;