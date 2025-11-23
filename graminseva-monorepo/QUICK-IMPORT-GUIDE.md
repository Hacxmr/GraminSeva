# 🚀 EASIEST METHOD - Import Ready-Made Flow

## Step 1: Go to Twilio Studio
👉 **https://console.twilio.com/us1/develop/studio/flows**

## Step 2: Create New Flow
1. Click the big blue **"Create new Flow"** button
2. Name it: **GraminSeva Health Assistant**
3. Click **"Next"**

## Step 3: Import the JSON
1. You'll see the visual editor
2. Click the **3 dots menu** (⋮) in the top right corner
3. Select **"Import from JSON"**
4. Open the file: **`twilio-studio-flow.json`** (I just created it)
5. Copy ALL the content from that file
6. Paste it into the import dialog
7. Click **"Import"**

✨ **BOOM! The entire flow is created automatically!**

## Step 4: Publish
1. Click the **"Publish"** button (top right)
2. Click **"Publish"** again to confirm

## Step 5: Connect to Your Phone Number
1. Go to: **https://console.twilio.com/us1/develop/phone-numbers/manage/incoming**
2. Click on your number: **+1 952-299-0705**
3. Scroll down to **"Voice & Fax"** section
4. Under **"A CALL COMES IN"**:
   - Change dropdown from "Webhook" to **"Studio Flow"**
   - Select: **"GraminSeva Health Assistant"**
5. Click **"Save"** at the bottom

## Step 6: TEST IT! 📱
Call **+1 952-299-0705** and:
- Hear welcome in Hindi
- Press **1** for mother health → hear submenu → press 1, 2, or 3
- Press **2** for child health → hear submenu → press 1, 2, or 3  
- Press **3** for general advice → hear advice directly

---

## 🎯 What's Included in the Flow

✅ **Hindi Voice** (Polly.Aditi - natural female voice)
✅ **3-Level Menu System:**
   - Main menu (Mother/Child/General)
   - Mother submenu (Fever/Stomach/Weakness)
   - Child submenu (Fever/Diarrhea/Appetite)
✅ **Health Advice** in Hindi for each option
✅ **Error Handling** for invalid inputs
✅ **Professional Goodbye** message

---

## 🔧 If Import Doesn't Work

**Alternative: Copy Flow Manually (5 minutes)**

I'll walk you through creating just the main parts:

### Widget 1: Trigger (Already there)
- Don't touch this

### Widget 2: Welcome Menu
1. Drag **"Gather Input on Call"** from left panel
2. Connect **Trigger** → **Gather Input**
3. Name it: `welcome_menu`
4. Configure:
   - **Say**: `Namaste! GraminSeva mein aapka swagat hai. Maa ki swasthya ke liye 1 dabayen. Bacche ki swasthya ke liye 2 dabayen.`
   - **Voice**: `Polly.Aditi`
   - **Language**: `hi-IN`
   - **Number of Digits**: `1`
   - **Timeout**: `10`

### Widget 3: Split Input
1. Drag **"Split Based On..."** widget
2. Connect **welcome_menu** → **Split**
3. Configure:
   - **Variable**: `{{widgets.welcome_menu.Digits}}`
   - Add condition: If `equal to` `1` → create new "Say/Play" widget
   - Add condition: If `equal to` `2` → create new "Say/Play" widget

### Widget 4: Mother Advice
1. Drag **"Say/Play"** widget
2. Connect from Split (when = 1)
3. Configure:
   - **Say**: `Maa ki swasthya ke liye: Aaram karein, paani piyein, doctor se milein agar zarurat ho. Dhanyavaad!`
   - **Voice**: `Polly.Aditi`

### Widget 5: Child Advice
1. Drag **"Say/Play"** widget  
2. Connect from Split (when = 2)
3. Configure:
   - **Say**: `Bacche ki swasthya ke liye: Bacche ko hydrated rakhein, doctor se sampark karein. Dhanyavaad!`
   - **Voice**: `Polly.Aditi`

### Widget 6: Hangup
1. Drag **"Hangup"** widget
2. Connect both advice widgets → **Hangup**

---

## 📸 Visual Reference

```
Start
  ↓
[Welcome: Press 1 or 2]
  ↓
[Split on Input]
  ├─ 1 → [Mother Advice] → [Hangup]
  └─ 2 → [Child Advice] → [Hangup]
```

---

## ✅ That's It!

**Total time**: 2-3 minutes with import method

Your IVR will be live immediately after connecting to the phone number!

**Need help?** Let me know which step you're stuck on.
