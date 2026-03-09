
-- Shortlinks table (admin-managed links users visit to earn coins)
CREATE TABLE public.shortlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  reward_amount numeric NOT NULL DEFAULT 0,
  timer_seconds integer NOT NULL DEFAULT 10,
  network text NOT NULL DEFAULT 'direct',
  is_active boolean NOT NULL DEFAULT true,
  daily_limit integer DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shortlinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shortlinks" ON public.shortlinks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage shortlinks" ON public.shortlinks
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User shortlink completions tracking
CREATE TABLE public.user_shortlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shortlink_id uuid NOT NULL REFERENCES public.shortlinks(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  reward_amount numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.user_shortlinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shortlink completions" ON public.user_shortlinks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shortlink completions" ON public.user_shortlinks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage user shortlinks" ON public.user_shortlinks
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Ads table (admin-managed rewarded ads)
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ad_type text NOT NULL DEFAULT 'video',
  reward_amount numeric NOT NULL DEFAULT 0,
  cooldown_seconds integer NOT NULL DEFAULT 300,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ads" ON public.ads
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage ads" ON public.ads
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User ad views tracking
CREATE TABLE public.user_ad_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  reward_amount numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.user_ad_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ad views" ON public.user_ad_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad views" ON public.user_ad_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage user ad views" ON public.user_ad_views
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
