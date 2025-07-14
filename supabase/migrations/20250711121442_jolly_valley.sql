/*
  # Sistema de Gerenciamento de Membros

  1. Novas Tabelas
    - `workspaces` - Espaços de trabalho (um por usuário principal)
    - `workspace_members` - Membros do workspace com permissões
    - `member_invitations` - Convites pendentes

  2. Permissões
    - `view_only` - Apenas visualizar
    - `edit_tests` - Editar testes
    - `edit_offers` - Editar ofertas  
    - `edit_financial` - Editar dados financeiros
    - `manage_members` - Gerenciar membros
    - `full_access` - Acesso total

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas baseadas em workspace e permissões
*/

-- Criar tabela de workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Meu Workspace',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de membros do workspace
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  permissions jsonb NOT NULL DEFAULT '{"view_only": true}',
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Criar tabela de convites
CREATE TABLE IF NOT EXISTS member_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{"view_only": true}',
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, email)
);

-- Habilitar RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas para workspaces
CREATE POLICY "Users can read own workspace"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create own workspace"
  ON workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own workspace"
  ON workspaces
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- Políticas para workspace_members
CREATE POLICY "Members can read workspace members"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage members"
  ON workspace_members
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Políticas para member_invitations
CREATE POLICY "Workspace owners can manage invitations"
  ON member_invitations
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read invitations by token"
  ON member_invitations
  FOR SELECT
  TO authenticated
  USING (true);

-- Atualizar tabelas existentes para incluir workspace_id
DO $$
BEGIN
  -- Adicionar workspace_id às tabelas existentes se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE offers ADD COLUMN workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE tests ADD COLUMN workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_data' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE financial_data ADD COLUMN workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Função para criar workspace automaticamente
CREATE OR REPLACE FUNCTION create_user_workspace()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspaces (owner_id, name)
  VALUES (NEW.id, 'Meu Workspace');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar workspace automaticamente
DROP TRIGGER IF EXISTS create_workspace_on_signup ON auth.users;
CREATE TRIGGER create_workspace_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_workspace();

-- Função para aceitar convite
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token text)
RETURNS jsonb AS $$
DECLARE
  invitation_record member_invitations;
  workspace_record workspaces;
  result jsonb;
BEGIN
  -- Buscar convite válido
  SELECT * INTO invitation_record
  FROM member_invitations
  WHERE token = invitation_token
    AND expires_at > now()
    AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite inválido ou expirado');
  END IF;

  -- Buscar workspace
  SELECT * INTO workspace_record
  FROM workspaces
  WHERE id = invitation_record.workspace_id;

  -- Adicionar membro ao workspace
  INSERT INTO workspace_members (
    workspace_id,
    user_id,
    email,
    permissions,
    invited_by
  ) VALUES (
    invitation_record.workspace_id,
    auth.uid(),
    invitation_record.email,
    invitation_record.permissions,
    invitation_record.invited_by
  ) ON CONFLICT (workspace_id, user_id) DO NOTHING;

  -- Marcar convite como aceito
  UPDATE member_invitations
  SET accepted_at = now()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'workspace_name', workspace_record.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;