
-- Allow authenticated users to insert their own airdrop records
CREATE POLICY "Users can insert own airdrops"
ON public.airdrops
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own airdrops (for claiming)
CREATE POLICY "Users can update own airdrops"
ON public.airdrops
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to insert their own user_balances
CREATE POLICY "Users can insert own balances"
ON public.user_balances
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update own balances
CREATE POLICY "Users can update own balances"
ON public.user_balances
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
