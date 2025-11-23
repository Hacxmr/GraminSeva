# 🎙️ Twilio Studio IVR Setup Guide

## 🚀 Quick Setup (10 minutes)

### Step 1: Create Twilio Studio Flow

1. Go to: **https://console.twilio.com/us1/develop/studio/flows**
2. Click **"Create new Flow"**
3. Name it: **"GraminSeva Health Assistant"**
4. Click **"Next"**
5. Choose **"Start from scratch"**

### Step 2: Build the IVR Flow

I'll guide you through the visual editor. Here's what to create:

#### **Widget 1: Welcome Message (Trigger)**
- Already there when you start
- This is where the call begins

#### **Widget 2: Gather Input (Menu)**

1. Drag **"Gather Input on Call"** widget to canvas
2. Connect **Trigger** → **Gather Input**
3. Configure:
   - **Widget Name**: `main_menu`
   - **Text to Say**: 
     ```
     Namaste! GraminSeva mein aapka swagat hai. Kripya sunein. 
     Maa ki swasthya samasya ke liye 1 dabayen. 
     Bacche ki swasthya samasya ke liye 2 dabayen. 
     Samanya swasthya salah ke liye 3 dabayen.
     ```
   - **Voice**: `Polly.Aditi` (Hindi female voice)
   - **Language**: `hi-IN`
   - **Number of Digits**: `1`
   - **Timeout**: `10` seconds
   - **Stop Gathering After**: Select "Pressed digits equals set"

4. Add **"Say/Play"** widget after text to say English version:
   - **Text**: `Hello! Welcome to GraminSeva health service. Press 1 for mother health, 2 for child health, 3 for general advice.`
   - **Voice**: `alice`
   - **Language**: `en-IN`

#### **Widget 3: Split Based on Input**

1. Drag **"Split Based On..."** widget
2. Connect **Gather Input** → **Split Based On**
3. Configure:
   - **Variable to test**: `{{widgets.main_menu.Digits}}`
   - **Transitions**:
     - If `Equal To` → `1` → Go to "Mother Health"
     - If `Equal To` → `2` → Go to "Child Health"  
     - If `Equal To` → `3` → Go to "General Advice"
     - **No Condition Matches** → Go to "Invalid Input"

#### **Widget 4a: Mother Health Submenu**

1. Drag **"Gather Input on Call"** widget
2. Name: `mother_symptoms`
3. Connect from Split → `1`
4. Configure:
   - **Text to Say**:
     ```
     Aapne maa ki swasthya samasya chuni hai. Kripya lakshan chunein.
     Bukhar ya infection ke liye 1 dabayen.
     Pet dard ya ulti ke liye 2 dabayen.
     Chakkar ya kamzori ke liye 3 dabayen.
     Gambhir raktasrav ya dard ke liye 9 dabayen.
     ```
   - **Voice**: `Polly.Aditi`
   - **Language**: `hi-IN`
   - **Number of Digits**: `1`

#### **Widget 4b: Child Health Submenu**

1. Drag **"Gather Input on Call"** widget
2. Name: `child_symptoms`
3. Connect from Split → `2`
4. Configure:
   - **Text to Say**:
     ```
     Aapne bacche ki swasthya samasya chuni hai. Kripya lakshan chunein.
     Bukhar ya khansi ke liye 1 dabayen.
     Dast ya ulti ke liye 2 dabayen.
     Bhookh na lagna ke liye 3 dabayen.
     Saans lene mein takleef ke liye 9 dabayen.
     ```
   - **Voice**: `Polly.Aditi`
   - **Language**: `hi-IN`
   - **Number of Digits**: `1`

#### **Widget 5: HTTP Request to Backend**

For each symptom option, add **"Make HTTP Request"** widget:

1. Drag **"Make HTTP Request"** widget
2. Name: `get_ai_advice`
3. Configure:
   - **HTTP Method**: `POST`
   - **URL**: `http://localhost:5001/api/voice` (or your public backend URL)
   - **Content Type**: `application/json`
   - **Request Body**:
     ```json
     {
       "message": "{{widgets.mother_symptoms.Digits == '1' ? 'Mother has fever or infection' : widgets.mother_symptoms.Digits == '2' ? 'Mother has stomach pain' : 'Mother has weakness'}}",
       "phoneNumber": "{{trigger.call.From}}"
     }
     ```

**Note**: For hackathon demo, you can skip HTTP requests and use static responses.

#### **Widget 6: Say AI Response**

1. Drag **"Say/Play"** widget
2. Configure:
   - **Text to Say**: `{{widgets.get_ai_advice.parsed.reply}}`
   - **Voice**: `alice`
   - **Language**: `en-IN`

#### **Widget 7: Thank You & Hangup**

1. Drag **"Say/Play"** widget
2. Configure:
   - **Text to Say**: `Dhanyavaad. Swasth rahein. Thank you for calling GraminSeva.`
   - **Voice**: `Polly.Aditi`
   - **Language**: `hi-IN`

3. Drag **"Hangup"** widget
4. Connect Say → Hangup

---

## 📱 Simplified Flow (Quick Demo Version)

If the above is too complex, here's a **minimal working version**:

