const express = require("express");
const { v4: uuidv4 } = require("uuid"); // Import UUID generator
const supabase = require("./db"); // Import Supabase connection
const cors = require('cors');
const { sendWelcomeEmail, sendPaymentSuccessEmail, sendOTPEmail } = require('./emailService');
const app = express();
const PORT = process.env.PORT || 3000;


// Enable CORS for all routes with proper configuration
app.use(cors({
  origin: '*', // Allow all origins (or specify your frontend URL)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

// Middleware for JSON parsing
app.use(express.json());
// Middleware for URL-encoded data (form submissions)
app.use(express.urlencoded({ extended: true }));

// 🔍 Global Request Logger to debug missing requests
app.use((req, res, next) => {
  console.log(`📨 Request: ${req.method} ${req.url}`);
  next();
});

// No need for initDB with Supabase - tables are managed in Supabase dashboard
console.log("✅ Backend connected to Supabase");

/* 🟢 Route to Insert Data into accommodation_requests */
app.post("/add-accommodation", async (req, res) => {
  try {
    let { user_id, username, accommodation_dates, gender, email_id, mobile_number, college_name } = req.body;

    // Validate user_id is provided
    if (!user_id) {
      return res.status(401).json({ 
        success: false,
        error: "User authentication required" 
      });
    }

    // Ensure accommodation_dates is an array
    if (!Array.isArray(accommodation_dates) || accommodation_dates.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid accommodation_dates. It should be a non-empty array of dates." 
      });
    }

    // Determine which dates are selected (February 12, 13, 14)
    const february_12_accommodation = accommodation_dates.includes('February 12');
    const february_13_accommodation = accommodation_dates.includes('February 13');
    const february_14_accommodation = accommodation_dates.includes('February 14');
    
    // 🏷️ Calculate price: ₹350 per day (dinner only)
    const number_of_days = accommodation_dates.length;
    const accommodation_price = number_of_days * 350;

    // Check if booking already exists for this user
    const { data: existingBooking } = await supabase
      .from('accommodation_requests')
      .select('*')
      .eq('user_id', user_id)
      .single();

    let result;
    
    if (existingBooking) {
      // User already has a booking - don't allow duplicate
      return res.status(400).json({ 
        success: false,
        alreadyBooked: true,
        message: "You have already booked accommodation"
      });
    } else {
      // Insert new booking
      const { data, error } = await supabase
        .from('accommodation_requests')
        .insert([{
          user_id: user_id,
          full_name: username,
          email: email_id,
          phone: mobile_number,
          college_name: college_name,
          gender: gender,
          february_12_accommodation,
          february_13_accommodation,
          february_14_accommodation,
          number_of_days,
          total_price: accommodation_price,
          payment_status: 'PENDING'
        }])
        .select();

      if (error) {
        console.error("❌ Error inserting data:", error);
        return res.status(400).json({ 
          success: false,
          error: error.message || "Failed to book accommodation" 
        });
      }
      result = data;
    }

    res.status(201).json({
      success: true,
      message: "Accommodation booked successfully!",
      data: result[0],
    });
  } catch (error) {
    console.error("❌ Error inserting data:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Internal Server Error" 
    });
  }
});

/* 📧 Route to Send Welcome Email */
app.post("/send-welcome-email", async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ error: "Email and full name are required" });
    }

    const result = await sendWelcomeEmail(email, fullName);

    if (result.success) {
      res.status(200).json({
        message: "Welcome email sent successfully!",
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        error: "Failed to send welcome email",
        details: result.error
      });
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
    res.status(500).json({ error: "Failed to send welcome email" });
  }
});

/* 🟢 Route to Fetch All Accommodation Details */
app.get("/accommodations", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accommodation_requests')
      .select('full_name, email, phone, college_name, check_in_date, check_out_date, number_of_days, total_price, payment_status');

    if (error) throw error;

    res.status(200).json({
      message: "Fetched accommodation details successfully!",
      data: data,
    });
  } catch (error) {
    console.error("❌ Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* 🟢 Route to Add Lunch Booking */
app.post("/add-lunch-booking", async (req, res) => {
  try {
    const { user_id, full_name, email, mobile, lunch_dates, total_price } = req.body;

    // Validate user_id
    if (!user_id) {
      return res.status(401).json({ 
        success: false,
        error: "User authentication required" 
      });
    }

    if (!lunch_dates || lunch_dates.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Please select at least one lunch date" 
      });
    }

    // Determine which days are selected (February 12, 13, 14)
    const february_12_lunch = lunch_dates.includes('February 12');
    const february_13_lunch = lunch_dates.includes('February 13');
    const february_14_lunch = lunch_dates.includes('February 14');
    
    // Calculate totals
    const total_lunches = lunch_dates.length;
    const calculated_price = total_lunches * 100;

    // Check if booking already exists for this user
    const { data: existingBooking } = await supabase
      .from('lunch_bookings')
      .select('*')
      .eq('user_id', user_id)
      .single();

    let result;
    
    if (existingBooking) {
      // User already has a booking - don't allow duplicate
      return res.status(400).json({ 
        success: false,
        alreadyBooked: true,
        message: "You have already booked lunch"
      });
    } else {
      // Insert new booking
      const { data, error } = await supabase
        .from('lunch_bookings')
        .insert([{
          user_id,
          full_name,
          email,
          phone: mobile,
          february_12_lunch,
          february_13_lunch,
          february_14_lunch,
          total_lunches,
          total_price: calculated_price,
          payment_status: 'PENDING'
        }])
        .select();
      
      if (error) throw error;
      result = data;
    }

    res.status(201).json({
      success: true,
      message: "Lunch booked successfully!",
      data: result[0]
    });
  } catch (error) {
    console.error("Error adding lunch booking:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to add lunch booking" 
    });
  }
});

/* 🟢 Route to Insert Data into contact_details */
app.post("/add-contact", async (req, res) => {
  try {
    let { username, email_id, mobile_number, message } = req.body;

    // Validate required fields
    if (!username || !email_id || !mobile_number || !message) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    // Generate UUID for user_id
    const user_id = uuidv4();

    // Insert using Supabase
    const { data, error } = await supabase
      .from('contact_details')
      .insert([{
        user_id,
        username,
        email_id,
        mobile_number,
        message
      }])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: "Contact details added successfully!",
      data: data[0],
    });
  } catch (error) {
    console.error("❌ Error inserting contact details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/contacts", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contact_details')
      .select('username, email_id, mobile_number, message');

    if (error) throw error;

    res.status(200).json({
      message: "Fetched contact details successfully!",
      data: data,
    });
  } catch (error) {
    console.error("❌ Error fetching contact details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* 🟢 Route to Insert Data into feedback_details */
app.post("/add-feedback", async (req, res) => {
  try {
    let { username, email_id, rating, message } = req.body;

    // Validate required fields
    if (!username || !email_id || !rating || !message) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    // Generate UUID for feedback_id
    const feedback_id = uuidv4();

    // Insert using Supabase
    const { data, error } = await supabase
      .from('feedback_details')
      .insert([{
        feedback_id,
        username,
        email_id,
        rating,
        message
      }])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: "Feedback submitted successfully!",
      data: data[0],
    });
  } catch (error) {
    console.error("❌ Error inserting feedback:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* 🟢 Route to Fetch All Feedback Details */
app.get("/feedbacks", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('feedback_details')
      .select('username, email_id, rating, message, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      message: "Fetched feedback details successfully!",
      data: data,
    });
  } catch (error) {
    console.error("❌ Error fetching feedback:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* 🟢 Calculate Team Payment Amount (Preview) */
app.post("/payment/calculate-team-amount", async (req, res) => {
  try {
    const { team_id, event_id } = req.body;

    if (!team_id || !event_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: team_id, event_id"
      });
    }

    // Fetch team name
    const { data: teamData, error: teamDataErr } = await supabase
      .from('teams')
      .select('team_name')
      .eq('id', team_id)
      .single();

    if (teamDataErr || !teamData) {
      return res.status(404).json({
        success: false,
        error: "Team not found"
      });
    }

    // Fetch team members
    const { data: teamMembers, error: teamErr } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', team_id);

    if (teamErr) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch team members"
      });
    }

    const memberIds = (teamMembers || []).map(m => m.user_id);
    const teamSize = memberIds.length;

    // Check for already paid members FOR THIS SPECIFIC TEAM
    let alreadyPaidCount = 0;
    if (memberIds.length > 0) {
      const { data: existingMembers, error: existingErr } = await supabase
        .from('event_registrations_config')
        .select('user_id')
        .eq('event_id', event_id)
        .eq('event_name', teamData.team_name)
        .eq('payment_status', 'PAID')
        .in('user_id', memberIds);

      if (!existingErr) {
        alreadyPaidCount = (existingMembers || []).length;
      }
    }

    // Fetch event price
    const { data: eventRow, error: eventErr } = await supabase
      .from('events')
      .select('price')
      .eq('id', event_id)
      .single();

    if (eventErr || !eventRow) {
      return res.status(404).json({
        success: false,
        error: "Event not found"
      });
    }

    const pricePerMember = Number(eventRow.price) || 0;
    const unpaidMembersCount = teamSize - alreadyPaidCount;
    const calculatedAmount = Number((pricePerMember * unpaidMembersCount).toFixed(2));

    console.log('💰 Team amount calculation:', {
      team_id,
      event_id,
      totalMembers: teamSize,
      alreadyPaid: alreadyPaidCount,
      unpaidMembers: unpaidMembersCount,
      pricePerMember,
      calculatedAmount
    });

    res.status(200).json({
      success: true,
      calculated_amount: calculatedAmount,
      team_size: teamSize,
      unpaid_members: unpaidMembersCount,
      price_per_member: pricePerMember
    });

  } catch (error) {
    console.error("❌ Error calculating team amount:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate team amount",
      details: error.message
    });
  }
});

