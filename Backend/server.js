const express = require("express");
const { v4: uuidv4 } = require("uuid"); // Import UUID generator
const supabase = require("./db"); // Import Supabase connection
const cors = require('cors');
const { sendWelcomeEmail } = require('./emailService');
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
    
    // 🏷️ Calculate price: ₹300 per day
    const number_of_days = accommodation_dates.length;
    const accommodation_price = number_of_days * 300;

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
    
    // Validate required fields
    // Note: 'team' and 'mixed_registration' types may not have booking_id initially
    if (!user_id || !booking_type) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: user_id, booking_type" 
      });
    }
    
    // booking_id is required for non-team, non-mixed types
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
            // Use correct column names: team_name, created_by (required), max_members
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
              console.error('Team insert error details:', JSON.stringify(teamErr, null, 2));
              // Continue with other teams, don't fail the whole request
            } else {
              console.log(`✅ Created inactive team: ${newTeam.team_name} (ID: ${newTeam.id})`);
              
              // Add leader to team_members
              const { error: memberErr } = await supabase.from('team_members').insert({
                team_id: newTeam.id,
                user_id: user_id,
                role: 'leader',
                status: 'joined'
              });
              
              if (memberErr) {
                console.error('Failed to add leader to team_members:', memberErr);
              }
              
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
      // payload: { registrations: [ { type: 'individual', event_id }, { type: 'team', event_id, team_name, member_count } ] }
      
      const { registrations } = req.body;
      if (!Array.isArray(registrations) || registrations.length === 0) {
        return res.status(400).json({ success: false, error: "Invalid mixed registrations payload" });
      }

      let totalCalculatedAmount = 0;
      let processedRegistrations = [];
      // To prevent concurrency issues or price tampering, re-fetch all prices
      const eventIds = registrations.map(r => r.event_id);
      const { data: eventsData, error: eventsErr } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds); // Assuming event_id is UUID/id

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
           if (!count || count < (event.min_team_size || 1)) {
              return res.status(400).json({success:false, error: `Invalid count for team event ${event.title}`});
           }
           const itemTotal = price * count;
           totalCalculatedAmount += itemTotal;

           // Create Inactive Team NOW
           const { data: newTeam, error: teamErr } = await supabase
             .from('teams')
             .insert({
                team_name: item.team_name,
                event_id: item.event_id,
                leader_id: user_id,
                created_by: user_id, // Required for RLS policies
                is_active: false,
                max_members: count
             })
             .select()
             .single();
           
           if (teamErr) {
             console.error("Mixed reg team creation failed:", teamErr);
             return res.status(500).json({success:false, error: "Failed to create team: " + (teamErr.message || teamErr.details)});
           }

           // Add leader to team_members immediately
           await supabase.from('team_members').insert({
               team_id: newTeam.id,
               user_id: user_id,
               role: 'leader',
               status: 'joined'
           });

           processedRegistrations.push({
             ...item,
             team_id: newTeam.id,
             amount: itemTotal,
             price_per_member: price
           });

        } else {
           // Individual Logic
           totalCalculatedAmount += price;
           processedRegistrations.push({
             ...item,
             amount: price
           });
        }
      }
      
      // EXPORT DATA FOR PAYLOAD CONSTRUCTION
      req.processed_mixed_data = processedRegistrations;

      computedAmount = Number(totalCalculatedAmount.toFixed(2));
      actualBookingId = `MIXED_${Date.now()}`; // Virtual booking ID for grouping
      
      // We will store the processedRegistrations in the gateway payload to handle in callback
      // This is crucial for verifying what needs to be activated
      
      console.log('📦 Mixed Bundle Prepared:', { count: processedRegistrations.length, total: computedAmount });

    } else if (booking_type === 'team') {
      // Compute total amount based on team size and event price
      const { team_id, team_name, event_id, member_count } = req.body;
      
      const isNewTeam = !team_id && !!team_name;

      if (!event_id || (!team_id && !team_name)) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields for team payment: event_id, and team_id OR team_name"
        });
      }

      // Fetch event pricing
      const { data: eventRowData, error: eventErr } = await supabase
        .from('events')
        .select('*')
        .eq('event_id', event_id)
        .single();

      if (eventErr || !eventRowData) {
         return res.status(404).json({ success: false, error: "Event not found" });
      }
      
      teamEventRow = eventRowData; // Store for payload
      
      let teamSize = 0;
      let alreadyPaidMemberIds = [];
      let currentTeamId = team_id;

      if (isNewTeam) {
          // Handle New Team Creation Payment
          const count = Number(member_count);
          if (!count || count <= 0) {
             return res.status(400).json({ success: false, error: "Invalid member count" });
          }
          
          teamSize = count; // We are paying for 'count' slots
          unpaidMembersCount = count; // All slots user wants to pay for
          alreadyPaidMemberIds = [];

           // Check for existing team to reuse (if inactive) or conflict
           const { data: existingTeam } = await supabase
              .from('teams')
              .select('*')
              .eq('team_name', team_name)
              .eq('event_id', eventRowData.id)  // Use UUID, not text event_id
              .maybeSingle();

           if (existingTeam) {
               if (existingTeam.leader_id === user_id && !existingTeam.is_active) {
                   console.log("♻️ Reusing existing inactive team:", existingTeam.id);
                   currentTeamId = existingTeam.id;
                   
                   // Update members count if changed
                   await supabase.from('teams').update({ max_members: count }).eq('id', currentTeamId);
               } else {
                   return res.status(400).json({ success: false, error: "Team name already taken. Please try a different name." });
               }
           } else {
               // Create new team - use eventRowData.id (UUID) not event_id (text)
               const { data: newTeam, error: createTeamErr } = await supabase
                 .from('teams')
                 .insert({
                    team_name: team_name,
                    event_id: eventRowData.id,  // Use UUID from fetched event
                    leader_id: user_id,
                    created_by: user_id, // Required for RLS policies
                    is_active: false, // Inactive until paid
                    max_members: count
                 })
                 .select()
                 .single();
                 
               if (createTeamErr) {
                   console.error("Failed to create temporary team:", createTeamErr);
                   return res.status(400).json({ success: false, error: "Failed to create team: " + (createTeamErr.message || createTeamErr.details) });
               }
               currentTeamId = newTeam.id;
           }

           actualBookingId = currentTeamId;
           
           // Ensure leader is in team member list
           const { data: existMember } = await supabase
               .from('team_members')
               .select('id')
               .eq('team_id', currentTeamId)
               .eq('user_id', user_id)
               .maybeSingle();

           if (!existMember) {
                 await supabase.from('team_members').insert({
                     team_id: currentTeamId,
                     user_id: user_id,
                     role: 'leader',
                     status: 'joined'
                 });
           }

      } else {
        // ... Existing Logic for Existing Team ...
        // Prevent duplicate registrations: check if any team member already registered (PAID) for this event
        const { data: preCheckTeamMembers, error: preCheckTeamErr } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', team_id);
    
        if (preCheckTeamErr) {
            console.error('❌ Error fetching team members for duplicate check:', preCheckTeamErr);
            return res.status(500).json({
            success: false,
            error: 'Failed to fetch team members for duplicate check'
            });
        }
    
        const memberIds = (preCheckTeamMembers || []).map(m => m.user_id);
        
        if (memberIds.length > 0) {
            const { data: existingMembers, error: existingAnyMemberErr } = await supabase
            .from('event_registrations_config')
            .select('user_id')
            .eq('event_id', event_id)
            .eq('event_name', team_name) // This might be brittle if name changes, but adhering to existing pattern
            .eq('payment_status', 'PAID')
            .in('user_id', memberIds);
    
            if (existingAnyMemberErr) {
            console.error('❌ Error checking existing member registrations:', existingAnyMemberErr);
            return res.status(500).json({
                success: false,
                error: 'Failed to validate existing registrations'
            });
            }
            alreadyPaidMemberIds = (existingMembers || []).map(m => m.user_id);
        }
        
         // Fetch actual team members count
        const { data: teamMembers, error: teamErr } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', team_id);
            
         if (teamErr) return res.status(500).json({success:false, error: "Failed to fetch team members"});
         
         teamSize = Array.isArray(teamMembers) ? teamMembers.length : 0;
         const requestedSize = Number(member_count) || teamSize;
         unpaidMembersCount = teamSize - alreadyPaidMemberIds.length;
         
         // Basic Validations
         const minSize = Number(eventRowData.min_team_size) || 1;
         const maxSize = Number(eventRowData.max_team_size) || requestedSize;
         if (teamSize < minSize) return res.status(400).json({success:false, error: `Team too small (min ${minSize})`});
         if (teamSize > maxSize) return res.status(400).json({success:false, error: `Team too large (max ${maxSize})`});
      }

      // Compute total amount = price per member * unpaid members only
      const pricePerMember = Number(eventRowData.price) || 0;
      computedAmount = Number((pricePerMember * unpaidMembersCount).toFixed(2));

      console.log('🧮 Team payment computed:', { 
        team_id: currentTeamId, 
        event_id, 
        totalTeamSize: teamSize, 
        alreadyPaid: alreadyPaidMemberIds.length,
        unpaidMembers: unpaidMembersCount,
        pricePerMember, 
        computedAmount,
        isNewTeam
      });
      
      // Update req.body.team_id for subsequent logic if it was new
      if (isNewTeam) req.body.team_id = currentTeamId;
      actualBookingId = currentTeamId;
    } 
    // Scope fix applied in mixed_registration block above by attaching to req object

    // Generate unique order ID with timestamp to prevent duplicates
    const order_id = `ORDER_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${Date.now()}_${actualBookingId.toString().substring(0, 8)}`;

    // Format payment payload for gateway
    const paymentPayload = {
      amount: booking_type === 'team' ? computedAmount : amount,
      order_id: order_id,
      customer_name: profile.full_name,
      customer_email: customer_email,
      customer_phone: customer_phone,
      customer_college: profile.college_name || "N/A",
      customer_department: profile.department || "N/A",
      callback_url: "http://localhost:3000/payment/callback",
      description: `Dhaskaa T26 - ${booking_type.toUpperCase()} Registration`
    };

    // Store payment initiation record (with team data if applicable)
    console.log("💾 Attempting to create payment transaction:", {
      user_id,
      order_id,
      booking_id: actualBookingId,
      booking_type,
      amount
    });

    const paymentInsertData = {
      user_id: user_id,
      order_id: order_id,
      booking_id: actualBookingId,
      booking_type: booking_type,
      amount: (booking_type === 'team' || booking_type === 'mixed_registration') ? computedAmount : amount,
      status: 'INITIATED',
      gateway_payload: paymentPayload
    };

    // For team payments, store additional team data
    if (booking_type === 'team') {
      const { team_name, event_id, member_count } = req.body;
      const pricePerMember = Number(teamEventRow?.price) || 0;
      // Use actualBookingId which is set to currentTeamId for team payments
      const finalTeamId = actualBookingId;
      
      console.log('📦 Storing team payload with team_id:', finalTeamId);
      
      paymentInsertData.gateway_payload = {
        ...paymentPayload,
        team_data: {
          team_id: finalTeamId,  // Use the actual team ID (created or existing)
          team_name: team_name,
          event_id: teamEventRow.id,  // UUID for teams table
          event_text_id: event_id,    // Text ID for event_registrations_config
          member_count: member_count || 0,
          total_amount: computedAmount,
          price_per_member: pricePerMember,
          unpaid_members_count: unpaidMembersCount || member_count || 0
        }
      };
    } else if (booking_type === 'combo') {
      // For combo bookings, store team_data, selected_events, and created team IDs
      console.log('📦 Combo booking - team_data received:', req.body.team_data);
      console.log('📦 Combo booking - selected_events received:', req.body.selected_events);
      console.log('📦 Combo booking - created_teams:', req.combo_created_teams);
      paymentInsertData.gateway_payload = {
        ...paymentPayload,
        team_data: req.body.team_data || null,
        selected_events: req.body.selected_events || null,
        created_teams: req.combo_created_teams || null  // Team IDs created during initiation
      };
    } else if (booking_type === 'mixed_registration') {
        paymentInsertData.gateway_payload = {
            ...paymentPayload,
            mixed_data: {
                registrations: req.processed_mixed_data // Use data we prepared in the block above
            }
        };
    }

    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_transactions')
      .insert(paymentInsertData)
      .select()
      .single();

    if (paymentError) {
      console.error("❌ DETAILED ERROR storing payment record:");
      console.error("Error Code:", paymentError.code);
      console.error("Error Message:", paymentError.message);
      console.error("Error Details:", JSON.stringify(paymentError, null, 2));
      console.error("Hint:", paymentError.hint);
      console.error("\n⚠️  POSSIBLE CAUSES:");
      console.error("1. Table 'payment_transactions' does not exist in Supabase");
      console.error("2. RLS policies are blocking the insert (even with service_role)");
      console.error("3. Foreign key constraint failing (user_id not in profiles table)");
      console.error("\n📝 ACTION REQUIRED:");
      console.error("Run the SQL file: database/migrations/create_payment_transactions_fixed.sql");
      console.error("in your Supabase SQL Editor to create the table.\n");
      
      return res.status(500).json({
        success: false,
        error: "Failed to create payment transaction record",
        details: paymentError.message,
        code: paymentError.code
      });
    }

    console.log("✅ Payment transaction created:", {
      order_id,
      booking_id,
      user_id,
      amount
    });

    // Call payment gateway from backend (server-to-server, no CORS)
    const paymentGatewayUrl = process.env.PAYMENT_GATEWAY_URL || 'https://ccabc81dd642.ngrok-free.app';
    console.log('🌐 Payment Gateway URL:', paymentGatewayUrl);

    try {
      const gatewayResponse = await fetch(`${paymentGatewayUrl}/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
      });

      const gatewayResult = await gatewayResponse.json();

      if (!gatewayResult.success) {
        throw new Error('Payment gateway initialization failed');
      }

      // Replace localhost URL with ngrok URL for public access
      let paymentUrl = gatewayResult.payment_url;
      if (paymentUrl.includes('localhost:5002')) {
        paymentUrl = paymentUrl.replace('http://localhost:5002', paymentGatewayUrl);
      }

      // Return both payment data and gateway payment URL
      res.status(200).json({
        success: true,
        message: "Payment initiated successfully",
        payment_data: paymentPayload,
        payment_url: paymentUrl,
        transaction_id: paymentRecord?.id,
        calculated_amount: paymentPayload.amount // Include calculated amount for frontend display
      });
    } catch (gatewayError) {
      console.error("Payment gateway error:", gatewayError);
      res.status(500).json({
        success: false,
        error: "Payment gateway communication failed"
      });
    }

  } catch (error) {
    console.error("❌ Error initiating payment:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal Server Error" 
    });
  }
});

/* 🟢 Payment Gateway - Handle Callback (GET for user redirect, POST for webhook) */
app.all("/payment/callback", async (req, res) => { // Changed to app.all to handle both methods
  try {
    console.log(`💳 Payment callback received via ${req.method}`);
    
    // Extract payment data from either query params (GET) or body (POST)
    const paymentData = req.method === 'GET' ? req.query : req.body;
    const { 
      order_id,
      status, // 'success', 'failed', 'timeout'
      txn_id,
      payment_id,
      error: errorMsg
    } = paymentData;

    console.log("💳 Payment callback payload:", { order_id, status, txn_id, payment_id, method: req.method });

    // If we have payment data (order_id and status), process the payment update
    if (order_id && status) {
      // Map status to uppercase
      const paymentStatus = status.toUpperCase();

      // Fetch payment transaction record
      const { data: paymentRecord, error: fetchError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', order_id)
        .single();

      console.log("🔍 Database lookup result:", {
        order_id,
        found: !!paymentRecord,
        error: fetchError,
        record: paymentRecord
      });

      if (fetchError || !paymentRecord) {
        console.error("❌ Payment transaction not found:", { order_id, error: fetchError });
        if (req.method === 'GET') {
          return res.send(`
            <html>
              <head>
                <title>Payment Error</title>
                <meta http-equiv="refresh" content="5;url=http://localhost:5173/dashboard?payment_error=true" />
              </head>
              <body style="font-family: sans-serif; text-align: center; padding: 40px;">
                <h1>⚠️ Payment Error</h1>
                <p>Payment transaction not found for order: ${order_id}</p>
                <p>Redirecting to dashboard...</p>
              </body>
            </html>
          `);
        }
        return res.status(404).json({ error: "Payment transaction not found" });
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
      }

      // Update booking status based on payment result
      if (paymentStatus === 'SUCCESS') {
        const { booking_id, booking_type, user_id } = paymentRecord;

        let updateResult;
        
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
                  event_name: teamInfo?.teamName || null, // Store team name for team events
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
            event_text_id: teamData?.event_text_id,
            total_amount: teamData?.total_amount
          });
          
          if (!teamData) {
            console.error('❌ No team data found in payment record');
          } else {
            // CRITICAL: Activate the team after successful payment
            const { error: activateError } = await supabase
              .from('teams')
              .update({ is_active: true })
              .eq('id', teamData.team_id);
            
            if (activateError) {
              console.error('❌ Error activating team:', activateError);
            } else {
              console.log('✅ Team activated:', teamData.team_id);
            }
            
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
                // Use the correct event_id (UUID) for registrations
                // teamData.event_id is the UUID, teamData.event_text_id is the text ID
                const eventIdForRegistration = teamData.event_id;
                
                // Create registrations for unpaid team members only
                // First, fetch existing registrations for this specific team and event
                const { data: existingRegs, error: existingRegsErr } = await supabase
                  .from('event_registrations_config')
                  .select('user_id, transaction_id')
                  .eq('event_id', eventIdForRegistration)
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
                  event_id: eventIdForRegistration,
                  event_name: teamData.team_name,
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
          }

        if (updateResult?.error) {
          console.error("Error updating booking status:", updateResult.error);
        }
        
        console.log("✅ Payment successful, database updated");
      }

      // For GET requests, show success page and redirect
      if (req.method === 'GET') {
        const isSuccess = paymentStatus === 'SUCCESS';
        return res.send(`
          <html>
            <head>
              <title>Payment ${isSuccess ? 'Successful' : 'Failed'}</title>
              <meta http-equiv="refresh" content="3;url=http://localhost:5173/dashboard?payment_check=true&status=${isSuccess ? 'success' : 'failed'}" />
              <style>
                body { font-family: sans-serif; text-align: center; padding: 40px; }
                .loader { border: 5px solid #f3f3f3; border-top: 5px solid ${isSuccess ? '#3498db' : '#e74c3c'}; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 20px auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                h1 { color: ${isSuccess ? '#27ae60' : '#e74c3c'}; }
              </style>
            </head>
            <body>
              <h1>${isSuccess ? '✅ Payment Successful!' : '❌ Payment Failed'}</h1>
              <div class="loader"></div>
              <p>Redirecting to your dashboard...</p>
              <p>If you are not redirected automatically, <a href="http://localhost:5173/dashboard?payment_check=true">click here</a>.</p>
            </body>
          </html>
        `);
      }

      // For POST requests, return JSON
      return res.json({ received: true, status: paymentStatus });
    }

    // If no payment data in GET request, just show a generic redirect page
    if (req.method === 'GET') {
      return res.send(`
        <html>
          <head>
            <title>Payment Status</title>
            <meta http-equiv="refresh" content="3;url=http://localhost:5173/dashboard?payment_check=true" />
            <style>
              body { font-family: sans-serif; text-align: center; padding: 40px; }
              .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 20px auto; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <h1>Processing Payment...</h1>
            <div class="loader"></div>
            <p>Redirecting to your dashboard...</p>
            <p>If you are not redirected automatically, <a href="http://localhost:5173/dashboard?payment_check=true">click here</a>.</p>
          </body>
        </html>
      `);
    }

  } catch (error) {
    console.error("❌ Payment callback error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DEBUG ENDPOINT: Check event registrations count
app.get("/debug/registrations", async (req, res) => {
  try {
    // Get all events
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

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
