# DaKshaa Combo Offer System - Complete Database Analysis

## Executive Summary
The DaKshaa event management system uses a **Category-Based Quota System** for combo packages where students select events from different categories to complete their combo purchase. This document provides a comprehensive analysis of the database schema, frontend architecture, and their integration.

---

## 1. Current Database Schema Analysis

### 1.1 Core Tables

#### **Table: `combos`**
Primary table for defining combo packages.

```sql
CREATE TABLE IF NOT EXISTS public.combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    category_quotas JSONB DEFAULT '{}'::jsonb,
    total_events_required INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);
```

**Purpose**: Stores combo package definitions with category-based selection rules.

**Key Fields**:
- `category_quotas`: JSONB format `{"Technical": 2, "Workshop": 3, "Sports": 1}` - defines how many events from each category a student must select
- `total_events_required`: Auto-calculated total number of events (sum of all quotas)
- `price`: Discounted bundle price

**Example Data**:
```json
{
  "name": "Tech Master Pass",
  "description": "Perfect for tech enthusiasts",
  "price": 999,
  "category_quotas": {
    "Technical": 3,
    "Workshop": 2,
    "Sports": 1
  },
  "total_events_required": 6
}
```

---

#### **Table: `combo_purchases`**
Tracks combo purchase transactions and explosion status.

```sql
CREATE TABLE IF NOT EXISTS public.combo_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES public.combos(id),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_amount INTEGER NOT NULL,
    transaction_id TEXT,
    selected_event_ids JSONB DEFAULT '[]'::jsonb,
    explosion_completed BOOLEAN DEFAULT FALSE,
    individual_registration_ids JSONB DEFAULT '[]'::jsonb,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, combo_id)
);
```

**Purpose**: Stores student combo purchases and tracks the "explosion" process (converting combo into individual event registrations).

**Key Fields**:
- `selected_event_ids`: Array of event IDs the student selected (matching category quotas)
- `explosion_completed`: Boolean flag indicating if individual registrations were created
- `individual_registration_ids`: Array of created registration UUIDs after explosion

**Workflow**:
1. Student selects combo → Record created with `payment_status='PENDING'`
2. Payment successful → `payment_status='PAID'`
3. Explosion process runs → Creates individual event registrations
4. `explosion_completed=TRUE` and `individual_registration_ids` populated

---

#### **Table: `events_config`**
Main events table (modern schema, replaces old `events` table).

```sql
CREATE TABLE IF NOT EXISTS public.events_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Technical' CHECK (category IN ('Technical', 'Non-Technical', 'Workshop', 'Conference', 'Cultural', 'Sports', 'Gaming', 'Other', 'Special')),
    price INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('SOLO', 'TEAM')),
    capacity INTEGER NOT NULL DEFAULT 100,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);
```

**Purpose**: Defines all events available for registration.

**Key Fields**:
- `event_key`: Human-readable identifier (e.g., 'coding-challenge')
- `category`: Used for combo quota validation
- `type`: SOLO or TEAM event
- `capacity`: Maximum registrations allowed
- `is_open`: Controls event availability

---

#### **Table: `event_registrations_config`**
Individual event registrations (modern schema).

```sql
CREATE TABLE IF NOT EXISTS public.event_registrations_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events_config(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_name TEXT,
    team_members JSONB,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_amount INTEGER,
    transaction_id TEXT,
    combo_purchase_id UUID REFERENCES public.combo_purchases(id),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);
```

**Purpose**: Stores individual event registrations (created directly or via combo explosion).

**Key Fields**:
- `combo_purchase_id`: Links back to parent combo purchase (if created via explosion)
- `payment_status`: Can be 'PAID' immediately if from combo
- `team_members`: JSONB array for team events

**Important**: This table receives records from both:
1. Direct individual event registrations
2. Combo explosion process

---

### 1.2 Legacy/Archive Tables

#### **Table: `events` (LEGACY)**
Older schema using TEXT primary keys. Status: **Being phased out**.

