const nodemailer = require('nodemailer');
const path = require('path');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Welcome email template
const getWelcomeEmailTemplate = (userName, userEmail) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .header {
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
          padding: 40px 20px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
        }
        .content {
          padding: 40px 30px;
        }
        .welcome-text {
          font-size: 24px;
          color: #0ea5e9;
          margin-bottom: 20px;
          font-weight: bold;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          color: #333;
          margin-bottom: 20px;
        }
        .highlight {
          background: linear-gradient(135deg, #f97316 0%, #0ea5e9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: bold;
        }
        .info-box {
          background: #f0f9ff;
          border-left: 4px solid #0ea5e9;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .info-box h3 {
          color: #0ea5e9;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .info-box ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .info-box li {
          margin: 8px 0;
          color: #555;
        }
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          border-top: 2px solid #e2e8f0;
        }
        .footer p {
          color: #64748b;
          font-size: 14px;
          margin: 5px 0;
        }
        .social-links {
          margin: 15px 0;
        }
        .social-links a {
          color: #0ea5e9;
          text-decoration: none;
          margin: 0 10px;
          font-weight: 600;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to DaKshaa T25! 🎉</h1>
        </div>
        
        <div class="content">
          <p class="welcome-text">Hello ${userName}! 👋</p>
          
          <p class="message">
            Congratulations! You have successfully registered for <span class="highlight">DaKshaa T25</span>, 
            the National Level Techno-Cultural Fest that promises to be an unforgettable experience!
          </p>
          
          <div class="info-box">
            <h3>📧 Your Registration Details:</h3>
            <ul>
              <li><strong>Name:</strong> ${userName}</li>
              <li><strong>Email:</strong> ${userEmail}</li>
              <li><strong>Status:</strong> ✅ Successfully Registered</li>
            </ul>
          </div>
          
          <div class="info-box">
            <h3>🎯 What's Next?</h3>
            <ul>
              <li>🎪 <strong>3 DAYS</strong> of amazing events</li>
              <li>🎓 <strong>20+ Workshops</strong> to enhance your skills</li>
              <li>🏆 <strong>25+ Events</strong> to showcase your talent</li>
              <li>🤝 Network with industry professionals</li>
              <li>🎁 Win exciting prizes and certificates</li>
            </ul>
          </div>
          
          <p class="message">
            <strong>Important:</strong> Keep checking your email for event updates, schedule announcements, 
            and important information about DaKshaa T25.
          </p>
          
          <center>
            <a href="https://your-dakshaa-website.com" class="button">Visit Website</a>
          </center>
        </div>
        
        <div class="footer">
          <p><strong>DaKshaa T25</strong></p>
          <p>National Level Techno-Cultural Fest</p>
          <p style="margin-top: 15px; font-style: italic;">"Where Innovation Meets Excellence"</p>
          
          <div class="social-links">
            <a href="#">Facebook</a> | 
            <a href="#">Instagram</a> | 
            <a href="#">Twitter</a>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
            If you have any questions, please contact us at support@dakshaa.com
          </p>
          <p style="font-size: 12px; color: #94a3b8;">
            © 2025 DaKshaa T25. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Payment Success Template matching "Dhaskaa T26" Dark Theme
const getPaymentSuccessTemplate = (userName, details) => {
    const { amount, transactionId, orderId, items, date, userId, phone, college, department, year, teamName } = details;
    
    // Generate items list text
    // Use line breaks for multiple items so they list nicely
    const eventDisplay = items.length > 0 
        ? items.map(i => i.name).join('<br>') 
        : 'Event Registration';
  
    // QR Code URL (using public API for simplicity)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${userId}`;
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
          body { 
            font-family: 'Roboto', sans-serif; 
            background-color: #0B1120; /* Deep dark blue background matching image */
            margin: 0; 
            padding: 0; 
            -webkit-font-smoothing: antialiased; 
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: #151e32; /* Slightly lighter card background */
            border-radius: 16px; 
            overflow: hidden; 
            color: #e2e8f0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            border: 1px solid #1e293b;
          }
          .header { 
            background: #0f172a; 
            padding: 20px; 
            text-align: center; 
            border-bottom: 1px solid #1e293b;
          }
          .dhaskaa-logo {
            max-height: 60px;
            object-fit: contain;
          }
          .content { padding: 30px; }
          
          /* Success Badge */
          .badge-container {
             text-align: center;
             margin-bottom: 25px;
          }
          .success-badge {
            background: rgba(6, 182, 212, 0.1); /* Transparent cyan */
            color: #06b6d4; /* Cyan text */
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            display: inline-block;
            border: 1px solid rgba(6, 182, 212, 0.3);
          }
          
          .footer-imgs {
             padding: 20px;
             text-align: center;
             background: #0f172a;
             border-top: 1px solid #1e293b;
          }
          .ksrct-logo {
             max-height: 50px;
             opacity: 0.8;
          }

          .greeting {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .user-name {
            color: #06b6d4;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          
          .description {
            color: #334155; /* Darker text for description if on light, but here we are on dark */
            color: #94a3b8;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 30px;
          }

          /* Details Section */
          .section-title {
            color: #06b6d4;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 10px;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 13px;
          }
          .details-label {
            color: #06b6d4;
            font-weight: 600;
            width: 35%;
          }
          .details-value {
            color: #e2e8f0;
            width: 65%;
            text-align: right;
            line-height: 1.4;
          }
          .details-value-link {
            color: #3b82f6;
            text-decoration: none;
          }

          /* Entry Pass Section */
          .pass-container {
            background: #1e293b;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin-top: 30px;
          }
          .pass-title {
            color: #06b6d4;
            font-weight: bold;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .qr-box {
            background: white;
            padding: 10px;
            display: inline-block;
            border-radius: 8px;
          }
          .qr-img {
            width: 150px;
            height: 150px;
            display: block;
          }
          .qr-text {
            color: #64748b;
            font-size: 11px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="cid:dhaskaalogo" alt="DaKshaa T26" class="dhaskaa-logo" />
            <div style="display:none; color: #06b6d4; font-weight: bold; font-size: 24px;">DHASKAA T26</div>
          </div>
          
          <div class="content">
            <div class="badge-container">
              <span class="success-badge">✓ Registration Successful</span>
            </div>

            <div class="greeting">Hello</div>
            <div class="user-name">${userName}</div>
            
            <div class="description">
              Thank you for registering for <strong style="color: #06b6d4;">DaKshaa T26</strong>. 
              Your registration has been confirmed.
            </div>

            <div class="section-title">
             📋 Registration Details
            </div>
            
            <div class="details-row">
              <span class="details-label">Registration ID</span>
              <span class="details-value">${orderId.substring(6, 16)}...</span>
            </div>
            <div class="details-row">
              <span class="details-label">Date</span>
              <span class="details-value">${date}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Booking Type</span>
              <span class="details-value" style="font-weight: 500;">${eventDisplay}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Name</span>
              <span class="details-value">${userName}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Phone</span>
              <span class="details-value">${phone || 'N/A'}</span>
            </div>
            <div class="details-row">
              <span class="details-label">College</span>
              <span class="details-value">${college || 'N/A'}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Department</span>
              <span class="details-value">${department}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Year</span>
              <span class="details-value">${year}</span>
            </div>
            ${teamName && teamName !== 'N/A' ? `
            <div class="details-row">
              <span class="details-label">Team Name</span>
              <span class="details-value">${teamName}</span>
            </div>` : ''}
            <div class="details-row">
              <span class="details-label">Fee Paid</span>
              <span class="details-value">₹${amount}</span>
            </div>

            <div class="pass-container">
               <div class="pass-title">
                 🎫 Your Entry Pass
               </div>
               <div class="qr-box">
                 <img src="${qrCodeUrl}" alt="Entry QR Code" class="qr-img" />
               </div>
               <div class="qr-text">
                 Show this QR code at the event for quick check-in
               </div>
            </div>
            
            <center style="margin-top: 30px; margin-bottom: 10px;">
              <a href="https://dakshaa.ksrct.ac.in/dashboard/registrations" style="background: linear-gradient(90deg, #06b6d4, #3b82f6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);">View Full Details</a>
            </center>
          </div>
          
          <div class="footer-imgs">
             <img src="cid:ksrctlogo" alt="KSRCT" class="ksrct-logo" />
             <div style="font-size: 11px; color: #64748b; margin-top: 10px;">
               K.S. Rangasamy College of Technology<br/>
               Autonomous, Tiruchengode
             </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

// Send Payment Success Email
const sendPaymentSuccessEmail = async (userEmail, userName, paymentDetails) => {
    try {
      const transporter = createTransporter();
      
      // Get Event Name for Subject
      // Clean up "Event: " prefix if present for cleaner subject
      let subjectEventName = 'Event Registration';
      if (paymentDetails.items && paymentDetails.items.length > 0) {
          subjectEventName = paymentDetails.items.map(i => i.name.replace(/^Event: /, '').replace(/^Team: /, '')).join(', ');
      }

      const mailOptions = {
        from: `"DaKshaa T26" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `🎉 Registration Confirmed - ${subjectEventName} | Dhaskaa T26`,
        html: getPaymentSuccessTemplate(userName, paymentDetails),
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(__dirname, 'logo.png'),
            cid: 'dhaskaalogo' // same cid value as in the html img src
          },
          {
            filename: 'ksrct.png',
            path: path.join(__dirname, 'ksrct.png'),
            cid: 'ksrctlogo' // same cid value as in the html img src
          }
        ]
      };
  
      const info = await transporter.sendMail(mailOptions);
      console.log('Payment success email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending payment email:', error);
      return { success: false, error: error.message };
    }
  };

// Send welcome email
const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"DaKshaa T25" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '🎉 Welcome to DaKshaa T25 - Registration Successful!',
      html: getWelcomeEmailTemplate(userName, userEmail)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// OTP email template matching the payment success email design
const getOTPEmailTemplate = (userName, otpCode) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        body { 
          font-family: 'Roboto', sans-serif; 
          background-color: #0B1120; /* Deep dark blue background matching payment email */
          margin: 0; 
          padding: 0; 
          -webkit-font-smoothing: antialiased; 
        }
        .container { 
          max-width: 500px; 
          margin: 20px auto; 
          background: #151e32; /* Slightly lighter card background */
          border-radius: 16px; 
          overflow: hidden; 
          color: #e2e8f0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          border: 1px solid #1e293b;
        }
        .header { 
          background: #0f172a; 
          padding: 20px 15px; 
          text-align: center; 
          border-bottom: 1px solid #1e293b;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #e2e8f0;
        }
        .header p {
          margin: 8px 0 10px 0; 
          font-size: 14px;
          color: #06b6d4;
          font-weight: 500;
        }
        .dhaskaa-logo {
          max-height: 60px;
          object-fit: contain;
          margin-top: 8px;
        }
        .content { 
          padding: 20px; 
          text-align: center; 
        }
        
        /* Security Badge */
        .badge-container {
          text-align: center;
          margin-bottom: 20px;
        }
        .security-badge {
          background: rgba(239, 68, 68, 0.1); /* Transparent red */
          color: #ef4444; /* Red text for security */
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          display: inline-block;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .greeting {
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 15px;
          line-height: 1.5;
        }
        .greeting strong {
          color: #06b6d4;
        }
        
        .otp-section {
          background: #1e293b;
          border: 2px solid #06b6d4;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        .otp-title {
          color: #06b6d4;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #ef4444;
          letter-spacing: 5px;
          margin: 15px auto;
          padding: 18px 30px;
          background: #0f172a;
          border-radius: 10px;
          display: block;
          width: fit-content;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          border: 1px solid #1e293b;
          min-width: 180px;
        }
        .otp-description {
          color: #64748b;
          font-size: 12px;
          margin: 10px 0 0 0;
        }
        
        .warning {
          background: rgba(251, 191, 36, 0.1);
          border-left: 4px solid #fbbf24;
          padding: 15px;
          margin: 18px 0;
          border-radius: 8px;
          text-align: left;
        }
        .warning p {
          color: #fbbf24;
          margin: 0;
          font-weight: 500;
          font-size: 12px;
          line-height: 1.4;
        }
        .warning p:first-child {
          margin-bottom: 6px;
        }
        
        .security-note {
          color: #94a3b8;
          font-size: 12px;
          margin: 15px 0;
          line-height: 1.4;
        }
        
        .footer {
          background: #0f172a;
          padding: 18px;
          text-align: center;
          border-top: 1px solid #1e293b;
        }
        .ksrct-logo {
          max-height: 50px;
          opacity: 0.9;
          margin: 10px 0;
        }
        .footer p {
          color: #64748b;
          font-size: 12px;
          margin: 4px 0;
        }
        .footer p:first-child {
          color: #06b6d4;
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .footer p:last-child {
          color: #475569;
          font-size: 11px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
          <img src="cid:dhaskaalogo" alt="DaKshaa T26 Logo" class="dhaskaa-logo" />
        </div>
        
        <div class="content">
          <div class="badge-container">
            <span class="security-badge">Security Verification</span>
          </div>

          <p class="greeting">Hello <strong>${userName}</strong>,</p>
          <p class="greeting">You have requested to reset your password for your DaKshaa account.</p>
          
          <div class="otp-section">
            <div class="otp-title">
               Your Verification Code
            </div>
            <div class="otp-code">${otpCode}</div>
            <p class="otp-description">Enter this code to reset your password</p>
          </div>
          
          <div class="warning">
            <p>⚠️ This verification code is valid for 5 minutes only</p>
            <p>If you didn't request this password reset, please ignore this email</p>
          </div>
          
          <p class="security-note">For security reasons, please do not share this code with anyone. Our team will never ask for this code.</p>
        </div>
        
        <div class="footer">
          <img src="cid:ksrctlogo" alt="KSRCT Logo" class="ksrct-logo" />
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send OTP email
const sendOTPEmail = async (userEmail, userName, otpCode) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"DaKshaa T26" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '🔐 Password Reset OTP - DaKshaa T26',
      html: getOTPEmailTemplate(userName, otpCode),
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(__dirname, 'logo.png'),
          cid: 'dhaskaalogo' // same cid value as in the html img src
        },
        {
          filename: 'ksrct.png',
          path: path.join(__dirname, 'ksrct.png'),
          cid: 'ksrctlogo' // same cid value as in the html img src
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendWelcomeEmail, sendPaymentSuccessEmail, sendOTPEmail };
