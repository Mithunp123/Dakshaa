# Comprehensive Payment Gateway Integration

## Overview
Successfully integrated payment gateway for ALL booking types in DaKshaa platform:
- ✅ Individual Event Registration (already working)
- ✅ Accommodation Booking
- ✅ Lunch Booking  
- ✅ Combo Packages
- ✅ Team Event Registration (with team leader mobile collection)

---

## 1. Accommodation Payment Integration

### Frontend Changes (`AccommodationBooking.jsx`)
**What changed:**
- Replaced direct `/add-accommodation` POST with payment gateway flow
- Now calls `/payment/initiate` with accommodation details
- Redirects to payment gateway for actual payment
- Stores pending data in sessionStorage

**Payment Flow:**
```
User selects dates → Calculate total (dates × ₹300) → 
Call /payment/initiate → Create PENDING accommodation_request → 
Redirect to gateway → User pays → Callback updates to PAID
```

**Code Location:** Lines ~95-145 in AccommodationBooking.jsx

**Amount Calculation:**
```javascript
Total = accommodation_dates.length × 300 rupees
```

---

## 2. Lunch Payment Integration

### Frontend Changes (`AccommodationBooking.jsx`)
**What changed:**
- Replaced direct `/add-lunch-booking` POST with payment gateway flow
- Now calls `/payment/initiate` with lunch booking details
- Redirects to payment gateway for actual payment
- Stores pending data in sessionStorage

**Payment Flow:**
```
User selects lunch dates → Calculate total (dates × ₹100) → 
Call /payment/initiate → Create PENDING lunch_booking → 
Redirect to gateway → User pays → Callback updates to PAID
```

**Code Location:** Lines ~145-190 in AccommodationBooking.jsx

**Amount Calculation:**
```javascript
Total = lunch_dates.length × 100 rupees
```

---

## 3. Combo Package Payment Integration

### Frontend Changes (`RegistrationForm.jsx`)
**What changed:**
- Removed fake transaction ID generation: ~~`TXN_${Date.now()}`~~
- Now calls `/payment/initiate` after creating combo purchase
- Redirects to payment gateway instead of fake success
- Purchase created as PENDING, updated to PAID after payment

**Payment Flow:**
```
User selects combo + events → Create PENDING combo_purchase → 
Call /payment/initiate → Redirect to gateway → 
User pays → Callback updates to PAID
```

**Code Location:** Lines ~692-750 in RegistrationForm.jsx

**Amount:**
```javascript
Total = selectedCombo.price (combo package price)
```

---

## 4. Team Event Payment Integration

### Frontend Changes (`RegistrationForm.jsx`)
**What changed:**
- Added team leader mobile number collection (prompt if not in profile)
- Removed hardcoded `payment_status='PAID'`
- Now calls `/payment/initiate` with team details
- Redirects to payment gateway
- Team registrations created AFTER successful payment

**Payment Flow:**
```
Create team → Select event → Prompt for team leader mobile → 
Calculate total (event_price × member_count) → 
Call /payment/initiate → Redirect to gateway → 
User pays → Callback creates ALL team member registrations
```

**Code Location:** Lines ~810-900 in RegistrationForm.jsx

**Mobile Collection:**
```javascript
// Prompts if mobile not in profile
const mobile = prompt('Enter team leader\'s mobile number for payment:');
// Validates 10-digit format
if (!/^\d{10}$/.test(mobile)) { error }
```

**Amount Calculation:**
```javascript
Total = event_price × team_member_count
```

---

## Backend Changes (`server.js`)

### Payment Initiation (`/payment/initiate`)

**New Features:**
1. **Accommodation Handling:**
   - Creates `accommodation_requests` record with `payment_status='PENDING'`
   - Returns actual DB ID as booking_id

2. **Lunch Handling:**
   - Creates `lunch_bookings` record with `payment_status='PENDING'`
   - Returns actual DB ID as booking_id

3. **Team Handling:**
   - Stores team data in `payment_transactions.gateway_payload.team_data`
   - Includes: team_id, team_name, event_id, member_count
   - Team registrations created AFTER payment success

4. **Team Leader Mobile:**
   - Accepts `team_leader_mobile` in request body
   - Uses it for payment gateway customer_phone field
   - Falls back to profile mobile if not provided

**Code Location:** Lines ~360-500 in server.js

---

### Payment Callback (`/payment/callback`)

**New Features:**

1. **Accommodation Success:**
```javascript
// Updates accommodation_requests table
UPDATE accommodation_requests 
SET payment_status = 'PAID', 
    payment_id = '<transaction_id>'
WHERE id = booking_id AND user_id = user_id
```

