// backend/index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  // Log all incoming requests for debugging
  console.log(`📨 ${req.method} ${req.path}`, {
    userAgent: req.headers['user-agent']?.substring(0, 50),
    from: req.body?.From || req.query?.From,
    callSid: req.body?.CallSid || req.query?.CallSid
  });
  next();
});

// Initialize Google AI and Supabase with error handling
let genAI;
let model;
let supabase = null;

try {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('No API key found. Set GOOGLE_AI_API_KEY in .env');
  }
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log('✅ Google AI (Gemini) client initialized');
} catch (err) {
  console.error('❌ Failed to initialize Google AI:', err.message);
  process.exit(1);
}

try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey && 
      supabaseUrl.startsWith('http') && 
      supabaseKey.length > 20) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  } else {
    console.log('⚠️  Supabase not configured - using local file storage for calls/referrals');
  }
} catch (err) {
  console.warn('⚠️  Supabase initialization failed - using local file storage:', err.message);
  supabase = null;
}

// Twilio config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const CALL_SERVICE = process.env.CALL_SERVICE || 'twilio'; // Default to Twilio

// Initialize Twilio client if credentials exist
let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  console.log('✅ Twilio client initialized');
}

const BACKEND_BASE = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;

// Parse healthcare centers from env
const parseHealthcareCenters = () => {
  if (!process.env.HEALTHCARE_CENTERS) {
    return [
      { name: 'Sardar Hospital', phone: '+919999999999' },
      { name: 'City Medical Center', phone: '+918888888888' },
    ];
  }
  return process.env.HEALTHCARE_CENTERS.split(',').map(center => {
    const [name, phone] = center.split(':');
    return { name: name.trim(), phone: phone.trim() };
  });
};

const healthcareCenters = parseHealthcareCenters();

// In-memory storage for call history (for stats)
const callHistory = [];

// Simple language detector: detects Devanagari script or common romanized Hindi tokens.
const detectLanguage = (text) => {
  if (!text || typeof text !== 'string') return 'en';
  // If text contains Devanagari characters, it's Hindi
  try {
    // Match Devanagari block U+0900–U+097F
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
  } catch (e) {
    // ignore regex support issues
  }
  const lower = text.toLowerCase();
  const hindiTokens = ['hai', 'mujhe', 'mera', 'mere', 'bacche', 'baccha', 'bukhar', 'bukhaar', 'ulta', 'ulti', 'ultI', 'ultii', 'garbh', 'garbhvati', 'saans', 'saans', 'behosh', 'jhatke', 'khoon', 'khoon', 'khansi'];
  let matches = 0;
  for (const t of hindiTokens) {
    if (lower.includes(t)) matches++;
  }
  return matches >= 1 ? 'hi' : 'en';
};

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const CALLS_FILE = path.join(DATA_DIR, 'call_logs.json');
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');

const readJsonFile = (file) => {
  try {
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.warn('readJsonFile error', e && e.message ? e.message : e);
    return [];
  }
};

const writeJsonFile = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('writeJsonFile error', e && e.message ? e.message : e);
  }
};

