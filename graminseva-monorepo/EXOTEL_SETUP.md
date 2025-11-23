# Exotel Setup Guide for GraminSeva

## Overview
When someone calls your Exotel number **09513885656**, Exotel needs to forward the call to your backend server to process it with AI and log the conversation.

## Current Setup
- **Exotel Phone Number**: 09513885656
- **Backend Webhook Endpoint**: `/exotel/voice`
- **Backend Port**: 5001 (localhost)

## Steps to Make Your Number Live

### 1. Expose Your Backend to the Internet

Since your backend is running on `localhost:5001`, Exotel cannot reach it directly. You need to expose it using **ngrok**:

#### Install ngrok (if not already installed)
```bash
# Download from https://ngrok.com/download
# Or use winget
winget install ngrok
```

#### Start ngrok tunnel
```bash
ngrok http 5001
```

This will give you a public URL like: `https://abc123.ngrok.io`

**Important**: Keep this ngrok terminal window running!

### 2. Configure Exotel Webhook

1. Log in to your Exotel Dashboard: https://my.exotel.com/
2. Go to **Numbers** → Select your number **09513885656**
3. Find the **Voice Configuration** section
4. Set **Incoming Call URL** to:
   ```
   https://YOUR-NGROK-URL.ngrok.io/exotel/voice
   ```
   Replace `YOUR-NGROK-URL` with your actual ngrok URL
   
5. Set HTTP Method to: **POST**
6. Save the configuration

### 3. Test the Flow

#### Test 1: Call Your Number
1. Call **09513885656** from any phone
2. Speak your health concern in Hindi or English
3. The AI will respond with advice
4. Check the backend terminal for logs

#### Test 2: Check Dashboard
1. Open your browser: http://localhost:3000/dashboard
2. You should see:
   - Total calls count increased
   - Your call in "Recent Calls" section
   - Call transcript and AI response
   - If critical, it will show "Critical - Referred" status

### 4. Verify Data is Saved

The conversation data is automatically saved to:
- **Supabase** (your database): `call_logs` table
- Dashboard fetches this data and displays it in real-time

## How It Works

```
Caller dials 09513885656
         ↓
    Exotel receives call
         ↓
Exotel makes POST request to your webhook
         ↓
Your backend (/exotel/voice) processes:
  - Receives speech transcript
  - Calls OpenAI GPT-4 for medical advice
  - Logs to Supabase (call_logs table)
  - If critical: Creates referral + transfers call
  - Returns TwiML/XML response to Exotel
         ↓
Exotel speaks AI response to caller
         ↓
Dashboard shows call data in real-time
```

## Webhook Endpoint Details

**URL**: `/exotel/voice`
**Method**: POST
**Expected Parameters from Exotel**:
- `From`: Caller's phone number
- `To`: Your Exotel number (09513885656)
- `SpeechResult`: Transcribed speech from caller
- `Digits`: DTMF input (if any)

**Response Format**: XML (Exotel TwiML)

## Troubleshooting

### Issue: Calls not being logged
**Solution**: 
1. Check if backend is running: http://localhost:5001/health
2. Check Supabase credentials in `.env`
3. Look at backend terminal for error logs

### Issue: Dashboard shows no data
**Solution**:
1. Hard refresh browser (Ctrl + Shift + R)
2. Check backend API: http://localhost:5001/api/calls
3. Check Supabase `call_logs` table has data

### Issue: Exotel webhook fails
**Solution**:
1. Verify ngrok is running: `ngrok http 5001`
2. Test webhook manually:
   ```bash
   curl -X POST https://YOUR-NGROK-URL.ngrok.io/exotel/voice \
     -d "From=+919876543210" \
     -d "SpeechResult=Mujhe bukhar hai"
   ```
3. Check ngrok web interface: http://localhost:4040 (shows all requests)

### Issue: AI not responding properly
**Solution**:
1. Verify OpenAI API key in `.env`
2. Check OpenAI quota: https://platform.openai.com/usage
3. Backend logs will show OpenAI errors

## Important Notes

⚠️ **Keep ngrok running**: If ngrok stops, your webhook URL becomes invalid and calls won't work

⚠️ **Ngrok free plan**: URL changes every restart. Update Exotel webhook each time

💡 **Production**: For permanent deployment, deploy backend to:
- Heroku
- Railway
- Render
- AWS/Azure/GCP

Then use permanent domain in Exotel webhook (no ngrok needed)

## Current Configuration Status

✅ Backend configured with Exotel credentials
✅ Supabase connected for data storage
✅ Dashboard showing real call data
✅ OpenAI integration active
⏳ **Pending**: Expose backend via ngrok and configure Exotel webhook

## Next Steps

1. Run: `ngrok http 5001`
2. Copy the ngrok URL
3. Set it in Exotel dashboard webhook configuration
4. Make a test call to 09513885656
5. Check dashboard at http://localhost:3000/dashboard
