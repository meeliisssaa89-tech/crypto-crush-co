-- Create a function to safely add XP to a user profile (creates profile if missing)
CREATE OR REPLACE FUNCTION public.add_xp(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to update existing profile
  UPDATE profiles SET xp = xp + p_amount, updated_at = now() WHERE user_id = p_user_id;
  -- If no profile exists, create one
  IF NOT FOUND THEN
    INSERT INTO profiles (user_id, xp, referral_code)
    VALUES (p_user_id, p_amount, substr(md5(random()::text), 1, 8))
    ON CONFLICT (user_id) DO UPDATE SET xp = profiles.xp + p_amount, updated_at = now();
  END IF;
END;
$$;

-- Create a function to safely add tokens to airdrops
CREATE OR REPLACE FUNCTION public.add_tokens(p_user_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE airdrops SET tokens_earned = tokens_earned + p_amount, updated_at = now() WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO airdrops (user_id, tokens_earned)
    VALUES (p_user_id, p_amount)
    ON CONFLICT (user_id) DO UPDATE SET tokens_earned = airdrops.tokens_earned + p_amount, updated_at = now();
  END IF;
END;
$$;