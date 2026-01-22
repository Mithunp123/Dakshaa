# Payment Gateway Integration Guide

## Overview
This guide explains how to integrate with the local payment gateway for Dhaskaa T26 event registration system.

## Backend Endpoints

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://9f808d6cce60.ngrok-free.app`

---

## 1. Initiate Payment

**Endpoint**: `POST /payment/initiate`

**Description**: Creates a payment request by fetching user data from the database and formatting it for the payment gateway.

### Request Body
```json
{
  "user_id": "uuid-of-user",
  "booking_id": "booking-reference-id",
  "booking_type": "accommodation",
  "amount": 500
}
```

### Booking Types
- `accommodation` - For accommodation bookings
- `lunch` - For lunch bookings
- `event` - For individual event registrations
- `combo` - For combo package purchases

### Response (Success)
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "payment_data": {
    "amount": 500,
    "order_id": "ORDER_20260109_001",
    "customer_name": "John Doe",
    "customer_email": "john.doe@example.com",
    "customer_phone": "9876543210",
    "customer_college": "ABC Engineering College",
    "customer_department": "Computer Science",
    "callback_url": "https://9f808d6cce60.ngrok-free.app/payment/callback",
    "description": "Dhaskaa T26 - ACCOMMODATION Registration"
  },
  "transaction_id": "uuid-transaction-id"
}
```

### Response (Error)
```json
{
  "success": false,
  "error": "User profile not found"
}
```

---

## 2. Payment Callback

**Endpoint**: `POST /payment/callback`

**Description**: Receives payment status updates from the payment gateway and updates booking records accordingly.

### Request Body (from Payment Gateway)
```json
{
  "order_id": "ORDER_20260109_001",
  "status": "SUCCESS",
  "transaction_id": "TXN_20260109_12345",
  "payment_method": "UPI",
  "gateway_response": {
    "payment_id": "pay_12345",
    "timestamp": "2026-01-09T10:30:00Z"
  }
}
```

### Status Values
- `SUCCESS` - Payment completed successfully
- `FAILED` - Payment failed
- `PENDING` - Payment is pending

### Response
```json
{
  "success": true,
  "message": "Payment success",
  "order_id": "ORDER_20260109_001",
  "status": "SUCCESS"
}
```

### What Happens on Success
When status is `SUCCESS`, the backend automatically:
1. Updates the `payment_transactions` table
2. Updates the corresponding booking table (`accommodation_requests`, `lunch_bookings`, `event_registrations_config`, or `combo_purchases`)
3. Sets `payment_status` to `PAID`
4. Records the `transaction_id`

---

## Frontend Integration

### Using Payment Service

```javascript
import paymentService from '../services/paymentService';

// Example: Initiate payment for accommodation
const initiatePayment = async () => {
  const result = await paymentService.initiatePayment({
    userId: user.id,
    bookingId: accommodationBooking.id,
    bookingType: 'accommodation',
    amount: 900, // ₹900 for 3 nights
  });

  if (result.success) {
    // Send payment_data to your payment gateway
    const paymentData = result.payment_data;
    
    // Your payment gateway should redirect user to payment page
    // and send callback to: https://9f808d6cce60.ngrok-free.app/payment/callback
    
    window.location.href = `YOUR_PAYMENT_GATEWAY_URL?` + 
      new URLSearchParams(paymentData).toString();
  } else {
    console.error('Payment initiation failed:', result.error);
  }
};
```

### Example: Event Registration Payment
```javascript
const payForEvent = async (eventId, price) => {
  const result = await paymentService.initiatePayment({
    userId: currentUser.id,
    bookingId: registrationId,
    bookingType: 'event',
    amount: price,
  });

  if (result.success) {
    // Redirect to payment gateway
    processPayment(result.payment_data);
  }
};
```

---

## Database Schema

### payment_transactions Table
```sql
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    order_id TEXT UNIQUE NOT NULL,
    booking_id TEXT NOT NULL,
    booking_type TEXT CHECK (booking_type IN ('accommodation', 'lunch', 'event', 'combo')),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'INITIATED',
    transaction_id TEXT,
    payment_method TEXT,
    gateway_payload JSONB,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

---

## Testing

### Test Payment Initiation
```bash
curl -X POST http://localhost:3000/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-uuid",
    "booking_id": "booking-123",
    "booking_type": "accommodation",
    "amount": 500
  }'
```

### Test Payment Callback
```bash
curl -X POST http://localhost:3000/payment/callback \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER_20260109_001",
    "status": "SUCCESS",
    "transaction_id": "TXN_12345",
    "payment_method": "UPI",
    "gateway_response": {}
  }'
```

---

## Flow Diagram

```
User selects booking → Frontend calls /payment/initiate
                           ↓
                    Backend fetches user data from DB
                           ↓
                    Returns formatted payment payload
                           ↓
                    Frontend redirects to Payment Gateway
                           ↓
                    User completes payment
                           ↓
                    Gateway sends callback to /payment/callback
                           ↓
                    Backend updates booking status
                           ↓
                    User sees confirmation
```

---

## Error Handling

### Common Errors
1. **Missing required fields**: Ensure all required fields are provided
2. **User not found**: Verify user_id exists in profiles table
3. **Booking not found**: Check if booking_id is valid
4. **Payment already completed**: Order might already be paid

### Error Response Format
```json
{
  "success": false,
  "error": "Error message describing the issue"
}
```

---

## Security Notes

1. **Callback URL**: The callback endpoint is publicly accessible and must validate incoming requests
2. **User Data**: All user data is fetched from the database - never trust client input for sensitive fields
3. **Transaction Verification**: The system stores both the request and response for audit purposes
4. **Status Updates**: Only the callback endpoint can update payment status

---

## Migration

Run this SQL file to set up the payment_transactions table:
```bash
database/migrations/create_payment_transactions.sql
```

---

## Support

For issues or questions:
- Check the backend logs for error messages
- Verify database connectivity
- Ensure all required user profile fields are populated
- Check that the ngrok URL is active and accessible