```sql
CREATE TABLE IF NOT EXISTS events (
    event_id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    price DECIMAL NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Table: `registrations` (LEGACY)**
Old registration table. Status: **Being phased out**.

```sql
CREATE TABLE IF NOT EXISTS registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES events(event_id),
    combo_id TEXT REFERENCES combos(combo_id),
    payment_status TEXT DEFAULT 'pending',
    payment_id TEXT,
    qr_code_string TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Migration Note**: Frontend is transitioning from `events`/`registrations` to `events_config`/`event_registrations_config`.

---

## 2. Database Functions (RPC)

### 2.1 Combo Management Functions

#### **Function: `create_combo`**
Creates new combo with category quotas.

```sql
CREATE OR REPLACE FUNCTION public.create_combo(
    p_name TEXT,
    p_description TEXT,
    p_price INTEGER,
    p_is_active BOOLEAN,
    p_category_quotas JSONB
)
RETURNS JSON
```

**Validation**:
- Price must be > 0
- Category quotas must be valid JSONB
- Total events must be >= 2

**Returns**:
```json
{
  "success": true,
  "message": "Combo created successfully",
  "combo_id": "uuid",
  "total_events_required": 6
}
```

---

#### **Function: `update_combo`**
Updates existing combo.

```sql
CREATE OR REPLACE FUNCTION public.update_combo(
    p_combo_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_price INTEGER,
    p_is_active BOOLEAN,
    p_category_quotas JSONB
)
RETURNS JSON
```

**Prevents**: Reducing total events if combo has existing purchases.

---

#### **Function: `delete_combo`**
Safely deletes combo (only if no paid purchases).

```sql
CREATE OR REPLACE FUNCTION public.delete_combo(p_combo_id UUID)
RETURNS JSON
```

**Safety Check**: Blocks deletion if combo has paid purchases.

---

#### **Function: `toggle_combo_status`**
Toggles combo active/inactive status.

```sql
CREATE OR REPLACE FUNCTION public.toggle_combo_status(p_combo_id UUID)
RETURNS JSON
```

---

#### **Function: `get_combos_with_details`**
Retrieves all combos with purchase statistics.

```sql
CREATE OR REPLACE FUNCTION public.get_combos_with_details()
RETURNS TABLE (
    combo_id UUID,
    combo_name TEXT,
    description TEXT,
    price INTEGER,
    is_active BOOLEAN,
    category_quotas JSONB,
    total_events_required INTEGER,
    purchase_count BIGINT
)
```

---

### 2.2 Missing Functions (TO BE IMPLEMENTED)

#### **Function: `explode_combo_purchase` (CRITICAL)**
Converts combo purchase into individual event registrations.

**Expected Signature**:
```sql
CREATE OR REPLACE FUNCTION public.explode_combo_purchase(
    p_combo_purchase_id UUID,
    p_selected_event_ids JSONB
)
RETURNS JSON
```

**Logic**:
1. Validate event selection matches category quotas
2. Check event capacity and availability
3. Create individual registrations in `event_registrations_config`
4. Set `payment_status='PAID'` (already paid via combo)
5. Update `combo_purchases.explosion_completed=TRUE`
6. Store created registration IDs in `individual_registration_ids`

**Returns**:
```json
{
  "success": true,
  "message": "Registered for 6 events",
  "registration_ids": ["uuid1", "uuid2", ...]
}
```

---

#### **Function: `validate_combo_selection` (RECOMMENDED)**
Validates if selected events match combo category quotas.

**Expected Signature**:
```sql
CREATE OR REPLACE FUNCTION public.validate_combo_selection(
    p_combo_id UUID,
    p_selected_event_ids JSONB
)
RETURNS JSON
```

**Validation Checks**:
1. All event IDs exist and are open
2. Event categories match combo quotas exactly
3. No duplicate events
4. User hasn't already registered for these events

