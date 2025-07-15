/*
  # Fix Auth Users Database Error

  1. Database Setup
    - Ensure users table exists with proper structure
    - Create proper trigger for auth.users
    - Add RLS policies
    - Create workspace for new users

  2. Security
    - Enable RLS on users table
    - Add policies for user data access
    - Ensure proper foreign key constraints
*/

-- Ensure users table exists with correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Create RLS policies
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  workspace_id uuid;
BEGIN
  -- Insert user into public.users table
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- Create workspace for the user
  INSERT INTO public.workspaces (owner_id, name, created_at, updated_at)
  VALUES (NEW.id, 'Meu Workspace', NOW(), NOW())
  ON CONFLICT DO NOTHING
  RETURNING id INTO workspace_id;

  -- If workspace was created, get its ID
  IF workspace_id IS NULL THEN
    SELECT id INTO workspace_id
    FROM public.workspaces
    WHERE owner_id = NEW.id
    LIMIT 1;
  END IF;

  -- Create initial financial data
  INSERT INTO public.financial_data (user_id, workspace_id, initial_capital, current_balance, total_investment, total_revenue, net_profit, created_at, updated_at)
  VALUES (NEW.id, workspace_id, 0, 0, 0, 0, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to safely accept invitations
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record record;
  user_id uuid;
  result json;
BEGIN
  -- Get current user
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Get invitation details
  SELECT * INTO invitation_record
  FROM public.member_invitations
  WHERE token = invitation_token
    AND accepted_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Add user to workspace
  INSERT INTO public.workspace_members (
    workspace_id,
    user_id,
    email,
    role,
    permissions,
    invited_by,
    joined_at,
    created_at
  )
  VALUES (
    invitation_record.workspace_id,
    user_id,
    invitation_record.email,
    'member',
    invitation_record.permissions,
    invitation_record.invited_by,
    NOW(),
    NOW()
  )
  ON CONFLICT (workspace_id, user_id) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    joined_at = NOW();

  -- Mark invitation as accepted
  UPDATE public.member_invitations
  SET accepted_at = NOW(), used_at = NOW()
  WHERE id = invitation_record.id;

  RETURN json_build_object('success', true, 'workspace_id', invitation_record.workspace_id);
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;