/* 🟢 Payment Gateway - Initiate Payment */
app.post("/payment/initiate", async (req, res) => {
  try {
    const { 
      user_id, 
      booking_id, 
      booking_type, // 'accommodation', 'lunch', 'event', 'combo', 'team', 'mixed_registration'
      amount 
    } = req.body;
    
    // Shared variables used across team payment logic
    let teamEventRow = null; // Holds event details for team bookings
    let unpaidMembersCount = 0; // Number of unpaid team members
    
    // Validate required fields (team payments compute amount on server)
    if (!user_id || !booking_type) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: user_id, booking_type" 
      });
    }

    // booking_id is required for non-team, non-mixed types
    // We allow 'team' to skip booking_id if we implement new team creation, but following the snippet's flow, 
    // basic validation is done inside the type block.
    if (!booking_id && !['team', 'mixed_registration'].includes(booking_type)) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required field: booking_id (required for this booking type)" 
      });
    }

    // Fetch user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, id, college_name, department, mobile_number')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ 
        success: false,
        error: "User profile not found" 
      });
    }

    // Get user's email from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
    
    const customer_email = authUser?.user?.email || 'noemail@example.com';

    // For team events, use team leader mobile if provided
    const customer_phone = req.body.team_leader_mobile || profile.mobile_number || "0000000000";

    // Handle different booking types - create pending records BEFORE payment
    let actualBookingId = booking_id;
    let computedAmount = amount;
    
    if (booking_type === 'accommodation') {
      // Check if user already has a booking
      const { data: existingBooking } = await supabase
        .from('accommodation_requests')
        .select('id')
        .eq('user_id', user_id)
        .eq('payment_status', 'PAID')
        .maybeSingle();

      if (existingBooking) {
        console.log('⚠️ User already has accommodation booking, will create new one for modification');
      }

      // Create accommodation request (PENDING)
      const accommodationDates = req.body.accommodation_dates || [];
      const numberOfDays = accommodationDates.length.toString();
      const totalPrice = amount; // Use amount from request
      
      const { data: accRequest, error: accError } = await supabase
        .from('accommodation_requests')
        .insert({
          user_id: user_id,
          full_name: req.body.full_name || profile.full_name,
          email: customer_email,
          phone: req.body.mobile_number || profile.mobile_number,
          college_name: req.body.college_name || profile.college_name,
          gender: req.body.gender,
          number_of_days: numberOfDays,
          total_price: totalPrice,
          payment_status: 'PENDING',
          special_requests: JSON.stringify({ dates: accommodationDates })
        })
        .select()
        .single();

      if (accError) {
        console.error('❌ Error creating accommodation request:', accError);
        const errorMessage = 'Failed to create accommodation request';
        return res.status(400).json({
          success: false,
          error: errorMessage,
          details: accError.message
        });
      }
      
      // Update booking_id to actual database ID
      actualBookingId = accRequest.id;
      console.log('✅ Created accommodation request:', actualBookingId);
      
    } else if (booking_type === 'lunch') {
      // Check if user already has a booking
      const { data: existingLunch } = await supabase
        .from('lunch_bookings')
        .select('id')
        .eq('user_id', user_id)
        .eq('payment_status', 'PAID')
        .maybeSingle();

      if (existingLunch) {
        console.log('⚠️ User already has lunch booking, will create new one for modification');
      }

      // Create lunch booking (PENDING)
      const lunchDates = req.body.lunch_dates || [];
      const totalLunches = lunchDates.length.toString();
      const totalPrice = amount; // Use amount from request
      
      // Store dates as comma-separated string
      const bookedDates = lunchDates.join(', ');
      
      const { data: lunchBooking, error: lunchError } = await supabase
        .from('lunch_bookings')
        .insert({
          user_id: user_id,
          full_name: req.body.full_name || profile.full_name,
          email: customer_email,
          phone: req.body.mobile_number || profile.mobile_number,
          total_lunches: totalLunches,
          total_price: totalPrice,
          payment_status: 'PENDING',
          booked_dates: bookedDates
        })
        .select()
        .single();

      if (lunchError) {
        console.error('❌ Error creating lunch booking:', lunchError);
        const errorMessage = 'Failed to create lunch booking';
        return res.status(400).json({
          success: false,
          error: errorMessage,
          details: lunchError.message
        });
      }
      
      // Update booking_id to actual database ID
      actualBookingId = lunchBooking.id;
      console.log('✅ Created lunch booking:', actualBookingId);

    } else if (booking_type === 'combo') {
      // Validate combo purchase exists
      const { data: comboPurchase, error: comboError } = await supabase
        .from('combo_purchases')
        .select('id, combo_id, user_id, payment_status')
        .eq('id', booking_id)
        .eq('user_id', user_id)
        .single();

      if (comboError || !comboPurchase) {
        console.error('❌ Combo purchase not found:', { booking_id, user_id, error: comboError });
        return res.status(404).json({
          success: false,
          error: 'Combo purchase not found or already processed',
          details: comboError?.message
        });
      }

      if (comboPurchase.payment_status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: `Combo purchase status is ${comboPurchase.payment_status}, expected PENDING`
        });
      }

      actualBookingId = comboPurchase.id;
      console.log('✅ Validated combo purchase:', actualBookingId);
      
      // Handle team events in combo packages - create inactive teams NOW (like mixed_registration)
      const { team_data, selected_events } = req.body;
      console.log('📦 Combo team_data received:', team_data);
      console.log('📦 Combo selected_events received:', selected_events);
      
      if (team_data && Object.keys(team_data).length > 0 && selected_events && selected_events.length > 0) {
        // Fetch event details to verify team events
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, name, title, min_team_size, max_team_size')
          .in('id', selected_events);
        
        const eventsMap = {};
        (eventsData || []).forEach(e => { eventsMap[e.id] = e; });
        
        const createdTeams = {};
        
        for (const [eventId, teamInfo] of Object.entries(team_data)) {
          const event = eventsMap[eventId];
          const isTeamEvent = event && (event.min_team_size > 1 || event.max_team_size > 1);
          
          if (isTeamEvent && teamInfo.teamName) {
            console.log(`🏆 Creating inactive team for combo event ${event.name || event.title}:`, teamInfo);
            
            // Create inactive team (will be activated after payment)
            const { data: newTeam, error: teamErr } = await supabase
              .from('teams')
              .insert({
                team_name: teamInfo.teamName,
                event_id: eventId,
                leader_id: user_id,
                created_by: user_id,  // Required for RLS policies
                max_members: teamInfo.memberCount || event.max_team_size || 4,
                is_active: false  // Will be activated after payment success
              })
              .select()
              .single();
            
            if (teamErr) {
              console.error(`❌ Combo team creation failed for ${event.name}:`, teamErr);
              // Continue with other teams, don't fail the whole request
            } else {
              console.log(`✅ Created inactive team: ${newTeam.team_name} (ID: ${newTeam.id})`);
              
              // Add leader to team_members
              await supabase.from('team_members').insert({
                team_id: newTeam.id,
                user_id: user_id,
                role: 'leader',
                status: 'joined'
              });
              
              createdTeams[eventId] = newTeam.id;
            }
          }
        }
        
        // Store created team IDs for activation in callback
        req.combo_created_teams = createdTeams;
        console.log('📦 Combo teams created (inactive):', createdTeams);
      }
      
    } else if (booking_type === 'mixed_registration') {
      // Handle Mixed (Own Combo) Registration
      const { registrations } = req.body;
      if (!Array.isArray(registrations) || registrations.length === 0) {
        return res.status(400).json({ success: false, error: "Invalid mixed registrations payload" });
      }

      let totalCalculatedAmount = 0;
      let processedRegistrations = [];
      const eventIds = registrations.map(r => r.event_id);
      const { data: eventsData, error: eventsErr } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds);

      if (eventsErr || !eventsData) {
         return res.status(500).json({ success: false, error: "Failed to fetch event details"});
      }

      const eventsMap = {};
      eventsData.forEach(e => eventsMap[e.id || e.event_id] = e);

      for (const item of registrations) {
        const event = eventsMap[item.event_id];
        if (!event) continue;

        const price = Number(event.price) || 0;

        if (item.type === 'team') {
           // Team Logic
           const count = Number(item.member_count);
           const itemTotal = price * count;
           totalCalculatedAmount += itemTotal;

           // Create Inactive Team NOW (with Retry)
           let newTeam = null;
           let teamErr = null;
           let retryCount = 0;
           const MAX_RETRIES = 3;

           while (retryCount < MAX_RETRIES) {
             const result = await supabase
               .from('teams')
               .insert({
                  team_name: item.team_name,
                  event_id: item.event_id,
                  leader_id: user_id,
                  created_by: user_id,
                  is_active: false,
                  max_members: count
               })
               .select()
               .single();
             
             newTeam = result.data;
             teamErr = result.error;

             if (!teamErr) break; // Success
             
             // If error is related to fetch/connection, retry
             const updateErrMsg = teamErr?.message || JSON.stringify(teamErr);
             if (updateErrMsg.includes('fetch failed') || updateErrMsg.includes('ECONNRESET')) {
                console.log(`⚠️ Team creation retry ${retryCount + 1}/${MAX_RETRIES} for ${item.team_name}...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                retryCount++;
             } else {
                break; // Not a transient error
             }
           }
           
           if (teamErr) {
             console.error("Mixed reg team creation failed:", teamErr);
             return res.status(500).json({success:false, error: "Failed to create team"});
           }

           // Add leader to team_members immediately (with basic retry)
           let memberAdded = false;
           retryCount = 0;
           
           while (retryCount < MAX_RETRIES && !memberAdded) {
               const { error: memberErr } = await supabase.from('team_members').insert({
                   team_id: newTeam.id,
                   user_id: user_id,
                   role: 'leader',
                   status: 'joined'
               });
               
               if (!memberErr) {
                   memberAdded = true;
               } else {
                   const msg = memberErr?.message || '';
                   if (msg.includes('fetch failed') || msg.includes('ECONNRESET')) {
                        console.log(`⚠️ Team member add retry ${retryCount + 1}/${MAX_RETRIES}...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        retryCount++;
                   } else {
                       console.error("Failed to add team leader:", memberErr);
                       break;
                   }
               }
           }

           processedRegistrations.push({
             ...item,
             team_id: newTeam.id,
             amount: itemTotal,
             price_per_member: price,
             real_event_name: event.name
           });

        } else {
           totalCalculatedAmount += price;
           processedRegistrations.push({
             ...item,
             amount: price,
             real_event_name: event.name
           });
        }
      }
      
      req.processed_mixed_data = processedRegistrations;
      computedAmount = Number(totalCalculatedAmount.toFixed(2));
      actualBookingId = `MIXED_${Date.now()}`;

    } else if (booking_type === 'team') {
      // Compute total amount based on team size and event price
      const { team_id, team_name, event_id, member_count } = req.body;
      
      // Using strict logic from copied flow (requires team_id for existing teams)
      // IF team_id is missing, but we have team_name/member_count, we could fallback to creation logic?
      // Since 'new file' has logic, we'll assume we should use the ROBUST version from 'server.js' 
      // but ensure the *calculation* and *payload* matching the snippet.

      const isNewTeam = !team_id && !!team_name;
      
      if (!event_id || (!team_id && !team_name)) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields for team payment: team_id, event_id"
        });
      }

      // Prevent duplicate registrations check logic (from snippet)
      if (team_id) {
        const { data: preCheckTeamMembers } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', team_id);

        const memberIds = (preCheckTeamMembers || []).map(m => m.user_id);
      
        if (memberIds.length > 0) {
          const { data: existingMembers } = await supabase
            .from('event_registrations_config')
            .select('user_id')
            .eq('event_id', event_id)
            .eq('event_name', team_name)
            .eq('payment_status', 'PAID')
            .in('user_id', memberIds);

          const alreadyPaidMemberIds = (existingMembers || []).map(m => m.user_id);
          // Only block if ALL members are already registered
          if (alreadyPaidMemberIds.length > 0 && alreadyPaidMemberIds.length === memberIds.length) {
            return res.status(409).json({
              success: false,
              error: 'All team members are already registered for this event.'
            });
          }
        }
      }

      // Fetch event pricing
      const { data: eventRowData, error: eventErr } = await supabase
        .from('events')
        .select('id, name, price, is_team_event, min_team_size, max_team_size')
        .eq('id', event_id)
        .single();
      
      if (eventErr || !eventRowData) {
        return res.status(404).json({
          success: false,
          error: "Event not found for team payment"
        });
      }

      teamEventRow = eventRowData;

      let currentTeamId = team_id;
      let teamSize = 0;
      let alreadyPaidMemberIdsCount = 0;

      if (isNewTeam) {
        // Create new team logic (from existing file, to support New Team flow)
        const count = Number(member_count) || 1;
        teamSize = count;
        unpaidMembersCount = count;
        
        // Create new team
        const { data: newTeam, error: createTeamErr } = await supabase
          .from('teams')
          .insert({
            team_name: team_name,
            event_id: eventRowData.id,
            leader_id: user_id,
            created_by: user_id,
            is_active: false,
            max_members: count
          })
          .select()
          .single();
          
        if (createTeamErr) {
          return res.status(400).json({ success: false, error: "Failed to create team" });
        }
        currentTeamId = newTeam.id;
        
        // Add leader
        await supabase.from('team_members').insert({
           team_id: currentTeamId,
           user_id: user_id,
           role: 'leader',
           status: 'joined'
        });
        
        actualBookingId = currentTeamId;
      } else {
        // Existing team logic
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', team_id);
        
        teamSize = Array.isArray(teamMembers) ? teamMembers.length : 0;
        const requestedSize = Number(member_count) || teamSize;

        // Count paid members
        const { count } = await supabase
          .from('event_registrations_config')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event_id)
          .eq('payment_status', 'PAID')
          .in('user_id', (teamMembers || []).map(m => m.user_id));
        
        alreadyPaidMemberIdsCount = count || 0;
        unpaidMembersCount = teamSize - alreadyPaidMemberIdsCount;
      }
      const pricePerMember = Number(eventRowData.price) || 0;
      computedAmount = Number((pricePerMember * unpaidMembersCount).toFixed(2));

      console.log('🧮 Team payment computed:', { 
        team_id: currentTeamId, 
        event_id, 
        totalTeamSize: teamSize, 
        alreadyPaid: alreadyPaidMemberIdsCount,
        unpaidMembers: unpaidMembersCount,
        pricePerMember, 
        computedAmount 
      });
      actualBookingId = currentTeamId;
    }

    const order_id = `ORDER_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${Date.now()}_${actualBookingId.toString().substring(0, 8)}`;

    // [New] Check for insufficient amount credit
    let finalAmount = (booking_type === 'team' || booking_type === 'mixed_registration') ? computedAmount : amount;
    let usedCredit = 0;
    
    try {
      const { data: creditData } = await supabase
        .from('insufficient_amount')
        .select('amount')
        .eq('userid', user_id)
        .single();
      
      if (creditData && creditData.amount > 0) {
        const credit = parseFloat(creditData.amount);
        console.log(`ℹ️ User ${user_id} has credit of ₹${credit}`);
        
        usedCredit = credit;
        finalAmount = Math.max(1, finalAmount - credit); // Ensure at least ₹1 is paid if using gateway
        
        console.log(`💰 Applied credit. Original: ₹${(booking_type === 'team' || booking_type === 'mixed_registration') ? computedAmount : amount}, New Due: ₹${finalAmount}`);
      }
    } catch (creditErr) {
      console.error("Error checking credit:", creditErr);
    }

    // Format payment payload for gateway
    // Append order_id to callback_url so it persists through the gateway's redirect
    const callback_url = `http://localhost:3000/payment/callback?order_id=${order_id}`;

    const paymentPayload = {
      dueamount: finalAmount, // Use calculated final amount
      regno :  `DakshaaT26-${customer_phone}`,
      apporderid: order_id,
      fullname: profile.full_name,
      emailid: customer_email,
      mobileno: customer_phone,
      clg: "KSRCT",
      eventname: "DakshaaT26"
    };
    const paymentInsertData = {
      user_id: user_id,
      order_id: order_id,
      booking_id: actualBookingId,
      booking_type: booking_type,
      amount: finalAmount, // Use calculated final amount
      status: 'INITIATED',
      gateway_payload: {
          ...paymentPayload,
          metadata: { // Moving metadata inside gateway_payload to avoid schema changes
            original_amount: (booking_type === 'team' || booking_type === 'mixed_registration') ? computedAmount : amount,
            credit_used: usedCredit
          }
      }
    };


    if (booking_type === 'team') {
      const { team_name, event_id, member_count } = req.body;
      const pricePerMember = Number(teamEventRow?.price) || 0;
      paymentInsertData.gateway_payload = {
        ...paymentPayload,
        team_data: {
          team_id: actualBookingId, 
          team_name: team_name,
          event_id: event_id,
          member_count: member_count || 0,
          total_amount: computedAmount,
          price_per_member: pricePerMember,
          unpaid_members_count: unpaidMembersCount || member_count || 0,
          event_name_real: teamEventRow?.name
        }
      };
    } else if (booking_type === 'combo') {
      paymentInsertData.gateway_payload = {
        ...paymentPayload,
        team_data: req.body.team_data || null,
        selected_events: req.body.selected_events || null,
        created_teams: req.combo_created_teams || null
      };
    } else if (booking_type === 'mixed_registration') {
        paymentInsertData.gateway_payload = {
            ...paymentPayload,
            mixed_data: {
                registrations: req.processed_mixed_data
            }
        };
    }
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_transactions')
      .insert(paymentInsertData)
      .select()
      .single();
    if (paymentError) {
      console.error("❌ DETAILED ERROR storing payment record:", paymentError);
      return res.status(500).json({
        success: false,
        error: "Failed to create payment transaction record",
        details: paymentError.message
      });
    }

    console.log("✅ Payment transaction created:", { order_id, booking_id, user_id, amount });

    // Generate Direct Payment URL (Client Redirect)
    // We do NOT fetch from backend. We construct the URL and let the frontend redirect the user.
    const baseUrl = 'https://fees.ksrctdigipro.in/HandlePaymentFromApp';
    
    // Ensure payload values are strings for URLSearchParams
    const queryParams = new URLSearchParams();
    Object.entries(paymentPayload).forEach(([key, value]) => {
        queryParams.append(key, String(value));
    });
    
    const paymentUrl = `${baseUrl}?${queryParams.toString()}`;

    console.log("🔗 Generated Payment URL:", paymentUrl);

    res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      payment_data: paymentPayload,
      payment_url: paymentUrl,
      transaction_id: paymentRecord?.id,
      calculated_amount: paymentPayload.dueamount
    });


  } catch (error) {
    console.error("❌ Error initiating payment:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

/* 🟢 Payment Gateway - Handle Callback (GET for user redirect, POST for webhook) */
app.all("/payment/callback", async (req, res) => { // Changed to app.all to handle both methods
  try {
    console.log(`💳 Payment callback received via ${req.method}`);
    
    // Extract data from either Query (GET) or Body (POST)
    // Merge both to ensure we catch the payload regardless of method/transport details
    const payload = { ...req.query, ...req.body };
    
/*
    console.log("🔍 Callback Payload info:", {
       method: req.method,
       queryKeys: Object.keys(req.query),
       bodyKeys: Object.keys(req.body),
       contentType: req.headers['content-type'],
       payload: payload // Log the actual merged payload
    });
*/
    
    // Use 'let' for variables we might need to update via polling
    // 1. Normalize Keys (Support 'apporderid' vs 'order_id')
    let order_id = payload.order_id || payload.apporderid;

    // 2. Extract and Sanitize Fields
    let txn_id = payload.txn_id;
    let payment_id = payload.payment_id;
    let errorMsg = payload.error;
    let status = payload.status;
    let callbackAmount = payload.amount; // Extract amount from callback

    // Handle "Null" string values from Gateway
    if (String(txn_id) === 'Null') txn_id = null;
    if (String(payment_id) === 'Null') payment_id = null;

    // 3. Infer status from presence of 'success' flag (common in redirects)
    if (!status && (payload.success !== undefined)) {
       status = 'SUCCESS';
    }

    // 🔄 POLLING STRATEGY FOR GET REDIRECTS
    // If this is a user redirect (GET) and status is missing, the Webhook (POST) might be processing in parallel.
    // We poll the DB for a few seconds to see if the status updates to SUCCESS.
    if (req.method === 'GET' && order_id && !status) {
      
      const pollDuration = 5000; // 5 seconds max wait
      const pollInterval = 1000; // Check every 1 second
      const startTime = Date.now();

      while (Date.now() - startTime < pollDuration) {
        const { data: pollTxn } = await supabase
          .from('payment_transactions')
          .select('status, transaction_id, gateway_response')
          .eq('order_id', order_id)
          .single();

        if (pollTxn && (pollTxn.status === 'SUCCESS' || pollTxn.status === 'FAILED')) {
          status = pollTxn.status;
          
          // CRITICAL FIX: Update local variables so subsequent DB updates use the correct IDs found in DB
          txn_id = pollTxn.transaction_id || pollTxn.gateway_response?.txn_id;
          payment_id = pollTxn.gateway_response?.payment_id;
          
          break; // Exit loop
        }
        
        // Wait for interval
        // Only log "Polling" if we actually have to wait
        if (Date.now() - startTime < 100) console.log('⏳ GET redirect checking DB for Webhook update...');
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    console.log(`💳 Processing callback for Order: ${order_id} (Status: ${status || 'Pending...'})`);

    // If it's a GET request with NO data (and polling failed), just show loading (assume webhook handles it, or user just refreshed)
    if (req.method === 'GET' && (!order_id || !status)) {
       return res.send(`
        <html>
          <head>
            <title>Payment Status</title>
            <meta http-equiv="refresh" content="3;url=https://dakshaa.ksrct.ac.in/dashboard" />
            <style>
              body { font-family: sans-serif; text-align: center; padding: 40px; }
              .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 20px auto; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <h1>Checking Payment Status...</h1>
            <div class="loader"></div>
            <p>Please wait while we verify your transaction.</p>
            <p>If you are not redirected automatically, <a href="https://dakshaa.ksrct.ac.in/dashboard">click here</a>.</p>
          </body>
        </html>
      `);
    }

    // Validation
    if (!order_id || !status) {
      const msg = "Missing order_id or status";
      if (req.method === 'GET') return res.status(400).send(msg);
      return res.status(400).json({ error: msg });
    }

    // Map status to uppercase
    // Ensure we handle undefined status gracefully (though previous checks should prevent it)
    let paymentStatus = (status || '').toUpperCase();

    // Fetch payment transaction record
    const { data: paymentRecord, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (fetchError) {
      console.log("❌ Transaction not found:", order_id);
    } else {
      console.log("✅ Transaction found:", order_id);
    }

    if (fetchError || !paymentRecord) {
      console.error("❌ Payment transaction not found:", { order_id, error: fetchError });
      // ... error handling ...
      const htmlError = `
        <html>
          <body>
            <h1>Payment Error</h1>
            <p>Payment transaction not found for order: ${order_id}</p>
            <p>Error: ${fetchError?.message || 'Record does not exist'}</p>
          </body>
        </html>
      `;
      if (req.method === 'GET') return res.status(404).send(htmlError);
      return res.status(404).send(htmlError);
    }

    // 🛡️ Security Check: Verify Amount Matching (1.0 vs 1)
    let remainingAmount = 0;
    
    if (paymentStatus === 'SUCCESS' && callbackAmount) {
        const receivedAmount = parseFloat(callbackAmount);
        const expectedAmount = parseFloat(paymentRecord.amount);
        
        if (!isNaN(receivedAmount) && !isNaN(expectedAmount)) {
             // Allow tiny floating point differences (e.g. 1.000001 vs 1)
             if (Math.abs(receivedAmount - expectedAmount) > 0.1) {
                 if (receivedAmount < expectedAmount) {
                     console.log(`⚠️ Partial Payment Detected: Received ${receivedAmount}, Expected ${expectedAmount}`);
                     // Map to 'PENDING' because DB likely doesn't support 'PARTIAL' in status check constraint
                     paymentStatus = 'PENDING'; 
                     remainingAmount = expectedAmount - receivedAmount;
                     errorMsg = `Partial Payment: remaining ${remainingAmount}`;

                     // [NEW] Update Insufficient Amount Table - Store accumulated partial payments
                     try {
                        const { data: currIn } = await supabase
                             .from('insufficient_amount')
                             .select('amount')
                             .eq('userid', paymentRecord.user_id)
                             .single();
                        
                        const currentStored = (currIn && currIn.amount) ? parseFloat(currIn.amount) : 0;
                        const newStored = currentStored + receivedAmount;

                        await supabase.from('insufficient_amount').upsert({
                            userid: paymentRecord.user_id,
                            amount: newStored,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'userid' });
                        
                        console.log(`💾 Stored partial amount for user ${paymentRecord.user_id}: +${receivedAmount} (Total stored: ${newStored})`);
                     } catch(err) {
                        console.error("Failed to update insufficient_amount table:", err);
                     }

                 } else {
                     console.error(`❌ Payment Security Alert: Amount mismatch! Expected: ${expectedAmount}, Received: ${receivedAmount}`);
                     paymentStatus = 'FAILED'; 
                     errorMsg = `Amount validation failed: Expected ${expectedAmount}, got ${receivedAmount}`;
                 }
             } else {
                 console.log(`✅ Amount Verified matches: ${receivedAmount} == ${expectedAmount}`);
                 
                 // [NEW] Payment Complete -> Remove from insufficient table
                 try {
                    await supabase.from('insufficient_amount').delete().eq('userid', paymentRecord.user_id);
                    console.log(`🗑️ Cleared insufficient_amount record for user ${paymentRecord.user_id}`);
                 } catch(err) { console.error("Failed to clear insufficient_amount:", err); }
             }
        }
    }
    
    // Normalize status to match DB constraint (usually INITIATED, SUCCESS, FAILED, PENDING)
    // If DB has a constraint check, we must adhere to allowed values.
    // User requested to map failed status to 'PENDING'
    if (paymentStatus === 'FAILURE' || paymentStatus === 'FAIL') {
        paymentStatus = 'PENDING';
    }

    // Check if we already processed this order to prevent double-processing
    // (e.g. Webhook finished it, now Redirect is here)
    if (paymentRecord && paymentRecord.status === 'SUCCESS' && req.method === 'GET') {
       console.log("✅ Payment already processed (verified via DB). Skipping duplicate logic.");
       
       const redirectUrl = `https://dakshaa.ksrct.ac.in/dashboard`;
       
       // Just return the success page immediately
       return res.send(`
        <html>
          <head>
            <title>Payment Status</title>
            <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
            <style>
              body { font-family: sans-serif; text-align: center; padding: 40px; }
              .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 20px auto; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <h1>Payment Processed</h1>
            <div class="loader"></div>
            <p>Your payment has been recorded. Redirecting you...</p>
            <p>If you are not redirected automatically, <a href="${redirectUrl}">click here</a>.</p>
          </body>
        </html>
      `);
    }

    // Update payment transaction
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: paymentStatus,
        transaction_id: payment_id || txn_id,
        payment_method: 'GATEWAY',
        gateway_response: { txn_id, payment_id, error: errorMsg },
        completed_at: new Date().toISOString()
      })
      .eq('order_id', order_id);

    if (updateError) {
      console.error("Error updating payment:", updateError);
      const htmlErr = `
          <html>
            <body>
              <h1>Payment Error</h1>
              <p>Failed to update payment status</p>
            </body>
          </html>
      `;
      if (req.method === 'GET') return res.status(500).send(htmlErr);
      return res.status(500).send(htmlErr);
    }

    let updateResult;

    // Handle PARTIAL Payment Redirect Logic (GET only) before marking booking as FAILED/SUCCESS
    // We use errorMsg detection since paymentStatus is now normalized to 'PENDING'
    if (remainingAmount > 0 && req.method === 'GET') {
         // Create New Pending Transaction for Remaining Amount
         const newOrderId = `ORDER_${Date.now()}_REMAINING_${paymentRecord.booking_id.toString().substring(0, 5)}`;
         
         const newPayload = {
             ...paymentRecord.gateway_payload,
             dueamount: remainingAmount,
             apporderid: newOrderId
         };

         // Insert new transaction
         await supabase.from('payment_transactions').insert({
             user_id: paymentRecord.user_id,
             order_id: newOrderId,
             booking_id: paymentRecord.booking_id,
             booking_type: paymentRecord.booking_type,
             amount: remainingAmount,
             status: 'INITIATED',
             gateway_payload: newPayload
         });

         // Construct Payment URL
         const baseUrl = 'https://fees.ksrctdigipro.in/HandlePaymentFromApp';
         const queryParams = new URLSearchParams();
         // Ensure correct mapping
         Object.entries(newPayload).forEach(([key, value]) => {
             // Fix key names if payload has old mapping
             if (key === 'apporderid' || key === 'order_id') queryParams.append('apporderid', newOrderId);
             else if (key === 'dueamount') queryParams.append('dueamount', remainingAmount);
             else queryParams.append(key, String(value));
         });
         
         const paymentUrl = `${baseUrl}?${queryParams.toString()}`;

         return res.send(`
             <html>
                <head>
                 <title>Payment Warning</title>
                 <style>
                  body { font-family: sans-serif; text-align: center; padding: 40px; color: #333; }
                  .warning { background: #fff3cd; color: #856404; padding: 20px; border: 1px solid #ffeeba; border-radius: 5px; margin: 20px auto; max-width: 600px; }
                  .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
                 </style>
                </head>
                <body>
                  <h1>⚠️ Partial Payment Detected</h1>
                  <div class="warning">
                    <h2>Do NOT change the amount!</h2>
                    <p>You paid less than the required amount. You still owe <strong>₹${remainingAmount}</strong>.</p>
                    <p>If you change the amount again, your registration may be cancelled.</p>
                  </div>
                  <p>Click below to pay the remaining balance.</p>
                  <a href="${paymentUrl}" class="btn">Pay Remaining ₹${remainingAmount}</a>
                </body>
             </html>
         `);
    }

    // Update booking status based on payment result
    if (paymentStatus === 'SUCCESS') {
      const { booking_id, booking_type, user_id } = paymentRecord;
      
      if (booking_type === 'accommodation') {
        updateResult = await supabase
          .from('accommodation_requests')
          .update({ 
            payment_status: 'PAID',
            payment_id: payment_id || txn_id
          })
          .eq('id', booking_id)
          .eq('user_id', user_id);
      } else if (booking_type === 'lunch') {
        updateResult = await supabase
          .from('lunch_bookings')
          .update({ 
            payment_status: 'PAID',
            payment_id: payment_id || txn_id
          })
          .eq('id', booking_id)
          .eq('user_id', user_id);
      } else if (booking_type === 'event') {
        // First, get the registration to find the batch ID (stored in transaction_id temporarily)
        const { data: firstReg } = await supabase
          .from('event_registrations_config')
          .select('id, transaction_id')
          .eq('id', booking_id)
          .single();

        if (!firstReg) {
          console.error('❌ No registration found with id:', booking_id);
        }

        const batchId = firstReg?.transaction_id;
        console.log('📝 Batch ID from first registration:', batchId);

        // Update ALL registrations with the same batch ID (multiple events in one payment)
        // OR just the single registration if no batch ID exists
        let updateQuery = supabase
          .from('event_registrations_config')
          .update({ 
            payment_status: 'PAID',
            transaction_id: payment_id || txn_id // Replace batch ID with actual transaction ID
          })
          .eq('user_id', user_id);

        // If batch ID exists, update all registrations with that batch ID
        // Otherwise, just update the single registration
        if (batchId && batchId.startsWith('BATCH_')) {
          updateQuery = updateQuery.eq('transaction_id', batchId);
          console.log('🔄 Updating all registrations with batch ID:', batchId);
        } else {
          updateQuery = updateQuery.eq('id', booking_id);
          console.log('🔄 Updating single registration:', booking_id);
        }

        updateResult = await updateQuery;

        if (updateResult?.error) {
          console.error('❌ Error updating event registrations:', updateResult.error);
        } else {
          console.log('✅ Successfully updated event registrations');
        }

        // Create admin notification for event registration
        if (!updateResult?.error) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user_id)
            .single();

          const { data: authUser } = await supabase.auth.admin.getUserById(user_id);

          // Count how many events were updated
          const { count: eventCount } = await supabase
            .from('event_registrations_config')
            .select('id', { count: 'exact', head: true })
            .eq('transaction_id', payment_id || txn_id);

          await supabase.from('admin_notifications').insert({
            type: 'NEW_REGISTRATION',
            title: 'New Event Registration',
            message: `${userData?.full_name || authUser?.user?.email || 'User'} completed payment for ${eventCount || 1} event(s)`,
            data: {
              user_id: user_id,
              user_name: userData?.full_name,
              user_email: authUser?.user?.email,
              booking_id: booking_id,
              event_count: eventCount || 1,
              amount: paymentRecord.amount,
              transaction_id: payment_id || txn_id,
              registration_type: 'individual'
            },
            is_read: false
          });
        }
      } else if (booking_type === 'combo') {
        // Update combo purchase to PAID
        updateResult = await supabase
          .from('combo_purchases')
          .update({ 
            payment_status: 'PAID',
            transaction_id: payment_id || txn_id
          })
          .eq('id', booking_id)
          .eq('user_id', user_id)
          .select()
          .single();

        if (updateResult?.error) {
          console.error('❌ Error updating combo purchase:', updateResult.error);
        } else if (updateResult?.data) {
          console.log('✅ Combo purchase updated to PAID');
          
          // EXPLOSION: Create individual event registrations from combo
          const comboPurchase = updateResult.data;
          const selectedEventIds = comboPurchase.selected_event_ids;
          
          // Get team data and created team IDs from payment record
          const teamDataFromPayment = paymentRecord.gateway_payload?.team_data;
          const createdTeams = paymentRecord.gateway_payload?.created_teams;
          console.log('🎯 Team data from payment:', teamDataFromPayment);
          console.log('🎯 Created teams from payment:', createdTeams);
          
          if (selectedEventIds && Array.isArray(selectedEventIds) && selectedEventIds.length > 0) {
            console.log('💥 Exploding combo into', selectedEventIds.length, 'event registrations');
            
            // Fetch event details to identify team events
            const { data: eventsData } = await supabase
              .from('events')
              .select('id, name, title, min_team_size, max_team_size')
              .in('id', selectedEventIds);
            
            const eventsMap = {};
            (eventsData || []).forEach(e => { eventsMap[e.id] = e; });
            
            // Create registrations for all selected events in the combo
            const registrations = [];
            const teamsToActivate = [];
            
            for (const eventId of selectedEventIds) {
              const event = eventsMap[eventId];
              const isTeamEvent = event && (event.min_team_size > 1 || event.max_team_size > 1);
              const teamInfo = teamDataFromPayment?.[eventId];
              const createdTeamId = createdTeams?.[eventId];
              
              // If it's a team event with a created team, mark for activation
              if (isTeamEvent && createdTeamId) {
                console.log(`🏆 Team to activate for event ${event.name || event.title}: ${createdTeamId}`);
                teamsToActivate.push({
                  teamId: createdTeamId,
                  eventId: eventId,
                  teamName: teamInfo?.teamName
                });
              }
              
              // Create registration record
              registrations.push({
                user_id: user_id,
                event_id: eventId,
                event_name: event.name || event.title,
                payment_status: 'PAID',
                transaction_id: payment_id || txn_id,
                combo_purchase_id: booking_id
              });
            }
            
            // Activate teams that were created during payment initiation
            for (const teamData of teamsToActivate) {
              try {
                const { error: activateError } = await supabase
                  .from('teams')
                  .update({ is_active: true })
                  .eq('id', teamData.teamId);
                
                if (activateError) {
                  console.error(`❌ Error activating team ${teamData.teamId}:`, activateError);
                } else {
                  console.log(`✅ Team activated: ${teamData.teamName} (ID: ${teamData.teamId})`);
                }
              } catch (err) {
                console.error(`❌ Exception activating team:`, err);
              }
            }

            const { error: regError } = await supabase
              .from('event_registrations_config')
              .insert(registrations);

            if (regError) {
              console.error('❌ Error creating combo event registrations:', regError);
            } else {
              console.log('✅ Created', registrations.length, 'event registrations from combo');
              if (teamsToActivate.length > 0) {
                console.log('✅ Activated', teamsToActivate.length, 'teams for team events');
              }
              
              // Create admin notification
              const { data: userData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user_id)
                .single();

              await supabase.from('admin_notifications').insert({
                type: 'NEW_COMBO_REGISTRATION',
                title: 'New Combo Registration',
                message: `${userData?.full_name || 'User'} purchased combo with ${registrations.length} events`,
                data: {
                  user_id: user_id,
                  user_name: userData?.full_name,
                  combo_purchase_id: booking_id,
                  event_count: registrations.length,
                  amount: paymentRecord.amount,
                  transaction_id: payment_id || txn_id
                },
                is_read: false
              });
            }
          } else {
            console.warn('⚠️ No selected events found in combo purchase');
          }
        }
      } else if (booking_type === 'team') {
        // Get team data from payment record
        const teamData = paymentRecord.gateway_payload?.team_data;
        
        console.log('🔍 Processing team payment callback:', {
          team_id: teamData?.team_id,
          team_name: teamData?.team_name,
          event_id: teamData?.event_id,
          total_amount: teamData?.total_amount
        });
        
        if (!teamData) {
          console.error('❌ No team data found in payment record');
        } else {
          // Get all team members
          const { data: teamMembers, error: teamMembersError } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamData.team_id);

          console.log('👥 Team members fetched:', teamMembers?.length || 0);

          if (teamMembersError) {
            console.error('❌ Error fetching team members:', teamMembersError);
          } else if (!teamMembers || teamMembers.length === 0) {
            console.error('❌ No team members found for team:', teamData.team_id);
          } else {
              // Create registrations for unpaid team members only
              // First, fetch existing registrations for this specific team and event
              const { data: existingRegs, error: existingRegsErr } = await supabase
                .from('event_registrations_config')
                .select('user_id, transaction_id')
                .eq('event_id', teamData.event_id)
                .eq('event_name', teamData.team_name)
                .eq('payment_status', 'PAID');

              console.log('📋 Existing registrations:', existingRegs?.length || 0);

              if (existingRegsErr) {
                console.error('❌ Error fetching existing registrations:', existingRegsErr);
              }

              const existingUserIds = new Set((existingRegs || []).map(r => r.user_id));
              const pricePerMember = Number(teamData.price_per_member) || 0;
              const unpaidMembers = teamMembers.filter(member => !existingUserIds.has(member.user_id));
              
              console.log('💰 Payment details:', {
                totalMembers: teamMembers.length,
                alreadyPaid: existingUserIds.size,
                unpaidMembers: unpaidMembers.length,
                pricePerMember,
                totalAmount: teamData.total_amount
              });
              
              // Store the total payment amount for this transaction (e.g., ₹600 for 2 members)
              // This way each member's registration shows the full payment that was made
              const totalPaymentAmount = Number(teamData.total_amount) || (pricePerMember * unpaidMembers.length);
              
              const registrations = unpaidMembers.map(member => ({
                user_id: member.user_id,
                event_id: teamData.event_id,
                event_name: teamData.event_name_real || teamData.team_name,
                payment_status: 'PAID',
                payment_amount: totalPaymentAmount,
                transaction_id: payment_id || txn_id
              }));
              
              console.log('📝 Creating registrations:', registrations.length);

              let regError = null;
              if (registrations.length > 0) {
                console.log('💾 Inserting registrations into database...');
                const insertResult = await supabase
                  .from('event_registrations_config')
                  .insert(registrations)
                  .select();
                regError = insertResult.error;
                
                if (insertResult.data) {
                  console.log('✅ Registrations created successfully:', insertResult.data.length);
                }
              } else {
                console.log('⚠️ No new registrations needed - all members already registered');
              }

              if (regError) {
                console.error('❌ Error creating team registrations:', regError);
                console.error('❌ Error details:', JSON.stringify(regError, null, 2));
              } else {
                if (teamData.team_id) {
                     // Update Team Stats (Active, Amount, Members)
                     const { data: currentTeam } = await supabase
                        .from('teams')
                        .select('is_active, total_paid_amount, paid_members')
                        .eq('id', teamData.team_id)
                        .single();
                     
                     const currentAmount = Number(currentTeam?.total_paid_amount || 0);
                     const currentMembers = Number(currentTeam?.paid_members || 0);
                     const newAmount = Number(teamData.total_amount || 0);
                     const newMembers = registrations.length;

                     await supabase.from('teams').update({ 
                         is_active: true, // Always ensure active on payment
                         total_paid_amount: currentAmount + newAmount,
                         paid_members: currentMembers + newMembers
                     }).eq('id', teamData.team_id);
                     
                     console.log(`✅ Updated team ${teamData.team_id}: Active=true, TotalPaid=${currentAmount + newAmount}`);
                }
                console.log(`✅ Team payment processed successfully: ${registrations.length} new registrations for team ${teamData.team_id}`);
                
                // Create admin notification
                const { data: userData } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', user_id)
                  .single();

                await supabase.from('admin_notifications').insert({
                  type: 'NEW_REGISTRATION',
                  title: 'New Team Registration',
                  message: `${teamData.team_name} (${registrations.length} members) registered for event. Payment by ${userData?.full_name || 'User'}`,
                  data: {
                    user_id: user_id,
                    team_id: teamData.team_id,
                    team_name: teamData.team_name,
                    event_id: teamData.event_id,
                    member_count: registrations.length,
                    amount: paymentRecord.amount,
                    transaction_id: payment_id || txn_id,
                    registration_type: 'team'
                  },
                  is_read: false
                });
              }
            }
          }
        } else if (booking_type === 'mixed_registration') {
            const mixedData = paymentRecord.gateway_payload?.mixed_data?.registrations || [];
            console.log('🔍 Processing Mixed Registration:', mixedData.length);
            
            const results = [];
            
            for (const item of mixedData) {
                 if (item.type === 'team') {
                     // Activate the team and update stats
                     if (item.team_id) {
                         const { data: mTeam } = await supabase.from('teams').select('total_paid_amount, paid_members').eq('id', item.team_id).single();
                         const mCurrentAmt = Number(mTeam?.total_paid_amount || 0);
                         const mCurrentMem = Number(mTeam?.paid_members || 0);
                         const mNewAmt = Number(item.amount || 0);
                         const mNewMem = Number(item.member_count || 1);

                         await supabase.from('teams').update({ 
                             is_active: true,
                             total_paid_amount: mCurrentAmt + mNewAmt,
                             paid_members: mCurrentMem + mNewMem
                         }).eq('id', item.team_id);
                         console.log(`✅ Activated mixed team ${item.team_id}: Amount=${mCurrentAmt + mNewAmt}`);
                     }
                     // Create registrations for members (currently only leader is in newly created team)
                     // But for Mixed reg, we just add the leader or whomever the current user is.
                     // IMPORTANT: Mixed reg usually implies paying for current user + creating team for others
                     // For now, register current user for the team event
                     
                     // Register Leader (Current User)
                      const { error: regErr } = await supabase.from('event_registrations_config').upsert({
                          user_id: user_id,
                          event_id: item.event_id,
                          event_name: item.real_event_name || item.team_name,
                          payment_status: 'PAID',
                          payment_amount: item.amount,
                          transaction_id: payment_id || txn_id
                      }, { onConflict: 'user_id, event_id' });
                      if(regErr) console.error("Error registering mixed team leader:", regErr);

                 } else {
                     // Individual
                      const { error: regErr } = await supabase.from('event_registrations_config').upsert({
                          user_id: user_id,
                          event_id: item.event_id,
                          event_name: item.real_event_name,
                          payment_status: 'PAID',
                          payment_amount: item.amount,
                          transaction_id: payment_id || txn_id
                      }, { onConflict: 'user_id, event_id' });
                      if(regErr) console.error("Error registering mixed individual:", regErr);
                 }
            }
             console.log("✅ Mixed registration processed");
        }

      if (updateResult?.error) {
        console.error("Error updating booking status:", updateResult.error);
      }
      
      console.log("✅ Payment successful, database updated");

      // Send Payment Success Email
      try {
        const email = paymentRecord.gateway_payload?.emailid;
        const name = paymentRecord.gateway_payload?.fullname || "User";
        
        if (email) {
            // Reconstruct items list for email
            let items = [];
            
            // Try to get more specific item details from payload if available
            if (booking_type === 'mixed_registration' && paymentRecord.gateway_payload?.mixed_data?.registrations) {
                paymentRecord.gateway_payload.mixed_data.registrations.forEach(reg => {
                     items.push({ 
                         name: reg.event_name ? `Event: ${reg.event_name}` : 'Event Registration',
                         price: reg.amount
                     });
                });
            } else if (booking_type === 'team' && paymentRecord.gateway_payload?.team_data) {
                const td = paymentRecord.gateway_payload.team_data;
                items.push({
                    name: `Team: ${td.team_name || 'Team Event'}`,
                    price: td.total_amount || paymentRecord.amount
                });
            } else if (booking_type === 'event') {
                // If single event, we might not have event name in payload top level easily, generic fallback:
                items.push({ name: 'Event Registration', price: paymentRecord.amount });
            } else if (booking_type === 'lunch') {
                 items.push({ name: 'Lunch Booking', price: paymentRecord.amount });
            } else if (booking_type === 'accommodation') {
                 items.push({ name: 'Accommodation', price: paymentRecord.amount });
            } else {
                 // Fallback
                 items.push({ name: `${booking_type.charAt(0).toUpperCase() + booking_type.slice(1)} Booking`, price: paymentRecord.amount });
            }

            // Fetch additional profile details for email
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('department, year, college_name, mobile_number')
                .eq('id', paymentRecord.user_id)
                .single();

            await sendPaymentSuccessEmail(email, name, {
                amount: paymentRecord.amount,
                transactionId: payment_id || txn_id,
                orderId: order_id,
                date: new Date().toLocaleDateString('en-IN'),
                items: items,
                userId: paymentRecord.user_id,
                phone: paymentRecord.gateway_payload?.mobileno || userProfile?.mobile_number,
                college: paymentRecord.gateway_payload?.clg || userProfile?.college_name,
                department: userProfile?.department || 'N/A',
                year: userProfile?.year || 'N/A',
                teamName: paymentRecord.gateway_payload?.team_data?.team_name || 'N/A'
            });
            console.log("✅ Payment success email sent to:", email);
        } else {
             console.log("⚠️ No email found in payload, skipping email.");
        }
      } catch (err) {
        console.error("❌ Failed to send payment email:", err);
      }

      // 🎁 Referral Count Increment Logic
      // After successful payment, check if user has a referred_by code and increment the referral count
      try {
        const { data: userProfileForReferral } = await supabase
          .from('profiles')
          .select('referred_by')
          .eq('id', paymentRecord.user_id)
          .single();

        if (userProfileForReferral && userProfileForReferral.referred_by) {
          const referralCode = userProfileForReferral.referred_by.trim();
          console.log(`🎁 User has referral code: ${referralCode}. Checking referral_code table...`);

          // Check if this referral code exists in the referral_code table
          const { data: existingReferral, error: referralFetchErr } = await supabase
            .from('referral_code')
            .select('referral_id, usage_count')
            .eq('referral_id', referralCode)
            .maybeSingle();

          if (referralFetchErr) {
            console.error("❌ Error fetching referral code:", referralFetchErr);
          } else if (existingReferral) {
            // Referral code exists - increment usage_count by 1
            const newCount = (existingReferral.usage_count || 0) + 1;
            
            const { error: updateErr } = await supabase
              .from('referral_code')
              .update({ usage_count: newCount })
              .eq('referral_id', referralCode);

            if (updateErr) {
              console.error("❌ Error updating referral count:", updateErr);
            } else {
              console.log(`✅ Referral count incremented for ${referralCode}: ${existingReferral.usage_count} → ${newCount}`);
            }
          } else {
            // Referral code not found in table - skip (it might be an invalid code or not tracked)
            console.log(`⚠️ Referral code ${referralCode} not found in referral_code table. Skipping increment.`);
          }
        } else {
          console.log("ℹ️ User has no referral code. Skipping referral increment.");
        }
      } catch (referralErr) {
        console.error("❌ Error processing referral increment:", referralErr);
        // Don't fail the payment callback if referral tracking fails
      }

      // Localhost notification removed as per request
      console.log("✅ Payment successful handling complete.");
    } else {
      // Payment FAILED (or any status other than SUCCESS)
      console.log(`⚠️ Payment not successful (Status: ${paymentStatus}). Updating booking status to FAILED.`);

      const { booking_id, booking_type, user_id } = paymentRecord;
      let failUpdateResult;

      // Update booking status to FAILED
      if (booking_type === 'accommodation') {
        failUpdateResult = await supabase
          .from('accommodation_requests')
          .update({ 
            payment_status: 'FAILED',
            payment_id: payment_id || txn_id
          })
          .eq('id', booking_id)
          .eq('user_id', user_id);
      } else if (booking_type === 'lunch') {
        failUpdateResult = await supabase
          .from('lunch_bookings')
          .update({ 
            payment_status: 'FAILED',
            payment_id: payment_id || txn_id
          })
          .eq('id', booking_id)
          .eq('user_id', user_id);
      } else if (booking_type === 'event') {
        // Find batch ID if exists
        const { data: firstReg } = await supabase
          .from('event_registrations_config')
          .select('transaction_id')
          .eq('id', booking_id)
          .maybeSingle();

        const batchId = firstReg?.transaction_id;
        let updateQuery = supabase
          .from('event_registrations_config')
          .update({ 
            payment_status: 'FAILED',
            transaction_id: payment_id || txn_id
          })
          .eq('user_id', user_id);

        if (batchId && batchId.startsWith('BATCH_')) {
          updateQuery = updateQuery.eq('transaction_id', batchId);
        } else {
          updateQuery = updateQuery.eq('id', booking_id);
        }

        failUpdateResult = await updateQuery;
      } else if (booking_type === 'combo') {
        failUpdateResult = await supabase
          .from('combo_purchases')
          .update({ 
            payment_status: 'FAILED',
            transaction_id: payment_id || txn_id
          })
          .eq('id', booking_id)
          .eq('user_id', user_id);
      } else if (booking_type === 'team') {
          // No complex logic for team failure, just logging mainly as they are created on fly usually
          // For now, no specific table update for generic 'team' type unless we tracked a specific request ID
          // But based on paymentRecord, we might not have a specific single row to update to failed 
          // if registrations weren't created yet.
          console.log("Team payment failed. No specific pre-booking row to update to FAILED.");
      } else if (booking_type === 'mixed_registration') {
          console.log("Mixed payment failed. No specific pre-booking row to update to FAILED.");
      }

      if (failUpdateResult?.error) {
           console.error("❌ Error updating DB to FAILED:", failUpdateResult.error);
      } else {
           console.log("✅ DB updated to FAILED status.");
      }
      
      // Localhost notification removed as per request
      console.log("⚠️ Payment failure handling complete.");
    }

    // Finally return response
    if (req.method === 'GET') {
       const dbUpdated = paymentStatus === 'SUCCESS' && !updateResult?.error;
       const redirectUrl = `https://dakshaa.ksrct.ac.in/dashboard/registrations`;

       // Return Redirect HTML
       return res.send(`
        <html>
          <head>
            <title>Payment Status</title>
            <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
            <style>
              body { font-family: sans-serif; text-align: center; padding: 40px; }
              .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 20px auto; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <h1>Payment Processed</h1>
            <div class="loader"></div>
            <p>Your payment has been recorded. Redirecting you...</p>
            <p>If you are not redirected automatically, <a href="${redirectUrl}">click here</a>.</p>
          </body>
        </html>
      `);
    } else {
       res.json({ received: true, status: paymentStatus });
    }

  } catch (error) {
    console.error("❌ Payment callback error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
/* 🟢 Admin Dashboard - Registration Stats */
app.get("/api/admin/registration-stats", async (req, res) => {
  try {
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, event_id, name')
      .eq('is_active', true);

    if (eventsError) throw eventsError;

    // Get all PAID registrations
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations_config')
      .select('event_id, event_name, payment_status')
      .eq('payment_status', 'PAID');

    if (regError) throw regError;

    // Count registrations per event_id
    const countMap = {};
    registrations.forEach(reg => {
      countMap[reg.event_id] = (countMap[reg.event_id] || 0) + 1;
    });

    // Match counts with events
    const results = events.map(event => ({
      name: event.name,
      id: event.id,
      event_id: event.event_id,
      registrations: countMap[event.id] || 0,
      registrations_by_text_id: countMap[event.event_id] || 0
    }));

    res.json({
      success: true,
      total_events: events.length,
      total_paid_registrations: registrations.length,
      events: results,
      raw_count_map: countMap
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/* 🟢 Finance Dashboard API - Bypass RLS */
app.get("/api/admin/finance", async (req, res) => {
  try {
    // In a production app, verify the Authorization header JWT here
    // For now, we assume the frontend protects the route via ProtectedRoute
    
    // Fetch registrations
    const { data: regs, error } = await supabase
      .from('event_registrations_config')
      .select(`
        *,
        profiles (full_name, college_name),
        events (event_id, category, price)
      `)
      .order('registered_at', { ascending: false });

    if (error) throw error;

    // Process Stats
    let total = 0;
    let online = 0;
    let cash = 0;
    let pending = 0;
    
    const categories = {};
    const hourly = {};

    const processedRegs = regs.map(reg => {
       const price = Number(reg.payment_amount) || Number(reg.events?.price) || 0;
       const status = (reg.payment_status || 'pending').toLowerCase();
       const mode = reg.transaction_id ? 'online' : 'cash';

       if (status === 'paid' || status === 'completed' || status === 'approved') {
         total += price;
         if (mode === 'online') online += price;
         else cash += price;

         const cat = reg.registration_type === 'combo' ? 'Combo' : (reg.events?.category || reg.event_name || 'Other');
         categories[cat] = (categories[cat] || 0) + price;
       } else if ((status === 'pending' || status === 'initiated') && mode === 'cash') {
         pending += price;
       }
       
       if (reg.registered_at) {
          const hour = new Date(reg.registered_at).getHours();
          hourly[hour] = (hourly[hour] || 0) + 1;
       }

       return {
         ...reg,
         created_at: reg.registered_at, 
         payment_id: reg.transaction_id, 
         booking_id: reg.transaction_id,
         payment_mode: mode
       };
    });

    const categoryData = Object.keys(categories).map(name => ({
      name,
      value: categories[name]
    }));

     const hourlyData = Object.keys(hourly).map(hour => ({
        hour: `${hour}:00`,
        count: hourly[hour]
      }));

    res.json({
      success: true,
      stats: {
        totalRevenue: total,
        onlineRevenue: online,
        cashRevenue: cash,
        pendingCash: pending,
        totalRegistrations: regs.length
      },
      transactions: processedRegs,
      categoryData,
      hourlyData
    });

  } catch (error) {
    console.error('Finance API Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch finance data' });
  }
});

/* 🟢 Team Events Combo Visibility API Endpoints */

// Get combo visibility setting for team events
app.get("/api/admin/team-events-combo-visibility", async (req, res) => {
  try {
    // Check if there's a global setting in a settings table, if not return default (false)
    const { data: setting, error } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'team_events_in_combo_packages')
      .single();

    // If no setting exists, default to false (team events not visible in combo)
    const visibility = setting?.setting_value === 'true' || false;
    
    res.json({
      success: true,
      team_events_in_combo_visible: visibility
    });
  } catch (error) {
    console.error('Error fetching team events combo visibility:', error);
    res.json({
      success: true,
      team_events_in_combo_visible: false // Default to hidden
    });
  }
});

// Toggle combo visibility for team events
app.post("/api/admin/toggle-team-events-combo-visibility", async (req, res) => {
  try {
    const { visible } = req.body;
    
    // First check if setting exists
    const { data: existingSetting } = await supabase
      .from('admin_settings')
      .select('id')
      .eq('setting_key', 'team_events_in_combo_packages')
      .single();

    if (existingSetting) {
      // Update existing setting
      const { error: updateError } = await supabase
        .from('admin_settings')
        .update({ 
          setting_value: visible ? 'true' : 'false',
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'team_events_in_combo_packages');
        
      if (updateError) throw updateError;
    } else {
      // Create new setting
      const { error: insertError } = await supabase
        .from('admin_settings')
        .insert({
          setting_key: 'team_events_in_combo_packages',
          setting_value: visible ? 'true' : 'false',
          setting_description: 'Controls whether team events are visible in combo packages'
        });
        
      if (insertError) throw insertError;
    }

    res.json({
      success: true,
      message: `Team events in combo packages ${visible ? 'enabled' : 'disabled'}`,
      team_events_in_combo_visible: visible
    });
  } catch (error) {
    console.error('Error toggling team events combo visibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update team events combo visibility'
    });
  }
});

// Get events for combo creation with visibility filter
app.get("/api/admin/events-for-combo", async (req, res) => {
  try {
    // Get team events visibility setting
    const { data: setting } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'team_events_in_combo_packages')
      .single();

    const showTeamEvents = setting?.setting_value === 'true' || false;
    
    let query = supabase
      .from('events')
      .select('id, name, event_key, category, min_team_size, max_team_size, price')
      .eq('is_active', true);
    
    // If team events are not allowed in combos, filter them out
    if (!showTeamEvents) {
      query = query.or('min_team_size.is.null,min_team_size.lte.1')
                  .or('max_team_size.is.null,max_team_size.lte.1');
    }

    const { data: events, error } = await query.order('name');
    
    if (error) throw error;

    res.json({
      success: true,
      data: events || [],
      team_events_visible: showTeamEvents
    });
  } catch (error) {
    console.error('Error fetching events for combo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events for combo'
    });
  }
});

/* 🟢 Team Management API Endpoints */

// Get team statistics
app.get("/api/admin/teams/statistics", async (req, res) => {
  try {
    const { event_id, user_id } = req.query;

    // Get user role if user_id is provided
    let userRole = null;
    let accessibleEvents = [];
    let assignedEventsCount = 0;
    
    if (user_id) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, department, email, full_name')
          .eq('id', user_id)
          .single();
        
        if (profile) {
          userRole = profile.role?.toLowerCase();
          
          // Get accessible events for coordinators
          if (userRole === 'event_coordinator') {
            // For event coordinators, get ALL active events (they coordinate multiple events)
            // In a real system, you'd filter by coordinator assignment
            const { data: events } = await supabase
              .from('events')
              .select('id, name')
              .eq('is_active', true);
            
            accessibleEvents = events?.map(e => e.id) || [];
            assignedEventsCount = accessibleEvents.length;
            
            console.log(`Event Coordinator ${profile.email} has access to ${assignedEventsCount} events:`, events?.map(e => e.name));
          } else if (userRole === 'super_admin' || userRole === 'admin') {
            const { data: events } = await supabase
              .from('events')
              .select('id, name')
              .eq('is_active', true);
            
            accessibleEvents = events?.map(e => e.id) || [];
            assignedEventsCount = accessibleEvents.length;
          }
        }
      } catch (error) {
        console.log('Error getting user profile:', error.message);
      }
    }

    // Build queries
    let teamsQuery = supabase
      .from('teams')
      .select('id', { count: 'exact', head: true });
    
    let membersQuery = supabase
      .from('team_members')
      .select('id, teams!inner(event_id)', { count: 'exact', head: true });
    
    let paidTeamsQuery = supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    
    let revenueQuery = supabase
      .from('teams')
      .select('total_paid_amount')
      .eq('is_active', true);

    if (event_id) {
      teamsQuery = teamsQuery.eq('event_id', event_id);
      membersQuery = membersQuery.eq('teams.event_id', event_id);
      paidTeamsQuery = paidTeamsQuery.eq('event_id', event_id);
      revenueQuery = revenueQuery.eq('event_id', event_id);
    } else if (userRole === 'event_coordinator' && accessibleEvents.length > 0) {
      teamsQuery = teamsQuery.in('event_id', accessibleEvents);
      membersQuery = membersQuery.in('teams.event_id', accessibleEvents);
      paidTeamsQuery = paidTeamsQuery.in('event_id', accessibleEvents);
      revenueQuery = revenueQuery.in('event_id', accessibleEvents);
    }

    const [teamsRes, membersRes, paidRes, revRes] = await Promise.all([
      teamsQuery,
      membersQuery,
      paidTeamsQuery,
      revenueQuery
    ]);

    if (teamsRes.error) throw teamsRes.error;
    if (membersRes.error) throw membersRes.error;
    if (paidRes.error) throw paidRes.error;
    if (revRes.error) throw revRes.error;

    const teamsCount = teamsRes.count || 0;
    const membersCount = membersRes.count || 0;
    const paidTeamsCount = paidRes.count || 0;
    
    let revenue = 0;
    if (revRes.data) {
      revenue = revRes.data.reduce((sum, team) => {
        return sum + (parseFloat(team.total_paid_amount) || 0);
      }, 0);
    }

    res.json({
      success: true,
      data: {
        team_count: teamsCount,
        paid_team_count: paidTeamsCount,
        leader_count: teamsCount,
        member_count: membersCount,
        total_revenue: revenue,
        assigned_events_count: assignedEventsCount,
        user_role: userRole
      }
    });
  } catch (error) {
    console.error('Error fetching team statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all teams with members
app.get("/api/admin/teams", async (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
      event_id,
      only_paid = false,
      user_id
    } = req.query;

    // Get user role if user_id is provided
    let userRole = null;
    let accessibleEvents = null;
    
    if (user_id) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, department, email, full_name')
          .eq('id', user_id)
          .single();
        
        if (profile) {
          userRole = profile.role?.toLowerCase();
          console.log(`User ${profile.email} has role: ${userRole}`);
          
          // If event coordinator, get their accessible events
          if (userRole === 'event_coordinator') {
            // For now, allowing all events for coordinators
            // You can modify this logic based on your requirements
            const { data: events } = await supabase
              .from('events')
              .select('id, name')
              .eq('is_active', true);
            
            accessibleEvents = events?.map(e => e.id) || [];
            console.log(`Event coordinator ${profile.email} has access to ${accessibleEvents.length} events:`, events?.map(e => e.name));
          }
        }
      } catch (error) {
        console.log('Error getting user profile:', error.message);
      }
    }

    // Build teams query
    let query = supabase
      .from('teams')
      .select('*');

    console.log('Query parameters:', { event_id, user_id, userRole, accessibleEvents: accessibleEvents?.length });

    if (event_id) {
      query = query.eq('event_id', event_id);
      console.log('Filtering by event_id:', event_id);
    } else if (userRole === 'event_coordinator' && accessibleEvents && accessibleEvents.length > 0) {
      // Filter teams by accessible events for coordinators
      query = query.in('event_id', accessibleEvents);
      console.log('Filtering coordinator accessible events:', accessibleEvents);
    }

    if (only_paid === 'true') {
      query = query.eq('is_active', true);
    }

    const { data: teams, error: teamsError } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (teamsError) throw teamsError;

    console.log(`Found ${teams?.length || 0} teams`);

    if (!teams || teams.length === 0) {
      return res.json({
        success: true,
        data: [],
        user_role: userRole
      });
    }

    const teamIds = teams.map(team => team.id);
    const leaderIds = teams.map(team => team.leader_id).filter(Boolean);

    // Fetch team members with profiles - matching the Python reference
    const { data: members } = await supabase
      .from('team_members')
      .select(`
        *,
        profiles(
          full_name,
          mobile_number,
          email
        )
      `)
      .in('team_id', teamIds);

    console.log(`Found ${members?.length || 0} team members for ${teamIds.length} teams`);

    // Fetch leader profiles for ALL leader_ids to ensure we have them even if not in members list
    const { data: leaderProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, mobile_number, email')
      .in('id', leaderIds);

    // Group members by team_id and create leader profiles map
    const membersMap = {};
    const leaderProfilesMap = {};
    
    // Process members data
    members?.forEach(member => {
      const teamId = member.team_id;
      if (!membersMap[teamId]) {
        membersMap[teamId] = [];
      }
      
      membersMap[teamId].push({
        id: member.id,
        user_id: member.user_id,
        full_name: member.profiles?.full_name || 'Unknown User',
        mobile: member.profiles?.mobile_number || '',
        email: member.profiles?.email || '',
        role: member.role,
        joined_at: member.joined_at
      });
    });

    // Create leader profiles map
    leaderProfiles?.forEach(profile => {
      leaderProfilesMap[profile.id] = profile;
    });

    // For each team, also fetch registered participants from event_registrations_config
    // to match team members with actual event registrations
    const teamMembersWithRegistrations = {};
    
    for (const team of teams) {
      if (team.event_id) {
        try {
          // Get event registrations for this event
          const { data: registrations } = await supabase
            .from('event_registrations_config')
            .select(`
              user_id,
              payment_status,
              payment_amount,
              profiles(
                full_name,
                mobile_number,
                email
              )
            `)
            .eq('event_id', team.event_id)
            .eq('payment_status', 'PAID'); // Only get paid registrations

          if (registrations) {
            // Match team members with event registrations
            const teamMembers = membersMap[team.id] || [];
            const registeredMembers = [];
            
            teamMembers.forEach(member => {
              const registration = registrations.find(reg => reg.user_id === member.user_id);
              if (registration) {
                registeredMembers.push({
                  ...member,
                  payment_status: registration.payment_status,
                  payment_amount: registration.payment_amount,
                  // Use registration profile data as fallback
                  full_name: member.full_name || registration.profiles?.full_name || 'Unknown User',
                  mobile: member.mobile || registration.profiles?.mobile_number || '',
                  email: member.email || registration.profiles?.email || ''
                });
              } else {
                // Include team member even if not in registrations (might be unpaid)
                registeredMembers.push(member);
              }
            });
            
            teamMembersWithRegistrations[team.id] = registeredMembers;
          } else {
            teamMembersWithRegistrations[team.id] = membersMap[team.id] || [];
          }
        } catch (error) {
          console.log('Error fetching registrations for team:', team.id, error.message);
          teamMembersWithRegistrations[team.id] = membersMap[team.id] || [];
        }
      } else {
        teamMembersWithRegistrations[team.id] = membersMap[team.id] || [];
      }
    }

    // Process teams data
    const processedTeams = await Promise.all(
      teams.map(async (team) => {
        // Get team members with registrations
        const teamMembers = teamMembersWithRegistrations[team.id] || [];
        
        // Resolve event information
        let eventName = 'Unknown Event';
        let realEventId = team.event_id;
        
        if (team.event_id) {
          try {
            const { data: event } = await supabase
              .from('events')
              .select('id, name, price')
              .eq('id', team.event_id)
              .single();
            
            if (event) {
              eventName = event.name;
              realEventId = event.id;
            }
          } catch (error) {
            console.log('Event lookup failed for ID:', team.event_id, error.message);
          }
        }

        // Get leader information - prioritize team.leader_id lookup
        let leaderName = null;
        let leaderMobile = null;
        let leaderEmail = null;

        // 1. Try direct lookup from profiles table fetch (most accurate to "leader_id")
        if (team.leader_id) {
          const leaderProfile = leaderProfilesMap[team.leader_id];
          if (leaderProfile) {
            leaderName = leaderProfile.full_name;
            leaderMobile = leaderProfile.mobile_number;
            leaderEmail = leaderProfile.email;
          }
        }

        // 2. Fallback: created_by lookup in members
        if (!leaderName && team.created_by) {
          const creatorMember = teamMembers.find(m => m.user_id === team.created_by);
          if (creatorMember) {
            leaderName = creatorMember.full_name;
            leaderMobile = creatorMember.mobile;
            leaderEmail = creatorMember.email;
          }
        }

        // 3. Fallback: role='leader' in members
        if (!leaderName) {
          const leaderMember = teamMembers.find(m => m.role === 'leader');
          if (leaderMember) {
            leaderName = leaderMember.full_name;
            leaderMobile = leaderMember.mobile;
            leaderEmail = leaderMember.email;
          }
        }

        // Sort members (leaders first)
        teamMembers.sort((a, b) => {
          if (a.role === 'leader' && b.role !== 'leader') return -1;
          if (a.role !== 'leader' && b.role === 'leader') return 1;
          return 0;
        });

        // Create member names list for display (like in the reference image)
        const memberNames = teamMembers
          .filter(m => m.role !== 'leader') // Exclude leader from members list
          .map(m => `${m.full_name} (member)`)
          .join(', ');

        const leaderDisplay = teamMembers
          .filter(m => m.role === 'leader')
          .map(m => `${m.full_name} (leader)`)
          .join(', ');

        console.log(`Team ${team.team_name}: Leader=${leaderName}, Members=${memberNames}`);

        return {
          ...team,
          name: team.team_name || 'Unnamed Team',
          event_name: eventName,
          real_event_id: realEventId,
          leader_name: leaderName,
          leader_mobile: leaderMobile,
          leader_email: leaderEmail,
          member_count: teamMembers.length,
          members_list: teamMembers,
          member_names: memberNames, // For display like "Jithya.s (member), Jayashree (member)"
          leader_display: leaderDisplay, // For display like "Kanika M (leader)"
          payment_amount: parseFloat(team.total_paid_amount) || 0,
          leader_payment_status: team.is_active ? 'PAID' : 'PENDING',
          payment_status: team.is_active ? 'PAID' : 'PENDING'
        };
      })
    );

    res.json({
      success: true,
      data: processedTeams,
      user_role: userRole,
      total_accessible_events: accessibleEvents?.length || 'all'
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get team members
app.get("/api/admin/teams/:teamId/members", async (req, res) => {
  try {
    const { teamId } = req.params;
    const { event_id } = req.query;

    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('role', { ascending: false })
      .order('joined_at');

    if (membersError) throw membersError;

    if (!members || members.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Process each member
    const processedMembers = await Promise.all(
      members.map(async (member) => {
        let profile = {};
        let paymentInfo = {
          payment_status: 'PENDING',
          payment_amount: 0,
          transaction_id: null,
          reg_id: null
        };

        // Fetch profile information
        if (member.user_id) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email, mobile_number, college_name')
              .eq('id', member.user_id)
              .single();
            
            if (profileData) {
              profile = profileData;
            }
          } catch (error) {
            console.log('Profile lookup failed:', error.message);
          }

          // Fetch payment status if event_id provided
          if (event_id) {
            try {
              const { data: registration } = await supabase
                .from('event_registrations_config')
                .select('*')
                .eq('event_id', event_id)
                .eq('user_id', member.user_id)
                .single();
              
              if (registration) {
                paymentInfo = {
                  payment_status: registration.payment_status || 'PENDING',
                  payment_amount: registration.payment_amount || 0,
                  transaction_id: registration.transaction_id,
                  reg_id: registration.id
                };
              }
            } catch (error) {
              console.log('Payment lookup failed:', error.message);
            }
          }
        }

        return {
          ...member,
          full_name: profile.full_name || 'Unknown User',
          email: profile.email || '',
          mobile_number: profile.mobile_number || '',
          college_name: profile.college_name || '',
          ...paymentInfo
        };
      })
    );

    res.json({
      success: true,
      data: processedMembers
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start Server
/* 🟢 Route to Fetch Schedule Data */
app.get("/api/schedule", async (req, res) => {
  try {
    const { userId } = req.query;
    console.log(`📅 Fetching schedule for userId: ${userId || 'Guest'}`);

    // 1. Fetch all active events with schedule info
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, event_id, name, venue, category, event_date, start_time, coordinator_name, coordinator_contact')
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    // 2. If userId is provided, fetch user registrations to mark "My Events"
    let myRegisteredEventIds = new Set();
    if (userId) {
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('event_id')
        .eq('user_id', userId);
        
       if (!regError && registrations) {
           registrations.forEach(r => {
             if (r.event_id) myRegisteredEventIds.add(r.event_id);
           });
       }
       console.log(`📅 Found ${myRegisteredEventIds.size} registrations for user`);
    }

    // 3. Helper Functions
    const formatTime = (timeStr) => {
        if (!timeStr) return 'TBA';
        try {
          // Handle ISO string or simple time string
          let timeOnly = timeStr;
          if (timeStr.includes('T')) {
             timeOnly = timeStr.split('T')[1];
          }
          
          const [hours, minutes] = timeOnly.split(':');
          const h = parseInt(hours);
          const ampm = h >= 12 ? 'PM' : 'AM';
          const h12 = h % 12 || 12; 
          return `${h12}:${minutes} ${ampm}`;
        } catch (e) {
          return timeStr;
        }
    };

    const formatCategory = (cat) => {
        if (!cat) return 'General';
        // Capitalize first letter
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    };

    // Explicit Date Mapping Logic
    const getDayFromDate = (dateStr) => {
        if (!dateStr) return null;
        // Normalize date string (take YYYY-MM-DD part), trim whitespace
        const datePart = typeof dateStr === 'string' ? dateStr.trim().split('T')[0] : '';
        
        if (datePart === '2026-02-12') return 1;
        if (datePart === '2026-02-13') return 2;
        if (datePart === '2026-02-14') return 3;
        
        return null; 
    };

    // 4. Transform data structure
    const schedule = {};
    schedule[1] = [];
    schedule[2] = [];
    schedule[3] = [];

    events.forEach(event => {
        const day = getDayFromDate(event.event_date);
        
        if (day) {
            // Check matches against UUID (id) OR Text ID (event_id)
            const isMyEvent = userId ? (
              myRegisteredEventIds.has(event.event_id) || 
              myRegisteredEventIds.has(event.id)
            ) : false;

            schedule[day].push({
                time: formatTime(event.start_time),
                name: event.name,
                venue: event.venue || 'TBA',
                category: formatCategory(event.category),
                coordinator: event.coordinator_name || 'Coordinator',
                phone: event.coordinator_contact || '',
                isMyEvent: isMyEvent
            });
        }
    });

    res.json({ success: true, schedule });

  } catch (error) {
    console.error('Error in /api/schedule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* 🔐 FORGOT PASSWORD ROUTES */

// Send OTP for password reset
app.post("/forgot-password/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required" 
      });
    }

    // Check if user exists in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .single();
    
    if (profileError || !profileData) {
      console.error('Error checking user in profiles:', profileError);
      return res.status(404).json({ 
        success: false, 
        error: "No account found with this email address" 
      });
    }

    const user = profileData;

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

    // Get client IP and user agent for security
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('password_reset_otp')
      .insert({
        email: email,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to generate OTP" 
      });
    }

    // Get user's name from profiles data (already fetched)
    const userName = user?.full_name || 'User';

    // Send OTP email
    const emailResult = await sendOTPEmail(email, userName, otpCode);
    
    if (!emailResult.success) {
      console.error('Error sending OTP email:', emailResult.error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to send OTP email" 
      });
    }

    res.json({ 
      success: true, 
      message: "OTP sent successfully to your email" 
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
});

// Verify OTP
app.post("/forgot-password/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        error: "Email and OTP are required" 
      });
    }

    // Find and validate OTP
    const { data: otpData, error: otpError } = await supabase
      .from('password_reset_otp')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .eq('is_verified', false)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      // Increment attempts for rate limiting
      await supabase
        .from('password_reset_otp')
        .update({ attempts: supabase.raw('attempts + 1') })
        .eq('email', email)
        .eq('otp_code', otp);

      return res.status(400).json({ 
        success: false, 
        error: "Invalid or expired OTP" 
      });
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('password_reset_otp')
      .update({ is_verified: true })
      .eq('id', otpData.id);

    if (updateError) {
      console.error('Error updating OTP:', updateError);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to verify OTP" 
      });
    }

    res.json({ 
      success: true, 
      message: "OTP verified successfully" 
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
});

// Reset password
app.post("/forgot-password/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: "Email, OTP, and new password are required" 
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: passwordValidation.errors.join('. ') 
      });
    }

    // Verify OTP is valid and verified
    const { data: otpData, error: otpError } = await supabase
      .from('password_reset_otp')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .eq('is_verified', true)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid or expired OTP" 
      });
    }

    // Get user from profiles table first to get the auth user ID
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .single();
    
    if (profileError || !profileData) {
      console.error('Error getting user from profiles:', profileError);
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Update password using Supabase Auth Admin API
    const { error: resetError } = await supabase.auth.admin.updateUserById(
      profileData.id, 
      { password: newPassword }
    );

    if (resetError) {
      console.error('Error resetting password:', resetError);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to reset password" 
      });
    }

    // Mark OTP as used
    await supabase
      .from('password_reset_otp')
      .update({ is_used: true })
      .eq('id', otpData.id);

    res.json({ 
      success: true, 
      message: "Password reset successfully" 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
});

// Password validation function
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});//on 24-01-2026
