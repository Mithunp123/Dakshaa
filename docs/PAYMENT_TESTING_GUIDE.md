# Payment Gateway Integration - Quick Test Guide

## Prerequisites
✅ Run SQL migration: `database/add_payment_columns_to_bookings.sql` in Supabase SQL Editor
✅ Payment gateway running at: https://ccabc81dd642.ngrok-free.app/
✅ Backend running: `npm start` (port 3000)
✅ Frontend running: `npm run dev` (port 5173)

---

## Test 1: Accommodation Booking 🏨

**Steps:**
1. Login to application
2. Navigate to Accommodation page
3. Select "Book Accommodation" tab
4. Fill in form:
   - Full Name: Auto-filled
   - Mobile: Auto-filled
   - Gender: Select
   - College: Auto-filled
   - Select at least 1 date (March 12, 13, or 14)
5. Click "Book Accommodation"

**Expected:**
- Toast: "Preparing payment..."
- Redirects to payment gateway
- Payment page shows: Amount = (dates × ₹300)
- After payment:
  - SUCCESS → accommodation_requests updated (payment_status='PAID')
  - FAILED → accommodation_requests stays PENDING

**Database Check:**
```sql
SELECT id, user_id, accommodation_dates, payment_status, payment_id, created_at
FROM accommodation_requests
WHERE user_id = '<your-user-id>'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Test 2: Lunch Booking 🍽️

**Steps:**
1. Login to application
2. Navigate to Accommodation page (has lunch tab)
3. Select "Book Lunch" tab
4. Fill in form:
   - Full Name: Auto-filled
   - Mobile: Auto-filled
   - Select at least 1 lunch date (March 12, 13, or 14)
5. Click "Book Lunch"

**Expected:**
- Toast: "Preparing payment..."
- Redirects to payment gateway
- Payment page shows: Amount = (dates × ₹100)
- After payment:
  - SUCCESS → lunch_bookings updated (payment_status='PAID')
  - FAILED → lunch_bookings stays PENDING

**Database Check:**
```sql
SELECT id, user_id, lunch_dates, total_price, payment_status, payment_id, created_at
FROM lunch_bookings
WHERE user_id = '<your-user-id>'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Test 3: Combo Package 📦

**Steps:**
1. Login to application
2. Navigate to Register/Events page
3. Click "Combo Packages" tab
4. Select a combo package (e.g., "Tech Bundle")
5. Select events within the combo (as required)
6. Click "Register Combo"

**Expected:**
- Toast: "Creating combo purchase..."
- Toast: "Preparing payment..."
- Redirects to payment gateway
- Payment page shows: Amount = combo price
- After payment:
  - SUCCESS → combo_purchases updated (payment_status='PAID')
  - FAILED → combo_purchases stays PENDING

**Database Check:**
```sql
SELECT cp.id, cp.combo_id, cp.payment_status, cp.transaction_id, 
       c.name as combo_name, c.price, cp.created_at
FROM combo_purchases cp
JOIN combos c ON c.id = cp.combo_id
WHERE cp.user_id = '<your-user-id>'
ORDER BY cp.created_at DESC
LIMIT 1;
```

**Event Selections:**
```sql
SELECT ces.*, e.name as event_name
FROM combo_event_selections ces
JOIN events e ON e.id = ces.event_id
WHERE ces.purchase_id = '<purchase-id-from-above>';
```

---

## Test 4: Team Event Registration 👥

**Steps:**
1. Login to application
2. Navigate to Register/Events page
3. Click "Team Events" tab
4. Create a new team:
   - Team Name: "Test Team"
   - Max Size: 4
   - Add members (invite or join requests)
5. Select team from dropdown
6. Select a team event
7. Click "Register Team"
8. **NEW:** Prompt appears asking for team leader mobile
   - Enter 10-digit mobile number
   - Or leave blank if already in profile

**Expected:**
- Prompt: "Enter team leader's mobile number for payment:"
- If invalid mobile: Error toast "Valid 10-digit mobile number required"
- Toast: "Preparing payment..."
- Redirects to payment gateway
- Payment page shows: Amount = (event_price × team_member_count)
- After payment:
  - SUCCESS → Creates registrations for ALL team members
  - FAILED → No registrations created

**Database Check:**
```sql
-- Check team members
SELECT tm.user_id, p.full_name, tm.is_leader
FROM team_members tm
JOIN profiles p ON p.id = tm.user_id
WHERE tm.team_id = '<team-id>';

-- Check registrations (should match member count)
SELECT erc.id, erc.user_id, p.full_name, erc.payment_status, 
       erc.transaction_id, erc.registration_type
FROM event_registrations_config erc
JOIN profiles p ON p.id = erc.user_id
WHERE erc.team_id = '<team-id>'
  AND erc.event_id = '<event-id>';

-- Should be: COUNT(*) = team member count
```

**Admin Notification:**
```sql
SELECT type, title, message, data, created_at
FROM admin_notifications
WHERE data->>'team_id' = '<team-id>'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Test 5: Payment Transactions Log 📊

**All payments should be logged:**
```sql
SELECT 
  pt.id,
  pt.order_id,
  pt.booking_type,
  pt.amount,
  pt.status,
  pt.transaction_id,
  pt.created_at,
  pt.completed_at,
  p.full_name as user_name