// Local rule-based analyzer used in DEV_MODE when OpenAI is unavailable or for demos.
const analyzeSymptomsLocally = (text) => {
  const lower = (text || '').toLowerCase();
  const criticalKeywords = ['khoon', 'bleed', 'bleeding', 'behosh', 'unconscious', 'saans', 'breath', 'breathing', 'jhatke', 'seizure', 'tez bukhar', 'high fever'];
  const isCritical = criticalKeywords.some(k => lower.includes(k));
  let firstAid = 'Keep the patient calm and seek medical attention if symptoms worsen.';
  let hospitalReferral = '';
  
  if (isCritical) {
    firstAid = 'Lay the mother on her left side and call for immediate medical help.';
    hospitalReferral = 'Aapko turant Sardar Hospital jaana chahiye!';
  } else {
    // Handle vaccination questions
    if (lower.includes('vaccin') || lower.includes('tikakaran') || lower.includes('immuniz')) {
      firstAid = 'Vaccination Schedule (0-2 years): Birth - BCG, OPV-0, Hepatitis B; 6 weeks - DTaP, IPV, Hib, PCV; 10 weeks - DTaP-2, IPV-2, Hib-2, PCV-2; 14 weeks - DTaP-3, IPV-3, Hib-3, PCV-3; 9 months - Measles-1; 12 months - Hepatitis A; 15 months - MMR, PCV booster; 18 months - DTaP booster. Visit nearest health center for complete schedule.';
    }
    // Handle pregnancy nutrition - improved detection
    else if ((lower.includes('pregnan') || lower.includes('garbh') || lower.includes('mein')) && (lower.includes('khana') || lower.includes('kya') || lower.includes('chahiye') || lower.includes('eat') || lower.includes('food') || lower.includes('diet') || lower.includes('nutrition'))) {
      firstAid = 'Garbhavastha mein nutritious khana bahut zaroori hai. Protein ke liye daal, eggs aur doodh lein. Hara saag (palak, methi), phal, aur sabziyan khayein. Iron-rich foods jaise palak aur chana lein. Folic acid ke liye hare patte wali sabzi. Din mein 3-4 baar thoda-thoda khaana behtar hai. Paani aur juice bharpur matra mein piyein (8-10 glass daily).';
    }
    // Handle fever - CHECK WHO IS AFFECTED
    else if (lower.includes('fever') || lower.includes('bukhar')) {
      // Check if it's for an adult or child
      const isAdult = lower.includes('mujhe') || lower.includes('mere ko') || lower.includes('mai') || lower.includes('meri patni') || lower.includes('pati');
      const isChild = lower.includes('bacche') || lower.includes('baccha') || lower.includes('child') || lower.includes('baby');
      
      if (isAdult && !isChild) {
        // Adult fever - feminine language
        firstAid = 'Main aapki madad kar rahi hoon. Aapko fever hai - yeh upchar lein: 1) Complete bed rest karein, 2) Garm paani, ginger tea, tulsi water din mein 10-12 glass piyein, 3) Agar temperature 100°F se zyada ho to paracetamol 500mg tablet le sakte hain (har 6 ghante mein), 4) Subah-shaam steam inhalation (bhap) lein, 5) Light aur nutritious khana khayein. Main bata rahi hoon - agar fever 3 din mein kam na ho ya 103°F se zyada ho to doctor se zaroor milein.';
      } else if (isChild) {
        // Child fever
        firstAid = 'Bacche ko garm kapde pehnaayein aur aaram karwayein. Bharpur matra mein paani, juice ya ORS solution pilayein. Bukhar 100.4°F se zyada ho to paracetamol syrup (weight ke anusar) de sakte hain. Bukhar 2 din se zyada rahe ya 103°F se zyada ho to doctor se zaroor milein.';
      } else {
        // Generic/unclear - assume adult
        firstAid = 'Fever ke liye: Aaram karein, bharpur paani piyein (10-12 glass daily), garm fluids lein. Agar fever 100°F+ ho to paracetamol le sakte hain. Steam inhalation helpful hai. 3 din mein better na ho to doctor se milein.';
      }
    }
    // Handle cough - CHECK WHO IS AFFECTED
    else if (lower.includes('khansi') || lower.includes('cough')) {
      const isAdult = lower.includes('mujhe') || lower.includes('mere ko') || lower.includes('mai') || lower.includes('meri patni') || lower.includes('pati');
      const isChild = lower.includes('bacche') || lower.includes('baccha') || lower.includes('child') || lower.includes('baby');
      
      if (isAdult && !isChild) {
        // Adult cough - feminine language
        firstAid = 'Main aapko cough ka ilaj bata rahi hoon: 1) Garm paani mein namak daal kar garara karein (din mein 3-4 baar), 2) Ginger tea, tulsi water, shahad wala doodh piyein, 3) Steam inhalation din mein 2-3 baar zaroor lein, 4) Cough syrup ya honey le sakte hain, 5) Dhuaan aur thandi cheezon se bachein. Main salah de rahi hoon - agar cough 2 hafte se zyada rahe, khoon aaye, ya saans lene mein takleef ho to turant doctor se milein.';
      } else if (isChild) {
        // Child cough
        firstAid = 'Bacche ko garm paani pilayein aur bhap (steam) le sakti hai. Honey (1 year se bade bacchon ke liye) rahat de sakta hai. Khansi 1 hafte se zyada rahe ya saans lene mein takleef ho to doctor se milein.';
      } else {
        // Generic
        firstAid = 'Cough ke liye: Garm paani se garara karein, steam lein, ginger tea piyein. Honey helpful hai. Agar 2 hafte se zyada rahe to doctor se milein.';
      }
    }
    // Handle fever AND cough together - ADULT SPECIFIC
    else if ((lower.includes('fever') && lower.includes('cough')) || (lower.includes('bukhar') && lower.includes('khansi'))) {
      const isAdult = lower.includes('mujhe') || lower.includes('mere ko') || lower.includes('mai') || !lower.includes('bacch');
      
      if (isAdult) {
        firstAid = 'Main aapko fever aur cough ke liye pura ilaj bata rahi hoon: 1) Complete rest zaroor karein, kaam se chhuti lein, 2) Din mein 10-12 glass garm paani, ginger tea, tulsi water piyein, 3) Paracetamol 500mg tablet agar fever 100°F+ ho (har 6 ghante mein max 3-4 tablets daily), 4) Steam inhalation subah-shaam (garam paani mein eucalyptus oil optional), 5) Garam paani se garara 3-4 baar daily, 6) Vitamin C wale fruits (orange, mosambi) khayein, 7) Light khana khayein - soup, khichdi, daal. Main salah de rahi hoon - agar 3 din mein better na ho, fever 103°F se zyada ho, ya breathing problem ho to turant doctor se milein.';
      } else {
        firstAid = 'Bacche ko fever aur cough hai: Aaram karwayein, garm kapde, bharpur fluids (paani, juice, soup), paracetamol syrup agar fever 100.4°F+, steam therapy, honey (1 year+). 2-3 din mein better na ho to doctor se milein.';
      }
    }
    // Handle agriculture/farming queries
    else if (lower.includes('kheti') || lower.includes('fasal') || lower.includes('crop') || lower.includes('farming') || lower.includes('agriculture') || lower.includes('kisan') || lower.includes('farmer') || lower.includes('mausam') || lower.includes('weather') || lower.includes('barish') || lower.includes('rain')) {
      if (lower.includes('mausam') || lower.includes('weather') || lower.includes('barish') || lower.includes('rain')) {
        firstAid = 'Mausam ki jaankari: Climate-resilient practices apnayein. Barish ke season mein drainage ka dhyan rakhein. Sukhe ke dauran mulching aur drip irrigation ka upyog karein. Weather forecast ke liye local agriculture office se sampark karein ya mobile apps jaise Meghdoot, Kisan Suvidha use karein.';
      } else if (lower.includes('beej') || lower.includes('seed')) {
        firstAid = 'Beej chunaav: High-quality certified seeds ka upyog karein. Apne kshetra ke liye suitable climate-resistant varieties chunein. Seeds ko fungicide se treat karein. Government schemes ke through subsidized seeds mil sakte hain - apne najdeeki Krishi Vigyan Kendra se sampark karein.';
      } else if (lower.includes('khaad') || lower.includes('fertilizer') || lower.includes('khad')) {
        firstAid = 'Khaad prabandhan: Organic khad (compost, vermicompost) ka upyog karein. Soil testing karwayein to sahi matra mein fertilizer ka prayog ho. Nitrogen, Phosphorus, Potassium ki balanced quantity use karein. Neem cake natural pest control ke liye helpful hai.';
      } else if (lower.includes('keede') || lower.includes('pest') || lower.includes('disease') || lower.includes('bimari')) {
        firstAid = 'Keet evam rog niyantran: Integrated Pest Management (IPM) apnayein. Neem oil, garlic spray jaise organic solutions use karein. Crop rotation practice karein. Healthy soil healthy plants banati hai. Serious infestation ke liye local agriculture extension officer se salah lein.';
      } else {
        firstAid = 'Kheti evam krishi salah: Smart farming practices apnayein - crop rotation, soil health management, water conservation. Climate-resilient varieties ka upyog karein. Government ki PM-KISAN, Kisan Credit Card jaise schemes ka labh uthayein. Technical guidance ke liye Krishi Vigyan Kendra (KVK) se sampark karein. Fasal bima zaroor karwayein. Mobile apps: Kisan Suvidha, mKisan, Crop Insurance app use kar sakte hain.';
      }
    }
  }
  return { is_critical: !!isCritical, first_aid_advice: firstAid, hospital_referral: hospitalReferral };
};

const callAI = async (message, options = {}) => {
  // If DEV_MODE is true, use the local analyzer
  if (process.env.DEV_MODE === 'true') {
    const result = analyzeSymptomsLocally(message || '');
    return { choices: [{ message: { content: JSON.stringify(result) } }] };
  }

  // Use Google Gemini AI
  try {
    const prompt = options.messages 
      ? options.messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
      : `${systemPrompt}\n\nUser: ${message}\n\nAssistant (respond ONLY with valid JSON):`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Return in OpenAI-compatible format
    return {
      choices: [{
        message: {
          content: text
        }
      }]
    };
  } catch (error) {
    console.error('Google AI error:', error.message);
    throw error;
  }
};

const logCallLocal = async (entry) => {
  const calls = readJsonFile(CALLS_FILE);
  entry.id = (calls.length ? calls[calls.length - 1].id + 1 : 1);
  entry.created_at = new Date().toISOString();
  calls.push(entry);
  writeJsonFile(CALLS_FILE, calls);
  return entry;
};

const createReferralLocal = async (ref) => {
  const refs = readJsonFile(REFERRALS_FILE);
  ref.id = (refs.length ? refs[refs.length - 1].id + 1 : 1);
  ref.created_at = new Date().toISOString();
  refs.push(ref);
  writeJsonFile(REFERRALS_FILE, refs);
  return ref;
};

