# Payment Gateway Flow - Visual Diagram

## Overview: Unified Payment Flow for All Booking Types

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DaKshaa Payment Gateway Integration             │
│                    (Accommodation, Lunch, Combo, Team, Event)           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. ACCOMMODATION BOOKING FLOW 🏨

```
┌──────────────┐
│    USER      │  Fills form: dates, gender, college
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  AccommodationBooking.jsx  │
│  - Select dates (12, 13, 14 March) │
│  - Calculate: dates × ₹300          │
│  - Validate form                    │
└──────┬───────────────────────────┘
       │
       │ POST /payment/initiate
       ▼
┌──────────────────────────────────────┐
│      Backend (server.js)             │
│  1. Create accommodation_request     │
│     - payment_status = 'PENDING'     │
│     - Insert dates, user info        │
│  2. Get booking_id from DB           │
│  3. Create payment_transaction       │
│     - order_id, amount, booking_id   │
│  4. Call payment gateway API         │
└──────┬──────────────────────────────┘
       │
       │ return payment_url
       ▼
┌──────────────────────────────┐
│   Payment Gateway (ngrok)    │
│   - User pays ₹300 × dates   │
│   - Status: SUCCESS/FAILED   │
└──────┬──────────────────────┘
       │
       │ GET /payment/callback?status=success&txn_id=...
       ▼
┌──────────────────────────────────────┐
│   Backend Callback Handler           │
│  1. Update payment_transaction       │
│     - status = 'SUCCESS'             │
│     - transaction_id = txn_id        │
│  2. Update accommodation_request     │
│     - payment_status = 'PAID'        │
│     - payment_id = txn_id            │
└──────┬──────────────────────────────┘
       │
       ▼
┌──────────────┐
│  SUCCESS     │  Booking confirmed ✅
│  PAGE        │  Accommodation reserved
└──────────────┘
```

---

## 2. LUNCH BOOKING FLOW 🍽️

```
┌──────────────┐
│    USER      │  Fills form: dates
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  AccommodationBooking.jsx (Lunch Tab) │
│  - Select lunch dates (12, 13, 14)   │
│  - Calculate: dates × ₹100            │
│  - Validate form                      │
└──────┬──────────────────────────────┘
       │
       │ POST /payment/initiate
       ▼
┌──────────────────────────────────────┐
│      Backend (server.js)             │
│  1. Create lunch_booking             │
│     - payment_status = 'PENDING'     │
│     - Insert dates, user info        │
│  2. Get booking_id from DB           │
│  3. Create payment_transaction       │
│  4. Call payment gateway API         │
└──────┬──────────────────────────────┘
       │
       │ return payment_url
       ▼
┌──────────────────────────────┐
│   Payment Gateway (ngrok)    │
│   - User pays ₹100 × dates   │
│   - Status: SUCCESS/FAILED   │
└──────┬──────────────────────┘
       │
       │ GET /payment/callback
       ▼
┌──────────────────────────────────────┐
│   Backend Callback Handler           │
│  1. Update payment_transaction       │
│  2. Update lunch_booking             │
│     - payment_status = 'PAID'        │
│     - payment_id = txn_id            │
└──────┬──────────────────────────────┘
       │
       ▼
┌──────────────┐
│  SUCCESS     │  Lunch reserved ✅
│  PAGE        │
└──────────────┘
```

---

## 3. COMBO PACKAGE FLOW 📦

```
┌──────────────┐
│    USER      │  Selects combo + events
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│  RegistrationForm.jsx (Combo)    │
│  - Select combo package          │
│  - Select required events        │
│  - Create combo_purchase         │
│    (payment_status = 'PENDING')  │
└──────┬──────────────────────────┘
       │
       │ POST /payment/initiate
       ▼
┌──────────────────────────────────────┐
│      Backend (server.js)             │
│  1. Get combo purchase_id (already created) │
│  2. Create payment_transaction       │
│     - booking_id = purchase_id       │
│     - amount = combo.price           │
│  3. Call payment gateway API         │
└──────┬──────────────────────────────┘
       │
       │ return payment_url
       ▼
┌──────────────────────────────┐
│   Payment Gateway (ngrok)    │
│   - User pays combo price    │
│   - Status: SUCCESS/FAILED   │
└──────┬──────────────────────┘
       │
       │ GET /payment/callback
       ▼
┌──────────────────────────────────────┐
│   Backend Callback Handler           │
│  1. Update payment_transaction       │
│  2. Update combo_purchase            │
│     - payment_status = 'PAID'        │
│     - transaction_id = txn_id        │
│  3. Event selections preserved       │
└──────┬──────────────────────────────┘
       │
       ▼
┌──────────────┐
│  SUCCESS     │  Combo purchased ✅
│  PAGE        │  Events unlocked
└──────────────┘
```

