// backend/index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');

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

// Initialize OpenAI and Supabase with error handling
let openai;
let supabase = null;

try {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('✅ OpenAI client initialized');
} catch (err) {
  console.error('❌ Failed to initialize OpenAI:', err.message);
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

// Exotel config
const EXOTEL_SID = process.env.EXOTEL_SID;
const EXOTEL_API_KEY = process.env.EXOTEL_API_KEY;
const EXOTEL_API_TOKEN = process.env.EXOTEL_API_TOKEN;
const EXOTEL_SUBDOMAIN = process.env.EXOTEL_SUBDOMAIN || 'api.exotel.com';

// Base URL used by Exotel callbacks / generated links
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
    // non-critical heuristics
    if (lower.includes('fever') || lower.includes('bukhar')) firstAid = 'Keep the child warm and offer fluids; consult a doctor if fever persists.';
    if (lower.includes('khansi') || lower.includes('cough')) firstAid = 'Keep the child comfortable; if cough worsens seek medical care.';
  }
  return { is_critical: !!isCritical, first_aid_advice: firstAid, hospital_referral: hospitalReferral };
};

const callAI = async (message, options = {}) => {
  // If DEV_MODE is true, use the local analyzer
  if (process.env.DEV_MODE === 'true') {
    const result = analyzeSymptomsLocally(message || '');
    return { choices: [{ message: { content: JSON.stringify(result) } }] };
  }

  // Otherwise, call OpenAI as before
  return await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    ...(options.response_format ? { response_format: options.response_format } : {}),
    messages: options.messages || [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
  });
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
You are "Asha AI," a specialized AI assistant for maternal and child health emergencies in rural India.
Your primary mission is to provide SAFE first-aid guidance and immediately direct users to a hospital in critical situations.
YOU ARE NOT A DOCTOR. YOU MUST NEVER SUGGEST OR PRESCRIBE SPECIFIC MEDICINES.

Follow these rules STRICTLY:
1.  Analyze the user's description of the mother's or child's symptoms.
2.  Identify if the situation is critical. Critical keywords include: "tez bukhar" (high fever) in a newborn, "khoon behna" (bleeding) during pregnancy, "saans lene me takleef" (breathing difficulty), "behosh" (unconscious), "jhatke aana" (seizures).
3.  Your response MUST be a JSON object, and nothing else. The JSON object must have three keys:
    - "is_critical": A boolean (true or false). Set to true if any critical keywords are found.
    - "first_aid_advice": A very short, safe, universally accepted first-aid tip. Examples: "Maa ko unke baayin taraf litayein." (Lay the mother on her left side.), "Bacche ko garm rakhein." (Keep the child warm.). If not critical, this can be general advice like "Doctor se salah lena zaroori hai."
    - "hospital_referral": If "is_critical" is true, this MUST say "Aapko turant Sardar Hospital jaana chahiye!". If false, it should be an empty string "".

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
  "first_aid_advice": "Bacche ko garm rakhein aur dher saara तरल पदार्थ pilayein. Doctor se salah lena zaroori hai.",
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

  try {
    // Call AI with maternal health system prompt
    let completion;
    try {
      completion = await callAI(message, { response_format: { type: 'json_object' } });
    } catch (err) {
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

    const aiJsonResponse = JSON.parse(completion.choices[0].message.content);
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
    // Use Exotel API to initiate call
    // Replace 'from' with a valid Exotel virtual number or your Exophone
    const from = process.env.EXOTEL_API_KEY; // Or set a specific Exophone number
    const to = phoneNumber;
    const call = await makeExotelCall(from, to);
    return res.json({ 
      message: 'Call initiated',
      exotelResponse: call.data,
    });
  } catch (error) {
    console.error("Initiate call error:", error);
    return res.status(500).json({ error: error.message || 'Failed to initiate call' });
  }
});

