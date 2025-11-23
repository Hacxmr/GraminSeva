# GraminSeva - Maternal and Child Health Platform

A comprehensive health consultation platform for rural India with AI-powered guidance and emergency healthcare center integration.

## Features

✅ **AI-Powered Health Guidance** - OpenAI-based maternal and child health consultation  
✅ **Critical Case Detection** - Automatic identification of emergency situations  
✅ **Emergency Referral System** - Direct transfer to nearest healthcare centers  
✅ **Real-time Dashboard** - Monitor all health consultations and statistics  
✅ **Multilingual Support** - Hindi and English support for health queries  
✅ **Call History Tracking** - All calls logged in Supabase for medical records  
✅ **Twilio Integration** - Voice call support (optional, when credentials provided)

## Architecture

```
Frontend (Next.js 16)          Backend (Express.js)          Database (Supabase)
├── Dashboard                   ├── /api/calls                ├── call_logs
├── Voice Call Page             ├── /api/voice                ├── referrals
├── Test Page                   ├── /api/stats
└── UI Components               ├── /api/initiate-call
                                ├── /api/voice-followup
                                └── /api/transfer-call
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for containerized deployment)
- Supabase account for database
- OpenAI API key
- Twilio account (optional, for voice calls)

### Step 1: Environment Configuration

Create/update `.env` file in the root directory:

```env
# OpenAI
OPENAI_API_KEY="your_openai_api_key"

# Supabase
SUPABASE_URL="your_supabase_url"
SUPABASE_ANON_KEY="your_supabase_anon_key"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Twilio (Optional - for voice calls)
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Healthcare Centers (Configure your local centers)
HEALTHCARE_CENTERS="Sardar Hospital:+919999999999,City Medical Center:+918888888888"

# URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BACKEND_URL="http://localhost:5001"
```

### Step 2: Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### Step 3: Database Setup (Supabase)

Create the required tables in Supabase:

**Table: `call_logs`**
```sql
CREATE TABLE call_logs (
  id BIGSERIAL PRIMARY KEY,
  user_phone_number TEXT NOT NULL,
  user_transcript TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  is_critical BOOLEAN DEFAULT FALSE,
  parent_call_id BIGINT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**Table: `referrals`**
```sql
CREATE TABLE referrals (
  id BIGSERIAL PRIMARY KEY,
  call_id BIGINT NOT NULL REFERENCES call_logs(id),
  patient_phone TEXT NOT NULL,
  symptoms_summary TEXT,
  referred_to_hospital TEXT NOT NULL,
  hospital_phone TEXT,
  critical_level TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Step 4: Local Development

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Runs on http://localhost:5001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### Step 5: Docker Deployment

```bash
# Build and run services
docker compose up --build

# Services will be available at:
# Frontend: http://localhost:3000
# Backend: http://localhost:5001
```

## Pages & Routes

### Frontend Pages
- **`/`** - Home page
- **`/dashboard`** - Real-time analytics and call statistics
- **`/voice-call`** - Make a health inquiry call
- **`/test`** - Test all API endpoints

### Backend API Endpoints
- **`POST /api/call`** - Process health consultation (legacy)
- **`POST /api/voice`** - Process voice/text health inquiry
- **`POST /api/voice-followup`** - Handle follow-up consultations
- **`POST /api/initiate-call`** - Initiate Twilio call (requires credentials)
- **`GET /api/calls`** - Retrieve all call logs
- **`GET /api/stats`** - Get dashboard statistics
- **`GET /api/transfer-call`** - Handle emergency call transfer

## AI System Prompt

The backend uses a specialized system prompt for maternal and child health guidance:

**Key Features:**
- ✅ Identifies critical situations (high fever, bleeding, breathing difficulty, etc.)
- ✅ Provides safe first-aid advice
- ✅ Never prescribes medicines
- ✅ Responds in JSON format for consistency
- ✅ Automatically triggers emergency referral for critical cases

**Response Format:**
```json
{
  "is_critical": boolean,
  "first_aid_advice": "Safe first-aid guidance",
  "hospital_referral": "Hospital referral message (if critical)"
}
```

## Test Health Queries

Quick test templates included in the system:

- "Mere bacche ko tez bukhar hai" (My child has high fever)
- "Pregnant aur bleeding ho raha hai" (Pregnant and bleeding)
- "Saans lene mein takleef" (Difficulty breathing)
- "Newborn ko jaundice symptoms" (Newborn with jaundice)
- "Bacche ko chest pain" (Child with chest pain)

## Testing

### Test API Endpoints
Visit `/test` page to:
- Test GET /api/calls
- Test GET /api/stats
- Test POST /api/test-call
- Test POST /api/initiate-call

### Make a Real Call
Visit `/voice-call` page to:
- Enter your phone number
- Describe your health concern
- Receive AI guidance
- Get emergency referral if needed

## Troubleshooting

### Backend not connecting
- Ensure `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Check backend is running on port 5001
- Verify CORS settings in backend

### Twilio calls not working
- Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` to .env
- Verify phone numbers are in correct format
- Check Twilio account has available credits

### Database connection failed
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Ensure tables are created in Supabase
- Check network connectivity

## Performance Notes

- Frontend builds with Next.js Turbopack for fast compilation
- Dashboard updates every 5 seconds (configurable)
- Real data pulled from backend when available
- Graceful fallback to simulated data if backend unavailable

## Security Considerations

⚠️ **Important:**
- Never commit `.env` file to version control
- Rotate API keys periodically
- Use HTTPS in production
- Validate all user inputs on backend
- Implement rate limiting for API endpoints
- Use environment-specific configurations

## Support for Healthcare Workers

The system provides:
- Simple Hindi/English interface
- Step-by-step guidance
- Emergency protocol activation
- Call history for reference
- Real-time statistics

## Future Enhancements

- SMS-based health queries
- WhatsApp integration
- Local language support (Marathi, Bengali, etc.)
- Machine learning for common queries
- Integration with government health systems
- Offline mode for rural areas

## Contributing

Contributions are welcome! Please follow:
- ESLint/Prettier for code style
- TypeScript for type safety
- Component-based architecture

## License

MIT License - See LICENSE file for details

## Contact & Support

For issues or questions:
- GitHub Issues: [project-issues]
- Email: support@graminseva.in
- WhatsApp: +91-XXXX-XXXX-XX

---

**Made with ❤️ for maternal and child health in rural India**
