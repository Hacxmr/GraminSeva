# 🚀 GraminSeva - Quick Start Guide

## एक साथ Backend और Frontend चलाएं (Run Together)

### विधि 1: स्वचालित स्क्रिप्ट (Automatic Script)

**Windows:**
```bash
# Repository के root folder में जाएं
cd graminseva-monorepo

# Start script चलाएं
START.bat
```

यह script automatically:
- ✅ Node.js check करेगा
- ✅ पुराने processes को बंद करेगा
- ✅ Backend शुरू करेगा (Port 5001)
- ✅ Frontend शुरू करेगा (Port 3000)
- ✅ Browser में application खोलेगा

---

### विधि 2: Manual (दो terminals में)

#### Terminal 1 - Backend शुरू करें:
```bash
cd graminseva-monorepo/backend
node index.js
```

**Expected Output:**
```
✅ Google AI (Gemini) client initialized
✅ Supabase client initialized
✅ Twilio client initialized
🌐 Server listening on http://0.0.0.0:5001
```

#### Terminal 2 - Frontend शुरू करें:
```bash
cd graminseva-monorepo/frontend
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.0.3 (Turbopack)
- Local: http://localhost:3000
✓ Ready in 2s
```

---

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application UI |
| **Backend API** | http://localhost:5001 | REST API server |
| **Dashboard** | http://localhost:3000/dashboard | Admin dashboard |
| **Health Check** | http://localhost:5001/health | Backend status |

---

## 🎯 Quick Test

### 1. Web Interface Test
1. खोलें: http://localhost:3000
2. Click करें chatbot icon (bottom-right) 💬
3. Click करें speaker icon 🔊 to enable voice
4. Type करें: **"mujhe fever aur cough hai"**
5. सुनें AI की feminine voice में जवाब

### 2. Phone Call Test
1. Click करें **"Start Your Call Now"**
2. अपना phone number enter करें
3. Call आएगी Twilio से
4. Follow करें IVR menu instructions

---

## 🛠️ Troubleshooting

### समस्या: Port already in use

**हल:**
```bash
# सभी Node processes को बंद करें
taskkill /F /IM node.exe

# फिर से start करें
START.bat
```

### समस्या: Backend नहीं चल रहा

**Check करें:**
1. `.env` file है backend folder में
2. Google AI API key सही है
3. Port 5001 खाली है

**हल:**
```bash
cd backend
node index.js
```

### समस्या: Frontend compile नहीं हो रहा

**हल:**
```bash
cd frontend
npm install
npm run dev
```

### समस्या: Voice काम नहीं कर रही

**Check करें:**
1. Browser में microphone permission दिया है
2. HTTPS या localhost पर चल रहा है
3. Browser console में errors check करें (F12)

**हल:**
- Chrome/Edge browser use करें
- Speaker icon को फिर से click करें
- Browser refresh करें (Ctrl+R)

---

## 📝 Environment Variables

### Backend (.env)
```env
# AI Configuration
GOOGLE_AI_API_KEY=AIzaSyBwB7oly0R8S7ISd5ik9kDhaYaJXSs_3pU

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Twilio (Phone Calls)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Server
PORT=5001
CALL_SERVICE=twilio
```

---

## 🎤 Voice Features

### हिंदी में feminine voice:
- **Enable करने पर**: "मैं अब सभी संदेशों को जोर से पढूंगी।"
- **Language बदलने पर**: "मैंने भाषा हिंदी में बदल दी है।"
- **Responses**: "Main aapki madad kar rahi hoon..."

### Voice Settings:
- **Pitch**: 2.0 (Maximum feminine)
- **Rate**: 0.9 (Clear speed)
- **Languages**: Hindi (hi-IN), English (en-IN)

---

## 🔄 Development Workflow

### 1. Code Changes के बाद:
```bash
# Backend restart (Terminal 1)
Ctrl+C
node index.js

# Frontend auto-reloads (no restart needed)
```

### 2. नया dependency install करने के लिए:
```bash
# Backend
cd backend
npm install <package-name>

# Frontend
cd frontend
npm install <package-name>
```

### 3. Database changes के लिए:
- Supabase dashboard: https://apubdmpefyqesqcqohgi.supabase.co
- या local JSON files: `backend/call_logs.json`, `backend/referrals.json`

---

## 📊 Features Overview

### ✅ Implemented
- 💬 AI Chatbot (Google Gemini)
- 🎤 Text-to-Speech (Feminine voice)
- 📞 Phone Call System (Twilio IVR)
- 🏥 Health Advice (Maternal & Child)
- 🌾 Agriculture Guidance
- 🚨 Critical Case Detection
- 📈 Admin Dashboard
- 🗣️ Bilingual Support (Hindi/English)

### 🎯 Usage Stats
- **Voice Pitch**: 2.0 (Max feminine)
- **Language**: Hindi (feminine verbs: करूंगी, बताऊंगी)
- **AI Model**: Gemini 1.5 Flash
- **Response Time**: ~2-5 seconds

---

## 🆘 Quick Commands

```bash
# Start everything
START.bat

# Stop everything
taskkill /F /IM node.exe

# Check if running
netstat -ano | findstr :3000
netstat -ano | findstr :5001

# View logs
# Backend terminal window
# Frontend terminal window

# Test backend directly
curl http://localhost:5001/health

# Test frontend
curl http://localhost:3000
```

---

## 📞 Contact & Support

- **Repository**: https://github.com/Hacxmr/GraminSeva
- **Branch**: hackathon-demo
- **Documentation**: `/DOCUMENTATION.md`

---

## 🎉 Success Indicators

सब कुछ सही से चल रहा है अगर:

✅ Backend terminal shows: `✅ Google AI (Gemini) client initialized`  
✅ Frontend terminal shows: `✓ Ready in 2s`  
✅ Browser में chatbot खुल रहा है  
✅ Voice enable करने पर "मैं अब सभी संदेशों को जोर से पढूंगी।" सुनाई देता है  
✅ Message भेजने पर feminine voice में response आता है  

---

**🚀 Ab aap tayyar hain! Open करें http://localhost:3000 और test करें!**