---

## 4. TEAM EVENT FLOW 👥 (NEW: Mobile Collection)

```
┌──────────────┐
│    USER      │  Creates team, selects event
│ (Team Leader)│
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  RegistrationForm.jsx (Team)         │
│  1. Create team                      │
│  2. Add members                      │
│  3. Select team event                │
│  4. Click "Register Team"            │
└──────┬──────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────┐
│   🆕 MOBILE COLLECTION                │
│                                       │
│   IF profile.mobile_number EXISTS:   │
│      → Use it automatically          │
│                                       │
│   ELSE:                               │
│      → Prompt: "Enter team leader's  │
│         mobile number for payment:"  │
│      → Validate: /^\d{10}$/          │
│                                       │
└──────┬───────────────────────────────┘
       │
       │ POST /payment/initiate (with team_leader_mobile)
       ▼
┌──────────────────────────────────────────────┐
│      Backend (server.js)                     │
│  1. Store team data in payment record:       │
│     gateway_payload.team_data = {            │
│       team_id, team_name,                    │
│       event_id, member_count                 │
│     }                                         │
│  2. Create payment_transaction               │
│     - booking_id = TEAM_<teamId>_<timestamp> │
│     - amount = event_price × member_count    │
│     - customer_phone = team_leader_mobile 🆕 │
│  3. Call payment gateway API                 │
└──────┬──────────────────────────────────────┘
       │
       │ return payment_url
       ▼
┌────────────────────────────────────────┐
│   Payment Gateway (ngrok)              │
│   - User pays: price × members         │
│   - Phone: team_leader_mobile 🆕       │
│   - Status: SUCCESS/FAILED             │
└──────┬────────────────────────────────┘
       │
       │ GET /payment/callback?status=success&txn_id=...
       ▼
┌──────────────────────────────────────────────────┐
│   Backend Callback Handler                       │
│  1. Update payment_transaction                   │
│     - status = 'SUCCESS'                         │
│  2. Get team_data from payment record            │
│  3. Get ALL team members:                        │
│     SELECT user_id FROM team_members             │
│     WHERE team_id = team_data.team_id            │
│  4. 🆕 Create registrations for ALL members:     │
│     INSERT INTO event_registrations_config       │
│     (user_id, event_id, team_id,                 │
│      payment_status='PAID',                      │
│      transaction_id, registration_type='team')   │
│     FOR EACH member                              │
│  5. Create admin notification                    │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌──────────────────────┐
│  SUCCESS PAGE        │  ALL members registered ✅
│                      │  Team shows as registered
│  🆕 Member 1: ✅     │
│  🆕 Member 2: ✅     │
│  🆕 Member 3: ✅     │
│  🆕 Member 4: ✅     │
└──────────────────────┘
```

---

## 5. MULTI-EVENT (INDIVIDUAL) FLOW 🎯

```
┌──────────────┐
│    USER      │  Selects multiple events
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  RegistrationForm.jsx (Individual)   │
│  - Select Event 1, Event 2, Event 3  │
│  - Calculate total price             │
│  - Generate batch_id:                │
│    BATCH_<timestamp>_<userId>        │
└──────┬──────────────────────────────┘
       │
       │ Create registrations (payment_status='PENDING')
       ▼
┌────────────────────────────────────────┐
│   Database: event_registrations_config │
│                                        │
│   Event 1: transaction_id = batch_id  │
│   Event 2: transaction_id = batch_id  │
│   Event 3: transaction_id = batch_id  │
│   All: payment_status = 'PENDING'     │
└──────┬────────────────────────────────┘
       │
       │ POST /payment/initiate (with first event as booking_id)
       ▼
┌──────────────────────────────────────┐
│      Backend (server.js)             │
│  1. Create payment_transaction       │
│  2. Call payment gateway API         │
└──────┬──────────────────────────────┘
       │
       │ return payment_url
       ▼
┌──────────────────────────────┐
│   Payment Gateway (ngrok)    │
│   - User pays total amount   │
│   - Status: SUCCESS/FAILED   │
└──────┬──────────────────────┘
       │
       │ GET /payment/callback
       ▼
┌──────────────────────────────────────────┐
│   Backend Callback Handler               │
│  1. Get first registration's batch_id    │
│  2. Update ALL registrations with same   │
│     batch_id:                            │
│     - payment_status = 'PAID'            │
│     - transaction_id = actual_txn_id     │
│  3. Create admin notification            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  SUCCESS     │  All events registered ✅
│  PAGE        │  Event 1, 2, 3 confirmed
└──────────────┘
```

