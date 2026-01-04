-- Fix Payment Transactions Table
-- This script ensures the payment_transactions table exists with correct columns

-- Drop existing table if there are issues (WARNING: This will delete data!)
-- Comment out the next line if you want to preserve existing data
DROP TABLE IF EXISTS public.payment_transactions CASCADE;

-- Create payment_transactions table with correct schema
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('EVENT', 'COMBO', 'ACCOMMODATION', 'LUNCH')),
    reference_id UUID, -- Points to event_registration, combo_purchase, accommodation_request, or lunch_booking
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_gateway TEXT, -- 'razorpay', 'paytm', 'stripe', etc.
    gateway_transaction_id TEXT, -- This is the problematic column
    gateway_order_id TEXT,
    payment_status TEXT DEFAULT 'INITIATED' CHECK (payment_status IN ('INITIATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_method TEXT, -- 'UPI', 'CARD', 'NET_BANKING', 'WALLET', etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user 
ON public.payment_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status 
ON public.payment_transactions(payment_status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_type 
ON public.payment_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id 
ON public.payment_transactions(gateway_transaction_id);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can view their own payment transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can create their own payment transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all payment transactions" ON public.payment_transactions;
CREATE POLICY "Admins can view all payment transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'registration_admin')
  )
);

-- Add comment
COMMENT ON TABLE public.payment_transactions IS 
'Unified payment tracking for all transaction types across the platform';

-- Verify table creation
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'payment_transactions'
ORDER BY ordinal_position;
