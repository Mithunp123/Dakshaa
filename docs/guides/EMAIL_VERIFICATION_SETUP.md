# Email Verification Setup Instructions

## Issue: Email Verification Not Working

The user is receiving sample template emails but cannot verify through them. This is because Supabase email templates need to be configured.

## Solution: Configure Supabase Email Templates

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `ltmyqtcirhsgfyortgfo`
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure "Confirm Signup" Template

Find the **Confirm signup** template and update it with this content:

**Subject:**
```
Confirm your DaKshaa Account
```

**Email Body (HTML):**
```html
<h2>Welcome to DaKshaa!</h2>

<p>Hi {{ .Data.full_name }}!</p>

<p>Thanks for signing up for DaKshaa! Before we get started, we need to confirm your email address.</p>

<p>Please click the button below to verify your email:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #0ea5e9; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: bold;">
    Verify Email Address
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 24 hours.</p>

<p>If you didn't create an account with DaKshaa, you can safely ignore this email.</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

<p style="color: #666; font-size: 12px;">
  This email was sent to {{ .Email }}. If you have any questions, contact us at support@dakshaa.com
</p>
```

### Step 3: Configure Site URL

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:5173` (for development)
3. For production, set it to your actual domain: `https://yourdomain.com`

### Step 4: Configure Redirect URLs

1. In the same **URL Configuration** section
2. Under **Redirect URLs**, add:
   ```
   http://localhost:5173/login
   http://localhost:5173/**
   ```
3. For production, add:
   ```
   https://yourdomain.com/login
   https://yourdomain.com/**
   ```

### Step 5: Enable Email Confirmation

1. Go to **Authentication** → **Settings** → **Auth Providers**
2. Click on **Email**
3. Make sure **Enable email confirmations** is checked
4. **Confirm email** should be set to **enabled**
5. **Double confirm email changes** can be disabled for simpler flow
6. Save changes

### Step 6: Test Email Verification Flow

1. Clear your browser cookies and local storage
2. Register a new user with a valid email address
3. Check your email inbox (and spam folder)
4. Click the verification link
5. You should be redirected to `/login` page
6. You'll see a toast message: "Email verified successfully!"
7. After 3 seconds, you'll be redirected to homepage
8. Now you can login with your verified account

## Email Template Variables Available

- `{{ .ConfirmationURL }}` - The verification link
- `{{ .Email }}` - User's email address  
- `{{ .Data.full_name }}` - User's full name (from metadata)
- `{{ .Data.college_name }}` - User's college name
- `{{ .Data.mobile_number }}` - User's mobile number
- `{{ .SiteURL }}` - Your site URL

## Troubleshooting

### Issue: Still receiving sample template
- **Solution**: Make sure you saved the email template in Supabase dashboard
- **Solution**: Try logging out of Supabase dashboard and back in
- **Solution**: Check if you're in the correct project

### Issue: Verification link redirects to wrong page
- **Solution**: Check Site URL in Authentication → URL Configuration
- **Solution**: Make sure redirect URL includes `/login`
- **Solution**: Code already sets `emailRedirectTo: '${window.location.origin}/login'`

### Issue: "Invalid link" error
- **Solution**: Link expires in 24 hours, register again
- **Solution**: Check if you copied the full link
- **Solution**: Make sure URL configuration matches your domain

### Issue: Email not received
- **Solution**: Check spam/junk folder
- **Solution**: Use a different email provider (Gmail works best)
- **Solution**: Check Supabase logs: Authentication → Logs

## Development vs Production

### Development (localhost)
- Site URL: `http://localhost:5173`
- Redirect URL: `http://localhost:5173/login`

### Production
- Site URL: `https://yourdomain.com`
- Redirect URL: `https://yourdomain.com/login`

Make sure to update these when deploying to production!

## Code Changes Made

The following files were already updated to handle email verification:

1. **Frontend/src/Pages/Register/Components/SignUpForm.jsx**
   - Duplicate email check uses `.maybeSingle()` to avoid 406 errors
   - Sets `emailRedirectTo` to `/login` page
   - Signs out user after registration
   - Shows verification message

2. **Frontend/src/Pages/Login/Login.jsx**
   - Detects email verification from URL hash
   - Shows success toast
   - Redirects to homepage after 3 seconds
   - Checks `email_confirmed_at` before allowing login

3. **Frontend/src/supabase.js**
   - Session persistence disabled (`persistSession: false`)
   - Users must login after page refresh

## Next Steps

1. ✅ Configure email template in Supabase dashboard (follow Step 2 above)
2. ✅ Set Site URL and Redirect URLs (Steps 3 & 4)
3. ✅ Enable email confirmation (Step 5)
4. ✅ Test the flow (Step 6)
5. Update URLs for production deployment

After completing these steps, email verification will work correctly!