### Simple Flow:

```
1. Trigger (Start)
   ↓
2. Gather Input (Main Menu)
   - Say: "Press 1 for mother health, 2 for child health"
   - Get 1 digit
   ↓
3. Split Based On Digits
   ├─ If 1 → Say: "For mother's health: Rest, drink water, visit doctor if fever persists. Thank you!"
   ├─ If 2 → Say: "For child's health: Keep child hydrated, monitor fever, visit doctor if symptoms worsen. Thank you!"
   └─ Else → Say: "Invalid input. Goodbye."
   ↓
4. Hangup
```

---

## 🔗 Connect Flow to Your Number

### Step 3: Publish the Flow

1. Click **"Publish"** (top right)
2. Confirm publish

### Step 4: Connect to Phone Number

1. Go to: **https://console.twilio.com/us1/develop/phone-numbers/manage/incoming**
2. Click on your phone number: **+19522990705**
3. Scroll to **"Voice & Fax"** section
4. Under **"A CALL COMES IN"**:
   - Change from "Webhook" to **"Studio Flow"**
   - Select: **"GraminSeva Health Assistant"**
5. Click **"Save"**

---

## ✅ Test Your IVR

1. Call your Twilio number: **+1 952-299-0705**
2. You should hear the welcome message
3. Press 1 or 2
4. Hear the submenu
5. Press a symptom number
6. Hear the advice
7. Call ends

---

## 🎨 Visual Flow Diagram

Here's what your flow should look like:

```
┌─────────────────┐
│   Trigger       │
│  (Call Starts)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gather Input   │
│  (Main Menu)    │
│  "Press 1, 2, 3"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Split Based On │
│     Digits      │
└─┬─────┬─────┬───┘
  │     │     │
  1     2     3
  │     │     │
  ▼     ▼     ▼
Mother Child General
Menu   Menu  Advice
  │     │     │
  └─────┴─────┘
        │
        ▼
   ┌─────────┐
   │ Say     │
   │ Advice  │
   └────┬────┘
        │
        ▼
   ┌─────────┐
   │ Hangup  │
   └─────────┘
```

---

## 🔧 Advanced: Connect to Your Backend

If you want AI-generated responses (optional):

### Make your backend public:

**Option A: Use ngrok (paid)**
```bash
ngrok http 5001 --authtoken YOUR_TOKEN
```

**Option B: Deploy backend to:**
- Heroku (free tier)
- Render.com (free tier)
- Railway.app (free tier)

### Then in HTTP Request widget:
- **URL**: `https://your-public-backend.com/api/voice`
- **Body**: `{"message": "User pressed {{widgets.main_menu.Digits}}", "phoneNumber": "{{trigger.call.From}}"}`

---

## 💡 Tips

### Voices Available:
- **Polly.Aditi** - Hindi female (best for GraminSeva)
- **Polly.Raveena** - Hindi female (alternative)
- **alice** - English (clear, neutral)

### Best Practices:
1. Keep messages under 20 seconds
2. Always provide English + Hindi
3. Use clear digit options (1, 2, 3, not *)
4. Add pauses between languages
5. Always end with "Thank you" + Hangup

---

## 🎯 Ready-to-Use Widget Configurations

### Widget: Main Menu (Copy-Paste)
```
Widget: Gather Input on Call
Name: main_menu

Say a Message:
Text: Namaste! GraminSeva mein aapka swagat hai. Maa ki swasthya ke liye 1 dabayen. Bacche ki swasthya ke liye 2 dabayen.

Voice: Polly.Aditi
Language: hi-IN
Number of Digits: 1
Timeout (seconds): 10
Stop Gathering After: Pressed digits equals set
```

### Widget: Mother Symptoms
```
Widget: Gather Input on Call
Name: mother_symptoms

Say a Message:
Text: Bukhar ke liye 1, pet dard ke liye 2, kamzori ke liye 3, emergency ke liye 9 dabayen.

Voice: Polly.Aditi  
Language: hi-IN
Number of Digits: 1
```

### Widget: Static Response (Mother Fever)
```
Widget: Say/Play
Name: fever_advice

Say a Message:
Text: Bukhar ke liye: Aaram karein, paani piyein, paracetamol le sakte hain. Agar bukhar 3 din se zyada rahe toh doctor se milein. Dhanyavaad!

Voice: Polly.Aditi
Language: hi-IN
```

---

## 🚀 You're All Set!

After setup:
- ✅ No ngrok needed
- ✅ No backend webhooks needed (can use static responses)
- ✅ Fully functional IVR
- ✅ Professional voice quality
- ✅ Production-ready

**Next step**: Go to Twilio Studio and create your flow! I'm here to help if you get stuck on any step.

---

## 📞 Quick Reference

**Twilio Console Links:**
- Studio Flows: https://console.twilio.com/us1/develop/studio/flows
- Phone Numbers: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
- Call Logs: https://console.twilio.com/us1/monitor/logs/calls

**Your Twilio Number:** +1 952-299-0705
**Account SID:** AC430c53c6de5967840ded678ef72c5b29

---

**Need help with any step? Just ask!** 🎉