**Returns**:
```json
{
  "valid": true,
  "category_breakdown": {
    "Technical": 3,
    "Workshop": 2,
    "Sports": 1
  },
  "errors": []
}
```

---

#### **Function: `get_user_combo_purchases` (RECOMMENDED)**
Gets user's combo purchase history.

```sql
CREATE OR REPLACE FUNCTION public.get_user_combo_purchases(p_user_id UUID)
RETURNS TABLE (
    purchase_id UUID,
    combo_name TEXT,
    payment_status TEXT,
    selected_events JSONB,
    explosion_completed BOOLEAN,
    purchased_at TIMESTAMPTZ
)
```

---

## 3. Frontend Architecture Analysis

### 3.1 Key Components

#### **Component: `ComboCard.jsx`**
**Path**: `Frontend/src/Pages/Register/Components/ComboCard.jsx`

**Purpose**: Displays combo package cards with pricing, discounts, and category quotas.

**Key Features**:
- Shows discount percentage
- Displays category quotas (e.g., "2 Technical, 3 Workshop")
- Shows purchase count
- Handles purchased/unavailable states

**Props**:
```javascript
{
  combo: {
    combo_id: UUID,
    combo_name: string,
    combo_description: string,
    price: number,
    category_quotas: object,
    is_active: boolean,
    events: array, // For display purposes
    total_purchases: number
  },
  onSelect: function,
  isSelected: boolean,
  userPurchasedCombos: array
}
```

---

#### **Component: `RegistrationForm.jsx`**
**Path**: `Frontend/src/Pages/Register/Components/RegistrationForm.jsx`

**Purpose**: Multi-step registration wizard for events and combos.

**State Management**:
```javascript
{
  currentStep: 1-4,
  registrationMode: 'individual' | 'combo',
  selectedCombo: object | null,
  selectedEvents: array, // Array of event UUIDs
  events: array, // All available events
  combos: array, // All available combos
  user: object,
  userProfile: object
}
```

**Steps**:
1. **Step 1**: Choose registration mode (individual vs combo)
2. **Step 2**: Select combo OR select individual events
3. **Step 3**: For combos - select specific events; For individual - review
4. **Step 4**: Payment and completion

---

#### **Component: `ComboManagement.jsx` (Admin)**
**Path**: `Frontend/src/Pages/Admin/SuperAdmin/ComboManagement.jsx`

**Purpose**: Admin panel for creating and managing combos.

**Features**:
- Create/Edit/Delete combos
- Toggle combo active status
- View purchase statistics
- Set category quotas via form

---

### 3.2 Services

#### **Service: `comboService.js`**
**Path**: `Frontend/src/services/comboService.js`

**Key Methods**:

```javascript
// Get combos with details
getCombosWithDetails: async () => { ... }

// Get active combos for students
getActiveCombosForStudents: async (userId) => { ... }

// Create combo (Admin)
createCombo: async ({
  name,
  description,
  price,
  isActive,
  categoryQuotas
}) => { ... }

// Update combo (Admin)
updateCombo: async (comboId, { ... }) => { ... }

// Delete combo (Admin)
deleteCombo: async (comboId) => { ... }

// Toggle combo status (Admin)
toggleComboStatus: async (comboId) => { ... }

// EXPLOSION FUNCTION (Main student flow)
explodeComboPurchase: async ({
  comboId,
  userId,
  transactionId,
  paymentAmount
}) => {
  // Calls RPC: explode_combo_purchase
  // Creates individual registrations
}

// Purchase combo (Student)
purchaseCombo: async (userId, comboId, selectedEventIds) => { ... }
```

---

#### **Service: `eventConfigService.js`**
**Path**: `Frontend/src/services/eventConfigService.js`

**Key Methods**:

```javascript
// Get events with registration stats
getEventsWithStats: async () => { ... }

// Register for individual event
registerForEvent: async (userId, eventId, teamData) => { ... }

// Check if user registered for event
isUserRegistered: async (userId, eventId) => { ... }

// Get user's registrations
getUserRegistrations: async (userId) => { ... }
```