2. **Lunch Success:**
```javascript
// Updates lunch_bookings table
UPDATE lunch_bookings 
SET payment_status = 'PAID', 
    payment_id = '<transaction_id>'
WHERE id = booking_id AND user_id = user_id
```

3. **Combo Success:**
```javascript
// Updates combo_purchases table
UPDATE combo_purchases 
SET payment_status = 'PAID', 
    transaction_id = '<transaction_id>'
WHERE id = booking_id AND user_id = user_id
```

4. **Team Success:**
```javascript
// Retrieves team data from payment record
const teamData = paymentRecord.gateway_payload.team_data;

// Gets all team members
SELECT user_id FROM team_members WHERE team_id = teamData.team_id;

// Creates registrations for ALL members
INSERT INTO event_registrations_config (
  user_id, event_id, team_id, payment_status, 
  transaction_id, registration_type
) VALUES ... (for each member)

// Creates admin notification for team registration
```

**Code Location:** Lines ~600-720 in server.js

---

## Database Requirements

### Tables Must Have These Columns:

**accommodation_requests:**
- `payment_status` (TEXT/VARCHAR) - 'PENDING', 'PAID', 'FAILED'
- `payment_id` (TEXT/VARCHAR) - Transaction ID from gateway

**lunch_bookings:**
- `payment_status` (TEXT/VARCHAR) - 'PENDING', 'PAID', 'FAILED'
- `payment_id` (TEXT/VARCHAR) - Transaction ID from gateway

**combo_purchases:**
- `payment_status` (TEXT/VARCHAR) - Already exists
- `transaction_id` (TEXT/VARCHAR) - Already exists

**event_registrations_config:**
- `payment_status` (TEXT/VARCHAR) - Already exists
- `transaction_id` (TEXT/VARCHAR) - Already exists
- `team_id` (UUID) - Already exists
- `registration_type` ('individual' or 'team') - Already exists

**payment_transactions:**
- All columns already exist
- `gateway_payload` now stores team_data for team payments

---

## SQL Migration (If Needed)

If `accommodation_requests` or `lunch_bookings` don't have payment columns:

```sql
-- Add payment columns to accommodation_requests
ALTER TABLE accommodation_requests 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Add payment columns to lunch_bookings
ALTER TABLE lunch_bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_accommodation_payment 
ON accommodation_requests(payment_status);

CREATE INDEX IF NOT EXISTS idx_lunch_payment 
ON lunch_bookings(payment_status);
```

---

## Payment Gateway Flow

### Unified Flow for All Types:
```
1. User submits booking form
   ↓
2. Frontend validates data
   ↓
3. Frontend calls /payment/initiate with:
   - user_id
   - booking_id (temp ID or actual)
   - booking_type ('accommodation', 'lunch', 'combo', 'team', 'event')
   - amount
   - type-specific data (dates, team info, etc.)
   ↓
4. Backend creates PENDING record (if needed)
   ↓
5. Backend calls payment gateway
   ↓
6. Backend returns payment_url
   ↓
7. Frontend redirects to payment gateway
   ↓
8. User completes payment
   ↓
9. Gateway redirects to /payment/callback
   ↓
10. Backend updates booking status to PAID
    ↓
11. Backend creates team registrations (if team type)
    ↓
12. Backend creates admin notification
    ↓
13. User redirected to success page
```

---

## Testing Checklist

### Accommodation:
- [ ] Select dates (single and multiple)
- [ ] Calculate total correctly (dates × ₹300)
- [ ] Payment gateway opens
- [ ] Successful payment updates accommodation_requests
- [ ] Failed payment keeps status as PENDING
- [ ] User can see booking in dashboard

### Lunch:
- [ ] Select lunch dates (single and multiple)
- [ ] Calculate total correctly (dates × ₹100)
- [ ] Payment gateway opens
- [ ] Successful payment updates lunch_bookings
- [ ] Failed payment keeps status as PENDING
- [ ] User can see booking in dashboard

### Combo:
- [ ] Select combo package
- [ ] Select events within combo
- [ ] Create purchase (PENDING status)
- [ ] Payment gateway opens
- [ ] Successful payment updates combo_purchases
- [ ] Event selections properly linked
- [ ] Failed payment keeps status as PENDING

### Team:
- [ ] Create team with members
- [ ] Select team event
- [ ] Prompt for team leader mobile (if needed)
- [ ] Validate mobile format (10 digits)
- [ ] Calculate total (price × members)
- [ ] Payment gateway opens
- [ ] Successful payment creates ALL member registrations
- [ ] All members can see registration in dashboard
- [ ] Team shows as registered for event
- [ ] Failed payment doesn't create registrations

