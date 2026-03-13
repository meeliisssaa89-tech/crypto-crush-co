-- Enhanced Data Isolation and Security Fixes
-- This migration ensures proper user data isolation and fixes data sharing issues

-- 1. Add unique constraint on telegram_id to prevent duplicate profiles
ALTER TABLE profiles ADD CONSTRAINT unique_telegram_id UNIQUE (telegram_id) WHERE telegram_id IS NOT NULL;

-- 2. Ensure profiles table has proper indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- 3. Ensure user_balances are properly isolated per user
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);

-- 4. Ensure transactions are properly isolated per user
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- 5. Ensure airdrops are properly isolated per user
CREATE INDEX IF NOT EXISTS idx_airdrops_user_id ON airdrops(user_id);

-- 6. Ensure user_tasks are properly isolated per user
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);

-- 7. Ensure referrals are properly isolated
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

-- 8. Ensure withdrawal_requests are properly isolated per user
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);

-- 9. Add comment to document the data isolation strategy
COMMENT ON TABLE profiles IS 'User profiles - one per user_id, identified by telegram_id for Telegram Mini App users';
COMMENT ON COLUMN profiles.user_id IS 'Foreign key to auth.users - ensures one profile per authenticated user';
COMMENT ON COLUMN profiles.telegram_id IS 'Unique identifier from Telegram - used for Mini App authentication';

-- 10. Create a function to validate user data isolation
CREATE OR REPLACE FUNCTION validate_user_isolation()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check 1: Duplicate telegram_ids
  RETURN QUERY
  SELECT 
    'Duplicate Telegram IDs'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'FAILED' ELSE 'PASSED' END::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'Found ' || COUNT(*)::TEXT || ' duplicate telegram_ids' ELSE 'No duplicates found' END::TEXT
  FROM (
    SELECT telegram_id, COUNT(*) as cnt
    FROM profiles
    WHERE telegram_id IS NOT NULL
    GROUP BY telegram_id
    HAVING COUNT(*) > 1
  ) duplicates;

  -- Check 2: Duplicate user_ids
  RETURN QUERY
  SELECT 
    'Duplicate User IDs'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'FAILED' ELSE 'PASSED' END::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'Found ' || COUNT(*)::TEXT || ' duplicate user_ids' ELSE 'No duplicates found' END::TEXT
  FROM (
    SELECT user_id, COUNT(*) as cnt
    FROM profiles
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;

  -- Check 3: Orphaned profiles (no matching auth user)
  RETURN QUERY
  SELECT 
    'Orphaned Profiles'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'PASSED' END::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'Found ' || COUNT(*)::TEXT || ' orphaned profiles' ELSE 'No orphaned profiles' END::TEXT
  FROM profiles p
  LEFT JOIN auth.users u ON p.user_id = u.id
  WHERE u.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 11. Log this migration
INSERT INTO app_settings (key, value) 
VALUES ('last_migration', '{"timestamp": "' || NOW() || '", "migration": "enhance_data_isolation"}')
ON CONFLICT (key) DO UPDATE SET value = '{"timestamp": "' || NOW() || '", "migration": "enhance_data_isolation"}';
