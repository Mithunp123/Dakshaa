# 🔒 RAZORPAY PAYMENT INTEGRATION - Security Analysis

## ⚠️ CRITICAL: What MUST Stay in Backend

---

## 🔴 **NEVER PUT IN FRONTEND:**

### **1. Razorpay Key Secret**
```javascript
// ❌ NEVER DO THIS IN FRONTEND
const razorpay = new Razorpay({
  key_id: "rzp_live_xxxxx",           // ✅ Public - OK in frontend
  key_secret: "YOUR_SECRET_KEY"       // 🔴 PRIVATE - NEVER in frontend!
});
```

**Why?**
- Anyone can see frontend code
- Attacker steals key_secret → creates fake payments
- Verifies fake transactions as real
- Steals money from your account

---

### **2. Payment Signature Verification**
```javascript
// ❌ NEVER DO THIS IN FRONTEND
const expectedSignature = crypto
  .createHmac("sha256", KEY_SECRET)  // 🔴 Uses secret key!
  .update(razorpay_order_id + "|" + razorpay_payment_id)
  .digest("hex");

if (expectedSignature === razorpay_signature) {
  // Mark as paid
}
```

**Why?**
- If in frontend, attacker can:
  1. Bypass verification entirely
  2. Mark orders as paid without paying
  3. Get free registrations/bookings

---

## ✅ **SAFE IN FRONTEND:**

### **1. Razorpay Key ID (Public Key)**
```javascript
// ✅ SAFE - This is meant to be public
const options = {
  key: "rzp_live_xxxxx",  // Public key - safe to expose
  amount: amount * 100,
  currency: "INR",
  name: "DaKshaa T26"
};
```

---

### **2. Initiating Payment UI**
```javascript
// ✅ SAFE - Just opens Razorpay checkout
const rzp = new window.Razorpay(options);
rzp.open();
```

---

## 🎯 **CORRECT ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User clicks "Pay Now"                                       │
│       ↓                                                      │
│  1. Call Backend: /api/payment/create-order                 │
│     ✅ Send: amount, userId, bookingType                    │
│                                                              │
│  2. Receive: orderId, amount, keyId                         │
│                                                              │
│  3. Open Razorpay Checkout:                                 │
│     ✅ Uses public key_id                                   │
│     ✅ Shows payment UI                                     │
│                                                              │
│  4. User completes payment                                  │
│     ✅ Get: razorpay_payment_id, signature                  │
│                                                              │
│  5. Call Backend: /api/payment/verify                       │
│     ✅ Send: orderId, paymentId, signature                  │
│                                                              │
│  6. Backend verifies & updates database                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│                   (SECURE - PRIVATE)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /api/payment/create-order:                                 │
│  ✅ Uses key_secret to create order                         │
│  ✅ Stores order in database                                │
│  ✅ Returns orderId to frontend                             │
│                                                              │
│  /api/payment/verify:                                       │
│  ✅ Uses key_secret to verify signature                     │
│  ✅ Prevents fake payments                                  │
│  ✅ Updates payment_status to PAID                          │
│  ✅ Only backend can mark as paid                           │
│                                                              │
│  /api/payment/webhook:                                      │
│  ✅ Receives notifications from Razorpay                    │
│  ✅ Verifies webhook signature                              │
│  ✅ Handles payment.captured events                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 **FRONTEND IMPLEMENTATION**

### **File: `src/services/paymentService.js`**

```javascript
import { supabase } from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Create Razorpay order (via backend)
 */
export const createPaymentOrder = async (paymentData) => {
  try {
    const response = await fetch(`${API_URL}/api/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: paymentData.amount,
        userId: paymentData.userId,
        bookingType: paymentData.bookingType,
        bookingId: paymentData.bookingId
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process payment with Razorpay
 */
