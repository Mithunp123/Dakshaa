# QR Printing Quick Reference Card

## For Super Admins 👨‍💼

### How to Print QR Codes

1. **Login** to your Super Admin account
2. **Navigate** to Registration Management
3. **Select** an event from the list
4. **Click** the green "Print QR" button
5. **Wait** for the QR codes to generate
6. **Print** when the print dialog appears

### Features
- ✅ Print unlimited times
- ✅ Print for any event
- ✅ Automatic team member QR generation
- ✅ All registered events included

---

## For Event Coordinators 🎯

### How to Print QR Codes (ONE TIME ONLY)

1. **Login** to your Coordinator account
2. **Go to** assigned events
3. **Select** your event
4. **Click** "Print QR" button
5. **Confirm** and print

### Important Notes
- ⚠️ You can only print **ONCE** per participant
- ⚠️ Cannot re-print after first time
- ⚠️ Contact Super Admin if re-print needed
- ✅ Only for paid participants

### Error Messages

**"QR code already printed for this participant"**
- This means you already printed once
- Contact Super Admin if re-print needed

**"No registrations to print"**
- Event has no paid participants yet
- Check payment status

---

## For Scanning Staff 📱

### How to Scan QR Codes

1. **Open** Scanner page
2. **Allow** camera permissions
3. **Point** camera at QR code
4. **View** participant information:
   - Name
   - Registration ID (DAK26-XXXXXXXX)
   - College
   - **All Registered Events** 👈 NEW!

### What to Check
- ✅ Green checkmark = Valid entry
- ✅ Name matches ID card
- ✅ Check which events they're registered for
- ❌ Red X = Invalid or error

---

## QR Code Format 📄

Each printed QR includes:

```
┌────────────────────────┐
│    DaKshaa 2026        │
│ Participant Entry Pass │
│                        │
│   [QR CODE IMAGE]      │
│                        │
│ NAME: John Doe         │
│ ID: DAK26-ABC12345     │
│ TEAM: Team Alpha       │ (if team event)
│                        │
│ Registered Events:     │
│ • Event 1              │
│ • Event 2              │
│                        │
│ Present at venue       │
└────────────────────────┘
```

---

## Common Issues & Solutions 🔧

### Issue: Print button is disabled
**Solution**: 
- Check if event has paid participants
- Verify you're logged in correctly
- Refresh the page

### Issue: Nothing happens when clicking Print
**Solution**:
- Allow pop-ups in browser settings
- Check browser supports printing
- Try Chrome or Edge browser

### Issue: QR codes not printing correctly
**Solution**:
- Check printer is connected
- Use "Print" not "Save as PDF" first
- Adjust print settings if needed

### Issue: "Already printed" error (Coordinators)
**Solution**:
- This is normal after first print
- Contact Super Admin to re-enable
- Super Admin can print unlimited times

### Issue: Scanner not showing events
**Solution**:
- Ensure good internet connection
- Re-scan the QR code
- Check QR is from new system

---

## Best Practices ✨

### Before Printing
1. ✅ Verify all payments are processed
2. ✅ Check participant details are correct
3. ✅ Ensure printer has enough paper
4. ✅ Test with one participant first

### During Printing
1. ✅ Check print quality
2. ✅ Ensure QR is clear and scannable
3. ✅ Keep prints organized by event
4. ✅ Handle with care to avoid damage

### At Event Venue
1. ✅ Set up scanner stations early
2. ✅ Test scanners before participants arrive
3. ✅ Have backup printed list ready
4. ✅ Train scanning staff properly

---

## Quick Commands 💻

### Check if user already printed
```sql
SELECT full_name, is_print 
FROM profiles 
WHERE id = 'user-id';
```

### Reset print flag (Super Admin only)
```sql
UPDATE profiles 
SET is_print = false 
WHERE id = 'user-id';
```

### Count printed vs not printed
```sql
SELECT 
  is_print,
  COUNT(*) as count
FROM profiles
GROUP BY is_print;
```

---

## Support Contacts 📞

**Technical Issues**: Contact IT Support
**Print Problems**: Contact Admin Team
**Scanner Issues**: Check documentation first

---

## Remember! 💡

- **Super Admin**: Can print unlimited times
- **Coordinator**: Can print only ONCE
- **QR Codes**: Include ALL registered events
- **Teams**: Each member gets separate QR
- **Scanner**: Shows full participant info

---

## Keyboard Shortcuts ⌨️

- `Ctrl + P` - Print dialog (after clicking Print QR)
- `Esc` - Cancel print
- `F5` - Refresh if page stuck

---

## Print Settings Recommendation 🖨️

- **Paper**: A4 White
- **Orientation**: Portrait
- **Margins**: Default
- **Scale**: 100%
- **Background**: Enable (to show borders)
- **Headers/Footers**: Disable

---

**Last Updated**: February 5, 2026
**Version**: 1.0.0
**System**: DaKshaa 2026 Event Management
