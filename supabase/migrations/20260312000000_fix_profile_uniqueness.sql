-- Migration to fix the uniqueness of the profile IDs

ALTER TABLE profiles
  ADD CONSTRAINT unique_profile_ids UNIQUE (id);

-- You can also address the MIN(id) UUID issue if necessary, here's an example fix:
-- CREATE INDEX idx_profiles_id ON profiles USING btree (id);
-- This creates an index on the id column which can help with performance issues if needed.