export const processPayment = async (orderData, userDetails) => {
  return new Promise((resolve, reject) => {
    const options = {
      key: orderData.keyId,  // ✅ Public key - safe
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId,
      name: "DaKshaa T26",
      description: `Payment for ${orderData.bookingType}`,
      image: "/logo.png",
      
      prefill: {
        name: userDetails.fullName,
        email: userDetails.email,
        contact: userDetails.phone
      },

      theme: {
        color: "#0ea5e9"
      },

      handler: async function(response) {
        // Payment successful - verify with backend
        const verification = await verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          userId: orderData.userId,
          bookingType: orderData.bookingType,
          bookingId: orderData.bookingId
        });

        if (verification.success) {
          resolve(verification);
        } else {
          reject(new Error('Payment verification failed'));
        }
      },

      modal: {
        ondismiss: function() {
          reject(new Error('Payment cancelled by user'));
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  });
};

/**
 * Verify payment with backend
 */
export const verifyPayment = async (verificationData) => {
  try {
    const response = await fetch(`${API_URL}/api/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationData)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Complete payment flow (create order + process payment)
 */
export const completePayment = async (paymentData, userDetails) => {
  try {
    // Step 1: Create order via backend
    const orderResult = await createPaymentOrder(paymentData);
    
    if (!orderResult.success) {
      throw new Error('Failed to create payment order');
    }

    // Step 2: Process payment via Razorpay
    const paymentResult = await processPayment(
      {
        ...orderResult,
        userId: paymentData.userId,
        bookingType: paymentData.bookingType,
        bookingId: paymentData.bookingId
      },
      userDetails
    );

    return {
      success: true,
      paymentId: paymentResult.paymentId
    };

  } catch (error) {
    console.error('Payment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

---

## 🚨 **WHAT HAPPENS IF YOU PUT EVERYTHING IN FRONTEND**

### **Scenario: Attacker's Perspective**

```javascript
// Attacker opens browser DevTools
// Finds this in your frontend code:

const razorpay = new Razorpay({
  key_id: "rzp_live_xxxxx",
  key_secret: "YOUR_SECRET_HERE"  // 🔴 Exposed!
});

// Now attacker can:

// 1. Create fake orders
const fakeOrder = razorpay.orders.create({
  amount: 1,  // ₹0.01 instead of ₹300
  currency: 'INR'
});

// 2. Generate valid signatures for fake payments
const fakeSignature = crypto
  .createHmac("sha256", "YOUR_SECRET_HERE")
  .update(fakeOrderId + "|" + fakePaymentId)
  .digest("hex");

// 3. Mark their booking as PAID without paying
await supabase
  .from('accommodation_requests')
  .update({ payment_status: 'PAID' })
  .eq('id', myBookingId);

// 4. Get free accommodation, events, lunch
// 5. Your revenue = ₹0
```

---

## ✅ **WHY BACKEND IS NECESSARY**

| Operation | Frontend | Backend | Reason |
|-----------|----------|---------|---------|
| **Show payment UI** | ✅ Yes | ❌ No | Uses public key only |
| **Create order** | ❌ No | ✅ Yes | Needs secret key |
| **Verify signature** | ❌ No | ✅ Yes | Needs secret key |
| **Update payment status** | ❌ No | ✅ Yes | Can be faked in frontend |
| **Handle webhooks** | ❌ No | ✅ Yes | Razorpay → Backend only |

---

## 📋 **REQUIRED BACKEND ENDPOINTS**

### **Minimum Backend for Razorpay:**

```javascript
// 1. Create Order
POST /api/payment/create-order
- Uses: RAZORPAY_KEY_SECRET
- Returns: orderId, amount, keyId

// 2. Verify Payment
POST /api/payment/verify
- Uses: RAZORPAY_KEY_SECRET
- Verifies: signature
- Updates: database

// 3. Webhook Handler
POST /api/payment/webhook
- Uses: RAZORPAY_WEBHOOK_SECRET
- Handles: Razorpay notifications
```

**Total Lines of Code: ~200 lines**
**Cost to Host: ~$5/month (Vercel/Railway free tier)**
**Security Value: PRICELESS**

---

## 🎯 **FINAL VERDICT**

### **Can you move Razorpay to frontend?**

**NO.** ❌

**Why?**
1. **Key Secret exposed** → Anyone can create fake payments
2. **No signature verification** → Free bookings for everyone
3. **Database updates in frontend** → Can be bypassed
4. **No webhook handling** → Miss payment confirmations

### **What to keep in backend?**
1. ✅ Order creation (`/create-order`)
2. ✅ Payment verification (`/verify`)
3. ✅ Webhook handler (`/webhook`)
4. ✅ Database updates (mark as PAID)

### **What can be in frontend?**
1. ✅ Razorpay checkout UI
2. ✅ User input collection
3. ✅ Success/failure messages

---

## 💰 **COST-BENEFIT ANALYSIS**

### **Option 1: Keep Backend ($5/month)**
- ✅ Secure payments
- ✅ Prevents fraud
- ✅ Revenue protected
- ✅ Razorpay compliance
- Cost: $5/month
- Risk: 🟢 Low

### **Option 2: No Backend (Free)**
- ❌ Exposed secrets
- ❌ Fake payments
- ❌ No revenue
- ❌ Account banned
- Cost: $0/month
- Risk: 🔴 **CRITICAL - DO NOT DO THIS**

---

## 📝 **MY RECOMMENDATION**

**Keep minimal backend:**
- Email service (nodemailer)
- Razorpay order creation
- Razorpay payment verification
- Razorpay webhooks

**Move to frontend:**
- Everything else (with RLS)

**Result:**
- 95% reduced backend code ✅
- Still secure payments ✅
- Minimal hosting cost ($5/month) ✅
- No fraud risk ✅

---

**Bottom Line:** For payment processing, **backend is NON-NEGOTIABLE**. But you only need ~200 lines of backend code, not the full server you have now.
