-- ============================================================
-- Payment Transactions Table for Local Payment Gateway
-- ============================================================

-- Drop existing table if exists
DROP TABLE IF EXISTS payment_transactions CASCADE;

-- Create payment_transactions table
CREATE TABLE payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    order_id TEXT UNIQUE NOT NULL,
    booking_id TEXT NOT NULL,
    booking_type TEXT NOT NULL CHECK (booking_type IN ('accommodation', 'lunch', 'event', 'combo')),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    transaction_id TEXT,
    payment_method TEXT,
    gateway_payload JSONB,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own payment transactions
CREATE POLICY "Users can view own payment transactions"
ON payment_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own payment transactions (via backend)
CREATE POLICY "Users can create own payment transactions"
ON payment_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only system/backend can update payment transactions
CREATE POLICY "Backend can update payment transactions"
ON payment_transactions
FOR UPDATE
USING (true);

-- Comments for documentation
COMMENT ON TABLE payment_transactions IS 'Stores all payment transactions for accommodation, lunch, events, and combos';
COMMENT ON COLUMN payment_transactions.order_id IS 'Unique order identifier sent to payment gateway';
COMMENT ON COLUMN payment_transactions.booking_id IS 'Reference to the booking (accommodation_requests.id, lunch_bookings.id, etc.)';
COMMENT ON COLUMN payment_transactions.booking_type IS 'Type of booking: accommodation, lunch, event, or combo';
COMMENT ON COLUMN payment_transactions.gateway_payload IS 'Complete payload sent to payment gateway';
COMMENT ON COLUMN payment_transactions.gateway_response IS 'Response received from payment gateway';

-- Grant permissions
GRANT SELECT, INSERT ON payment_transactions TO authenticated;
GRANT ALL ON payment_transactions TO service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Payment transactions table created successfully!';
    RAISE NOTICE 'Table: payment_transactions';
    RAISE NOTICE 'Indexes: 5 indexes created for optimal performance';
    RAISE NOTICE 'RLS: Enabled with policies for user access';
END $$;
