# Frontend-Database Integration Guide
## DaKshaa Combo System

This document provides a complete mapping between frontend components/services and database tables/functions for the DaKshaa combo offer system.

---

## Table of Contents
1. [Service Layer Mappings](#service-layer-mappings)
2. [Component-Database Mappings](#component-database-mappings)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [API Implementation Examples](#api-implementation-examples)
5. [Error Handling Guidelines](#error-handling-guidelines)

---

## Service Layer Mappings

### 1. `comboService.js` → Database Integration

#### File: `Frontend/src/services/comboService.js`

#### **Method: `getCombosWithDetails()`**
```javascript
// Frontend Service
getCombosWithDetails: async () => {
  const { data, error } = await supabase.rpc("get_combos_with_details");
  return { success: !error, data: data || [], error };
}
```

**Database RPC Called**: `public.get_combos_with_details()`

**Returns**:
```typescript
interface ComboDetails {
  combo_id: UUID;
  combo_name: string;
  description: string;
  price: number;
  is_active: boolean;
  category_quotas: Record<string, number>;
  total_events_required: number;
  purchase_count: number;
}
```

**Usage in Frontend**:
- `ComboManagement.jsx` (Admin panel)
- `RegistrationForm.jsx` (Student view)

---

#### **Method: `getActiveCombosForStudents(userId)`**
```javascript
// Current implementation (direct query)
getActiveCombosForStudents: async (userId) => {
  const { data, error } = await supabase
    .from("combos")
    .select("*")
    .eq("is_active", true);
  return { success: !error, data: data || [] };
}
```

**Recommended Update**: Create new RPC function for better filtering

```sql
-- New RPC function to create
CREATE OR REPLACE FUNCTION public.get_active_combos_for_students(p_user_id UUID)
RETURNS TABLE (
    combo_id UUID,
    combo_name TEXT,
    description TEXT,
    price INTEGER,
    category_quotas JSONB,
    total_events_required INTEGER,
    already_purchased BOOLEAN,
    available_events JSONB
)
```

---

#### **Method: `createCombo()` (Admin)**
```javascript
createCombo: async ({ name, description, price, isActive, categoryQuotas }) => {
  const { data, error } = await supabase.rpc("create_combo", {
    p_name: name,
    p_description: description,
    p_price: price,
    p_is_active: isActive,
    p_category_quotas: categoryQuotas
  });
  return { success: data?.success, error: data?.message || error };
}
```

**Database RPC**: `public.create_combo()`

**Table Modified**: `public.combos`

**Usage**: `ComboManagement.jsx` → Create combo form

---

#### **Method: `updateCombo()` (Admin)**
```javascript
updateCombo: async (comboId, { name, description, price, isActive, categoryQuotas }) => {
  const { data, error } = await supabase.rpc("update_combo", {
    p_combo_id: comboId,
    p_name: name,
    p_description: description,
    p_price: price,
    p_is_active: isActive,
    p_category_quotas: categoryQuotas
  });
  return { success: data?.success, error: data?.message };
}
```

**Database RPC**: `public.update_combo()`

**Table Modified**: `public.combos`

---

#### **Method: `deleteCombo()` (Admin)**
```javascript
deleteCombo: async (comboId) => {
  const { data, error } = await supabase.rpc("delete_combo", {
    p_combo_id: comboId
  });
  return { success: data?.success, error: data?.message };
}
```

**Database RPC**: `public.delete_combo()`

**Safety**: Prevents deletion if combo has paid purchases

---

#### **Method: `toggleComboStatus()` (Admin)**
```javascript
toggleComboStatus: async (comboId) => {
  const { data, error } = await supabase.rpc("toggle_combo_status", {
    p_combo_id: comboId
  });
  return { success: data?.success, isActive: data?.is_active };
}
```

**Database RPC**: `public.toggle_combo_status()`

---

#### **Method: `purchaseCombo()` (Student) - TO BE UPDATED**

**Current Implementation** (needs update):
```javascript
purchaseCombo: async (userId, comboId, selectedEventIds) => {
  // Current: Direct insert
  const { data, error } = await supabase
    .from("combo_purchases")
    .insert({ user_id: userId, combo_id: comboId, ... });
}
```

**Recommended Implementation**:
```javascript
purchaseCombo: async (userId, comboId, selectedEventIds) => {
  // Step 1: Create purchase record
  const { data, error } = await supabase.rpc("create_combo_purchase", {
    p_combo_id: comboId,
    p_user_id: userId,
    p_selected_event_ids: selectedEventIds
  });
  
  if (!data?.success) {
    return { success: false, error: data?.message };
  }

  // Step 2: Initiate payment gateway
  const paymentResult = await initiatePayment({
    amount: data.amount,
    purchaseId: data.purchase_id,
    userId: userId
  });

  return {
    success: true,
    purchaseId: data.purchase_id,
    paymentOrderId: paymentResult.orderId
  };
}
```

**Database RPC**: `public.create_combo_purchase()`

**Tables Modified**:
- `public.combo_purchases` (INSERT with status='PENDING')

---

#### **Method: `completeComboPayment()` - NEW METHOD TO ADD**

```javascript
// Add this to comboService.js
completeComboPayment: async (purchaseId, transactionId) => {
  const { data, error } = await supabase.rpc("complete_combo_payment", {
    p_combo_purchase_id: purchaseId,
    p_transaction_id: transactionId
  });

  if (error || !data?.success) {
    return { 
      success: false, 
      error: data?.message || error?.message 
    };
  }

  return {
    success: true,
    registrationIds: data.registration_ids,
    eventCount: data.event_count
  };
}
```

**Database RPC**: `public.complete_combo_payment()`

**What it does**:
1. Updates `combo_purchases.payment_status = 'PAID'`
2. Calls `explode_combo_purchase()` internally
3. Creates individual `event_registrations_config` records
4. Sends notification

**Tables Modified**:
- `public.combo_purchases` (UPDATE payment status)
- `public.event_registrations_config` (INSERT multiple)
- `public.combo_event_selections` (INSERT multiple)
- `public.notification_queue` (INSERT)

---

#### **Method: `validateComboSelection()` - NEW METHOD TO ADD**

```javascript
// Add this to comboService.js
validateComboSelection: async (comboId, selectedEventIds) => {
  const { data, error } = await supabase.rpc("validate_combo_selection", {
    p_combo_id: comboId,
    p_selected_event_ids: selectedEventIds
  });

  return {
    valid: data?.valid || false,
    categoryBreakdown: data?.category_breakdown || {},
    errors: data?.errors || []
  };
}
```

**Database RPC**: `public.validate_combo_selection()`

**Use Cases**:
- Real-time validation in `RegistrationForm.jsx` as user selects events
- Pre-submission validation before payment
- Admin validation when creating combos

---

#### **Method: `getUserComboPurchases()` - NEW METHOD TO ADD**

```javascript
// Add this to comboService.js
getUserComboPurchases: async (userId) => {
  const { data, error } = await supabase.rpc("get_user_combo_purchases", {
    p_user_id: userId
  });

  return {
    success: !error,
    data: data || [],
    error: error?.message
  };
}
```

**Database RPC**: `public.get_user_combo_purchases()`

**Returns**:
```typescript
interface UserComboPurchase {
  purchase_id: UUID;
  combo_id: UUID;
  combo_name: string;
  combo_description: string;
  combo_price: number;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_amount: number;
  transaction_id: string;
  selected_events: UUID[];
  explosion_completed: boolean;
  individual_registration_ids: UUID[];
  purchased_at: timestamp;
  event_details: Array<{
    event_id: UUID;
    event_name: string;
    category: string;
    price: number;
  }>;
}
```

**Usage**:
- User dashboard showing purchase history
- Admin panel for support queries

---

### 2. `eventConfigService.js` → Database Integration

#### File: `Frontend/src/services/eventConfigService.js`

#### **Method: `getEventsWithStats()`**
```javascript
getEventsWithStats: async () => {
  const { data, error } = await supabase
    .from("events_config")
    .select(`
      *,
      registrations:event_registrations_config(count)
    `)
    .eq("is_open", true);

  return {
    success: !error,
    data: data?.map(event => ({
      ...event,
      current_registrations: event.registrations?.[0]?.count || 0
    }))
  };
}
```

**Database Table**: `public.events_config`

**Joins**: `public.event_registrations_config` (for count)

**Usage**:
- `RegistrationForm.jsx` → Load available events
- `EventCard.jsx` → Display capacity

---

#### **Method: `registerForEvent()`**
```javascript
registerForEvent: async (userId, eventId, teamData = null) => {
  const { data, error } = await supabase
    .from("event_registrations_config")
    .insert({
      user_id: userId,
      event_id: eventId,
      team_name: teamData?.teamName,
      team_members: teamData?.members,
      payment_status: 'PENDING',
      payment_amount: eventPrice
    })
    .select()
    .single();

  return { success: !error, data, error };
}
```

**Database Table**: `public.event_registrations_config` (INSERT)

**Usage**: Direct individual event registration

---

#### **Method: `getUserRegistrations()`**
```javascript
getUserRegistrations: async (userId) => {
  const { data, error } = await supabase
    .from("event_registrations_config")
    .select(`
      *,
      event:events_config(*)
    `)
    .eq("user_id", userId)
    .eq("payment_status", "PAID");

  return { success: !error, data: data || [] };
}
```

**Database Tables**:
- `public.event_registrations_config`
- `public.events_config` (joined)

**Usage**: User dashboard, QR code generation

---

### 3. Payment Gateway Integration

#### **New Service: `paymentService.js` (TO BE CREATED)**

```javascript
// Frontend/src/services/paymentService.js

import { supabase } from '../supabase';

const paymentService = {
  // Create payment transaction record
  createPaymentTransaction: async ({
    userId,
    transactionType, // 'EVENT' | 'COMBO' | 'ACCOMMODATION' | 'LUNCH'
    referenceId, // Purchase ID or Registration ID
    amount,
    currency = 'INR'
  }) => {
    const { data, error } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: userId,
        transaction_type: transactionType,
        reference_id: referenceId,
        amount: amount,
        currency: currency,
        payment_status: 'INITIATED'
      })
      .select()
      .single();

    return { success: !error, data, error };
  },

  // Update payment status after gateway callback
  updatePaymentStatus: async (transactionId, status, gatewayData) => {
    const { data, error } = await supabase
      .from("payment_transactions")
      .update({
        payment_status: status,
        gateway_transaction_id: gatewayData.transactionId,
        gateway_order_id: gatewayData.orderId,
        payment_method: gatewayData.method,
        metadata: gatewayData.metadata,
        updated_at: new Date()
      })
      .eq("id", transactionId)
      .select()
      .single();

    return { success: !error, data, error };
  },

  // Get user's payment history
  getUserPaymentHistory: async (userId) => {
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { success: !error, data: data || [], error };
  }
};

export default paymentService;
```

**Database Table**: `public.payment_transactions`

---

### 4. Notification Service

#### **New Service: `notificationService.js` (TO BE CREATED)**

```javascript
// Frontend/src/services/notificationService.js

import { supabase } from '../supabase';

const notificationService = {
  // Get user's unread notifications
  getUnreadNotifications: async (userId) => {
    const { data, error } = await supabase
      .from("notification_queue")
      .select("*")
      .eq("user_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    return { success: !error, data: data || [], error };
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const { data, error } = await supabase
      .from("notification_queue")
      .update({
        is_read: true,
        read_at: new Date()
      })
      .eq("id", notificationId);

    return { success: !error, error };
  },

  // Mark all as read
  markAllAsRead: async (userId) => {
    const { data, error } = await supabase
      .from("notification_queue")
      .update({
        is_read: true,
        read_at: new Date()
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    return { success: !error, error };
  },

  // Subscribe to real-time notifications
  subscribeToNotifications: (userId, callback) => {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_queue',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
};

export default notificationService;
```

**Database Table**: `public.notification_queue`

---

## Component-Database Mappings

### 1. `RegistrationForm.jsx`

**Path**: `Frontend/src/Pages/Register/Components/RegistrationForm.jsx`

#### **State to Database Mapping**

```javascript
// Frontend State
const [registrationMode, setRegistrationMode] = useState(""); // 'individual' | 'combo'
const [selectedCombo, setSelectedCombo] = useState(null);
const [selectedEvents, setSelectedEvents] = useState([]);

// Step 1: User selects mode
setRegistrationMode('combo');

// Step 2: User selects combo
setSelectedCombo(combo); // From combos state (loaded via comboService.getCombosWithDetails())

// Step 3: User selects events matching category quotas
setSelectedEvents([eventId1, eventId2, ...]); // Must match combo.category_quotas

// Step 4: Submit
handleSubmit = async () => {
  // Validate selection
  const validation = await comboService.validateComboSelection(
    selectedCombo.combo_id,
    selectedEvents
  );

  if (!validation.valid) {
    alert(validation.errors.join('\n'));
    return;
  }

  // Create purchase
  const purchase = await comboService.purchaseCombo(
    user.id,
    selectedCombo.combo_id,
    selectedEvents
  );

  // Redirect to payment gateway
  initiatePayment(purchase.purchaseId, purchase.amount);
}
```

#### **Database Flow**

1. **Load Combos**: `comboService.getCombosWithDetails()` → `public.combos` (SELECT)
2. **Load Events**: `eventConfigService.getEventsWithStats()` → `public.events_config` (SELECT)
3. **Validate Selection**: `comboService.validateComboSelection()` → `validate_combo_selection()` RPC
4. **Create Purchase**: `comboService.purchaseCombo()` → `create_combo_purchase()` RPC → `public.combo_purchases` (INSERT with status='PENDING')
5. **Payment Complete**: Payment gateway callback → `comboService.completeComboPayment()` → `complete_combo_payment()` RPC
6. **Explosion**: `complete_combo_payment()` internally calls `explode_combo_purchase()` → Creates:
   - `public.event_registrations_config` records (multiple INSERTs)
   - `public.combo_event_selections` records (audit trail)
   - `public.notification_queue` record

---

### 2. `ComboCard.jsx`

**Path**: `Frontend/src/Pages/Register/Components/ComboCard.jsx`

#### **Props to Database Mapping**

```javascript
const ComboCard = ({ combo, onSelect, isSelected, userPurchasedCombos }) => {
  // combo comes from comboService.getCombosWithDetails()
  // Maps to: public.combos table

  const isPurchased = userPurchasedCombos.includes(combo.combo_id);
  // userPurchasedCombos comes from comboService.getUserComboPurchases()
  // Maps to: public.combo_purchases WHERE user_id = current_user

  const isAvailable = combo.is_active && !isPurchased;
  // is_active from: public.combos.is_active column
}
```

#### **Displayed Data Sources**

| UI Element | Database Source |
|-----------|----------------|
| `combo.combo_name` | `public.combos.name` |
| `combo.combo_description` | `public.combos.description` |
| `combo.price` | `public.combos.price` |
| `combo.category_quotas` | `public.combos.category_quotas` (JSONB) |
| `combo.total_purchases` | Aggregated from `public.combo_purchases` WHERE `payment_status='PAID'` |
| `combo.is_active` | `public.combos.is_active` |

---

### 3. `ComboManagement.jsx` (Admin)

**Path**: `Frontend/src/Pages/Admin/SuperAdmin/ComboManagement.jsx`

#### **CRUD Operations Mapping**

| Action | Frontend Method | Database RPC | Tables Affected |
|--------|----------------|--------------|----------------|
| **Load Combos** | `comboService.getCombosWithDetails()` | `get_combos_with_details()` | `public.combos` (SELECT) |
| **Create Combo** | `comboService.createCombo()` | `create_combo()` | `public.combos` (INSERT) |
| **Edit Combo** | `comboService.updateCombo()` | `update_combo()` | `public.combos` (UPDATE) |
| **Delete Combo** | `comboService.deleteCombo()` | `delete_combo()` | `public.combos` (DELETE) |
| **Toggle Status** | `comboService.toggleComboStatus()` | `toggle_combo_status()` | `public.combos` (UPDATE is_active) |

#### **Admin Stats Dashboard**

```javascript
// Frontend calculations
const totalCombos = combos.length;
const activeCombos = combos.filter(c => c.is_active).length;
const totalPurchases = combos.reduce((sum, c) => sum + c.total_purchases, 0);

// Data sources
// combos: from get_combos_with_details() RPC
// c.total_purchases: Aggregated from combo_purchases table
```

---

### 4. `EventCard.jsx`

**Path**: `Frontend/src/Pages/Register/Components/EventCard.jsx`

#### **Props to Database Mapping**

```javascript
const EventCard = ({ event, onSelect, isSelected, userRegisteredEvents }) => {
  // event comes from eventConfigService.getEventsWithStats()
  // Maps to: public.events_config table

  const isRegistered = userRegisteredEvents.includes(event.id);
  // userRegisteredEvents from: event_registrations_config WHERE user_id = current_user

  const isFull = event.current_registrations >= event.capacity;
  // current_registrations: COUNT from event_registrations_config
  // capacity: events_config.capacity column
}
```

#### **Displayed Data Sources**

| UI Element | Database Source |
|-----------|----------------|
| `event.name` | `public.events_config.name` |
| `event.description` | `public.events_config.description` |
| `event.price` | `public.events_config.price` |
| `event.category` | `public.events_config.category` |
| `event.type` | `public.events_config.type` ('SOLO' or 'TEAM') |
| `event.capacity` | `public.events_config.capacity` |
| `event.current_registrations` | `COUNT(*) FROM event_registrations_config WHERE event_id = event.id AND payment_status='PAID'` |
| `event.is_open` | `public.events_config.is_open` |

---

## Data Flow Diagrams

### Combo Purchase Flow (Complete)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Browse Combos                                               │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend: RegistrationForm.jsx                                      │
│ Service: comboService.getCombosWithDetails()                        │
│ RPC: get_combos_with_details()                                      │
│ Table: public.combos (SELECT)                                       │
│ Output: List of available combos with quotas                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Select Combo                                                │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend: User clicks ComboCard                                     │
│ State: setSelectedCombo(combo)                                      │
│ State: setRegistrationMode('combo')                                 │
│ State: setCurrentStep(3) - Move to event selection                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Load Available Events                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend: RegistrationForm.jsx                                      │
│ Service: eventConfigService.getEventsWithStats()                    │
│ Table: public.events_config (SELECT)                                │
│ Output: List of open events with capacity info                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: Select Events (Match Category Quotas)                       │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend: User selects events via EventCard components              │
│ State: setSelectedEvents([...eventIds])                             │
│ Validation: Real-time check against combo.category_quotas           │
│ Service: comboService.validateComboSelection() (optional real-time) │
│ RPC: validate_combo_selection()                                     │
│ Output: validation.valid = true/false                               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: Submit - Create Purchase                                    │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend: User clicks "Proceed to Payment"                          │
│ Service: comboService.purchaseCombo()                               │
│ RPC: create_combo_purchase()                                        │
│ Validation: Final validation of event selection                     │
│ Table: public.combo_purchases (INSERT)                              │
│   - combo_id: selected combo                                        │
│   - user_id: current user                                           │
│   - payment_status: 'PENDING'                                       │
│   - payment_amount: combo.price                                     │
│   - selected_event_ids: [eventId1, eventId2, ...]                   │
│ Output: purchase_id, amount                                         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 6: Payment Gateway Integration                                 │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend: Redirect to Razorpay/PayTM/Stripe                         │
│ Service: paymentService.createPaymentTransaction()                  │
│ Table: public.payment_transactions (INSERT)                         │
│   - user_id: current user                                           │
│   - transaction_type: 'COMBO'                                       │
│   - reference_id: purchase_id                                       │
│   - payment_status: 'INITIATED'                                     │
│ Payment Gateway: User completes payment                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 7: Payment Callback (Success)                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Backend: Webhook receives payment confirmation                      │
│ Service: paymentService.updatePaymentStatus()                       │
│ Table: public.payment_transactions (UPDATE)                         │
│   - payment_status: 'PAID'                                          │
│   - gateway_transaction_id: provided by gateway                     │
│ Service: comboService.completeComboPayment()                        │
│ RPC: complete_combo_payment()                                       │
│ Table: public.combo_purchases (UPDATE)                              │
│   - payment_status: 'PAID'                                          │
│   - transaction_id: gateway transaction ID                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 8: Explosion Process (Automatic)                               │
├─────────────────────────────────────────────────────────────────────┤
│ RPC: explode_combo_purchase() (called by complete_combo_payment)    │
│                                                                      │
│ FOR EACH selected event:                                            │
│   - Check event capacity                                            │
│   - Check if user already registered                                │
│   - INSERT INTO event_registrations_config                          │
│       ├─ event_id: current event                                    │
│       ├─ user_id: purchaser                                         │
│       ├─ payment_status: 'PAID' (already paid via combo)            │
│       ├─ payment_amount: 0 (included in combo)                      │
│       ├─ combo_purchase_id: parent purchase ID                      │
│       └─ transaction_id: combo transaction ID                       │
│   - INSERT INTO combo_event_selections (audit trail)                │
│       ├─ combo_purchase_id: parent purchase                         │
│       ├─ event_id: current event                                    │
│       └─ category: event category                                   │
│   - Store registration_id in array                                  │
│                                                                      │
│ UPDATE combo_purchases:                                             │
│   - explosion_completed: TRUE                                       │
│   - individual_registration_ids: [reg1, reg2, ...]                  │
│                                                                      │
│ INSERT INTO notification_queue:                                     │
│   - notification_type: 'COMBO'                                      │
│   - title: 'Combo Registration Complete'                            │
│   - message: 'Registered for X events'                              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 9: Success Confirmation                                        │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend: Payment gateway redirects back to app                     │
│ Service: comboService.getUserComboPurchases()                       │
│ RPC: get_user_combo_purchases()                                     │
│ Display: Success message with list of registered events             │
│ Display: QR codes for each event                                    │
│ Notification: Bell icon shows new notification                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Individual Event Registration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ Browse Events → Select Event → Fill Team Details (if TEAM event)    │
│ → Submit → Payment → Success                                        │
├─────────────────────────────────────────────────────────────────────┤
│ Tables: events_config → event_registrations_config                  │
│ No combo explosion needed                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Implementation Examples

### Example 1: Complete Combo Purchase (Frontend)

```javascript
// Frontend/src/Pages/Register/Components/RegistrationForm.jsx

const handleComboPurchase = async () => {
  try {
    setIsSubmitting(true);

    // Step 1: Validate selection
    const validation = await comboService.validateComboSelection(
      selectedCombo.combo_id,
      selectedEvents
    );

    if (!validation.valid) {
      toast.error(`Invalid selection: ${validation.errors.join(', ')}`);
      return;
    }

    // Step 2: Create purchase record
    const purchaseResult = await comboService.purchaseCombo(
      user.id,
      selectedCombo.combo_id,
      selectedEvents
    );

    if (!purchaseResult.success) {
      toast.error(purchaseResult.error);
      return;
    }

    // Step 3: Initiate payment
    const paymentOrder = await initiateRazorpayPayment({
      amount: purchaseResult.amount,
      purchaseId: purchaseResult.purchaseId,
      currency: 'INR'
    });

    // Step 4: Open Razorpay payment modal
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY,
      amount: paymentOrder.amount,
      currency: 'INR',
      name: 'DaKshaa T26',
      description: `Combo: ${selectedCombo.combo_name}`,
      order_id: paymentOrder.orderId,
      handler: async (response) => {
        // Step 5: Payment successful - complete purchase
        const completeResult = await comboService.completeComboPayment(
          purchaseResult.purchaseId,
          response.razorpay_payment_id
        );

        if (completeResult.success) {
          toast.success(`Successfully registered for ${completeResult.eventCount} events!`);
          navigate('/dashboard', { 
            state: { registrationSuccess: true } 
          });
        } else {
          toast.error(completeResult.error);
        }
      },
      prefill: {
        name: userProfile.full_name,
        email: userProfile.email,
        contact: userProfile.mobile_number
      },
      theme: {
        color: '#06b6d4' // secondary color
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();

  } catch (error) {
    console.error('Purchase error:', error);
    toast.error('Purchase failed. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

### Example 2: Real-time Event Selection Validation

```javascript
// Frontend/src/Pages/Register/Components/RegistrationForm.jsx

const handleEventToggle = async (eventId) => {
  const newSelection = selectedEvents.includes(eventId)
    ? selectedEvents.filter(id => id !== eventId)
    : [...selectedEvents, eventId];

  setSelectedEvents(newSelection);

  // Real-time validation
  if (selectedCombo && newSelection.length > 0) {
    const validation = await comboService.validateComboSelection(
      selectedCombo.combo_id,
      newSelection
    );

    setValidationStatus(validation);

    // Show visual feedback
    if (validation.valid) {
      setValidationMessage('✓ Selection complete and valid!');
    } else {
      setValidationMessage(
        `Selection incomplete: ${validation.errors.join(', ')}`
      );
    }
  }
};
```

---

### Example 3: User Dashboard - Show Purchases

```javascript
// Frontend/src/Pages/Dashboard/UserDashboard.jsx

import comboService from '../../services/comboService';
import eventConfigService from '../../services/eventConfigService';

const UserDashboard = () => {
  const [comboPurchases, setComboPurchases] = useState([]);
  const [eventRegistrations, setEventRegistrations] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      // Load combo purchases
      const combos = await comboService.getUserComboPurchases(user.id);
      setComboPurchases(combos.data);

      // Load individual event registrations
      const events = await eventConfigService.getUserRegistrations(user.id);
      setEventRegistrations(events.data);
    };

    loadUserData();
  }, [user.id]);

  return (
    <div>
      {/* Combo Purchases Section */}
      <section>
        <h2>Combo Packages</h2>
        {comboPurchases.map(purchase => (
          <div key={purchase.purchase_id}>
            <h3>{purchase.combo_name}</h3>
            <p>Price: ₹{purchase.combo_price}</p>
            <p>Status: {purchase.payment_status}</p>
            <p>Purchased: {new Date(purchase.purchased_at).toLocaleDateString()}</p>
            
            {/* Show selected events */}
            <div>
              <h4>Events in this combo:</h4>
              {purchase.event_details?.map(event => (
                <div key={event.event_id}>
                  <span>{event.event_name}</span>
                  <span>{event.category}</span>
                  {/* Show QR code for each event */}
                  <QRCodeGenerator 
                    registrationId={
                      purchase.individual_registration_ids?.find(
                        id => /* match by event_id */
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Individual Registrations Section */}
      <section>
        <h2>Individual Event Registrations</h2>
        {eventRegistrations.map(reg => (
          <div key={reg.id}>
            <h3>{reg.event.name}</h3>
            <p>Price: ₹{reg.payment_amount}</p>
            <QRCodeGenerator registrationId={reg.id} />
          </div>
        ))}
      </section>
    </div>
  );
};
```

---

## Error Handling Guidelines

### 1. Validation Errors

```javascript
// In RegistrationForm.jsx
try {
  const validation = await comboService.validateComboSelection(
    selectedCombo.combo_id,
    selectedEvents
  );

  if (!validation.valid) {
    // Show user-friendly error messages
    validation.errors.forEach(error => {
      toast.error(error, { duration: 5000 });
    });
    return;
  }
} catch (error) {
  toast.error('Validation failed. Please try again.');
  console.error(error);
}
```

### 2. Payment Errors

```javascript
// Handle payment failures
handler: async (response) => {
  try {
    const result = await comboService.completeComboPayment(
      purchaseId,
      response.razorpay_payment_id
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    toast.success('Payment successful!');
  } catch (error) {
    toast.error('Payment processing failed. Contact support.');
    
    // Log for admin review
    console.error('Payment completion error:', error);
    
    // Optionally, update payment_transactions table with failure
    await paymentService.updatePaymentStatus(
      transactionId,
      'FAILED',
      { error: error.message }
    );
  }
}
```

### 3. Capacity Errors

```javascript
// In explode_combo_purchase RPC function
IF v_current_registrations >= v_event.capacity THEN
    -- Capacity exceeded, prevent registration
    RAISE EXCEPTION 'Event % is at full capacity', v_event.name;
END IF;

// Frontend handling
try {
  const result = await comboService.completeComboPayment(purchaseId, txnId);
} catch (error) {
  if (error.message.includes('full capacity')) {
    toast.error('One or more events are full. Refund will be processed.');
    // Initiate refund process
  }
}
```

### 4. Duplicate Registration Prevention

```javascript
// In explode_combo_purchase RPC function
IF EXISTS (
    SELECT 1 FROM public.event_registrations_config
    WHERE user_id = v_combo_purchase.user_id 
    AND event_id = v_event_id
) THEN
    RAISE EXCEPTION 'Already registered for event: %', v_event.name;
END IF;

// Frontend should prevent this earlier, but backend validates
```

---

## Testing Checklist

### Frontend Testing

- [ ] Combo selection UI renders correctly
- [ ] Event selection matches quota constraints
- [ ] Real-time validation provides feedback
- [ ] Payment modal opens correctly
- [ ] Payment success redirects to dashboard
- [ ] Dashboard shows combo purchases with events
- [ ] QR codes generate for each event registration

### Integration Testing

- [ ] Create combo → Purchase combo → Complete payment → Verify registrations
- [ ] Select invalid events → Validation fails gracefully
- [ ] Attempt duplicate purchase → Prevented
- [ ] Event at capacity → User notified, purchase fails
- [ ] Payment failure → Combo purchase remains in PENDING, retryable

### Database Testing

- [ ] `validate_combo_selection()` returns correct validation
- [ ] `create_combo_purchase()` creates PENDING record
- [ ] `complete_combo_payment()` updates status and calls explosion
- [ ] `explode_combo_purchase()` creates all registrations atomically
- [ ] RLS policies prevent unauthorized access
- [ ] Indexes improve query performance

---

## Summary

This guide provides complete mappings between:
- **Frontend services** ↔ **Database RPC functions**
- **React components** ↔ **Database tables**
- **UI state** ↔ **Database records**

**Key Implementation Steps**:
1. ✅ Deploy `complete_combo_schema.sql` to add missing tables and functions
2. ✅ Update `comboService.js` with new methods (`validateComboSelection`, `completeComboPayment`, etc.)
3. ✅ Create `paymentService.js` for payment transaction management
4. ✅ Create `notificationService.js` for user notifications
5. ✅ Update `RegistrationForm.jsx` to use complete flow
6. ✅ Test end-to-end combo purchase flow
7. ✅ Integrate payment gateway (Razorpay/PayTM)
8. ✅ Add error handling and user feedback

**Next Actions**:
1. Run `complete_combo_schema.sql` in Supabase SQL Editor
2. Test RPC functions manually in SQL Editor
3. Update frontend services one by one
4. Test integration with sample combos and events
5. Deploy to production

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-03  
**Author**: GitHub Copilot  
**Status**: Ready for Implementation
