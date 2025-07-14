/*
  # Atualizar tabela de testes com novas métricas

  1. Novas Colunas
    - `ctr` (numeric) - Click Through Rate
    - `conversion_rate` (numeric) - Taxa de conversão
    - `cpc` (numeric) - Custo por clique
    - `impressions` (integer) - Número de impressões
    - `conversions` (integer) - Número de conversões

  2. Alterações
    - Adicionar colunas com valores padrão para dados existentes
    - Manter compatibilidade com dados atuais
*/

-- Adicionar novas colunas à tabela tests
DO $$
BEGIN
  -- CTR (Click Through Rate)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'ctr'
  ) THEN
    ALTER TABLE tests ADD COLUMN ctr numeric(5,2) DEFAULT 0;
  END IF;

  -- Conversion Rate
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'conversion_rate'
  ) THEN
    ALTER TABLE tests ADD COLUMN conversion_rate numeric(5,2) DEFAULT 0;
  END IF;

  -- CPC (Cost Per Click)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'cpc'
  ) THEN
    ALTER TABLE tests ADD COLUMN cpc numeric(10,2) DEFAULT 0;
  END IF;

  -- Impressions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'impressions'
  ) THEN
    ALTER TABLE tests ADD COLUMN impressions integer DEFAULT 0;
  END IF;

  -- Conversions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'conversions'
  ) THEN
    ALTER TABLE tests ADD COLUMN conversions integer DEFAULT 0;
  END IF;
END $$;