---

## Payment Transaction Record Structure

```
payment_transactions table:
┌─────────────────────────────────────────────────────────────┐
│ id               | 1                                        │
│ user_id          | abc-123-def                              │
│ order_id         | ORDER_20240312_ACC_1234                  │
│ booking_id       | 42 (actual DB ID or temp ID)             │
│ booking_type     | 'accommodation' | 'lunch' | 'combo' |    │
│                  | 'team' | 'event'                         │
│ amount           | 900 (₹300 × 3 dates)                     │
│ status           | 'INITIATED' → 'SUCCESS' | 'FAILED'       │
│ transaction_id   | TXN_ABC123 (from gateway)                │
│ gateway_payload  | {                                        │
│                  |   order_id, customer_name,               │
│                  |   customer_phone,                        │
│                  |   team_data: { // For team bookings      │
│                  |     team_id, team_name,                  │
│                  |     event_id, member_count               │
│                  |   }                                       │
│                  | }                                         │
│ gateway_response | { txn_id, payment_id, status }           │
│ created_at       | 2024-03-12 10:30:00                      │
│ completed_at     | 2024-03-12 10:35:00                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Status Flow Diagram

```
ALL BOOKING TYPES:

┌─────────────┐
│   PENDING   │  ← Created before payment
└──────┬──────┘
       │
       │  User redirected to gateway
       │  User completes payment
       │
       ▼
┌─────────────┐
│   SUCCESS   │  ← Callback updates status
└──────┬──────┘
       │
       │  Booking confirmed
       │  For teams: Create all member registrations
       │
       ▼
┌─────────────┐
│   PAID      │  ← Final status in booking table
└─────────────┘

FAILED PATH:
┌─────────────┐
│   PENDING   │
└──────┬──────┘
       │
       │  User payment fails
       │
       ▼
┌─────────────┐
│   FAILED    │  ← Status in payment_transactions
└──────┬──────┘
       │
       │  Booking stays PENDING
       │  User can retry payment
       │
       ▼
```

---

## Before vs After Comparison

### ACCOMMODATION - Before
```
User → Direct POST /add-accommodation → DB Insert (PAID) ❌
```

### ACCOMMODATION - After
```
User → POST /payment/initiate → Create PENDING → Gateway → 
Callback → Update to PAID ✅
```

### COMBO - Before
```
User → Create purchase → Generate fake TXN_${Date.now()} → 
Mark as success ❌
```

### COMBO - After
```
User → Create purchase (PENDING) → POST /payment/initiate → 
Gateway → Callback → Update to PAID ✅
```

### TEAM - Before
```
User → Create team → Register with payment_status='PAID' → 
No actual payment ❌
```

### TEAM - After
```
User → Create team → Collect mobile 🆕 → POST /payment/initiate → 
Gateway → Callback → Create ALL member registrations (PAID) ✅
```

---

## Team Leader Mobile Collection Flow

```
┌─────────────────────────────────────┐
│   Team Registration Started         │
└────────────┬────────────────────────┘
             │
             ▼
      ┌──────────────────┐
      │  Check Profile   │
      │  mobile_number?  │
      └────┬──────┬──────┘
           │      │
      YES  │      │  NO
           │      │
           ▼      ▼
    ┌─────────────────┐     ┌──────────────────────────┐
    │  Use Profile    │     │  Show Prompt:            │
    │  Mobile         │     │  "Enter team leader's    │
    │  Automatically  │     │   mobile number for      │
    └────┬────────────┘     │   payment:"              │
         │                  └────┬─────────────────────┘
         │                       │
         │                       ▼
         │                  ┌──────────────────┐
         │                  │  Validate:       │
         │                  │  /^\d{10}$/      │
         │                  └────┬─────┬───────┘
         │                       │     │
         │                  VALID│     │INVALID
         │                       │     │
         │                       ▼     ▼
         │                  ┌────────────────┐
         │                  │  Show Error:   │
         │                  │  "Valid 10-    │
         │                  │  digit mobile  │
         │                  │  required"     │
         │                  │  → STOP        │
         │                  └────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
           ┌─────────────────────┐
           │  Proceed to Payment │
           │  with mobile number │
           └─────────────────────┘
