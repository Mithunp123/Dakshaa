-- ============================================================
-- Payment Transactions Table (Fixed for Team Events)
-- ============================================================

-- Drop existing table if exists (safe for idempotent setup)
DROP TABLE IF EXISTS public.payment_transactions CASCADE;

-- Create payment_transactions table with 'team' and 'mixed_registration' booking types supported
CREATE TABLE public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    order_id TEXT UNIQUE NOT NULL,
    booking_id TEXT NOT NULL,
    booking_type TEXT NOT NULL CHECK (booking_type IN ('accommodation', 'lunch', 'event', 'combo', 'team', 'mixed_registration')),
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    transaction_id TEXT,
    payment_method TEXT,
    gateway_payload JSONB,
    gateway_response JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON public.payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own payment transactions"
ON public.payment_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own transactions
DROP POLICY IF EXISTS "Users can create own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can create own payment transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Backend can update transactions
DROP POLICY IF EXISTS "Backend can update payment transactions" ON public.payment_transactions;
CREATE POLICY "Backend can update payment transactions"
ON public.payment_transactions
FOR UPDATE
USING (true);

-- Grants
GRANT SELECT, INSERT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Payment transactions (fixed) table created successfully with team and mixed_registration booking types!';
END $$;
