/*
  # Fix user creation issues for invites

  1. Ensure users table exists and has proper structure
  2. Add trigger to automatically create user record when auth user is created
  3. Fix workspace member insertion issues
  4. Add proper error handling for duplicate entries
*/

-- Ensure users table exists with proper structure
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create policy for users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update workspace_members table to handle conflicts better
ALTER TABLE workspace_members 
DROP CONSTRAINT IF EXISTS workspace_members_workspace_id_user_id_key;

-- Add unique constraint with better handling
ALTER TABLE workspace_members 
ADD CONSTRAINT workspace_members_workspace_id_user_id_key 
UNIQUE (workspace_id, user_id);

-- Function to safely add workspace member
CREATE OR REPLACE FUNCTION add_workspace_member(
  p_workspace_id uuid,
  p_user_id uuid,
  p_email text,
  p_permissions jsonb DEFAULT '{"view_only": true}',
  p_role text DEFAULT 'member'
)
RETURNS uuid AS $$
DECLARE
  member_id uuid;
BEGIN
  -- Insert or update workspace member
  INSERT INTO workspace_members (
    workspace_id,
    user_id,
    email,
    permissions,
    role
  ) VALUES (
    p_workspace_id,
    p_user_id,
    p_email,
    p_permissions,
    p_role
  )
  ON CONFLICT (workspace_id, user_id) 
  DO UPDATE SET
    permissions = EXCLUDED.permissions,
    role = EXCLUDED.role,
    updated_at = now()
  RETURNING id INTO member_id;
  
  RETURN member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION add_workspace_member TO authenticated;

-- Update member_invitations table to prevent duplicate invites
ALTER TABLE member_invitations 
DROP CONSTRAINT IF EXISTS member_invitations_workspace_id_email_key;

ALTER TABLE member_invitations 
ADD CONSTRAINT member_invitations_workspace_id_email_active_key 
UNIQUE (workspace_id, email) 
DEFERRABLE INITIALLY DEFERRED;

-- Function to safely create invitation
CREATE OR REPLACE FUNCTION create_member_invitation(
  p_workspace_id uuid,
  p_email text,
  p_permissions jsonb,
  p_invited_by uuid
)
RETURNS uuid AS $$
DECLARE
  invitation_id uuid;
BEGIN
  -- Delete any existing pending invitations for this email/workspace
  DELETE FROM member_invitations 
  WHERE workspace_id = p_workspace_id 
    AND email = p_email 
    AND accepted_at IS NULL;
  
  -- Create new invitation
  INSERT INTO member_invitations (
    workspace_id,
    email,
    permissions,
    invited_by
  ) VALUES (
    p_workspace_id,
    p_email,
    p_permissions,
    p_invited_by
  )
  RETURNING id INTO invitation_id;
  
  RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_member_invitation TO authenticated;