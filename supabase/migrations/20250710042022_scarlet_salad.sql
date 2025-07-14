/*
  # Esquema inicial do TrafficFlow Manager Pro

  1. Novas Tabelas
    - `offers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `library_link` (text)
      - `landing_page_link` (text)
      - `checkout_link` (text)
      - `niche` (text)
      - `created_at` (timestamp)
    
    - `tests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `offer_id` (uuid, foreign key, nullable)
      - `start_date` (date)
      - `product_name` (text)
      - `niche` (text)
      - `offer_source` (text)
      - `landing_page_url` (text)
      - `invested_amount` (decimal)
      - `clicks` (integer)
      - `return_value` (decimal)
      - `cpa` (decimal)
      - `roi` (decimal)
      - `roas` (decimal)
      - `status` (text)
      - `observations` (text)
      - `created_at` (timestamp)
    
    - `financial_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `initial_capital` (decimal)
      - `current_balance` (decimal)
      - `total_investment` (decimal)
      - `total_revenue` (decimal)
      - `net_profit` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `test_id` (uuid, foreign key, nullable)
      - `type` (text)
      - `amount` (decimal)
      - `description` (text)
      - `date` (timestamp)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Adicionar políticas para usuários autenticados acessarem apenas seus próprios dados
*/

-- Criar tabela de ofertas
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  library_link text NOT NULL,
  landing_page_link text NOT NULL,
  checkout_link text NOT NULL,
  niche text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de testes
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  offer_id uuid REFERENCES offers(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  product_name text NOT NULL,
  niche text NOT NULL,
  offer_source text NOT NULL,
  landing_page_url text NOT NULL,
  invested_amount decimal(10,2) NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  return_value decimal(10,2) NOT NULL DEFAULT 0,
  cpa decimal(10,2) NOT NULL DEFAULT 0,
  roi decimal(10,2) NOT NULL DEFAULT 0,
  roas decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('Escalar', 'Pausar', 'Encerrar')),
  observations text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de dados financeiros
CREATE TABLE IF NOT EXISTS financial_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  initial_capital decimal(10,2) NOT NULL DEFAULT 0,
  current_balance decimal(10,2) NOT NULL DEFAULT 0,
  total_investment decimal(10,2) NOT NULL DEFAULT 0,
  total_revenue decimal(10,2) NOT NULL DEFAULT 0,
  net_profit decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_id uuid REFERENCES tests(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('investment', 'revenue', 'expense')),
  amount decimal(10,2) NOT NULL,
  description text NOT NULL,
  date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para ofertas
CREATE POLICY "Users can read own offers"
  ON offers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offers"
  ON offers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offers"
  ON offers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own offers"
  ON offers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para testes
CREATE POLICY "Users can read own tests"
  ON tests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests"
  ON tests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests"
  ON tests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tests"
  ON tests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para dados financeiros
CREATE POLICY "Users can read own financial data"
  ON financial_data
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial data"
  ON financial_data
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial data"
  ON financial_data
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para transações
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela financial_data
CREATE TRIGGER update_financial_data_updated_at
    BEFORE UPDATE ON financial_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();