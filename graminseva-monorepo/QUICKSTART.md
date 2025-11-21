# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### Step 2: Set Up Environment
Copy this to `.env` in project root:
```env
# Required
OPENAI_API_KEY="sk-proj-..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="eyJ..."

# Optional but recommended
NEXT_PUBLIC_BACKEND_URL="http://localhost:5001"
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
HEALTHCARE_CENTERS="Sardar Hospital:+919999999999"
```

### Step 3: Run Locally (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Listens on http://localhost:5001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Opens at http://localhost:3000
```

### Step 4: Test

Open browser to `http://localhost:3000`

**Quick Test:**
1. Go to `/test` → Click test buttons
2. Go to `/voice-call` → Enter phone & health concern
3. Go to `/dashboard` → Watch real-time updates

## 🐳 Docker Setup

One command to run everything:
```bash
docker compose up --build
```

Then open:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5001`

## 📋 Checklist

Before going live:

- [ ] Supabase tables created (see SETUP.md)
- [ ] OpenAI API key working
- [ ] Backend connecting to Supabase
- [ ] Frontend calling backend
- [ ] Test call working
- [ ] Dashboard showing data
- [ ] (Optional) Twilio configured

## 🐛 Common Issues

**"Cannot find module '@supabase/supabase-js'"**
```bash
npm install
```

**"Backend not connecting"**
- Check `NEXT_PUBLIC_BACKEND_URL` in .env
- Verify backend running on port 5001
- Check CORS in backend/index.js

**"API not responding"**
- Add credentials to .env
- Check environment variables loaded
- Restart servers

**"Docker containers fail"**
```bash
docker compose down
docker compose up --build
```

## 📚 Key Files Modified

```
.env                                    - Configuration
backend/
  ├── index.js                         - API endpoints + Twilio
  └── package.json                     - Added twilio dependency

frontend/
  ├── src/app/
  │   ├── dashboard/page.tsx          - Enhanced with critical data
  │   ├── voice-call/page.tsx         - NEW: Health inquiry form
  │   └── api/
  │       ├── stats/route.ts          - Enhanced with backend connection
  │       └── test-call/route.ts      - Enhanced with real health queries
  └── README.md                        - Updated

SETUP.md                               - Complete setup guide
IMPLEMENTATION.md                      - Feature details
```

## 🎯 Features at a Glance

| Feature | Location | Status |
|---------|----------|--------|
| AI Health Guidance | `/voice-call` | ✅ Ready |
| Test Calls | `/test` | ✅ Ready |
| Dashboard | `/dashboard` | ✅ Ready |
| Critical Detection | Backend | ✅ Ready |
| Emergency Referral | Backend | ✅ Ready |
| Twilio Integration | Backend | ✅ Ready (optional) |

## 💡 Pro Tips

1. **Test with templates**: Click quick templates on `/voice-call`
2. **Watch dashboard update**: Make a call, see dashboard change in 5 seconds
3. **Check logs**: Backend logs all calls in Supabase
4. **Use dark mode**: `/dashboard` supports dark theme
5. **Multi-language**: Type in Hindi or English

## 🆘 Get Help

Check these files in order:
1. `SETUP.md` - Complete setup instructions
2. `IMPLEMENTATION.md` - Feature details
3. Backend logs - See what's happening
4. Browser DevTools - Check API calls

## 📞 Testing Health Scenarios

Try these on `/voice-call`:

| Scenario | Type | Expected |
|----------|------|----------|
| "Mere bacche ko tez bukhar hai" | Critical | 🚨 Referral |
| "Pregnant, bleeding" | Critical | 🚨 Referral |
| "Saans lene takleef" | Critical | 🚨 Referral |
| "Halki khansi" | Normal | ✅ Guidance |
| "Nutrition advice" | Normal | ✅ Guidance |

## 🔄 Data Flow

```
User Input (/voice-call)
    ↓
Frontend API (/api/voice)
    ↓
Backend API (POST /api/voice)
    ↓
OpenAI (Asha AI)
    ↓
Critical Check → Supabase Log → Twilio Transfer (if critical)
    ↓
Frontend Response Display
    ↓
Dashboard Update (5 sec)
```

## 🎓 Next Steps

1. ✅ Get running locally
2. ✅ Test all features
3. ✅ Configure Twilio (optional)
4. ✅ Deploy with Docker
5. ✅ Monitor dashboard
6. ✅ Scale with load balancer

## 🔌 Expose to Twilio (ngrok)

For local testing with Twilio you need a public HTTPS URL that forwards to your local backend.
The easiest way is `ngrok`.

1. Start your backend locally (or via Docker) so it listens on `http://localhost:5001`.

2. Start ngrok (PowerShell):

```powershell
.\scripts\start-ngrok.ps1
# or: ngrok http 5001
```

Or (bash):

```bash
./scripts/start-ngrok.sh
# or: ngrok http 5001
```

3. The script prints a public URL (for example `https://abcd-1234.ngrok.io`). Set your Twilio phone number's Voice webhook to:

```
<NGROK_URL>/api/voice/twiml
```

4. Configure Twilio webhook in the console: Dashboard → Phone Numbers → Manage → Active Numbers → (your number) → Voice & Fax → A CALL COMES IN → Webhook (POST).

Alternatively you can set the webhook via the Twilio REST API (replace values):

```bash
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=yyyy
PHONE_SID=PNxxxx   # the IncomingPhoneNumber SID for your Twilio number
NGROK_URL=https://abcd-1234.ngrok.io

curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/IncomingPhoneNumbers/$PHONE_SID.json" \
    -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
    --data-urlencode "VoiceUrl=$NGROK_URL/api/voice/twiml"
```

Notes:
- Use HTTPS public URLs (ngrok provides them).
- Test carefully; transfers will dial the numbers in `HEALTHCARE_CENTERS` from `.env`.
- If you want the backend reachable at a stable domain, deploy it and set the webhook to `https://your-domain.example/api/voice/twiml`.
---

**Questions?** Check SETUP.md or IMPLEMENTATION.md for details.

**Ready to deploy?** Use Docker Compose!

```bash
docker compose up --build
```

Happy consulting! 🏥❤️