---

## Key Features

### 1. Team Leader Mobile Collection
**Why:** Payment gateway needs valid mobile for payment tracking

**How:**
- First checks user profile for mobile_number
- If not found, prompts with JavaScript `prompt()`
- Validates 10-digit format
- Passes as `team_leader_mobile` to backend
- Backend uses it for payment gateway customer_phone

**Code:**
```javascript
let teamLeaderMobile = userProfile.mobile_number;
if (!teamLeaderMobile) {
  const mobile = prompt('Enter team leader\'s mobile number for payment:');
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    toast.error('Valid 10-digit mobile number required');
    return;
  }
  teamLeaderMobile = mobile;
}
```

### 2. Pending → Paid Status Flow
All bookings now follow proper status flow:
- Created as **PENDING** before payment
- Updated to **PAID** after successful payment
- Remain **PENDING** if payment fails (can retry)

### 3. Batch/Multi-Event Support
- Event registrations already support batch payments (BATCH_timestamp_userId)
- Team registrations create multiple records in one payment
- Combo registrations link multiple events to one purchase

### 4. Admin Notifications
Backend creates admin notifications for:
- Individual event registrations (with event count)
- Team registrations (with team name and member count)
- Can be extended for accommodation/lunch if needed

---

## Configuration

### Environment Variables (.env)
```
PAYMENT_GATEWAY_URL=https://ccabc81dd642.ngrok-free.app/
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Frontend Config (.env)
```
VITE_API_URL=http://localhost:3000
```

---

## Error Handling

### Frontend:
- Validates all required fields before payment
- Shows loading toast during payment preparation
- Handles payment initiation failures
- Stores pending data in sessionStorage
- Redirects back on callback

### Backend:
- Validates user profile exists
- Creates PENDING records before payment
- Logs all payment steps
- Returns detailed error messages
- Handles gateway failures gracefully
- Updates payment_transactions status

---

## Security Considerations

1. **RLS Bypass:** Backend uses service_role key for inserting PENDING records
2. **User Validation:** All payments validate user_id exists in profiles
3. **Team Member Validation:** Team payments verify all members exist
4. **Mobile Validation:** Team leader mobile must be 10 digits
5. **Status Verification:** Only SUCCESS status updates bookings to PAID
6. **Transaction Tracking:** All payments logged in payment_transactions

---

## Next Steps (Optional Enhancements)

1. **Payment History Page:**
   - Show all user payments (accommodation, lunch, events, combos, teams)
   - Filter by type and status
   - Download receipts

2. **Refund System:**
   - Admin can mark payments as REFUNDED
   - Update booking status accordingly
   - Notify users

3. **Payment Retry:**
   - Allow users to retry PENDING bookings
   - Reuse existing booking_id
   - Update payment_transactions

4. **Email Notifications:**
   - Send confirmation emails after successful payment
   - Include booking details and transaction ID
   - Send team registration confirmations to all members

5. **Webhook Integration:**
   - Replace GET callback with POST webhook
   - Add signature verification
   - Handle async payment updates

---

## Files Modified

### Frontend:
- `Frontend/src/Pages/Accomodation/Components/AccommodationBooking.jsx`
  - Lines ~95-145: Accommodation payment integration
  - Lines ~145-190: Lunch payment integration

- `Frontend/src/Pages/Register/Components/RegistrationForm.jsx`
  - Lines ~692-750: Combo payment integration
  - Lines ~810-900: Team payment integration with mobile collection

### Backend:
- `Backend/server.js`
  - Lines ~360-500: Payment initiation with accommodation/lunch/team handling
  - Lines ~600-720: Payment callback with all booking types

### Documentation:
- `COMPREHENSIVE_PAYMENT_INTEGRATION.md` (this file)

---

## Support

For issues or questions:
1. Check backend logs (console.log with emojis 💾 🌐 ✅ ❌)
2. Verify database columns exist (see SQL migration above)
3. Test payment gateway accessibility (ngrok URL)
4. Check RLS policies allow service_role writes

---

## Summary

✅ **All 5 booking types now use unified payment gateway:**
1. Individual Events (multi-event batch support)
2. Accommodation (with date selection)
3. Lunch (with date selection)
4. Combo Packages (with event selection)
5. Team Events (with team leader mobile collection)

🎯 **Key Achievement:** 
- Consistent payment flow across entire platform
- No more fake transaction IDs
- No more hardcoded 'PAID' status
- Proper PENDING → PAID status tracking
- Team leader mobile collection for team payments
- All payments logged in payment_transactions table