```

---

## Database Table Updates

### Accommodation Requests
```
accommodation_requests:
┌──────────────────────────────────────┐
│ id                    | 1            │
│ user_id               | abc-123      │
│ accommodation_dates   | [12,13,14]   │
│ username              | John Doe     │
│ gender                | Male         │
│ college_name          | XYZ College  │
│ email_id              | john@...     │
│ mobile_number         | 9876543210   │
│ 🆕 payment_status     | PENDING/PAID │
│ 🆕 payment_id         | TXN_ABC123   │
│ created_at            | ...          │
└──────────────────────────────────────┘
```

### Lunch Bookings
```
lunch_bookings:
┌──────────────────────────────────────┐
│ id                    | 1            │
│ user_id               | abc-123      │
│ lunch_dates           | [12,13]      │
│ full_name             | John Doe     │
│ email                 | john@...     │
│ mobile                | 9876543210   │
│ total_price           | 200          │
│ 🆕 payment_status     | PENDING/PAID │
│ 🆕 payment_id         | TXN_ABC123   │
│ created_at            | ...          │
└──────────────────────────────────────┘
```

### Team Event Registrations
```
event_registrations_config:
(Multiple rows created AFTER payment)

Team "Tech Warriors" (4 members) pays ₹400 (₹100 × 4)

┌─────────────────────────────────────────────┐
│ id  | user_id | event_id | team_id | ...   │
├─────────────────────────────────────────────┤
│ 1   | member1 | event-x  | team-1  | PAID  │
│ 2   | member2 | event-x  | team-1  | PAID  │
│ 3   | member3 | event-x  | team-1  | PAID  │
│ 4   | member4 | event-x  | team-1  | PAID  │
└─────────────────────────────────────────────┘
All created in ONE callback after payment success
All have same transaction_id from payment gateway
```

---

## Error Handling Flow

```
┌─────────────────────────────────────┐
│   User Initiates Booking            │
└────────────┬────────────────────────┘
             │
             ▼
      ┌──────────────┐
      │  Validation  │
      │  OK?         │
      └───┬──────┬───┘
          │      │
      YES │      │ NO
          │      │
          │      ▼
          │  ┌──────────────────┐
          │  │  Show Error      │
          │  │  Toast           │
          │  │  → STOP          │
          │  └──────────────────┘
          │
          ▼
      ┌──────────────────┐
      │  Call Backend    │
      │  /payment/       │
      │  initiate        │
      └───┬──────┬───────┘
          │      │
    SUCCESS│      │ERROR
          │      │
          │      ▼
          │  ┌──────────────────┐
          │  │  Show Error      │
          │  │  "Payment init   │
          │  │  failed"         │
          │  │  → STOP          │
          │  └──────────────────┘
          │
          ▼
      ┌──────────────────┐
      │  Redirect to     │
      │  Payment Gateway │
      └───┬──────────────┘
          │
          ▼
      ┌──────────────────┐
      │  User Pays       │
      └───┬──────┬───────┘
          │      │
    SUCCESS│      │FAILED
          │      │
          │      ▼
          │  ┌──────────────────┐
          │  │  Callback marks  │
          │  │  status=FAILED   │
          │  │  Booking stays   │
          │  │  PENDING         │
          │  │  User can retry  │
          │  └──────────────────┘
          │
          ▼
      ┌──────────────────┐
      │  Callback Updates│
      │  Status to PAID  │
      │  Creates Team    │
      │  Registrations   │
      └──────────┬───────┘
                 │
                 ▼
      ┌──────────────────┐
      │  Success Page    │
      │  Booking         │
      │  Confirmed ✅    │
      └──────────────────┘
```

---

## Summary

✅ **All 5 booking types follow unified payment flow**
✅ **PENDING status created before payment**
✅ **Payment gateway handles actual payment**
✅ **Callback updates status to PAID on success**
✅ **Team registrations created AFTER payment**
✅ **Team leader mobile collected for team payments**
✅ **Complete transaction logging**
✅ **Retry capability for failed payments (PENDING remains)**

🎯 **No more fake payments or hardcoded statuses!**
