
-- Add reward_type and token_reward_amount to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reward_type text NOT NULL DEFAULT 'xp';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS token_reward_amount numeric NOT NULL DEFAULT 0;

-- Add reward_type and token_reward_amount to ads
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS reward_type text NOT NULL DEFAULT 'xp';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS token_reward_amount numeric NOT NULL DEFAULT 0;

-- Add reward_type and token_reward_amount to shortlinks
ALTER TABLE public.shortlinks ADD COLUMN IF NOT EXISTS reward_type text NOT NULL DEFAULT 'xp';
ALTER TABLE public.shortlinks ADD COLUMN IF NOT EXISTS token_reward_amount numeric NOT NULL DEFAULT 0;