FROM payment_transactions pt
JOIN profiles p ON p.id = pt.user_id
ORDER BY pt.created_at DESC
LIMIT 10;
```

**Expected booking_type values:**
- `accommodation` - Accommodation bookings
- `lunch` - Lunch bookings
- `event` - Individual event registrations
- `combo` - Combo package purchases
- `team` - Team event registrations

---

## Common Issues & Solutions

### Issue 1: "Payment status column doesn't exist"
**Solution:** Run `database/add_payment_columns_to_bookings.sql`

### Issue 2: "Team leader mobile prompt doesn't appear"
**Solution:** Clear mobile_number from your profile in Supabase:
```sql
UPDATE profiles SET mobile_number = NULL WHERE id = '<your-id>';
```

### Issue 3: "Payment gateway URL not accessible"
**Solution:** 
- Check ngrok is running
- Update `.env` with correct ngrok URL
- Restart backend server

### Issue 4: "Team registrations not created after payment"
**Solution:**
- Check backend console logs for errors
- Verify team_members table has all members
- Check payment_transactions.gateway_payload for team_data

### Issue 5: "Accommodation/Lunch status stays PENDING after payment"
**Solution:**
- Check payment callback logs
- Verify booking_id matches database record
- Check if RLS policies allow updates

---

## Backend Logs to Watch

**Payment Initiation:**
```
💾 Attempting to create payment transaction
✅ Created accommodation request: <id>
✅ Created lunch booking: <id>
📝 Team payment preparation - will create registrations after payment
🌐 Payment Gateway URL: https://...
✅ Payment transaction created
```

**Payment Callback:**
```
💳 Payment callback received (GET)
🔍 Database lookup result
✅ Successfully updated event registrations
✅ Created 4 team registrations for team <team-id>
```

---

## Success Criteria

### ✅ Accommodation:
- [ ] Payment gateway opens with correct amount
- [ ] Successful payment updates payment_status to PAID
- [ ] Failed payment keeps PENDING status
- [ ] payment_id populated with transaction ID

### ✅ Lunch:
- [ ] Payment gateway opens with correct amount
- [ ] Successful payment updates payment_status to PAID
- [ ] Failed payment keeps PENDING status
- [ ] payment_id populated with transaction ID

### ✅ Combo:
- [ ] Combo purchase created with PENDING status
- [ ] Payment gateway opens with combo price
- [ ] Successful payment updates to PAID
- [ ] transaction_id populated
- [ ] Event selections preserved

### ✅ Team:
- [ ] Mobile prompt appears (or uses profile mobile)
- [ ] Mobile validation works (10 digits)
- [ ] Payment gateway opens with total (price × members)
- [ ] Successful payment creates ALL member registrations
- [ ] All members see event as "Already Registered"
- [ ] Admin notification created
- [ ] Failed payment doesn't create any registrations

### ✅ Payment Transactions:
- [ ] All payments logged in payment_transactions
- [ ] status updated to SUCCESS/FAILED
- [ ] transaction_id populated
- [ ] gateway_response contains callback data
- [ ] team_data stored for team payments

---

## Reset Test Data (Optional)

If you need to test again, clean up test records:

```sql
-- Delete test accommodation (CAUTION!)
DELETE FROM accommodation_requests 
WHERE user_id = '<your-id>' 
  AND payment_status = 'PENDING';

-- Delete test lunch (CAUTION!)
DELETE FROM lunch_bookings 
WHERE user_id = '<your-id>' 
  AND payment_status = 'PENDING';

-- Delete test combo (CAUTION!)
DELETE FROM combo_purchases 
WHERE user_id = '<your-id>' 
  AND payment_status = 'PENDING';

-- Delete test team registrations (CAUTION!)
DELETE FROM event_registrations_config 
WHERE team_id = '<test-team-id>';

-- Delete test payment transactions (CAUTION!)
DELETE FROM payment_transactions 
WHERE user_id = '<your-id>' 
  AND status = 'INITIATED';
```

---

## Mobile Testing

**Test mobile collection for team payments:**

1. **With mobile in profile:**
   - Should use profile mobile automatically
   - No prompt appears

2. **Without mobile in profile:**
   - Prompt appears: "Enter team leader's mobile number for payment:"
   - Enter valid: "9876543210" → Proceeds
   - Enter invalid: "123" → Error "Valid 10-digit mobile number required"
   - Cancel prompt → Error and stops

3. **Verify in payment:**
   - Check payment_transactions.gateway_payload
   - Should contain: `customer_phone: "9876543210"`

---

## Final Checklist

Before marking as complete:

- [ ] All 4 booking types redirect to payment gateway
- [ ] No fake transaction IDs generated
- [ ] No hardcoded payment_status='PAID'
- [ ] All bookings created as PENDING
- [ ] Successful payments update to PAID
- [ ] Failed payments stay PENDING
- [ ] Team leader mobile collected for team payments
- [ ] Team registrations created only after successful payment
- [ ] All payments logged in payment_transactions
- [ ] Admin notifications created
- [ ] No console errors
- [ ] Database constraints satisfied

---

## Support

Check comprehensive documentation: `COMPREHENSIVE_PAYMENT_INTEGRATION.md`
