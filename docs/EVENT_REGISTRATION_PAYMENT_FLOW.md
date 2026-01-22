# Event Registration Payment Flow

## Overview
Complete payment gateway integration for event registration at `http://localhost:5173/register-events`

---

## Payment Flow

### Step 1: User Selects Events
- User navigates to `/register-events`
- Selects registration mode (Individual/Combo/Team)
- Chooses events
- Reviews registration (Step 3)

### Step 2: Click "Confirm Registration"
When user clicks **"Confirm Registration"** button:

1. **Create Pending Registrations**
   ```javascript
   // Inserts into event_registrations_config with:
   {
     event_id: "uuid",
     user_id: "uuid", 
     payment_status: "PENDING",
     payment_amount: 100,
     transaction_id: null
   }
   ```

2. **Call Payment Initiation Endpoint**
   ```javascript
   POST https://9f808d6cce60.ngrok-free.app/payment/initiate
   
   Request:
   {
     user_id: "user-uuid",
     booking_id: "registration-id",
     booking_type: "event",
     amount: 100
   }
   ```

3. **Backend Fetches User Data & Creates Payload**
   Backend automatically:
   - Fetches user profile from database
   - Gets email from auth.users
   - Generates unique order_id
   - Creates payment payload

   ```json
   Response:
   {
     "success": true,
     "payment_data": {
       "amount": 100,
       "order_id": "ORDER_20260109_a1b2c3d4",
       "customer_name": "John Doe",
       "customer_email": "john.doe@example.com",
       "customer_phone": "9876543210",
       "customer_college": "ABC Engineering College",
       "customer_department": "Computer Science",
       "callback_url": "https://9f808d6cce60.ngrok-free.app/payment/callback",
       "description": "Dhaskaa T26 - EVENT Registration"
     },
     "transaction_id": "txn-uuid"
   }
   ```

### Step 3: Redirect to Payment Gateway
Frontend receives payment data and redirects user to your payment gateway:

```javascript
// TODO: Replace with your actual payment gateway URL
window.location.href = `YOUR_PAYMENT_GATEWAY_URL?${new URLSearchParams(paymentData).toString()}`;
```

**Payment Gateway receives:**
- amount: 100
- order_id: ORDER_20260109_a1b2c3d4
- customer_name: John Doe
- customer_email: john.doe@example.com
- customer_phone: 9876543210
- customer_college: ABC Engineering College
- customer_department: Computer Science
- callback_url: https://9f808d6cce60.ngrok-free.app/payment/callback
- description: Dhaskaa T26 - EVENT Registration

### Step 4: User Completes Payment
User completes payment on your payment gateway

### Step 5: Payment Gateway Calls Callback
Your payment gateway sends callback to:

```javascript
POST https://9f808d6cce60.ngrok-free.app/payment/callback

{
  "order_id": "ORDER_20260109_a1b2c3d4",
  "status": "SUCCESS",  // or "FAILED" or "PENDING"
  "transaction_id": "TXN_12345",
  "payment_method": "UPI",
  "gateway_response": {
    // Any additional data from gateway
  }
}
```

### Step 6: Backend Updates Database
On receiving callback, backend automatically:

1. **Updates payment_transactions table**
   ```sql
   UPDATE payment_transactions
   SET status = 'SUCCESS',
       transaction_id = 'TXN_12345',
       payment_method = 'UPI',
       completed_at = NOW()
   WHERE order_id = 'ORDER_20260109_a1b2c3d4'
   ```

2. **Updates event_registrations_config table**
   ```sql
   UPDATE event_registrations_config
   SET payment_status = 'PAID',
       transaction_id = 'TXN_12345'
   WHERE id = 'booking-id'
   ```

3. **Creates Admin Notification**
   ```javascript
   INSERT INTO admin_notifications {
     type: 'NEW_REGISTRATION',
     title: 'New Event Registration',
     message: 'John Doe completed event registration payment',
     data: { user details, amount, transaction_id }
   }
   ```

### Step 7: User Redirected to Success Page
Payment gateway redirects user back to your app with success confirmation

---

## Database Schema

### payment_transactions
```sql
id: UUID (Primary Key)
user_id: UUID (Foreign Key -> profiles)
order_id: TEXT (Unique)
booking_id: TEXT
booking_type: TEXT ('event', 'accommodation', 'lunch', 'combo')
amount: DECIMAL
status: TEXT ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED')
transaction_id: TEXT
payment_method: TEXT
gateway_payload: JSONB
gateway_response: JSONB
created_at: TIMESTAMP
completed_at: TIMESTAMP
```

### event_registrations_config
```sql
id: UUID (Primary Key)
event_id: UUID (Foreign Key -> events)
user_id: UUID (Foreign Key -> profiles)
event_name: TEXT
payment_status: TEXT ('PENDING', 'PAID', 'FAILED')
payment_amount: INTEGER
transaction_id: TEXT
created_at: TIMESTAMP
```

---

## API Endpoints

### 1. Payment Initiation
**Endpoint:** `POST https://9f808d6cce60.ngrok-free.app/payment/initiate`