// Helper to insert into Supabase with verbose logging for debugging
const safeSupabaseInsert = async (table, payload, opts = {}) => {
  try {
    let res;
    if (opts.single) {
      res = await supabase.from(table).insert(payload).select().single();
    } else {
      res = await supabase.from(table).insert(payload).select();
    }
    console.log(`Supabase insert into ${table} response:`, JSON.stringify(res, null, 2));
    return res;
  } catch (e) {
    console.error(`Supabase insert exception into ${table}:`, e && e.stack ? e.stack : e);
    return { data: null, error: e };
  }
};

// Health check endpoint (used by Docker healthcheck and frontend)
// Note: the real `/api/stats` implementation is defined later; expose a simple /health for probes.

app.get('/health', async (req, res) => {
  try {
    // Quick check to verify backend is responsive
    return res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error && error.message ? error.message : error });
  }
});

// THIS IS THE MOST IMPORTANT PART OF THE PROJECT
const systemPrompt = `
You are "Asha AI," a FEMALE AI assistant for rural India, providing support for:
1. Maternal and Child Health - Pregnancy care, child health, nutrition, first-aid
2. Agriculture & Farming - Smart farming guidance, crop health, climate-resilient practices

IMPORTANT: You are a FEMALE assistant. Use FEMININE language in Hindi:
- Use "मैं आपकी मदद करूंगी" (I will help you - feminine) NOT "करूंगा" (masculine)
- Use "मैं बता रही हूं" (I am telling - feminine) NOT "बता रहा हूं" (masculine)
- Use feminine verb endings: करूंगी, बताऊंगी, दूंगी, समझाऊंगी

Your primary mission is to provide SAFE, PRACTICAL, and CONTEXTUALLY RELEVANT guidance.
YOU ARE NOT A DOCTOR. YOU MUST NEVER SUGGEST OR PRESCRIBE SPECIFIC MEDICINES.

CRITICAL INSTRUCTIONS:
1. READ THE USER'S QUESTION CAREFULLY - Understand WHO is affected:
   - "Mujhe" (I have/I am) = ADULT asking for themselves
   - "Mere bacche ko" (My child has) = CHILD health issue
   - "Meri patni" (My wife) = ADULT WOMAN/PREGNANT WOMAN
   - "Mera pati" (My husband) = ADULT MAN
   - If no subject mentioned but symptoms given = assume ADULT asking for themselves
   
   EXAMPLE:
   "Mujhe fever hai" = Adult with fever → Give ADULT-specific advice
   "Bacche ko fever hai" = Child with fever → Give CHILD-specific advice

2. Identify if the situation is CRITICAL (for health only):
   Critical keywords: "tez bukhar" (high fever >103°F), "khoon behna" (bleeding) during pregnancy, "saans lene me takleef" (breathing difficulty), "behosh" (unconscious), "jhatke aana" (seizures), "bahut dard" (severe pain)
   
3. Provide SPECIFIC advice based on:
   - Who is affected (adult, pregnant woman, child, infant)
   - Severity of symptoms (mild, moderate, severe)
   - Duration (new symptoms vs ongoing)

4. Your response MUST be a JSON object with three keys:
   - "is_critical": boolean (true for emergencies requiring immediate hospital visit)
   - "first_aid_advice": SPECIFIC advice for the person and symptoms mentioned. Include:
     * Immediate home care steps
     * What to monitor
     * When to seek medical help
     * Specific remedies (only safe ones like hydration, rest, steam)
   - "hospital_referral": If "is_critical" is true, say "Aapko turant Sardar Hospital jaana chahiye!" If false, leave empty ""

RESPONSE GUIDELINES:
- For adults with fever/cough: Rest, fluids, monitor temperature, paracetamol if needed
- For children: More caution, specific age-appropriate advice, earlier doctor consultation
- For pregnant women: Extra care, avoid medications without doctor, immediate attention for severe symptoms
- For agriculture: Practical, season-appropriate advice

Example Input: "Pregnancy mein kya khana chahiye?"
Example Output:
{
  "is_critical": false,
  "first_aid_advice": "Garbhavastha mein nutritious khana bahut zaroori hai. Protein ke liye daal, eggs aur doodh lein. Hara saag, phal, aur sabziyan khayein. Iron-rich foods jaise palak aur chana lein. Din mein 3-4 baar thoda-thoda khaana behtar hai. Paani aur juice bharpur matra mein piyein.",
  "hospital_referral": ""
}

Example Input: "Mujhe fever aur cough hai"
Example Output:
{
  "is_critical": false,
  "first_aid_advice": "Aapko fever aur cough hai - yeh adult ke liye upay hain: 1) Pura aaram karein aur kaam se break lein, 2) Din mein kam se kam 10-12 glass garm paani, ginger tea, ya tulsi water piyein, 3) Agar temperature 100°F se zyada hai to paracetamol 500mg tablet le sakte hain (har 6 ghante mein, doctor ki salah ke saath), 4) Subah-shaam bhap (steam inhalation) lein - garam paani mein eucalyptus oil daal sakte hain, 5) Garam paani mein namak daal kar garara karein (din mein 3-4 baar), 6) Vitamin C wale juice (orange, mosambi) piyein. Agar 3 din mein fever kam na ho, 103°F se zyada ho, ya saans lene mein taklif ho to doctor se zaroor milein.",
  "hospital_referral": ""
}

Example Input: "mujhe fever aur cough hai" (lowercase)
Example Output:
{
  "is_critical": false,
  "first_aid_advice": "Aapko fever aur cough hai - adult ke liye upchar: 1) Complete bed rest, 2) Garm paani aur fluids 10-12 glass daily, 3) Paracetamol 500mg agar fever 100°F+ ho, 4) Steam inhalation morning-evening, 5) Saltwater gargling 3-4 times, 6) Vitamin C intake. Doctor se milein agar 3 din mein better na ho.",
  "hospital_referral": ""
}

Example Input: "Meri patni garbhvati hai aur bahut khoon beh raha hai"
Example Output:
{
  "is_critical": true,
  "first_aid_advice": "Maa ko aaram se litayein aur unke pairon ko thoda upar uthayein. Kuch bhi khane ya peene ko na dein.",
  "hospital_referral": "Aapko turant Sardar Hospital jaana chahiye!"
}

Example Input: "Mere bacche ko halki khansi hai"
Example Output:
{
  "is_critical": false,
  "first_aid_advice": "Bacche ki halki khansi ke liye: 1) Bacche ko garm rakhein, 2) Garm paani ya juice pilayein (umr ke anusar), 3) Bhap (steam) lein din mein 2 baar - bathroom mein garm paani chala kar steam lein, 4) Agar 6 mahine se bada hai to shahad (1 choti chammach) de sakte hain, 5) Sar ke neeche takiya rakhein so ki saans lene mein aasani ho. Agar 3 din mein sudhar na ho, tez bukhar aaye, ya saans lene mein dikkat ho to turant doctor se milein.",
  "hospital_referral": ""
}

Example Input: "Mera 2 saal ka baccha bukhar mein hai"
Example Output:
{
  "is_critical": false,
  "first_aid_advice": "2 saal ke bacche mein bukhar: 1) Temperature check karein (100.4°F se zyada ho to paracetamol syrup de sakte hain - weight ke anusar dose), 2) Halke kapde pehnayen, 3) Room temperature paani se sponging karein (thande paani se nahi), 4) Bharpur liquid pilayein (paani, ORS, juice), 5) Temperature har 2 ghante mein check karein. Agar bukhar 102°F se zyada ho, 2 din se zyada rahe, baccha lethargic ho, ya khana-peena band kar de to doctor se milein.",
  "hospital_referral": ""
}

Example Input: "Bacche ko pet dard hai" OR "A child has stomach pain"
Example Output:
{
  "is_critical": false,
  "first_aid_advice": "Bacche ko pet dard ke liye: 1) Bacche ko aaram se litayein aur pet par halka pressure daalein, 2) Garam paani ki bottle pet par rakhein (bahut garam nahi), 3) Kuch bhi heavy na khilayein - sirf halka khana jaise khichdi, dalia, ya banana, 4) ORS solution ya paani pilayein, 5) Agar gas ho to pet ko halke haath se clockwise direction mein massage karein, 6) Avoid oily, spicy, ya junk food. Agar dard bahut tez ho, vomiting bhi ho, fever aaye, ya 2-3 ghante mein kam na ho to doctor se zaroor milein. Agar appendicitis ke lakshan hon (dard neeche right side mein) to turant hospital jaayein.",
  "hospital_referral": ""
}

Example Input: "Meri fasal mein keede lag gaye hain"
Example Output:
{
  "is_critical": false,
  "first_aid_advice": "Keet niyantran ke liye pehle organic solutions try karein - neem oil spray (10ml neem oil per liter paani mein), garlic spray ya chilli spray. Integrated Pest Management (IPM) apnayein. Yellow sticky traps lagayein. Agar problem serious ho to apne najdeeki Krishi Vigyan Kendra se salah lein. Chemical pesticides sirf last option ke taur par use karein.",
  "hospital_referral": ""
}

Example Input: "Barish ke season mein konsi fasal ugayein"
Example Output:
{
  "is_critical": false,
  "first_aid_advice": "Kharif season (June-October) ke liye: Dhan (rice), maize, bajra, jowar, soybean, cotton best options hain. Apne kshetra ki soil type aur rainfall pattern ke anusar selection karein. Climate-resilient varieties chunein. Soil testing karwayein sahi crop selection ke liye. Government ke through beej subsidy schemes available hain - PM Kisan Samman Nidhi ke benefits zaroor lein.",
  "hospital_referral": ""
}
`;