---

### 3.3 Data Flow

#### **Combo Purchase Flow (Student)**

```
1. Student browses combos
   ↓ [ComboCard.jsx renders combos]
   
2. Student selects combo
   ↓ [RegistrationForm.jsx: Step 2]
   
3. Student selects events matching category quotas
   ↓ [RegistrationForm.jsx: Step 3]
   ↓ [Frontend validates quota matching]
   
4. Student proceeds to payment
   ↓ [Payment Gateway Integration]
   
5. Payment successful → Backend called
   ↓ [comboService.explodeComboPurchase()]
   ↓ [Database RPC: explode_combo_purchase]
   
6. Database creates:
   - combo_purchases record (payment_status='PAID')
   - Individual event_registrations_config records
   - Links via combo_purchase_id
   
7. Frontend shows success
   ↓ [RegistrationForm.jsx: Step 4]
```

---

#### **Individual Event Registration Flow**

```
1. Student browses events
   ↓ [EventCard.jsx renders events]
   
2. Student selects event(s)
   ↓ [RegistrationForm.jsx tracks selection]
   
3. Student proceeds to payment
   ↓ [Payment Gateway]
   
4. Payment successful
   ↓ [eventConfigService.registerForEvent()]
   ↓ [Direct INSERT into event_registrations_config]
   
5. Success confirmation shown
```

---

## 4. Missing Database Tables

### 4.1 CRITICAL Missing Tables

None of the critical tables are missing. However, some columns need to be added:

#### **Missing Column: `combo_purchase_id` in `event_registrations_config`**

```sql
ALTER TABLE public.event_registrations_config
ADD COLUMN IF NOT EXISTS combo_purchase_id UUID REFERENCES public.combo_purchases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_registrations_combo_purchase 
ON public.event_registrations_config(combo_purchase_id);

COMMENT ON COLUMN public.event_registrations_config.combo_purchase_id IS 
'Links to parent combo purchase if this registration was created via combo explosion';
```

---

### 4.2 RECOMMENDED New Tables

#### **Table: `combo_event_selections` (Transaction Log)**
Stores temporary event selections before explosion.

```sql
CREATE TABLE IF NOT EXISTS public.combo_event_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_purchase_id UUID NOT NULL REFERENCES public.combo_purchases(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events_config(id),
    category TEXT NOT NULL,
    selected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(combo_purchase_id, event_id)
);

CREATE INDEX idx_combo_selections_purchase ON public.combo_event_selections(combo_purchase_id);
CREATE INDEX idx_combo_selections_event ON public.combo_event_selections(event_id);

COMMENT ON TABLE public.combo_event_selections IS 
'Tracks student event selections for combo purchases before explosion';
```

**Purpose**: 
- Audit trail of event selections
- Allows partial saves during selection process
- Helps debugging explosion failures

---

#### **Table: `payment_transactions` (Unified Payment Log)**
Centralized payment tracking for all transaction types.

```sql
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('EVENT', 'COMBO', 'ACCOMMODATION', 'LUNCH')),
    reference_id UUID, -- Points to event_registration, combo_purchase, etc.
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_gateway TEXT, -- 'razorpay', 'paytm', etc.
    gateway_transaction_id TEXT,
    gateway_order_id TEXT,
    payment_status TEXT DEFAULT 'INITIATED' CHECK (payment_status IN ('INITIATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_method TEXT, -- 'UPI', 'CARD', 'NET_BANKING', etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(payment_status);
CREATE INDEX idx_payment_transactions_type ON public.payment_transactions(transaction_type);
CREATE INDEX idx_payment_transactions_gateway_id ON public.payment_transactions(gateway_transaction_id);

COMMENT ON TABLE public.payment_transactions IS 
'Unified payment tracking for all transaction types across the platform';
```

**Benefits**:
- Single source of truth for payments
- Easy reconciliation with payment gateway
- Comprehensive payment analytics
- Supports refunds and disputes

