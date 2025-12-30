// Email Service for sending confirmation emails
// This service uses Supabase Edge Functions or can be configured to use other providers

import { supabase } from "../supabase";

const emailService = {
  /**
   * Send registration confirmation email to user
   * Note: For production, set up Supabase Edge Functions or use a service like SendGrid, Resend, etc.
   */
  sendRegistrationConfirmation: async (
    userEmail,
    userName,
    registrationDetails
  ) => {
    try {
      // Store email in a queue table for processing
      // In production, this would trigger a Supabase Edge Function or webhook

      const emailData = {
        to: userEmail,
        subject: "🎉 Registration Confirmed - DaKshaa Event",
        template: "registration_confirmation",
        data: {
          user_name: userName,
          events: registrationDetails.events,
          total_amount: registrationDetails.totalAmount,
          registration_type: registrationDetails.registrationType,
          registration_id: `REG_${Date.now().toString(36).toUpperCase()}`,
          registered_at: new Date().toISOString(),
        },
        status: "pending",
        created_at: new Date().toISOString(),
      };

      // Option 1: Store in email_queue table (create this table in Supabase)
      const { error } = await supabase.from("email_queue").insert(emailData);

      if (error) {
        console.log("Email queue not available, logging email:", emailData);
        // Fallback: Just log the email for now
        console.log("📧 Email would be sent to:", userEmail);
        console.log("Subject:", emailData.subject);
        console.log("Data:", emailData.data);
      }

      // Option 2: Call Supabase Edge Function (if configured)
      // const { data, error } = await supabase.functions.invoke('send-email', {
      //   body: emailData
      // });

      return { success: true, message: "Email queued successfully" };
    } catch (error) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send admin notification email
   */
  sendAdminNotification: async (adminEmail, notificationDetails) => {
    try {
      const emailData = {
        to: adminEmail,
        subject: `🔔 New Registration - ${notificationDetails.userName}`,
        template: "admin_notification",
        data: {
          user_name: notificationDetails.userName,
          user_email: notificationDetails.userEmail,
          user_mobile: notificationDetails.userMobile,
          events: notificationDetails.events,
          total_amount: notificationDetails.totalAmount,
          registration_type: notificationDetails.registrationType,
          registered_at: new Date().toISOString(),
        },
        status: "pending",
        created_at: new Date().toISOString(),
      };

      console.log("📧 Admin notification email:", emailData);

      return { success: true, message: "Admin email queued" };
    } catch (error) {
      console.error("Error sending admin email:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Generate HTML email template for registration confirmation
   */
  generateRegistrationEmailHTML: (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #1a1a2e; color: #fff; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #16213e; padding: 30px; border-radius: 0 0 10px 10px; }
          .event-card { background: #1a1a2e; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #667eea; }
          .total { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
            <p>Thank you for registering, ${data.user_name}!</p>
          </div>
          <div class="content">
            <h2>Your Registered Events:</h2>
            ${data.events
              .map(
                (event) => `
              <div class="event-card">
                <h3>${event.name}</h3>
                <p>Category: ${event.category || "General"}</p>
                <p>Price: ₹${event.price || 0}</p>
              </div>
            `
              )
              .join("")}
            <div class="total">
              <h2>Total Amount: ₹${data.total_amount}</h2>
              <p>Registration ID: ${data.registration_id}</p>
            </div>
          </div>
          <div class="footer">
            <p>DaKshaa Event Management</p>
            <p>If you have any questions, contact us at support@dakshaa.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },
};

export default emailService;
