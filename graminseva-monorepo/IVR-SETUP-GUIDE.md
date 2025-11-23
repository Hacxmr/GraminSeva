# 📞 Setting Up Interactive Phone Calls (IVR)

## ⚠️ Current Status

Your phone calls are working, but the **interactive menu (pressing 1, 2, 3) requires ngrok** to function.

**What works now:**
✅ Calling the number
✅ Hearing welcome message
✅ Call connects and completes

**What needs ngrok:**
❌ Interactive menu (pressing buttons)
❌ Getting health advice based on selection
❌ Multi-step IVR flow

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Install ngrok

**Option A: Download from website**
1. Go to https://ngrok.com/download
2. Download for Windows
3. Extract `ngrok.exe` to a folder (e.g., `C:\ngrok\`)

**Option B: Using Chocolatey (if you have it)**
```bash
choco install ngrok
```

### Step 2: Sign up for free account

1. Go to https://dashboard.ngrok.com/signup
2. Create free account (no credit card needed)
3. Copy your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken

### Step 3: Authenticate ngrok

```bash
# Run this command (replace YOUR_TOKEN with your actual token)
ngrok config add-authtoken YOUR_TOKEN
```

### Step 4: Start ngrok tunnel

```bash
# Navigate to ngrok folder or use full path
cd C:\ngrok

# Start tunnel to port 5001
ngrok http 5001
```

**You'll see output like:**
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:5001
```

### Step 5: Copy the HTTPS URL

Copy the URL that looks like: `https://abc123.ngrok.io`

### Step 6: Add to .env file

1. Open `backend/.env`
2. Add this line (replace with your actual URL):
```env
NGROK_URL=https://abc123.ngrok.io
```

### Step 7: Restart backend server

```bash
# Stop current server (Ctrl+C in backend terminal)
# Then restart
cd backend
node index.js
```

---

## ✅ Testing the Interactive IVR

Once ngrok is configured:

1. **Call your Twilio number**
2. **Hear:** "Namaste! GraminSeva mein aapka swagat hai..."
3. **Press 1** for mother's health
4. **Hear:** Symptom selection menu
5. **Press 1, 2, 3, or 9** for specific symptoms
6. **Hear:** AI-generated health advice
7. **Call ends** with thank you message

---

## 🔧 Alternative: Use Exotel (No ngrok needed)

If ngrok is too complex, you can use Exotel which has its own webhook system:

### Update .env:
```env
CALL_SERVICE=exotel
EXOTEL_API_KEY=your_api_key
EXOTEL_API_TOKEN=your_api_token
EXOTEL_SID=your_sid
EXOTEL_SUBDOMAIN=your_subdomain
EXOTEL_PHONE_NUMBER=your_exotel_number
```

The system already has Exotel support built-in!

---

## 📱 Current Call Flow (Without ngrok)

**What happens now:**

```
1. User clicks "Start Your Call Now"
2. Enters phone number
3. System uses Twilio to call
4. User hears: "Namaste! Welcome to GraminSeva. This is a demo call."
5. Call ends
```

**What happens WITH ngrok:**

```
1. User clicks "Start Your Call Now"
2. Enters phone number
3. System uses Twilio to call
4. User hears welcome + menu
5. User presses 1 (mother) or 2 (child)
6. User hears symptom options
7. User presses symptom number
8. AI generates specific advice
9. User hears advice in English
10. Call ends with thank you
```

---

## 🐛 Troubleshooting

### "Application error has occurred"

**Cause:** Twilio trying to reach webhook URL but it's not accessible

**Solutions:**
1. **Setup ngrok** (see steps above)
2. **Use Exotel instead** (no webhook issues)
3. **Accept demo mode** (basic calls work, no interactive menu)

### ngrok URL keeps changing

**Cause:** Free ngrok gives random URLs

**Solutions:**
1. **Paid ngrok** ($8/month): Get fixed subdomain
2. **Update .env** every time ngrok restarts
3. **Use Exotel** for permanent solution

### Port 4040 already in use

**Cause:** ngrok already running

**Solution:**
```bash
# Find and kill ngrok
taskkill /F /IM ngrok.exe

# Start again
ngrok http 5001
```

---

## 💡 Recommended Approach

### For Development/Testing:
✅ Use **ngrok** (free, easy, full IVR)

### For Production/Demo:
✅ Use **Exotel** (Indian service, no webhook issues)
✅ Get paid ngrok for fixed URL

### For Quick Demo:
✅ Current setup works fine (basic calls)
✅ Show chat interface instead (fully functional)

---

## 📊 Feature Comparison

| Feature | Without ngrok | With ngrok | With Exotel |
|---------|--------------|------------|-------------|
| **Make calls** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Welcome message** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Interactive menu** | ❌ No | ✅ Yes | ✅ Yes |
| **AI health advice** | ❌ No | ✅ Yes | ✅ Yes |
| **Setup complexity** | Easy | Medium | Medium |
| **Cost** | Free | Free (with limits) | Paid |
| **URL stability** | N/A | Changes often | Permanent |
| **India-friendly** | Yes | Yes | ✅ Best |

---

## 🎯 Next Steps

Choose one option:

### Option 1: Full IVR (Recommended for demo)
```bash
1. Install ngrok
2. Run: ngrok http 5001
3. Copy HTTPS URL
4. Add to .env: NGROK_URL=https://your-url.ngrok.io
5. Restart backend
6. Test call with interactive menu
```

### Option 2: Use Exotel (Recommended for production)
```bash
1. Sign up at exotel.com
2. Get API credentials
3. Add to .env file
4. Set CALL_SERVICE=exotel
5. Restart backend
6. Test call
```

### Option 3: Demo with Chat (Easiest)
```bash
1. Keep current setup
2. Demo the chat interface at http://localhost:3000
3. Show AI health advice working
4. Explain IVR needs ngrok/Exotel for full functionality
```

---

## ✅ Verification

**Backend started correctly if you see:**
```
✅ Google AI (Gemini) client initialized
✅ Supabase client initialized
✅ Twilio client initialized
🌐 Server listening on http://0.0.0.0:5001
```

**ngrok running correctly if you see:**
```
Forwarding  https://abc123.ngrok.io -> http://localhost:5001
```

**Call working if:**
- Phone rings ✅
- You hear welcome message ✅
- With ngrok: Menu works ✅
- Without ngrok: Basic message ✅

---

## 📞 Support

**Having issues?**
1. Check backend console for errors
2. Verify Twilio credentials in .env
3. Test health endpoint: `curl http://localhost:5001/health`
4. Check ngrok web interface: http://localhost:4040

**Questions about:**
- ngrok setup → https://ngrok.com/docs
- Twilio → https://www.twilio.com/docs
- Exotel → https://developer.exotel.com
