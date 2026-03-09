
-- Spin prizes table (separate from mystery box)
CREATE TABLE public.spin_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT 'hsl(262, 83%, 58%)',
  emoji text DEFAULT '🪙',
  image_url text DEFAULT NULL,
  sound_url text DEFAULT NULL,
  animation_url text DEFAULT NULL,
  weight integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.spin_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active spin prizes" ON public.spin_prizes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage spin prizes" ON public.spin_prizes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Mystery box prizes table
CREATE TABLE public.box_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  emoji text DEFAULT '🪙',
  rarity text NOT NULL DEFAULT 'Common',
  image_url text DEFAULT NULL,
  sound_url text DEFAULT NULL,
  animation_url text DEFAULT NULL,
  weight integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.box_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active box prizes" ON public.box_prizes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage box prizes" ON public.box_prizes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User spin tracking
CREATE TABLE public.user_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prize_id uuid REFERENCES public.spin_prizes(id) ON DELETE SET NULL,
  reward_amount numeric NOT NULL DEFAULT 0,
  spun_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spins" ON public.user_spins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spins" ON public.user_spins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage spins" ON public.user_spins
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User mystery box tracking
CREATE TABLE public.user_box_opens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prize_id uuid REFERENCES public.box_prizes(id) ON DELETE SET NULL,
  reward_amount numeric NOT NULL DEFAULT 0,
  unlock_method text NOT NULL DEFAULT 'task',
  opened_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_box_opens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own box opens" ON public.user_box_opens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own box opens" ON public.user_box_opens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage box opens" ON public.user_box_opens
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for prize media
INSERT INTO storage.buckets (id, name, public) VALUES ('prize-media', 'prize-media', true);

CREATE POLICY "Anyone can view prize media" ON storage.objects
  FOR SELECT USING (bucket_id = 'prize-media');

CREATE POLICY "Admins can upload prize media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'prize-media');

CREATE POLICY "Admins can update prize media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'prize-media');

CREATE POLICY "Admins can delete prize media" ON storage.objects
  FOR DELETE USING (bucket_id = 'prize-media');
