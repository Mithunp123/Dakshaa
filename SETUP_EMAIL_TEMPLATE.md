# 📧 Email Verification Template Setup Guide

## 🎯 Quick Setup (5 minutes)

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select project: `ltmyqtcirhsgfyortgfo`
3. Navigate to: **Authentication** → **Email Templates**

### Step 2: Configure "Confirm Signup" Template

#### ✉️ Subject Line:
```
✓ Verify Your DaKshaa T26 Account - Action Required
```

#### 📄 Message Body:
Copy the entire content from: `SUPABASE_EMAIL_VERIFICATION_TEMPLATE.html`

**Preview:**
- Beautiful gradient design matching DaKshaa branding
- Large "Verify Email Address" button
- What's Next checklist
- Event highlights
- Alternative link for button failures
- Security notices and expiry warning
- Contact information and social links

### Step 3: Configure URL Settings

#### 🔗 Site URL (Authentication → URL Configuration)
```
Development: http://localhost:5173
Production: https://dakshaa-t26.web.app
```

#### 🔄 Redirect URLs (Add both)
```
http://localhost:5173/login
http://localhost:5173/**
https://dakshaa-t26.web.app/login
https://dakshaa-t26.web.app/**
```

### Step 4: Enable Email Confirmations

**Authentication → Settings → Email Provider:**
- ✅ Enable email confirmations: **ON**
- ✅ Confirm email: **enabled**
- ✅ Secure email change: **enabled** (recommended)

### Step 5: Test the Flow

#### Test Steps:
1. Clear browser cookies/localStorage
2. Register with a **real email** (test with Gmail/Outlook)
3. Check inbox (and spam folder)
4. Verify email appearance:
   - ✅ DaKshaa branding visible
   - ✅ Blue gradient header
   - ✅ Large verification button
   - ✅ Countdown warning
5. Click "Verify Email Address" button
6. Should redirect to `/login` page
7. Toast message: "Email verified successfully! ✓"
8. Try logging in with verified account

## 🎨 Template Features

### Visual Design:
- **Gradient Background:** Purple/indigo gradient wrapper
- **Main Container:** White card with rounded corners + shadow
- **Header:** Cyan-to-teal gradient with DaKshaa logo
- **Call-to-Action:** Large rounded button with gradient + shadow
- **Info Boxes:** Color-coded sections (blue, yellow, red)
- **Footer:** Event highlights + contact info + social links

### Content Sections:
1. **Greeting:** Personalized with user's full name
2. **Main Message:** Welcome text + verification explanation
3. **Primary CTA:** Large verification button
4. **What's Next:** 5-point checklist of next steps
5. **Alternative Link:** For email clients blocking buttons
6. **Expiry Warning:** 24-hour countdown alert
7. **Security Notice:** Ignore if not registered message
8. **Event Highlights:** 6 key features of DaKshaa T26
9. **Contact Info:** Support email + phone number
10. **Social Links:** Facebook, Twitter, Instagram, LinkedIn
11. **Footer:** Legal text + website links

### Responsive Design:
- **Max-width:** 600px (standard email width)
- **Mobile-friendly:** All tables use role="presentation"
- **Safe Colors:** Web-safe color palette
- **Inline Styles:** All CSS inline (email client compatible)
- **Fallback Text:** Plain text version available

## 🔧 Customization Options

### Change Brand Colors:
Replace these hex codes throughout the template:
- **Primary Cyan:** `#0ea5e9` → Your color
- **Secondary Teal:** `#06b6d4` → Your color
- **Purple Background:** `#667eea` / `#764ba2` → Your colors

### Update Contact Info:
```html
<!-- Find and replace: -->
support@dakshaa.com → your-email@domain.com
+91 98765 43210 → your-phone-number
```

### Change Social Links:
```html
<!-- Update href values: -->
<a href="#" → <a href="https://facebook.com/yourpage"
<a href="#" → <a href="https://twitter.com/yourhandle"
```

### Modify Event Highlights:
```html
<!-- Edit this section: -->
<td style="padding: 5px; color: #475569; font-size: 14px;">
  ⚡ Your Event Feature
</td>
```

## 🐛 Troubleshooting

### Email Not Sending:
1. Check Supabase project status (not paused)
2. Verify email confirmations enabled in settings
3. Check Site URL matches your domain
4. Ensure redirect URLs are added

### Button Not Working:
- Alternative link provided in yellow box
- Users can copy/paste URL manually
- Check if popup blocker is interfering

### Email Goes to Spam:
- Add SPF/DKIM records to domain
- Use custom domain for sending
- Configure Supabase SMTP settings

### Styles Not Showing:
- All styles are inline (should work everywhere)
- Test in multiple email clients (Gmail, Outlook, Yahoo)
- Use Litmus or Email on Acid for testing

## 📊 Email Client Compatibility

✅ **Fully Tested:**
- Gmail (Desktop + Mobile)
- Outlook 2016/2019/365
- Apple Mail (macOS + iOS)
- Yahoo Mail
- Thunderbird

⚠️ **Limited Support:**
- Outlook 2007-2013 (no gradient support)
- Windows Mail (basic rendering)

🔄 **Fallback:**
Plain text version provided in: `SUPABASE_EMAIL_VERIFICATION_PLAIN_TEXT.txt`

## 📁 Files Provided

1. **SUPABASE_EMAIL_VERIFICATION_TEMPLATE.html**
   - Complete HTML template with inline CSS
   - Copy entire content to Supabase

2. **SUPABASE_EMAIL_VERIFICATION_PLAIN_TEXT.txt**
   - Plain text fallback version
   - For clients that don't support HTML

3. **SETUP_EMAIL_TEMPLATE.md** (this file)
   - Complete setup instructions
   - Customization guide
   - Troubleshooting tips

## 🚀 Advanced Features

### Dynamic Content:
```html
<!-- Conditional display of user name: -->
{{ if .Data.full_name }}, {{ .Data.full_name }}{{ end }}

<!-- Available variables: -->
{{ .Email }}           - User's email
{{ .ConfirmationURL }} - Verification link
{{ .Data.full_name }}  - From signup metadata
{{ .SiteURL }}         - Your site URL
```

### A/B Testing:
- Create multiple versions
- Test different button colors
- Try different copy/messaging
- Measure click-through rates

### Analytics Tracking:
Add UTM parameters to links:
```html
<a href="{{ .ConfirmationURL }}&utm_source=email&utm_medium=verification&utm_campaign=signup">
```

## ✅ Final Checklist

Before going live:
- [ ] Template copied to Supabase
- [ ] Subject line updated
- [ ] Site URL configured
- [ ] Redirect URLs added
- [ ] Email confirmations enabled
- [ ] Test email sent successfully
- [ ] Button works correctly
- [ ] All links functional
- [ ] Mobile rendering verified
- [ ] Contact info updated
- [ ] Social links updated
- [ ] Brand colors match

## 📞 Support

If you need help:
1. Check Supabase docs: https://supabase.com/docs/guides/auth/auth-email
2. Review setup guide: `docs/guides/EMAIL_VERIFICATION_SETUP.md`
3. Contact: Your support email

---

**Last Updated:** January 1, 2026  
**Version:** 2.0  
**Compatible with:** Supabase Auth v2