app.post('/api/call', async (req, res) => {
  const { message, userPhone } = req.body;
  if (!message || !userPhone) {
    return res.status(400).json({ error: 'Message and userPhone are required' });
  }

  try {
    let completion;
    try {
      completion = await callAI(message, {});
    } catch (err) {
      // Handle OpenAI quota/rate-limit errors gracefully with a safe bilingual fallback
      const msg = err && (err.message || err.toString()) || '';
      console.warn('OpenAI call failed (fallback):', msg);
      if ((err && (err.status === 429 || err.statusCode === 429)) || /quota|429|rate limit/i.test(msg)) {
        const lang = detectLanguage(message);
        const fallbackText = lang === 'hi'
          ? 'Agar lakshan bigadte hain to turant chikitsak se sampark karein. Kripya kareeb ke swasthya kendra ya aspataal mein jayein.'
          : 'Please seek medical attention if symptoms worsen. Visit the nearest health center or call for help.';
        completion = {
          choices: [{ message: { content: JSON.stringify({ is_critical: false, first_aid_advice: fallbackText, hospital_referral: '' }) } }]
        };
      } else {
        throw err;
      }
    }

    // The OpenAI response may not always be strict JSON; try to parse and
    // fall back to a safe non-critical response if parsing fails.
    let aiJsonResponse;
    try {
      aiJsonResponse = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      console.warn('AI did not return JSON, falling back to safe response:', e && e.stack ? e.stack : e);
      aiJsonResponse = {
        is_critical: false,
        first_aid_advice: (completion.choices[0].message.content || '').toString().substring(0, 400),
        hospital_referral: '',
      };
    }
    const { is_critical, first_aid_advice, hospital_referral } = aiJsonResponse;

    const full_ai_response = `${first_aid_advice} ${hospital_referral}`.trim();

    // Log the call (Supabase in prod, local JSON in DEV_MODE or if Supabase unavailable)
    let logData;
      if (!supabase || process.env.DEV_MODE === 'true') {
        logData = await logCallLocal({ user_phone_number: userPhone, user_transcript: message, ai_response: full_ai_response, is_critical: is_critical });
      } else {
        const supRes = await safeSupabaseInsert('call_logs', {
          user_phone_number: userPhone,
          user_transcript: message,
          ai_response: full_ai_response,
          is_critical: is_critical,
        });
        if (supRes.error) throw supRes.error;
        logData = supRes.data;
    }

    // If critical, create a referral for the hospital dashboard
    if (is_critical) {
      if (!supabase || process.env.DEV_MODE === 'true') {
        await createReferralLocal({ call_id: logData.id, patient_phone: userPhone, symptoms_summary: message, referred_to_hospital: 'Sardar Hospital' });
      } else {
          const supRef = await safeSupabaseInsert('referrals', {
            call_id: logData.id,
            patient_phone: userPhone,
            symptoms_summary: message,
            referred_to_hospital: 'Sardar Hospital',
          });
          if (supRef.error) throw supRef.error;
      }
    }

    return res.json({ reply: full_ai_response });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: 'Failed to process the call' });
  }
});

