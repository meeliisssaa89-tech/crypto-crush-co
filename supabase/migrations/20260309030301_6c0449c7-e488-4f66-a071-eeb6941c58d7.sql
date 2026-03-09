
ALTER TABLE public.currencies 
  ADD COLUMN IF NOT EXISTS chain text DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS contract_address text,
  ADD COLUMN IF NOT EXISTS icon_url text,
  ADD COLUMN IF NOT EXISTS decimals integer DEFAULT 18,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
