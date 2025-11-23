# Interactive Voice Response (IVR) System - GraminSeva

## 🎯 Overview

GraminSeva now features a complete **Interactive IVR system** for phone calls with:
- **Bilingual support** (Hindi + English)
- **DTMF menu navigation** (press buttons on phone)
- **Automated health advice**
- **Critical case detection**
- **Automatic referrals** to health centers

## 📞 Call Flow

### 1. Initial Greeting
When a call is initiated:
- **Hindi**: नमस्ते! ग्रामीणसेवा में आपका स्वागत है
- **English**: Hello! Welcome to GraminSeva health service

### 2. Main Menu (Press 1, 2, or 3)
**Hindi:**
- Press **1** - मां को कोई स्वास्थ्य समस्या है (Mother has health problem)
- Press **2** - बच्चे को कोई स्वास्थ्य समस्या है (Child has health problem)  
- Press **3** - सामान्य स्वास्थ्य सलाह (General health advice)

**English:**
- Press **1** - Mother has a health problem
- Press **2** - Child has a health problem
- Press **3** - General health advice

### 3. Mother's Health Submenu (if pressed 1)
**Symptoms Menu:**
- Press **1** - बुखार या संक्रमण (Fever or infection)
- Press **2** - पेट दर्द या उल्टी (Stomach pain or vomiting)
- Press **3** - चक्कर या कमजोरी (Dizziness or weakness)
- Press **9** - 🚨 गंभीर रक्तस्राव या दर्द (Severe bleeding or pain) **[CRITICAL]**

### 4. Child's Health Submenu (if pressed 2)
**Symptoms Menu:**
- Press **1** - बुखार या खांसी (Fever or cough)
- Press **2** - दस्त या उल्टी (Diarrhea or vomiting)
- Press **3** - भूख न लगना (Loss of appetite)
- Press **9** - 🚨 सांस लेने में तकलीफ (Breathing difficulty) **[CRITICAL]**

## 🚨 Critical Case Detection

When users press **9** (emergency symptoms):
1. **Automated response** given in Hindi + English
2. **Call logged** as critical in database
3. **Referral automatically created** with:
   - Patient phone number
   - Issue type
   - Severity: "critical"
   - Assigned health center
   - Timestamp
4. **Dashboard updated** - Shows as red/critical call
5. **Health centers alerted** for immediate follow-up

## 🏥 Health Advice Provided

### Mother's Health Advice

**Fever/Infection (Option 1):**
- Rest well, drink fluids
- Take paracetamol if fever is high
- Visit health center if fever persists >3 days

**Stomach Pain/Vomiting (Option 2):**
- Avoid solid food
- Drink ORS solution
- Seek immediate help if severe pain or blood in vomit

**Dizziness/Weakness (Option 3):**
- Rest adequately
- Eat iron-rich foods (spinach, jaggery)
- Take prescribed iron supplements
- Consult doctor if persistent

**Severe Bleeding (Option 9 - CRITICAL):**
- Go to nearest health center **IMMEDIATELY**
- Emergency referral created automatically

### Child's Health Advice

**Fever/Cough (Option 1):**
- Keep child hydrated
- Give paracetamol for fever
- Visit doctor if fever >102°F or persists >2 days

**Diarrhea/Vomiting (Option 2):**
- Give ORS solution frequently
- Avoid milk temporarily
- Watch for dehydration signs (dry mouth, no tears)
- **MARKED AS CRITICAL** - Dehydration dangerous for children

**Loss of Appetite (Option 3):**
- Offer small frequent meals
- Include favorite foods
- Ensure adequate water intake
- Consult doctor if continues >3 days

**Breathing Difficulty (Option 9 - CRITICAL):**
- Rush to nearest health center **IMMEDIATELY**
- Emergency referral created automatically

## 🎤 Voice Features (Web Interface)

### Chatbot Voice Assistant
Users who can't read can enable voice in the chatbot:

1. **Click speaker icon** in chatbot header
2. **Voice responses** automatically read in Hindi/English
3. **Speaking indicator** shows when voice is active
4. **Toggle on/off** anytime

**Features:**
- Text-to-Speech (TTS) for all responses
- Hindi language support
- Adjustable speed and pitch
- Visual speaking indicator

## 🔧 Technical Details

### Backend Endpoints

**IVR Webhooks:**
- `POST /api/twilio/voice` - Initial IVR greeting and main menu
- `POST /api/twilio/gather` - Process main menu selection
- `POST /api/twilio/mother-symptoms` - Handle mother's health symptoms
- `POST /api/twilio/child-symptoms` - Handle child's health symptoms
- `POST /api/twilio/status` - Call status callbacks

### Call Logging
Every call is automatically logged with:
```javascript
{
  id: "timestamp",
  phoneNumber: "+911234567890",
  timestamp: "2025-11-22T10:30:00.000Z",
  issueType: "mother_symptom_9", // or "child_symptom_2", etc.
  advice: "Full advice text provided",
  isCritical: true/false,
  status: "completed"
}
```

### Referral Creation (Critical Cases)
```javascript
{
  id: "timestamp",
  callId: "linked_call_id",
  phoneNumber: "+911234567890",
  issueType: "severe_bleeding",
  severity: "critical",
  status: "pending",
  assignedCenter: "Sardar Hospital",
  createdAt: "2025-11-22T10:30:00.000Z"
}
```

## 📊 Dashboard Integration

Critical calls appear in dashboard with:
- 🔴 **Red highlight** for critical cases
- **Severity indicator**
- **Issue type** displayed
- **Referral status** tracking
- **Quick action buttons** for health centers

## 🌐 Ngrok Setup (for Testing)

To test IVR with real calls:

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 5001
   ```

3. **Copy URL** (e.g., `https://abc123.ngrok.io`)

4. **Update .env:**
   ```env
   NGROK_URL=https://abc123.ngrok.io
   ```

5. **Restart backend**

Now Twilio can reach your local server for IVR!

## 📱 Testing the System

### Test a Call:
1. Go to http://localhost:3000
2. Click **"Start Your Call Now"**
3. Enter phone number: `+91XXXXXXXXXX`
4. Click **"Call Me"**
5. Answer the call
6. Follow voice prompts and press buttons

### Test Voice Assistant:
1. Click **chatbot icon** (bottom-right)
2. Click **speaker icon** to enable voice
3. Type a health question
4. Listen to voice response in Hindi/English

## 🎯 Use Cases

1. **Illiterate Users:** Can navigate using voice prompts only
2. **Emergency Cases:** Press 9 for immediate critical handling
3. **General Advice:** Press 3 for basic health guidance
4. **Follow-up:** Critical cases automatically tracked

## 📝 Future Enhancements

- Speech-to-Text for voice input (no button pressing needed)
- Multi-language support (Tamil, Telugu, etc.)
- SMS confirmation after call
- WhatsApp integration for follow-ups
- Call recording for quality assurance
- AI-powered symptom analysis

## 🔐 Privacy & Security

- Phone numbers encrypted
- Calls not recorded (unless configured)
- HIPAA-compliant data handling
- Secure webhooks with HTTPS
- No PII stored unnecessarily

---

**Status:** ✅ Fully Operational
**Last Updated:** November 22, 2025
