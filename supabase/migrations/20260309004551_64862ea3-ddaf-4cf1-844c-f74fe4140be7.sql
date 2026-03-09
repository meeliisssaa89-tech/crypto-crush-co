
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- spin_prizes
DROP POLICY IF EXISTS "Admins can manage spin prizes" ON public.spin_prizes;
DROP POLICY IF EXISTS "Anyone can view active spin prizes" ON public.spin_prizes;
CREATE POLICY "Admins can manage spin prizes" ON public.spin_prizes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active spin prizes" ON public.spin_prizes FOR SELECT TO authenticated USING (is_active = true);

-- box_prizes
DROP POLICY IF EXISTS "Admins can manage box prizes" ON public.box_prizes;
DROP POLICY IF EXISTS "Anyone can view active box prizes" ON public.box_prizes;
CREATE POLICY "Admins can manage box prizes" ON public.box_prizes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active box prizes" ON public.box_prizes FOR SELECT TO authenticated USING (is_active = true);

-- app_settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.app_settings;
CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view settings" ON public.app_settings FOR SELECT TO authenticated USING (true);

-- transactions
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Admins can manage transactions" ON public.transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_spins
DROP POLICY IF EXISTS "Admins can manage spins" ON public.user_spins;
DROP POLICY IF EXISTS "Users can insert own spins" ON public.user_spins;
DROP POLICY IF EXISTS "Users can view own spins" ON public.user_spins;
CREATE POLICY "Admins can manage spins" ON public.user_spins FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own spins" ON public.user_spins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own spins" ON public.user_spins FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_box_opens
DROP POLICY IF EXISTS "Admins can manage box opens" ON public.user_box_opens;
DROP POLICY IF EXISTS "Users can insert own box opens" ON public.user_box_opens;
DROP POLICY IF EXISTS "Users can view own box opens" ON public.user_box_opens;
CREATE POLICY "Admins can manage box opens" ON public.user_box_opens FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own box opens" ON public.user_box_opens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own box opens" ON public.user_box_opens FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- user_tasks
DROP POLICY IF EXISTS "Admins can manage user_tasks" ON public.user_tasks;
DROP POLICY IF EXISTS "Users can start tasks" ON public.user_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.user_tasks;
DROP POLICY IF EXISTS "Users can view own tasks" ON public.user_tasks;
CREATE POLICY "Admins can manage user_tasks" ON public.user_tasks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can start tasks" ON public.user_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.user_tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own tasks" ON public.user_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_ad_views
DROP POLICY IF EXISTS "Admins can manage user ad views" ON public.user_ad_views;
DROP POLICY IF EXISTS "Users can insert own ad views" ON public.user_ad_views;
DROP POLICY IF EXISTS "Users can view own ad views" ON public.user_ad_views;
CREATE POLICY "Admins can manage user ad views" ON public.user_ad_views FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own ad views" ON public.user_ad_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own ad views" ON public.user_ad_views FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- activity_logs
DROP POLICY IF EXISTS "Admins can view logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.activity_logs;
CREATE POLICY "Admins can view logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ads
DROP POLICY IF EXISTS "Admins can manage ads" ON public.ads;
DROP POLICY IF EXISTS "Anyone can view active ads" ON public.ads;
CREATE POLICY "Admins can manage ads" ON public.ads FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active ads" ON public.ads FOR SELECT TO authenticated USING (is_active = true);

-- airdrops
DROP POLICY IF EXISTS "Admins can manage airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Users can insert own airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Users can update own airdrops" ON public.airdrops;
DROP POLICY IF EXISTS "Users can view own airdrops" ON public.airdrops;
CREATE POLICY "Admins can manage airdrops" ON public.airdrops FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own airdrops" ON public.airdrops FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own airdrops" ON public.airdrops FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own airdrops" ON public.airdrops FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- currencies
DROP POLICY IF EXISTS "Admins can manage currencies" ON public.currencies;
DROP POLICY IF EXISTS "Anyone can view currencies" ON public.currencies;
CREATE POLICY "Admins can manage currencies" ON public.currencies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view currencies" ON public.currencies FOR SELECT TO authenticated USING (true);

-- referrals
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

-- shortlinks
DROP POLICY IF EXISTS "Admins can manage shortlinks" ON public.shortlinks;
DROP POLICY IF EXISTS "Anyone can view active shortlinks" ON public.shortlinks;
CREATE POLICY "Admins can manage shortlinks" ON public.shortlinks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active shortlinks" ON public.shortlinks FOR SELECT TO authenticated USING (is_active = true);

-- tasks
DROP POLICY IF EXISTS "Admins can manage tasks" ON public.tasks;
DROP POLICY IF EXISTS "Anyone can view active tasks" ON public.tasks;
CREATE POLICY "Admins can manage tasks" ON public.tasks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active tasks" ON public.tasks FOR SELECT TO authenticated USING (true);

-- user_balances
DROP POLICY IF EXISTS "Admins can manage balances" ON public.user_balances;
DROP POLICY IF EXISTS "Users can insert own balances" ON public.user_balances;
DROP POLICY IF EXISTS "Users can update own balances" ON public.user_balances;
DROP POLICY IF EXISTS "Users can view own balances" ON public.user_balances;
CREATE POLICY "Admins can manage balances" ON public.user_balances FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own balances" ON public.user_balances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own balances" ON public.user_balances FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own balances" ON public.user_balances FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_shortlinks
DROP POLICY IF EXISTS "Admins can manage user shortlinks" ON public.user_shortlinks;
DROP POLICY IF EXISTS "Users can insert own shortlink completions" ON public.user_shortlinks;
DROP POLICY IF EXISTS "Users can view own shortlink completions" ON public.user_shortlinks;
CREATE POLICY "Admins can manage user shortlinks" ON public.user_shortlinks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own shortlink completions" ON public.user_shortlinks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own shortlink completions" ON public.user_shortlinks FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- withdrawal_requests
DROP POLICY IF EXISTS "Admins can manage withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can create withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Admins can manage withdrawals" ON public.withdrawal_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create withdrawals" ON public.withdrawal_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Add unique constraint on app_settings.key for upsert to work
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_key_unique') THEN
    ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_key_unique UNIQUE (key);
  END IF;
END $$;
