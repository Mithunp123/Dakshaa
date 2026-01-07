// ============================================================
// SECURE BACKEND - Only Email & Payment Verification
// ============================================================

const express = require("express");
const supabase = require("./db");
const cors = require('cors');
const { sendWelcomeEmail, sendBookingConfirmationEmail, sendPaymentConfirmationEmail } = require('./emailService');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

console.log("✅ Backend connected - Email & Payment Service Only");

// ============================================================
// EMAIL ENDPOINTS
// ============================================================

/**
 * Send welcome email to new users
 * POST /api/send-welcome-email
 */
app.post("/api/send-welcome-email", async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ 
        error: "Email and full name are required" 
      });
    }

    const result = await sendWelcomeEmail(email, fullName);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Welcome email sent successfully!",
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to send welcome email",
        details: result.error
      });
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to send welcome email" 
    });
  }
});

/**
 * Send booking confirmation email
 * POST /api/send-booking-confirmation
 */
app.post("/api/send-booking-confirmation", async (req, res) => {
  try {
    const { email, fullName, bookingType, bookingDetails } = req.body;

    if (!email || !fullName || !bookingType) {
      return res.status(400).json({ 
        error: "Email, full name, and booking type are required" 
      });
    }

    const result = await sendBookingConfirmationEmail(
      email, 
      fullName, 
      bookingType, 
      bookingDetails
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Booking confirmation email sent!"
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to send confirmation email"
      });
    }
  } catch (error) {
    console.error("Error sending booking confirmation:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to send confirmation email" 
    });
  }
});

/**
 * Send payment confirmation email
 * POST /api/send-payment-confirmation
 */
app.post("/api/send-payment-confirmation", async (req, res) => {
  try {
    const { email, fullName, amount, transactionId, items } = req.body;

    if (!email || !fullName || !amount || !transactionId) {
      return res.status(400).json({ 
        error: "Required fields missing" 
      });
    }

    const result = await sendPaymentConfirmationEmail(
      email,
      fullName,
      amount,
      transactionId,
      items
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Payment confirmation email sent!"
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to send payment confirmation"
      });
    }
  } catch (error) {
    console.error("Error sending payment confirmation:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to send payment confirmation" 
    });
  }
});

// ============================================================
// RAZORPAY PAYMENT ENDPOINTS
// ============================================================

/**
 * Create Razorpay order
 * POST /api/payment/create-order
 */
app.post("/api/payment/create-order", async (req, res) => {
  try {
    const { amount, currency, receipt, userId, bookingType, bookingId } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ 
        error: "Amount and userId are required" 
      });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Amount in paise
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        user_id: userId,
        booking_type: bookingType,
        booking_id: bookingId
      }
    };

    const order = await razorpay.orders.create(options);

    // Store order details in database for verification
    const { error: dbError } = await supabase
      .from('payment_orders')
      .insert({
        order_id: order.id,
        user_id: userId,
        amount: amount,
        currency: currency || 'INR',
        booking_type: bookingType,
        booking_id: bookingId,
        status: 'created'
      });

    if (dbError) {
      console.error('Error storing order:', dbError);
    }

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID // Safe to send - public key
    });

  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to create payment order" 
    });
  }
});

/**
 * Verify Razorpay payment signature
 * POST /api/payment/verify
 * 
 * CRITICAL: This MUST stay in backend
 * - Uses RAZORPAY_KEY_SECRET (must be private)
 * - Prevents payment fraud
 */
app.post("/api/payment/verify", async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      bookingType,
      bookingId 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        error: "Missing payment verification parameters" 
      });
    }

    // Verify signature using Razorpay secret
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Payment signature verification failed");
      return res.status(400).json({
        success: false,
        error: "Payment verification failed - Invalid signature"
      });
    }

    // Signature verified - Update payment status in database
    // Update the appropriate table based on booking type
    let updateResult;

    if (bookingType === 'accommodation') {
      updateResult = await supabase
        .from('accommodation_requests')
        .update({ 
          payment_status: 'PAID',
          payment_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id
        })
        .eq('id', bookingId)
        .eq('user_id', userId);
    } else if (bookingType === 'lunch') {
      updateResult = await supabase
        .from('lunch_bookings')
        .update({ 
          payment_status: 'PAID',
          payment_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id
        })
        .eq('id', bookingId)
        .eq('user_id', userId);
    } else if (bookingType === 'event') {
      updateResult = await supabase
        .from('event_registrations_config')
        .update({ 
          payment_status: 'PAID',
          transaction_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id
        })
        .eq('id', bookingId)
        .eq('user_id', userId);
    }

    if (updateResult && updateResult.error) {
      console.error('Error updating payment status:', updateResult.error);
      return res.status(500).json({
        success: false,
        error: "Payment verified but failed to update status"
      });
    }

    // Update payment order record
    await supabase
      .from('payment_orders')
      .update({ 
        status: 'paid',
        payment_id: razorpay_payment_id,
        verified_at: new Date().toISOString()
      })
      .eq('order_id', razorpay_order_id);

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ 
      success: false,
      error: "Payment verification failed" 
    });
  }
});

/**
 * Handle Razorpay webhooks
 * POST /api/payment/webhook
 * 
 * CRITICAL: Razorpay will call this directly
 */
app.post("/api/payment/webhook", async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle different webhook events
    if (event === 'payment.captured') {
      const paymentId = payload.payment.entity.id;
      const orderId = payload.payment.entity.order_id;
      const amount = payload.payment.entity.amount / 100;

      // Update payment status
      await supabase
        .from('payment_orders')
        .update({ 
          status: 'captured',
          payment_id: paymentId,
          captured_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      console.log(`Payment captured: ${paymentId} for order ${orderId}`);
    } else if (event === 'payment.failed') {
      const orderId = payload.payment.entity.order_id;
      
      await supabase
        .from('payment_orders')
        .update({ 
          status: 'failed',
          failed_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      console.log(`Payment failed for order ${orderId}`);
    }

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    message: "Backend server running - Email & Payment Service Only",
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Secure Backend running on http://localhost:${PORT}`);
  console.log(`📧 Email Service: Active`);
  console.log(`💳 Payment Service: Active (Razorpay)`);
  console.log(`🔒 Only secure operations exposed`);
});