// Exotel webhook for inbound calls
app.post('/exotel/voice', async (req, res) => {
  try {
    const from = req.body.From;
    const to = req.body.To;
    const speechResult = req.body.SpeechResult || '';
    const digits = req.body.Digits || '';
    const callSid = req.body.CallSid || 'unknown';
    
    console.log(`📞 Incoming call from ${from} to ${to}`, { speechResult, digits, callSid });

    // Handle DTMF menu selection
    if (digits && !speechResult) {
      let menuResponse = '';
      let healthCondition = '';
      
      switch(digits) {
        case '1':
          healthCondition = 'Pregnancy concerns (गर्भावस्था संबंधी चिंता)';
          menuResponse = 'Please describe your pregnancy symptoms or concerns.';
          break;
        case '2':
          healthCondition = 'Child health issue (बच्चे का स्वास्थ्य)';
          menuResponse = 'Please tell me about the child\'s symptoms.';
          break;
        case '3':
          healthCondition = 'High fever (तेज बुखार)';
          menuResponse = 'Please describe the fever symptoms - how long and severity.';
          break;
        case '4':
          healthCondition = 'Emergency situation (आपातकाल)';
          menuResponse = 'This is an emergency. Please describe the situation quickly.';
          break;
        case '9':
          return res.type('application/xml').send(`
            <Response>
              <Say language="hi-IN">Dhanyavaad. Swasthya ke liye GraminSeva ko chunne ke liye. Shukriya.</Say>
              <Say>Thank you for using GraminSeva Health Services. Goodbye.</Say>
              <Hangup/>
            </Response>
          `);
        default:
          menuResponse = 'Invalid selection. Please try again.';
      }
      
      // Log menu selection
      if (digits !== '9' && healthCondition) {
        const logData = !supabase || process.env.DEV_MODE === 'true'
          ? await logCallLocal({ user_phone_number: from, user_transcript: `Menu: ${healthCondition}`, ai_response: menuResponse, is_critical: digits === '4' })
          : (await supabase.from('call_logs').insert({ user_phone_number: from, user_transcript: `Menu: ${healthCondition}`, ai_response: menuResponse, is_critical: digits === '4' }).select().single()).data;
        
        console.log(`📋 Menu selection logged: ${healthCondition}`);
      }
      
      return res.type('application/xml').send(`
        <Response>
          <Say language="hi-IN">${menuResponse}</Say>
          <Gather input="speech" action="/exotel/voice" method="POST" timeout="5" language="hi-IN">
            <Say>Speak now...</Say>
          </Gather>
          <Say>No input received. Goodbye.</Say>
          <Hangup/>
        </Response>
      `);
    }

    // Initial call - present menu if no speech/digits
    if (!speechResult && !digits) {
      return res.type('application/xml').send(`
        <Response>
          <Say language="hi-IN">Namaste. GraminSeva health assistant mein aapka swagat hai.</Say>
          <Say>Welcome to GraminSeva Health Assistant.</Say>
          <Gather numDigits="1" action="/exotel/voice" method="POST" timeout="10">
            <Say language="hi-IN">
              Kripya apni samasya ke liye ek option chunein.
              Garbhavastha ke liye 1 dabaayein.
              Bacche ki sehat ke liye 2 dabaayein.
              Bukhar ke liye 3 dabaayein.
              Aapatkaaleen sthiti ke liye 4 dabaayein.
              Call khatam karne ke liye 9 dabaayein.
            </Say>
            <Say>
              Press 1 for pregnancy concerns.
              Press 2 for child health.
              Press 3 for fever.
              Press 4 for emergency.
              Press 9 to end call.
            </Say>
          </Gather>
          <Say>No input received. Goodbye.</Say>
          <Hangup/>
        </Response>
      `);
    }

    // Process speech input with AI
    const userTranscript = speechResult;
    console.log(`🗣️ Speech input: "${userTranscript}"`);

    // Call AI to analyze the spoken transcription
    let completion;
    try {
      completion = await callAI(userTranscript, { messages: [ { role: 'system', content: systemPrompt + '\nRespond in the same language as the user.' }, { role: 'user', content: userTranscript } ] });
    } catch (err) {
      const msg = err && (err.message || err.toString()) || '';
      console.warn('OpenAI call failed (fallback) in Exotel flow:', msg);
      if ((err && (err.status === 429 || err.statusCode === 429)) || /quota|429|rate limit/i.test(msg)) {
        const lang = detectLanguage(userTranscript);
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

    // Try to parse JSON response from model; fall back if not JSON
    let aiJsonResponse;
    try {
      aiJsonResponse = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      console.warn('AI did not return strict JSON in Exotel flow, falling back to plain text.', e && e.stack ? e.stack : e);
      aiJsonResponse = {
        is_critical: false,
        first_aid_advice: (completion.choices[0].message.content || '').toString().substring(0, 400),
        hospital_referral: '',
      };
    }

    const { is_critical, first_aid_advice, hospital_referral } = aiJsonResponse;
    const replyText = `${first_aid_advice} ${hospital_referral || ''}`.trim();
    const lang = detectLanguage(userTranscript);

    console.log(`🤖 AI Response (critical: ${is_critical}): "${replyText.substring(0, 100)}..."`);

    // Log the call (Supabase in prod, local JSON in DEV_MODE or if Supabase unavailable)
    try {
      let logData;
      if (!supabase || process.env.DEV_MODE === 'true') {
        logData = await logCallLocal({ user_phone_number: from, user_transcript: userTranscript, ai_response: replyText, is_critical: !!is_critical });
      } else {
        const { data: _logData, error: _logErr } = await supabase
          .from('call_logs')
          .insert({ user_phone_number: from, user_transcript: userTranscript, ai_response: replyText, is_critical: !!is_critical })
          .select()
          .single();
        if (_logErr) console.warn('Supabase log error (exotel):', _logErr);
        logData = _logData;
      }

      console.log(`💾 Call logged to database (ID: ${logData?.id})`);

      // If critical, create referral and attempt to transfer
      if (is_critical) {
        const nearestCenter = healthcareCenters[Math.floor(Math.random() * healthcareCenters.length)];
        try {
          if (!supabase || process.env.DEV_MODE === 'true') {
            await createReferralLocal({ call_id: logData?.id || null, patient_phone: from, symptoms_summary: userTranscript, referred_to_hospital: nearestCenter.name, hospital_phone: nearestCenter.phone, critical_level: 'Emergency' });
          } else {
            const { error: referralErr } = await supabase.from('referrals').insert({
              call_id: logData?.id || null,
              patient_phone: from,
              symptoms_summary: userTranscript,
              referred_to_hospital: nearestCenter.name,
              hospital_phone: nearestCenter.phone,
              critical_level: 'Emergency',
            });
            if (referralErr) console.warn('Referral logging error (exotel):', referralErr);
          }
          console.log(`🏥 Referral created: ${nearestCenter.name}`);
        } catch (e) {
          console.warn('Referral insert failed (exotel):', e && e.stack ? e.stack : e);
        }

        // Respond with Exotel XML to transfer call
        return res.type('application/xml').send(`
          <Response>
            <Say language="hi-IN">${first_aid_advice}</Say>
            <Say language="hi-IN">Aapko ${nearestCenter.name} se connect kar rahe hain. Kripya prateeksha karein.</Say>
            <Say>Connecting you to ${nearestCenter.name}. Please wait.</Say>
            <Dial>${nearestCenter.phone}</Dial>
            <Say>Unable to connect. Please call ${nearestCenter.phone} directly.</Say>
          </Response>
        `);
      }

      // Non-critical: respond with advice and offer to gather more information
      return res.type('application/xml').send(`
        <Response>
          <Say language="hi-IN">${replyText}</Say>
          <Gather input="speech dtmf" numDigits="1" action="/exotel/voice" method="POST" timeout="5" language="hi-IN">
            <Say language="hi-IN">Kya aur madad chahiye? Haan ke liye 1 dabaayein, nahi ke liye 9 dabaayein. Ya aap apna sawaal bol sakte hain.</Say>
            <Say>Need more help? Press 1 for yes, 9 for no. Or speak your question.</Say>
          </Gather>
          <Say language="hi-IN">Dhanyavaad. Swasthya ke liye GraminSeva ko yaad rakhein.</Say>
          <Say>Thank you for using GraminSeva Health Services.</Say>
          <Hangup/>
        </Response>
      `);
    } catch (logErr) {
      console.error('Exotel voice handling log error:', logErr && logErr.stack ? logErr.stack : logErr);
      return res.type('application/xml').send('<Response><Say>Sorry, an error occurred while processing your call. Please try again later.</Say></Response>');
    }
  } catch (error) {
    console.error('Exotel voice flow error:', error && error.stack ? error.stack : error);
    return res.type('application/xml').send('<Response><Say>Sorry, something went wrong. Please try again later.</Say></Response>');
  }
});

// Function to make outbound call via Exotel
async function makeExotelCall(from, to) {
  const url = `https://${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}@${EXOTEL_SUBDOMAIN}/v1/Accounts/${EXOTEL_SID}/Calls/connect`;
  const data = {
    From: from,
    To: to,
    CallerId: to,
    CallType: 'trans',
  };
  return axios.post(url, data);
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
