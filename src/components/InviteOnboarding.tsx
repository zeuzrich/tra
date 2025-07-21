import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Users, Eye, EyeOff, Lock, Mail, AlertTriangle, Shield, LogIn } from 'lucide-react';
import { supabase, signIn, signUp } from '../lib/supabase';

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
  
  const [step, setStep] = useState<'validating' | 'login-existing' | 'create-password' | 'success' | 'error'>('validating');
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    loginPassword: ''
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
      console.log('🔍 Validating invitation with token:', token);
      
      // Buscar convite na tabela
      const { data: invitation, error } = await supabase
        .from('member_invitations')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null)
        .single();

      console.log('📧 Invitation query result:', { invitation, error });

      if (error) {
        console.error('❌ Error fetching invitation:', error);
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

      console.log('✅ Invitation is valid, proceeding to create password step');

      setInvitationData({
        valid: true,
        invitation_id: invitation.id,
        email: invitation.email,
        workspace_id: invitation.workspace_id,
        permissions: invitation.permissions,
        expires_at: invitation.expires_at
      });

      // Sempre começar com a tela de criar senha
      // Se o usuário já existir, descobriremos durante a tentativa de criação
      setStep('create-password');
      
    } catch (error: any) {
      console.error('❌ Error validating invitation:', error);
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
    
    if (password.length < 8) {
      errors.push('A senha deve ter pelo menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
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

  const handleLoginExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationData?.email) {
      setErrors(['Dados do convite inválidos']);
      return;
    }
    
    setLoading(true);
    setErrors([]);
    
    try {
      console.log('🔐 Attempting login for existing user:', invitationData.email);
      
      // Fazer login com credenciais existentes
      const { data: authData, error: loginError } = await signIn(invitationData.email, formData.loginPassword);
      
      if (loginError) {
        throw new Error('Senha incorreta. Verifique suas credenciais.');
      }

      if (!authData.user) {
        throw new Error('Erro ao fazer login');
      }

      console.log('✅ User logged in successfully, adding to workspace');

      // Adicionar usuário ao workspace
      await addUserToWorkspace(authData.user.id, invitationData);
      
      console.log('✅ Login and workspace addition successful');
      setStep('success');
      
      // Redirecionar para o app após 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error during login:', error);
      setErrors([error.message || 'Erro ao fazer login. Verifique sua senha.']);
    } finally {
      setLoading(false);
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
      console.log('👤 Attempting to create account for:', invitationData.email);
      
      // Tentar criar usuário no Supabase Auth
      const { data: authData, error: authError } = await signUp(invitationData.email, formData.password);

      console.log('📝 Auth signup result:', { authData, authError });

      if (authError) {
        console.error('❌ Auth error:', authError);
        
        // Se o usuário já existe, redirecionar para login
        if (authError.message?.includes('User already registered') || 
            authError.message?.includes('already_registered') || 
            authError.message?.includes('already been registered') ||
            authError.message?.includes('Email address is already registered')) {
          
          console.log('👤 User already exists, switching to login flow');
          setStep('login-existing');
          setErrors(['Este email já possui uma conta. Por favor, faça login com sua senha existente.']);
          return; // Parar aqui e deixar o usuário fazer login
        }
        
        if (authError.message?.includes('Database error saving new user')) {
          throw new Error('Erro no banco de dados. Tente novamente em alguns segundos.');
        }
        
        throw new Error(authError.message || 'Erro ao criar conta');
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário - dados não retornados');
      }

      console.log('✅ User created successfully:', authData.user.id);

      // Aguardar um pouco para garantir que o usuário foi criado no banco
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Adicionar usuário ao workspace
      await addUserToWorkspace(authData.user.id, invitationData);

      console.log('✅ Account creation and workspace addition successful');
      setStep('success');
      
      // Redirecionar para o app após 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error creating account:', error);
      
      if (error.message?.includes('Database error')) {
        setErrors(['Erro no banco de dados. Aguarde alguns segundos e tente novamente.']);
      } else if (error.message?.includes('invalid_email')) {
        setErrors(['Email inválido.']);
      } else {
        setErrors([error.message || 'Erro ao criar conta. Tente novamente.']);
      }
    } finally {
      setLoading(false);
    }
  };

  const addUserToWorkspace = async (userId: string, invitationData: InvitationData) => {
    try {
      console.log('🏢 Adding user to workspace:', { userId, workspaceId: invitationData.workspace_id });

      // Use the secure function to accept invitation
      const { data: result, error } = await supabase.rpc('accept_invitation', {
        invitation_token: token
      });

      if (error) {
        console.error('❌ Error accepting invitation:', error);
        throw error;
      }

      if (!result?.success) {
        console.error('❌ Invitation acceptance failed:', result?.error);
        throw new Error(result?.error || 'Failed to accept invitation');
      }

      console.log('✅ Invitation accepted successfully:', result);

    } catch (error) {
      console.error('❌ Error in addUserToWorkspace:', error);
      throw error;
    }
  };

  const getPasswordStrength = (password: string) => {
    const errors = validatePassword(password);
    const strength = Math.max(0, 5 - errors.length);
    
    if (strength <= 1) return { label: 'Muito Fraca', color: 'bg-red-500', width: '20%' };
    if (strength === 2) return { label: 'Fraca', color: 'bg-red-400', width: '40%' };
    if (strength === 3) return { label: 'Média', color: 'bg-yellow-500', width: '60%' };
    if (strength === 4) return { label: 'Boa', color: 'bg-green-400', width: '80%' };
    return { label: 'Muito Forte', color: 'bg-green-500', width: '100%' };
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
          <h1 className="text-2xl font-bold text-green-800 mb-2">Bem-vindo ao Workspace!</h1>
          <p className="text-gray-600 mb-4">
            {step === 'login-existing' ? 
              'Você foi adicionado ao workspace com sucesso.' :
              'Sua conta foi criada e você foi adicionado ao workspace.'
            }
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
            Redirecionando para o aplicativo...
          </p>
        </div>
      </div>
    );
  }

  if (step === 'login-existing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Fazer Login</h1>
            <p className="text-gray-600">
              Você já possui uma conta com o email: <strong>{invitationData?.email}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Digite sua senha para acessar o workspace
            </p>
          </div>

          <form onSubmit={handleLoginExisting} className="space-y-6">
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
                Sua Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="loginPassword"
                  value={formData.loginPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-red-800 font-medium mb-1">Informação:</h4>
                    <ul className="text-red-700 text-sm space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.loginPassword}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar no Workspace'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Quer tentar criar uma nova conta?{' '}
              <button
                onClick={() => setStep('create-password')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Voltar para criar senha
              </button>
            </p>
          </div>
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
                minLength={8}
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
                    passwordStrength.label === 'Muito Forte' ? 'text-green-600' :
                    passwordStrength.label === 'Boa' ? 'text-green-500' :
                    passwordStrength.label === 'Média' ? 'text-yellow-600' :
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
              <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
                • Mínimo de 8 caracteres
              </li>
              <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
                • Pelo menos uma letra maiúscula
              </li>
              <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
                • Pelo menos uma letra minúscula
              </li>
              <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                • Pelo menos um número
              </li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : ''}>
                • Pelo menos um caractere especial
              </li>
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
              onClick={() => setStep('login-existing')}
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