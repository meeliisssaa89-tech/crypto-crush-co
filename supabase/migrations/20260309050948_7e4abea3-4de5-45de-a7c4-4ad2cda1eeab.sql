CREATE OR REPLACE FUNCTION public.add_xp(p_user_id uuid, p_amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE profiles SET xp = GREATEST(xp + p_amount, 0), updated_at = now() WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO profiles (user_id, xp, referral_code)
    VALUES (p_user_id, GREATEST(p_amount, 0), substr(md5(random()::text), 1, 8))
    ON CONFLICT (user_id) DO UPDATE SET xp = GREATEST(profiles.xp + p_amount, 0), updated_at = now();
  END IF;
END;
$function$;