---

#### **Table: `notification_queue` (User Notifications)**
Stores system notifications for users.

```sql
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('REGISTRATION', 'PAYMENT', 'COMBO', 'EVENT_UPDATE', 'SYSTEM')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON public.notification_queue(user_id);
CREATE INDEX idx_notifications_unread ON public.notification_queue(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON public.notification_queue(notification_type);

COMMENT ON TABLE public.notification_queue IS 
'Stores in-app notifications for users about registrations, payments, and system updates';
```

**Use Cases**:
- "Your combo purchase was successful!"
- "Registration confirmed for Coding Challenge"
- "Event capacity update"
- "Payment failed - retry"

---

## 5. Frontend-Database Mapping

### 5.1 Component → Database Mapping

| Frontend Component | Database Tables | Database Functions |
|-------------------|----------------|-------------------|
| `ComboCard.jsx` | `combos`, `combo_purchases` | `get_combos_with_details` |
| `ComboManagement.jsx` | `combos`, `combo_purchases` | `create_combo`, `update_combo`, `delete_combo`, `toggle_combo_status` |
| `RegistrationForm.jsx` | `combos`, `events_config`, `event_registrations_config`, `combo_purchases` | `explode_combo_purchase`, `validate_combo_selection` |
| `EventCard.jsx` | `events_config`, `event_registrations_config` | Direct query |
| `UserDashboard.jsx` | `event_registrations_config`, `combo_purchases` | `get_user_combo_purchases` |

---

### 5.2 Service → RPC Function Mapping

| Service Method | RPC Function | Purpose |
|---------------|-------------|---------|
| `comboService.getCombosWithDetails()` | `get_combos_with_details()` | Get all combos with stats |
| `comboService.createCombo()` | `create_combo()` | Admin creates combo |
| `comboService.updateCombo()` | `update_combo()` | Admin updates combo |
| `comboService.deleteCombo()` | `delete_combo()` | Admin deletes combo |
| `comboService.toggleComboStatus()` | `toggle_combo_status()` | Admin toggles status |
| `comboService.explodeComboPurchase()` | `explode_combo_purchase()` | **MISSING - TO BE CREATED** |
| `comboService.validateSelection()` | `validate_combo_selection()` | **MISSING - TO BE CREATED** |
| `comboService.getUserPurchases()` | `get_user_combo_purchases()` | **MISSING - TO BE CREATED** |

---

### 5.3 Frontend State → Database Fields

#### **Combo Selection State**
```javascript
// Frontend State
{
  selectedCombo: {
    combo_id: "uuid",
    category_quotas: {
      "Technical": 2,
      "Workshop": 3
    }
  },
  selectedEvents: ["event-uuid-1", "event-uuid-2", ...]
}

// Maps to Database
INSERT INTO combo_purchases (
  combo_id: selectedCombo.combo_id,
  user_id: currentUser.id,
  selected_event_ids: selectedEvents,
  payment_status: 'PENDING'
)
```

#### **Event Registration State**
```javascript
// Frontend State
{
  event_id: "uuid",
  user_id: "uuid",
  team_name: "Team Awesome",
  team_members: [
    {name: "John", email: "john@x.com"},
    {name: "Jane", email: "jane@x.com"}
  ]
}

// Maps to Database
INSERT INTO event_registrations_config (
  event_id: state.event_id,
  user_id: state.user_id,
  team_name: state.team_name,
  team_members: state.team_members,
  payment_status: 'PENDING'
)
```

---

## 6. Implementation Priorities

### Priority 1: CRITICAL (Immediate)
1. ✅ `combo_purchase_id` column in `event_registrations_config`
2. ❌ `explode_combo_purchase()` RPC function
3. ❌ `validate_combo_selection()` RPC function

### Priority 2: HIGH (Within 1 week)
4. ❌ `get_user_combo_purchases()` RPC function
5. ❌ `combo_event_selections` table (audit trail)
6. ❌ `payment_transactions` table (unified payments)