// GET /api/calls - Retrieve all call logs
app.get('/api/calls', async (req, res) => {
  try {
    if (!supabase || process.env.DEV_MODE === 'true') {
      const calls = readJsonFile(CALLS_FILE);
      // newest first
      return res.json((calls || []).slice().reverse().slice(0, 50));
    }
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return res.json(data || []);
  } catch (error) {
    console.error("Error fetching calls:", error);
    return res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

// GET /api/talks - Return all call logs for dashboard talks page
app.get('/api/talks', async (req, res) => {
  try {
    const { data: calls, error } = await supabase
      .from('call_logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ talks: calls || [] });
  } catch (err) {
    res.status(500).json({ talks: [] });
  }
});

// GET /api/stats - Get dashboard statistics
app.get('/api/stats', async (req, res) => {
  try {
    let calls = [];
    let referrals = [];
    if (!supabase || process.env.DEV_MODE === 'true') {
      calls = readJsonFile(CALLS_FILE);
      referrals = readJsonFile(REFERRALS_FILE);
    } else {
      // Fetch all calls
      const { data: callsData, error: callsError } = await supabase
        .from('call_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (callsError) throw callsError;
      calls = callsData || [];

      // Fetch critical/referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*');
      if (referralsError) throw referralsError;
      referrals = referralsData || [];
    }

    const totalCalls = calls?.length || 0;
    const criticalCalls = calls?.filter(c => c.is_critical)?.length || 0;
    const successRate = totalCalls > 0 ? ((totalCalls - criticalCalls) / totalCalls) * 100 : 100;
    
    // Calculate average duration from conversation lengths
    const avgDuration = totalCalls > 0 
      ? calls.reduce((sum, call) => {
          const conversationLength = (call.user_transcript?.length || 0) + (call.ai_response?.length || 0);
          return sum + Math.max(30, Math.min(600, conversationLength * 2));
        }, 0) / totalCalls
      : 0;
    
    const uniqueUsers = new Set(calls?.map(c => c.user_phone_number) || []).size;

    // Generate call data by hour
    const callsByHour = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      const hourCalls = calls?.filter(c => {
        const callHour = new Date(c.created_at).getHours().toString().padStart(2, '0');
        return callHour === hour;
      }).length || 0;
      return { time: `${hour}:00`, calls: hourCalls };
    });

    // Top health topics
    const topQuestions = [
      { question: 'High Fever (बुखार)', count: calls?.filter(c => c.user_transcript?.toLowerCase().includes('fever') || c.user_transcript?.toLowerCase().includes('bukhar')).length || 0 },
      { question: 'Pregnancy Concerns (गर्भावस्था)', count: calls?.filter(c => c.user_transcript?.toLowerCase().includes('pregnancy') || c.user_transcript?.toLowerCase().includes('garbh')).length || 0 },
      { question: 'Child Health (बाल स्वास्थ्य)', count: calls?.filter(c => c.user_transcript?.toLowerCase().includes('child') || c.user_transcript?.toLowerCase().includes('bacche')).length || 0 },
      { question: 'Nutrition Advice (पोषण)', count: calls?.filter(c => c.user_transcript?.toLowerCase().includes('nutrition') || c.user_transcript?.toLowerCase().includes('khana')).length || 0 },
    ];

    // Recent calls
    const recentCalls = (calls || []).slice(0, 5).map(call => {
      // Calculate realistic duration based on conversation length
      // Assume ~2 seconds per character spoken/listened (reading speed)
      const conversationLength = (call.user_transcript?.length || 0) + (call.ai_response?.length || 0);
      const estimatedDuration = Math.max(30, Math.min(600, conversationLength * 2)); // Min 30s, Max 10min
      
      return {
        phone: call.user_phone_number,
        topic: call.user_transcript?.substring(0, 40) + '...' || 'Unknown',
        status: call.is_critical ? 'Critical - Referred' : 'Completed',
        duration: estimatedDuration,
        timestamp: new Date(call.created_at).toLocaleTimeString(),
      };
    });

    return res.json({
      totalCalls,
      criticalCalls,
      successRate,
      avgDuration,
      uniqueUsers,
      callsByHour,
      topQuestions,
      recentCalls,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// POST /api/voice - Process incoming voice call
app.post('/api/voice', async (req, res) => {
  const { message, phoneNumber } = req.body;

  if (!message || !phoneNumber) {
    return res.status(400).json({ error: 'Message and phoneNumber are required' });
  }

  console.log('📞 Voice API called with message:', message);

  try {
    // Call AI with maternal health system prompt
    let completion;
    try {
      console.log('🤖 Calling OpenAI API...');
      completion = await callAI(message, { response_format: { type: 'json_object' } });
      console.log('✅ OpenAI response received');
    } catch (err) {
      const msg = err && (err.message || err.toString()) || '';
      console.warn('⚠️ OpenAI call failed, using local analyzer fallback:', msg);
      // Use local analyzer as fallback for all errors
      const localResult = analyzeSymptomsLocally(message || '');
      completion = {
        choices: [{ message: { content: JSON.stringify(localResult) } }]
      };
      console.log('🔧 Using local analyzer result:', localResult);
    }

    const aiJsonResponse = JSON.parse(completion.choices[0].message.content);
    console.log('📝 AI Response:', aiJsonResponse);
    const { is_critical, first_aid_advice, hospital_referral } = aiJsonResponse;
    const full_ai_response = `${first_aid_advice} ${hospital_referral}`.trim();

    // Log the call (Supabase in prod, local JSON in DEV_MODE or if Supabase unavailable)
    let _logData;
    if (!supabase || process.env.DEV_MODE === 'true') {
      _logData = await logCallLocal({ user_phone_number: phoneNumber, user_transcript: message, ai_response: full_ai_response, is_critical: is_critical });
    } else {
      const supRes = await safeSupabaseInsert('call_logs', {
        user_phone_number: phoneNumber,
        user_transcript: message,
        ai_response: full_ai_response,
        is_critical: is_critical,
      }, { single: true });
      if (supRes.error) throw supRes.error;
      _logData = supRes.data;
    }

    // If critical, create referral to nearest healthcare center
    if (is_critical) {
      const nearestCenter = healthcareCenters[Math.floor(Math.random() * healthcareCenters.length)];
      if (!supabase || process.env.DEV_MODE === 'true') {
        await createReferralLocal({ call_id: _logData.id, patient_phone: phoneNumber, symptoms_summary: message, referred_to_hospital: nearestCenter.name, hospital_phone: nearestCenter.phone, critical_level: 'Emergency' });
      } else {
        const supRef = await safeSupabaseInsert('referrals', {
          call_id: _logData.id,
          patient_phone: phoneNumber,
          symptoms_summary: message,
          referred_to_hospital: nearestCenter.name,
          hospital_phone: nearestCenter.phone,
          critical_level: 'Emergency',
        });
        if (supRef.error) console.warn('Referral logging error:', supRef.error);
      }
    }

    return res.json({ 
      reply: full_ai_response,
      isCritical: is_critical,
      referredTo: is_critical ? healthcareCenters[0].name : null,
    });
  } catch (error) {
    console.error("Voice call error:", error && error.stack ? error.stack : error);
    return res.status(500).json({ error: 'Failed to process voice call' });
  }
});

// POST /api/voice-followup - Follow-up call handler
app.post('/api/voice-followup', async (req, res) => {
  const { message, phoneNumber, callId } = req.body;

  if (!message || !phoneNumber) {
    return res.status(400).json({ error: 'Message and phoneNumber are required' });
  }

  try {
    // Retrieve original call for context
    let originalCall;
    if (!supabase || process.env.DEV_MODE === 'true') {
      const calls = readJsonFile(CALLS_FILE);
      originalCall = (calls || []).find(c => c.id == callId) || null;
    } else {
      const { data } = await supabase
        .from('call_logs')
        .select('*')
        .eq('id', callId)
        .single();
      originalCall = data;
    }

    const context = originalCall?.user_transcript || 'Unknown previous symptoms';

    let completion;
    try {
      completion = await callAI(`Previous call context: ${context}\nFollow-up: ${message}`, { response_format: { type: 'json_object' } });
    } catch (err) {
      const msg = err && (err.message || err.toString()) || '';
      console.warn('OpenAI call failed (fallback):', msg);
      if ((err && (err.status === 429 || err.statusCode === 429)) || /quota|429|rate limit/i.test(msg)) {
        completion = {
          choices: [{ message: { content: JSON.stringify({ is_critical: false, first_aid_advice: 'Please seek medical attention if symptoms worsen. Visit the nearest health center or call for help.', hospital_referral: '' }) } }]
        };
      } else {
        throw err;
      }
    }

    const aiJsonResponse = JSON.parse(completion.choices[0].message.content);
    const { is_critical, first_aid_advice, hospital_referral } = aiJsonResponse;
    const full_ai_response = `${first_aid_advice} ${hospital_referral}`.trim();

    // Log the follow-up
    if (!supabase || process.env.DEV_MODE === 'true') {
      await logCallLocal({ user_phone_number: phoneNumber, user_transcript: `[FOLLOW-UP] ${message}`, ai_response: full_ai_response, is_critical: is_critical, parent_call_id: callId });
    } else {
      const { error: logError } = await supabase
        .from('call_logs')
        .insert({
          user_phone_number: phoneNumber,
          user_transcript: `[FOLLOW-UP] ${message}`,
          ai_response: full_ai_response,
          is_critical: is_critical,
          parent_call_id: callId,
        });
      if (logError) throw logError;
    }

    return res.json({ 
      reply: full_ai_response,
      isCritical: is_critical,
    });
  } catch (error) {
    console.error("Follow-up call error:", error);
    return res.status(500).json({ error: 'Failed to process follow-up call' });
  }
});

// POST /api/initiate-call - Initiate a call to user
app.post('/api/initiate-call', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Use Twilio if configured and selected
    if (CALL_SERVICE === 'twilio' && twilioClient && TWILIO_PHONE_NUMBER) {
      console.log(`📞 Using Twilio to call ${phoneNumber}`);
      return await makeTwilioCall(phoneNumber, res);
    }
    
    // Twilio is required
    if (!twilioClient || !TWILIO_PHONE_NUMBER) {
      console.log(`📞 Development Mode: Call simulation for ${phoneNumber}`);
      return res.json({ 
        message: 'Call simulation successful',
        isDevelopment: true,
        phoneNumber: phoneNumber,
        note: 'Configure Twilio credentials to enable real calls. Get free Twilio trial at https://www.twilio.com/try-twilio'
      });
    }

    console.log(`✅ Using Twilio for calls`);
    return res.json({ 
      message: 'Call initiated successfully',
      isDevelopment: false,
      phoneNumber: phoneNumber,
      callSid: call.data?.Call?.Sid || call.data?.Sid || 'N/A',
      status: call.data?.Call?.Status || call.data?.Status || 'initiated'
    });
  } catch (error) {
    console.error("❌ Initiate call error:", error.message);
    console.error("Error details:", error.response?.data || error);
    
    if (error.response) {
      const errorData = error.response.data;
      console.error('API Error Response:', JSON.stringify(errorData, null, 2));
      
      let userMessage = 'Failed to initiate call';
      
      if (error.response.status === 401) {
        userMessage = 'Authentication failed. Please verify your API credentials.';
      } else if (error.response.status === 403) {
        userMessage = 'Access forbidden. Account may need verification.';
        // Fall back to simulation mode for 403
        return res.json({ 
          message: 'Call simulation (API access restricted)',
          isDevelopment: true,
          phoneNumber: phoneNumber,
          note: 'API access is restricted. Using simulation mode. Try Twilio as an alternative: https://www.twilio.com/try-twilio'
        });
      } else if (error.response.status === 400) {
        userMessage = errorData?.message || 'Invalid request. Check phone number format.';
      }
      
      return res.status(500).json({ 
        error: userMessage,
        details: errorData,
        isDevelopment: true,
        note: 'Check backend console for detailed error information.'
      });
    }
    
    return res.status(500).json({ 
      error: error.message || 'Failed to initiate call',
      isDevelopment: true,
      note: 'Unable to connect. Check your configuration and internet connection.'
    });
  }
});

// Twilio call function with interactive IVR
async function makeTwilioCall(to, res) {
  try {
    console.log('🔗 Twilio API Configuration:');
    console.log('   Account SID:', TWILIO_ACCOUNT_SID);
    console.log('   From Number:', TWILIO_PHONE_NUMBER);
    console.log('   To Number:', to);
    
    if (!twilioClient) {
      throw new Error('Twilio client not initialized. Check credentials.');
    }
    
    // This function is ONLY for OUTBOUND calls from web interface
    // Incoming calls to Twilio number are handled by TwiML Bins directly
    
    // Simple welcome message for programmatic calls from backend
    const simpleTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">नमस्ते! ग्रामीणसेवा में आपका स्वागत है। आपका कॉल कनेक्ट हो रहा है।</Say>
  <Say voice="alice" language="en-IN">Hello! Welcome to GraminSeva. Your call is being connected. Thank you!</Say>
  <Hangup/>
</Response>`;
    
    // Always use simple TwiML for programmatic calls
    // Interactive IVR is handled by TwiML Bins in Twilio Console
    const callOptions = {
      from: TWILIO_PHONE_NUMBER,
      to: to,
      twiml: simpleTwiml
    };
    
    console.log('📞 Initiating OUTBOUND call from web interface to:', to);
    
    // Create the call using Twilio SDK
    const call = await twilioClient.calls.create(callOptions);
    
    console.log('✅ Twilio call initiated successfully');
    console.log('   Call SID:', call.sid);
    console.log('   Status:', call.status);
    console.log('   Type: Outbound call from web interface');
    
    return res.json({
      message: 'Call initiated successfully via Twilio',
      isDevelopment: false,
      phoneNumber: to,
      callSid: call.sid,
      status: call.status,
      service: 'twilio',
      type: 'outbound-web'
    });
  } catch (error) {
    console.error('❌ Twilio call failed:', error.message);
    console.error('Error details:', error);
    
    // Provide helpful error messages
    let userMessage = 'Failed to initiate call via Twilio';
    
    if (error.code === 21608) {
      userMessage = 'Invalid phone number format. Please use E.164 format (e.g., +911234567890)';
    } else if (error.code === 21606) {
      userMessage = 'The "From" phone number is not a valid Twilio number. Please verify your Twilio phone number.';
    } else if (error.code === 20003) {
      userMessage = 'Authentication failed. Please verify your Twilio credentials.';
    } else if (error.code === 21217) {
      userMessage = 'Phone number not verified. For trial accounts, verify the number at https://console.twilio.com/us1/develop/phone-numbers/manage/verified';
    }
    
    return res.status(500).json({
      error: userMessage,
      details: error.message,
      code: error.code,
      isDevelopment: true,
      note: 'Check backend console for detailed error information. Visit https://www.twilio.com/docs/api/errors for error code reference.'
    });
  }
}

// Twilio Voice Webhook - Interactive IVR
app.post('/api/twilio/voice', (req, res) => {
  try {
    console.log('📞 Twilio Voice Webhook called');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const twiml = new twilio.twiml.VoiceResponse();
    const gather = twiml.gather({
      input: 'dtmf',
      timeout: 10,
      numDigits: 1,
      action: '/api/twilio/gather',
      method: 'POST'
    });

  // Hindi greeting
  gather.say(
    { voice: 'alice', language: 'hi-IN' },
    'नमस्ते! ग्रामीणसेवा में आपका स्वागत है।'
  );
  
  // English greeting
  gather.say(
    { voice: 'alice', language: 'en-IN' },
    'Hello! Welcome to GraminSeva health service.'
  );
  
  gather.pause({ length: 1 });
  
  // Hindi menu
  gather.say(
    { voice: 'alice', language: 'hi-IN' },
    'कृपया सुनें। यदि माँ को कोई स्वास्थ्य समस्या है, तो 1 दबाएं। यदि बच्चे को कोई स्वास्थ्य समस्या है, तो 2 दबाएं। सामान्य स्वास्थ्य सलाह के लिए 3 दबाएं।'
  );
  
  // English menu
  gather.say(
    { voice: 'alice', language: 'en-IN' },
    'Please listen carefully. Press 1 if mother has a health problem. Press 2 if child has a health problem. Press 3 for general health advice.'
  );

  // If no input received
  twiml.say(
    { voice: 'alice', language: 'en-IN' },
    'We did not receive your input. Please call back. Thank you.'
  );

  console.log('✅ Sending TwiML response');
  res.type('text/xml');
  res.send(twiml.toString());
  } catch (error) {
    console.error('❌ Error in /api/twilio/voice:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Sorry, a system error occurred. Please try again later.');
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Twilio Gather Handler - Process user input
app.post('/api/twilio/gather', async (req, res) => {
  try {
    const digit = req.body.Digits;
    const callSid = req.body.CallSid;
    const from = req.body.From;
    const twiml = new twilio.twiml.VoiceResponse();

    console.log(`📞 Received input: ${digit} from ${from}`);

    if (digit === '1') {
    // Mother's health issue
    const gather = twiml.gather({
      input: 'dtmf',
      timeout: 10,
      numDigits: 1,
      action: '/api/twilio/mother-symptoms',
      method: 'POST'
    });
    
    gather.say({ voice: 'alice', language: 'hi-IN' },
      'आपने माँ की स्वास्थ्य समस्या चुनी है। कृपया लक्षण चुनें।'
    );
    gather.say({ voice: 'alice', language: 'en-IN' },
      'You selected mother health issue. Please choose symptoms.'
    );
    gather.pause({ length: 1 });
    gather.say({ voice: 'alice', language: 'hi-IN' },
      'बुखार या संक्रमण के लिए 1 दबाएं। पेट दर्द या उल्टी के लिए 2 दबाएं। चक्कर या कमजोरी के लिए 3 दबाएं। गंभीर रक्तस्राव या दर्द के लिए 9 दबाएं।'
    );
    gather.say({ voice: 'alice', language: 'en-IN' },
      'Press 1 for fever or infection. Press 2 for stomach pain or vomiting. Press 3 for dizziness or weakness. Press 9 for severe bleeding or pain.'
    );
  } else if (digit === '2') {
    // Child's health issue
    const gather = twiml.gather({
      input: 'dtmf',
      timeout: 10,
      numDigits: 1,
      action: '/api/twilio/child-symptoms',
      method: 'POST'
    });
    
    gather.say({ voice: 'alice', language: 'hi-IN' },
      'आपने बच्चे की स्वास्थ्य समस्या चुनी है। कृपया लक्षण चुनें।'
    );
    gather.say({ voice: 'alice', language: 'en-IN' },
      'You selected child health issue. Please choose symptoms.'
    );
    gather.pause({ length: 1 });
    gather.say({ voice: 'alice', language: 'hi-IN' },
      'बुखार या खांसी के लिए 1 दबाएं। दस्त या उल्टी के लिए 2 दबाएं। भूख न लगना के लिए 3 दबाएं। सांस लेने में तकलीफ या गंभीर बीमारी के लिए 9 दबाएं।'
    );
    gather.say({ voice: 'alice', language: 'en-IN' },
      'Press 1 for fever or cough. Press 2 for diarrhea or vomiting. Press 3 for loss of appetite. Press 9 for breathing difficulty or severe illness.'
    );
  } else if (digit === '3') {
    // General health advice
    twiml.say({ voice: 'alice', language: 'hi-IN' },
      'सामान्य स्वास्थ्य सलाह।'
    );
    twiml.say({ voice: 'alice', language: 'en-IN' },
      'For general health advice, please maintain hygiene, drink clean water, ensure vaccination, eat nutritious food, and visit health center for regular checkups.'
    );
    twiml.say({ voice: 'alice', language: 'hi-IN' },
      'धन्यवाद। स्वस्थ रहें।'
    );
    
    // Log non-critical call
    await logCall(from, 'general_advice', 'completed', false);
  } else {
    twiml.say({ voice: 'alice', language: 'en-IN' },
      'Invalid input. Please call back and try again.'
    );
  }

  res.type('text/xml');
  res.send(twiml.toString());
  } catch (error) {
    console.error('❌ Twilio gather error:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Sorry, an error occurred. Please call back.');
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Mother symptoms handler - Dynamic AI-based responses
app.post('/api/twilio/mother-symptoms', async (req, res) => {
  try {
    const digit = req.body.Digits;
    const from = req.body.From;
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Map digit to health issue with detailed context
    const symptomMap = {
      '1': 'A mother (adult woman) is calling about fever or infection. She needs detailed advice on: what to do at home, when to take medicine, how to monitor temperature, when to visit doctor, and what are warning signs. Provide practical step-by-step guidance in simple Hindi/English.',
      '2': 'A mother (adult woman) has stomach pain or vomiting. She needs advice on: what to eat/avoid, home remedies like ORS, how to manage pain, when to seek medical help, and warning signs for serious conditions. Give specific actionable steps.',
      '3': 'A mother (adult woman) has dizziness or weakness. She may have low blood pressure, anemia, or dehydration. Advise on: immediate steps to take, foods to eat (iron-rich), rest positions, when to see doctor. Include specific remedies.',
      '9': 'CRITICAL EMERGENCY: A mother has severe bleeding or severe pain. This requires IMMEDIATE medical attention. Tell her to go to hospital RIGHT NOW.'
    };
    
    const symptomDescription = symptomMap[digit] || 'Unknown symptom';
    console.log(`🏥 Mother health query (digit ${digit}): Requesting detailed AI advice`);
    
    // Get AI-generated advice
    let aiResponse;
    try {
      const completion = await callAI(symptomDescription, { response_format: { type: 'json_object' } });
      aiResponse = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error('AI call failed, using fallback:', err.message);
      // Fallback for critical cases
      aiResponse = {
        is_critical: digit === '9',
        first_aid_advice: digit === '9' 
          ? 'This is an emergency. Please go to the nearest health center immediately.'
          : 'Please rest and stay hydrated. If symptoms worsen, visit a health center.',
        hospital_referral: digit === '9' ? 'Visit emergency room immediately' : ''
      };
    }
    
    const { is_critical, first_aid_advice, hospital_referral } = aiResponse;
    const advice = first_aid_advice + (hospital_referral ? ' ' + hospital_referral : '');
    const isCritical = is_critical || digit === '9';

    // Speak the AI-generated advice
    twiml.say({ voice: 'alice', language: 'en-IN' }, advice);
    twiml.pause({ length: 1 });
    
    if (isCritical) {
      twiml.say({ voice: 'alice', language: 'hi-IN' }, 'कृपया तुरंत स्वास्थ्य केंद्र जाएं।');
      twiml.say({ voice: 'alice', language: 'en-IN' }, 'Please go to health center immediately.');
    }
    
    twiml.say({ voice: 'alice', language: 'hi-IN' }, 'धन्यवाद। स्वस्थ रहें।');
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Thank you for calling GraminSeva. Take care.');

    // Log the call
    await logCall(from, `mother_symptom_${digit}`, advice, isCritical);

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('❌ Mother symptoms error:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Sorry, an error occurred. Please call back.');
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Child symptoms handler - Dynamic AI-based responses
app.post('/api/twilio/child-symptoms', async (req, res) => {
  try {
    const digit = req.body.Digits;
    const from = req.body.From;
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Map digit to health issue with detailed context
    const symptomMap = {
      '1': 'A parent is calling about their child who has fever or cough. The parent needs detailed guidance on: how to reduce fever at home, what temperature is dangerous, what fluids to give, how to help with cough, when to give medicine (paracetamol), and when to rush to doctor. Provide age-appropriate, practical steps in simple language.',
      '2': 'A parent\'s child has diarrhea or vomiting. This can be serious for children (dehydration risk). Advise on: giving ORS solution frequently, what foods to give/avoid, signs of dehydration (dry mouth, no tears, no urine), when it becomes critical. Give specific, life-saving instructions.',
      '3': 'A child has loss of appetite or not eating well. Parents are worried. Advise on: how to encourage eating, what nutritious foods to offer, small frequent meals, when this becomes serious, signs of malnutrition or illness. Provide practical feeding tips.',
      '9': 'CRITICAL CHILD EMERGENCY: A child has breathing difficulty, severe illness, or life-threatening symptoms. Tell parents to RUSH TO HOSPITAL IMMEDIATELY. This is extremely urgent. Child\'s life may be at risk.'
    };
    
    const symptomDescription = symptomMap[digit] || 'Unknown symptom';
    console.log(`👶 Child health query (digit ${digit}): Requesting detailed AI advice`);
    
    // Get AI-generated advice
    let aiResponse;
    try {
      const completion = await callAI(symptomDescription, { response_format: { type: 'json_object' } });
      aiResponse = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error('AI call failed, using fallback:', err.message);
      // Fallback for critical cases
      aiResponse = {
        is_critical: digit === '9' || digit === '2',
        first_aid_advice: digit === '9'
          ? 'Child breathing difficulty is critical! Rush to hospital immediately.'
          : 'Keep child comfortable and hydrated. Monitor symptoms closely.',
        hospital_referral: (digit === '9' || digit === '2') ? 'Visit hospital if symptoms worsen' : ''
      };
    }
    
    const { is_critical, first_aid_advice, hospital_referral } = aiResponse;
    const advice = first_aid_advice + (hospital_referral ? ' ' + hospital_referral : '');
    const isCritical = is_critical || digit === '9' || digit === '2';

    // Speak the AI-generated advice
    twiml.say({ voice: 'alice', language: 'en-IN' }, advice);
    twiml.pause({ length: 1 });
    
    if (isCritical) {
      twiml.say({ voice: 'alice', language: 'hi-IN' }, 'यह गंभीर है। तुरंत डॉक्टर से मिलें।');
      twiml.say({ voice: 'alice', language: 'en-IN' }, 'This is serious. See doctor immediately.');
    }
    
    twiml.say({ voice: 'alice', language: 'hi-IN' }, 'धन्यवाद। स्वस्थ रहें।');
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Thank you for calling GraminSeva. Take care.');

    // Log the call
    await logCall(from, `child_symptom_${digit}`, advice, isCritical);

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('❌ Child symptoms error:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Sorry, an error occurred. Please call back.');
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Twilio Status Callback
app.post('/api/twilio/status', (req, res) => {
  const { CallSid, CallStatus, From, To } = req.body;
  console.log(`📞 Call ${CallSid} status: ${CallStatus} (${From} -> ${To})`);
  res.sendStatus(200);
});

// Helper function to log calls
async function logCall(phoneNumber, issueType, advice, isCritical) {
  try {
    const callLog = {
      id: Date.now().toString(),
      phoneNumber: phoneNumber,
      timestamp: new Date().toISOString(),
      issueType: issueType,
      advice: advice,
      isCritical: isCritical,
      status: 'completed'
    };

    if (supabase) {
      await supabase.from('calls').insert([callLog]);
    } else {
      // Local storage fallback
      const calls = readJsonFile(CALLS_FILE);
      calls.push(callLog);
      writeJsonFile(CALLS_FILE, calls);
    }

    // If critical, create referral
    if (isCritical) {
      const referral = {
        id: Date.now().toString(),
        callId: callLog.id,
        phoneNumber: phoneNumber,
        issueType: issueType,
        severity: 'critical',
        status: 'pending',
        assignedCenter: HEALTHCARE_CENTERS[0]?.name || 'Nearest Health Center',
        createdAt: new Date().toISOString()
      };

      if (supabase) {
        await supabase.from('referrals').insert([referral]);
      } else {
        const referrals = readJsonFile(REFERRALS_FILE);
        referrals.push(referral);
        writeJsonFile(REFERRALS_FILE, referrals);
      }

      console.log('🚨 Critical case logged - Referral created:', referral);
    }

    console.log('✅ Call logged successfully:', callLog);
  } catch (error) {
    console.error('❌ Error logging call:', error);
  }
}

// Final error handler (catches errors passed with next(err))
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

// DELETE /api/calls/clear - Clear all test data (use with caution)
app.delete('/api/calls/clear', async (req, res) => {
  try {
    if (!supabase) {
      // Clear local files
      writeJsonFile(CALLS_FILE, []);
      writeJsonFile(REFERRALS_FILE, []);
      console.log('🗑️ Cleared local test data');
      return res.json({ message: 'Local test data cleared', count: 0 });
    }

    // Delete all calls from Supabase
    const { error: callsError, count: callsCount } = await supabase
      .from('call_logs')
      .delete()
      .neq('id', 0); // Delete all rows (neq 0 matches all)
    
    if (callsError) throw callsError;

    // Delete all referrals
    const { error: referralsError } = await supabase
      .from('referrals')
      .delete()
      .neq('id', 0);
    
    if (referralsError) console.warn('Referrals delete warning:', referralsError);

    console.log('🗑️ Cleared all test data from Supabase');
    res.json({ message: 'All test data cleared successfully', count: callsCount || 0 });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

// Start server
const PORT = process.env.PORT || 5001;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ GraminSeva Backend (Exotel) running on port ${PORT}`);
  console.log(`📍 Healthcare Centers configured: ${healthcareCenters.map(c => c.name).join(', ')}`);
  console.log(`🌐 Server listening on http://0.0.0.0:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Keep the process alive
console.log('🔄 Backend server is running. Press Ctrl+C to stop.');
