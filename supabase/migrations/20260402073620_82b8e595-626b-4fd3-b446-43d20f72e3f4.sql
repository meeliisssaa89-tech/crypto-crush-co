ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS ton_reward_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.shortlinks ADD COLUMN IF NOT EXISTS ton_reward_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ton_reward_amount numeric NOT NULL DEFAULT 0;