**Request:**
```json
{
  "user_id": "uuid",
  "booking_id": "uuid-or-id",
  "booking_type": "event",
  "amount": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "payment_data": {
    "amount": 100,
    "order_id": "ORDER_20260109_xyz",
    "customer_name": "Fetched from DB",
    "customer_email": "Fetched from DB",
    "customer_phone": "Fetched from DB",
    "customer_college": "Fetched from DB",
    "customer_department": "Fetched from DB",
    "callback_url": "https://9f808d6cce60.ngrok-free.app/payment/callback",
    "description": "Dhaskaa T26 - EVENT Registration"
  },
  "transaction_id": "uuid"
}
```

### 2. Payment Callback
**Endpoint:** `POST https://9f808d6cce60.ngrok-free.app/payment/callback`

**Request (from Payment Gateway):**
```json
{
  "order_id": "ORDER_20260109_xyz",
  "status": "SUCCESS",
  "transaction_id": "TXN_12345",
  "payment_method": "UPI",
  "gateway_response": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment success",
  "order_id": "ORDER_20260109_xyz",
  "status": "SUCCESS"
}
```

---

## Frontend Implementation

### Current Status (Testing Mode)
Currently, the code has a **temporary auto-complete** for testing:

```javascript
// FOR TESTING: Auto-complete payment after 2 seconds
setTimeout(async () => {
  await fetch('https://9f808d6cce60.ngrok-free.app/payment/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: paymentData.order_id,
      status: 'SUCCESS',
      transaction_id: `TXN_${Date.now()}`,
      payment_method: 'TEST',
      gateway_response: { test: true }
    })
  });
  setCurrentStep(4); // Show success page
}, 2000);
```

### Production Implementation
Replace the testing code with actual payment gateway redirect:

**File:** `Frontend/src/Pages/Register/Components/RegistrationForm.jsx`

**Find this section (around line 560):**
```javascript
// TODO: Redirect to your payment gateway with the payment data
// For now, just show the payment data
toast.success('Payment initiated! Redirecting to payment gateway...', {
  duration: 3000,
  position: 'top-center',
});

// Example: redirect to payment gateway
// window.location.href = `YOUR_PAYMENT_GATEWAY_URL?${new URLSearchParams(paymentData).toString()}`;
```

**Replace with:**
```javascript
// Redirect to payment gateway
const gatewayUrl = 'YOUR_PAYMENT_GATEWAY_URL'; // Replace with your actual URL
const queryParams = new URLSearchParams(paymentData).toString();
window.location.href = `${gatewayUrl}?${queryParams}`;
```

**And REMOVE the setTimeout testing code**

---

## Payment Gateway Integration Checklist

### Your Payment Gateway Must:
- ✅ Accept the payment data via URL parameters or POST
- ✅ Display payment form to user
- ✅ Process the payment
- ✅ Call the callback URL with payment status
- ✅ Redirect user back to your app

### Callback Requirements:
Your payment gateway MUST send a POST request to:
```
https://9f808d6cce60.ngrok-free.app/payment/callback
```

With this exact structure:
```json
{
  "order_id": "ORDER_20260109_xyz",  // The order_id we sent
  "status": "SUCCESS" | "FAILED" | "PENDING",
  "transaction_id": "your-transaction-id",
  "payment_method": "UPI" | "Card" | "NetBanking" | etc,
  "gateway_response": {
    // Optional: any additional data
  }
}
```

---

## Testing

### 1. Test Payment Initiation
```bash
curl -X POST https://9f808d6cce60.ngrok-free.app/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-uuid",
    "booking_id": "test-booking-123",
    "booking_type": "event",
    "amount": 100
  }'
```

### 2. Test Payment Callback
```bash
curl -X POST https://9f808d6cce60.ngrok-free.app/payment/callback \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER_20260109_test",
    "status": "SUCCESS",
    "transaction_id": "TXN_TEST_123",
    "payment_method": "UPI"
  }'
```

### 3. Test Full Flow
1. Go to http://localhost:5173/register-events
2. Login with a test account
3. Select an event (e.g., EEE Technical Quiz - ₹100)
4. Click "Next" → "Next" → "Confirm Registration"
5. Check console for payment_data
6. Currently auto-completes in 2 seconds
7. Should see "Registration Successful!" page

---

## URLs

### Development
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000
- **Public (Ngrok):** https://9f808d6cce60.ngrok-free.app

### API Endpoints
- **Payment Initiate:** https://9f808d6cce60.ngrok-free.app/payment/initiate
- **Payment Callback:** https://9f808d6cce60.ngrok-free.app/payment/callback

---

## Notes

1. **All user data is fetched from database** - No need to pass customer details from frontend
2. **Callback URL uses ngrok** - Not localhost, so payment gateway can reach it
3. **Payment status starts as PENDING** - Only changes to PAID after successful callback
4. **Admin notifications** - Automatically created on successful payment
5. **Session storage** - Used to track pending payment (can be used for return flow)

---

## Next Steps

### To Go Live:
1. Replace the testing setTimeout code with actual payment gateway redirect
2. Get your payment gateway URL
3. Configure your payment gateway to call the callback URL
4. Test with real payment gateway
5. Remove test/demo code
6. Update ngrok URL if it changes (or use permanent domain)
