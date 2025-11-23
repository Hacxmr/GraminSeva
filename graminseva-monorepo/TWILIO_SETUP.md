# Twilio Setup Guide for GraminSeva

## Current Status
✅ Twilio SDK installed
✅ Twilio credentials configured in backend/.env
✅ Backend code updated with Twilio integration
✅ Backend server running with Twilio client initialized

## What You Need to Do Now

### Step 1: Get a Twilio Phone Number (5 minutes)

1. **Go to Twilio Console:**
   - Visit: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
   
2. **Buy a Phone Number:**
   - Click the **"Buy a number"** button
   - Select your country (India for local numbers)
   - Choose **Voice** capability
   - Click **"Search"**
   - Select a number you like
   - Click **"Buy"** (FREE with your $15 trial credit)

3. **Copy Your Phone Number:**
   - After purchase, copy the phone number (format: +1234567890)

### Step 2: Update Configuration

1. **Edit backend/.env file:**
   ```
   TWILIO_PHONE_NUMBER=+1234567890  # Replace with your actual Twilio number
   ```

2. **Restart backend server:**
   - Stop current server: Press Ctrl+C in backend terminal
   - Start again: `npm start`

### Step 3: Test the Call Feature

1. **Open the app:** http://localhost:3001
2. **Click "Start Your Call Now"** button
3. **Enter your phone number** (use E.164 format with country code: +911234567890)
4. **Click "Call Me"**
5. **You should receive a call!** The message will be in Hindi and English

## Phone Number Format

**Important:** Phone numbers must be in E.164 format:
- ✅ Correct: `+911234567890` (India)
- ✅ Correct: `+14155551234` (USA)
- ❌ Wrong: `1234567890` (missing country code)
- ❌ Wrong: `091234567890` (incorrect format)

## Current Configuration

Your Twilio account:
- **Account SID:** (Configure in .env file)
- **Auth Token:** (Configure in .env file)
- **Phone Number:** ⚠️ NEEDS TO BE SET (currently placeholder)

## Testing

Once you've added your Twilio phone number:

1. **Backend logs will show:**
   ```
   🔗 Twilio API Configuration:
      Account SID: ACxxxxxxxxxxxx
      From Number: +YOUR_TWILIO_NUMBER
      To Number: +USER_PHONE_NUMBER
   ✅ Twilio call initiated successfully
      Call SID: CA...
      Status: queued
   ```

2. **Frontend will show:**
   - "Call initiated successfully via Twilio"
   - Call status with SID

## Troubleshooting

### Error: "The From phone number is not a valid Twilio number"
- **Solution:** Make sure you bought a Twilio phone number and set it in `.env`

### Error: "Invalid phone number format"
- **Solution:** Use E.164 format with country code (e.g., +911234567890)

### Error: "Authentication failed"
- **Solution:** Verify Account SID and Auth Token in `.env` file

### Error: Insufficient balance
- **Solution:** Check your Twilio balance at https://console.twilio.com/
- You should have $15 trial credit

## Resources

- **Twilio Console:** https://console.twilio.com/
- **Buy Phone Numbers:** https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
- **Account Balance:** https://console.twilio.com/billing
- **Error Codes:** https://www.twilio.com/docs/api/errors
- **Twilio Docs:** https://www.twilio.com/docs/voice/make-calls

## Alternative: Keep Using Exotel

If you want to use Exotel instead (once your account is activated):
1. Change `CALL_SERVICE=exotel` in backend/.env
2. Restart backend server
3. Contact Exotel support to activate your account

## Cost Estimate

With Twilio's $15 trial credit:
- India calls: ~$0.02 per minute = ~750 minutes = 12.5 hours of calls
- USA calls: ~$0.01 per minute = ~1500 minutes = 25 hours of calls

Perfect for your hackathon demo! 🎉
