/*
  # Fix infinite recursion in workspace_members policies

  1. Security Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create simplified policies that don't reference workspace_members in subqueries
    - Allow workspace owners to manage all members
    - Allow members to read their own membership record
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Members can read workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;

-- Create simplified policies without recursion
CREATE POLICY "Users can read own membership"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Workspace owners can read all members"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can insert members"
  ON workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update members"
  ON workspace_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can delete members"
  ON workspace_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
  );