### Priority 3: MEDIUM (Within 2 weeks)
7. ❌ `notification_queue` table
8. ❌ Update frontend to use new RPC functions
9. ❌ Add payment gateway integration

### Priority 4: LOW (Future Enhancement)
10. Analytics dashboard for combo performance
11. Dynamic combo pricing based on demand
12. Combo recommendation engine

---

## 7. Security Considerations

### 7.1 Row Level Security (RLS)

```sql
-- Combos: Public read, admin write
CREATE POLICY "Anyone can view active combos" ON public.combos
FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Only admins can modify combos" ON public.combos
FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE admin_role IN ('super_admin', 'registration_admin')));

-- Combo Purchases: Users see own purchases only
CREATE POLICY "Users can view own combo purchases" ON public.combo_purchases
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own combo purchases" ON public.combo_purchases
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Event Registrations: Users see own registrations
CREATE POLICY "Users can view own registrations" ON public.event_registrations_config
FOR SELECT USING (auth.uid() = user_id);
```

---

### 7.2 Validation Rules

1. **Combo Creation**: Total events >= 2
2. **Event Selection**: Must match category quotas exactly
3. **Payment**: Must validate amount before explosion
4. **Capacity**: Check event capacity before registration
5. **Duplicate Prevention**: User can't register for same event twice

---

## 8. Testing Checklist

### Unit Tests
- [ ] Combo creation with valid quotas
- [ ] Combo creation with invalid quotas (should fail)
- [ ] Event selection validation
- [ ] Explosion process
- [ ] Payment status transitions

### Integration Tests
- [ ] Complete combo purchase flow (student perspective)
- [ ] Combo management flow (admin perspective)
- [ ] Payment failure handling
- [ ] Capacity overflow handling
- [ ] RLS policy enforcement

### End-to-End Tests
- [ ] Student browses → selects combo → selects events → pays → gets registrations
- [ ] Admin creates combo → student purchases → admin views statistics
- [ ] Multiple students purchase same combo (concurrency)

---

## 9. Performance Optimizations

### Indexes
```sql
-- Already created
CREATE INDEX idx_combos_active ON public.combos(is_active);
CREATE INDEX idx_combo_purchases_user ON public.combo_purchases(user_id);
CREATE INDEX idx_combo_purchases_status ON public.combo_purchases(payment_status);

-- Recommended additions
CREATE INDEX idx_event_registrations_event ON public.event_registrations_config(event_id);
CREATE INDEX idx_event_registrations_user_status ON public.event_registrations_config(user_id, payment_status);
CREATE INDEX idx_events_config_category ON public.events_config(category);
```

### Query Optimization
- Use materialized views for combo statistics
- Cache combo list on frontend (5-minute TTL)
- Batch event availability checks

---

## 10. Migration Path

### Phase 1: Add Missing Components (Week 1)
1. Add `combo_purchase_id` column
2. Create `explode_combo_purchase()` function
3. Create `validate_combo_selection()` function
4. Update frontend to use new functions

### Phase 2: Enhanced Features (Week 2)
5. Add `combo_event_selections` table
6. Add `payment_transactions` table
7. Implement unified payment tracking
8. Add notification system

### Phase 3: Legacy Cleanup (Week 3)
9. Migrate data from `events` → `events_config`
10. Migrate data from `registrations` → `event_registrations_config`
11. Update all frontend queries to use new tables
12. Remove legacy tables

---

## Conclusion

The DaKshaa combo system is well-architected with a clear separation between:
- **Combo definitions** (quotas and pricing)
- **Student selections** (event choices)
- **Explosion process** (creating individual registrations)

**Key missing pieces** are the explosion RPC functions and audit tables, which should be implemented as Priority 1.

**Recommended next steps**:
1. Implement missing RPC functions
2. Add recommended tables
3. Update frontend to use complete data flow
4. Add comprehensive error handling
5. Implement payment gateway integration
