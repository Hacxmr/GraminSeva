# 📞 Twilio Setup Guide - GraminSeva

## 🚨 The Localhost Problem

**Error**: `Url is not a valid URL: http://localhost:3000/api/voice`

**Why?** Twilio needs a **publicly accessible URL** to send webhook requests. Your local development server at `localhost:3000` is only accessible from your computer, not from Twilio's servers.

---

## ✅ Solutions (Choose One)

### **Option 1: Development Mode (Current Setup)** ⭐ RECOMMENDED FOR TESTING

The app now automatically detects localhost and **simulates calls** without using Twilio. This allows you to test the UI and functionality without needing a public URL.

**What happens:**
- ✅ Call button works normally
- ✅ Call entries are created
- ✅ Dashboard updates
- ⚠️ No actual phone call is made (simulated)

**No setup needed!** Just click "Call Now" and test the UI.

---

### **Option 2: Use ngrok (For Real Calls in Development)** 🚀

Ngrok creates a temporary public URL that tunnels to your localhost.

#### **Steps:**

1. **Install ngrok**
   ```bash
   npm install -g ngrok
   ```

2. **Start your dev server**
   ```bash
   pnpm dev
   ```

3. **In a new terminal, start ngrok**
   ```bash
   ngrok http 3000
   ```

4. **Copy the ngrok URL** (looks like: `https://abc123.ngrok.io`)

5. **Update your `.env` file**
   ```properties
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```

6. **Restart your dev server**
   ```bash
   # Stop current server (Ctrl+C)
   pnpm dev
   ```

7. **Test the call** - Now real calls will work!

**Note:** The ngrok URL changes each time you restart it (unless you use a paid plan).

---

### **Option 3: Deploy to Production** 🌐

Deploy your app to get a permanent public URL.

#### **Quick Deploy Options:**

**A. Vercel (Recommended - Free)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow the prompts
```

**B. Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**C. Railway**
- Push to GitHub
- Connect Railway to your repo
- Auto-deploys on push

#### **After Deployment:**

1. Get your production URL (e.g., `https://your-app.vercel.app`)
2. Update `.env` (or add environment variables in hosting platform):
   ```properties
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
3. Add all Twilio credentials to production environment variables

---

## 🔧 Twilio Configuration

### **1. Get Twilio Credentials**

1. Sign up at [twilio.com](https://www.twilio.com/try-twilio)
2. Get a free trial phone number
3. Find your credentials at [console.twilio.com](https://console.twilio.com)

### **2. Update `.env` file**

```properties
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Application URL
# Development (simulated calls):
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OR Production/ngrok (real calls):
# NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
# NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# OpenAI API Key (optional for AI responses)
OPENAI_API_KEY=sk-...
```

### **3. Restart Server**

```bash
# Stop current server (Ctrl+C)
pnpm dev
```

---

## 🧪 Testing Each Mode

### **Development Mode (Simulated)**
```bash
# .env file
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Result: Calls are simulated, no Twilio needed
```

### **Testing with ngrok (Real Calls)**
```bash
# Terminal 1
pnpm dev

# Terminal 2
ngrok http 3000

# .env file
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io  # Use your ngrok URL

# Result: Real phone calls via Twilio
```

### **Production (Real Calls)**
```bash
# Deploy to Vercel/Netlify
# Set environment variables in hosting platform

# Result: Real phone calls, permanent URL
```

---

## 📊 Feature Comparison

| Feature | Development | ngrok | Production |
|---------|------------|-------|------------|
| Setup Time | ✅ Instant | ⚡ 2 minutes | 🕐 5-10 minutes |
| Real Calls | ❌ No | ✅ Yes | ✅ Yes |
| UI Testing | ✅ Yes | ✅ Yes | ✅ Yes |
| Permanent URL | ❌ No | ❌ No | ✅ Yes |
| Twilio Cost | ✅ Free | 💰 Uses credits | 💰 Uses credits |
| Recommended For | UI/UX testing | Call testing | Live users |

---

## 💡 Current Status

✅ **Development mode is active!**
- You can test all buttons and UI
- Calls are simulated automatically
- Dashboard updates work
- No public URL needed

⚠️ **For real phone calls:**
- Use ngrok (Option 2) for testing
- Or deploy to production (Option 3)

---

## 🐛 Troubleshooting

### **"URL is not valid" error**
- You're trying to use Twilio with localhost
- Solution: Use development mode (current setup) or ngrok

### **Calls not going through**
- Check Twilio credentials are correct
- Verify phone number has country code (+91 for India)
- Check Twilio console for error logs

### **ngrok URL not working**
- Restart ngrok and update .env with new URL
- Restart dev server after updating .env

### **Environment variables not loading**
- Restart dev server after changing .env
- Check for typos in variable names
- Ensure .env is in project root directory

---

## 📱 Test Phone Numbers (Twilio Trial)

With Twilio trial account:
- You can only call **verified phone numbers**
- Verify numbers in [Twilio Console](https://console.twilio.com/us1/develop/phone-numbers/manage/verified)
- Calls play a trial message before connecting

**Upgrade to paid account to:**
- Call any number
- Remove trial messages
- Get more credits

---

## 🎯 Recommended Development Workflow

1. **Start with Development Mode** (current setup)
   - Test all UI features
   - Verify button functionality
   - Check dashboard updates

2. **Use ngrok when you need real calls**
   - Test actual voice interactions
   - Verify Twilio integration
   - Debug voice response logic

3. **Deploy to Production for live users**
   - Get permanent URL
   - Set up monitoring
   - Configure production credentials

---

## 🚀 Quick Start Commands

**Current Mode (Simulated Calls):**
```bash
pnpm dev
# Visit http://localhost:3000
# Click "Call Now" - calls are simulated
```

**With ngrok (Real Calls):**
```bash
# Terminal 1
pnpm dev

# Terminal 2
ngrok http 3000
# Copy the https URL
# Update NEXT_PUBLIC_APP_URL in .env
# Restart Terminal 1

# Visit http://localhost:3000
# Click "Call Now" - real calls via Twilio
```

---

**Current Status**: ✅ All buttons working in development mode!
**Next Step**: Choose Option 2 (ngrok) or 3 (Deploy) for real calls.
