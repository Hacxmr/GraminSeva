# 🏥 GraminSeva - Voice-First Healthcare for Rural Communities

GraminSeva is an AI-powered voice healthcare assistant designed to provide maternal and child health guidance to rural communities. Built for accessibility - works on any phone, no app needed.

## 🌟 Features

- **📞 Voice-First Interface** - Call a number, get instant health guidance
- **🤖 AI-Powered Responses** - OpenAI GPT integration for intelligent conversations
- **🌐 Multilingual Support** - Understands local languages and dialects
- **📊 Real-Time Analytics Dashboard** - Track calls, success rates, and user statistics
- **🧪 Development Mode** - Test locally without Twilio webhooks
- **🎨 Modern UI** - Crypto-style interface with navy blue theme and glassmorphism effects
- **♿ Accessible** - No internet required for callers, works on any phone

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Twilio account (free tier works)
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Hacxmr/GraminSeva.git
cd GraminSeva
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. **Run the development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Development Mode

When running locally with `NEXT_PUBLIC_APP_URL=http://localhost:3000`, the app automatically simulates calls without requiring Twilio webhooks. This lets you:

- ✅ Test all UI functionality
- ✅ Test database operations
- ✅ See simulated calls in dashboard
- ✅ No ngrok or deployment needed

A yellow banner appears at the top indicating development mode.

## 🌐 Production Setup (Real Calls)

For real Twilio voice calls, you need a publicly accessible URL. Two options:

### Option 1: Using ngrok (for testing)

1. Install [ngrok](https://ngrok.com/download)
2. Run the helper script:
```powershell
# Windows
.\scripts\start-ngrok.ps1

# macOS/Linux
./scripts/start-ngrok.sh
```
3. Copy the `https://xxxx.ngrok.io` URL
4. Update `NEXT_PUBLIC_APP_URL` in `.env`
5. Configure Twilio webhook: `https://xxxx.ngrok.io/api/voice`

### Option 2: Deploy to production

Deploy to Vercel, Netlify, or any hosting provider:

```bash
# Deploy to Vercel
vercel

# Or use Vercel GitHub integration
```

Set environment variables in your hosting dashboard and configure Twilio webhook to your production URL.

See [TWILIO_SETUP.md](./TWILIO_SETUP.md) for detailed instructions.

## 📁 Project Structure

```
GraminSeva/
├── app/
│   ├── api/
│   │   ├── calls/          # Call logging endpoints
│   │   ├── initiate-call/  # Twilio call initiation
│   │   ├── stats/          # Dashboard statistics
│   │   ├── test-call/      # Test call simulation
│   │   └── voice/          # Twilio voice webhook
│   ├── dashboard/          # Analytics dashboard
│   ├── test/              # API testing page
│   └── page.tsx           # Main landing page
├── components/
│   └── ui/                # Reusable UI components
├── lib/
│   ├── health-knowledge-base.ts  # Health information
│   └── utils.ts           # Utility functions
├── scripts/
│   ├── start-ngrok.ps1    # Windows ngrok helper
│   └── start-ngrok.sh     # macOS/Linux ngrok helper
├── .env.example           # Environment template
└── TWILIO_SETUP.md        # Detailed setup guide
```

## 🎯 Use Cases

- **Maternal Health** - Pregnancy guidance, nutrition, prenatal care
- **Child Health** - Vaccination schedules, nutrition, development milestones
- **Agriculture** - Climate-smart farming, crop management
- **Emergency Guidance** - First aid, when to seek medical help

## 🛠️ Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom theme
- **Voice**: Twilio Voice API
- **AI**: OpenAI GPT-4
- **Analytics**: Real-time statistics with Recharts
- **Deployment**: Vercel-ready

## 📊 Dashboard Features

- Total calls and success rate
- Average call duration
- Unique users tracking
- Calls by hour visualization
- Top questions analysis
- Recent calls list with live updates

## 🧪 Testing

Visit `/test` route to test all API endpoints:

```bash
http://localhost:3000/test
```

Test buttons for:
- GET /api/calls
- GET /api/stats
- POST /api/test-call
- POST /api/initiate-call

## 🔒 Security

- Environment variables for sensitive data
- `.env` excluded from git via `.gitignore`
- Use `.env.example` as template (no secrets committed)
- Twilio webhook signature validation (TODO)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Documentation

- [TWILIO_SETUP.md](./TWILIO_SETUP.md) - Complete Twilio setup guide
- [BUTTON_FUNCTIONALITY.md](./BUTTON_FUNCTIONALITY.md) - Feature documentation

## 🐛 Troubleshooting

**Error: "Url is not a valid URL"**
- Solution: Use ngrok or deploy to production. See [TWILIO_SETUP.md](./TWILIO_SETUP.md)

**Calls not working in development**
- Check: Development mode banner should appear at top
- Verify: `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env`
- Result: Calls will be simulated (this is normal)

**Dashboard not updating**
- Check: Server logs for errors
- Verify: `/api/stats` and `/api/calls` endpoints responding
- Try: Refresh the page

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for Hackathon 2024
- Designed for rural healthcare accessibility
- Inspired by the need for voice-first solutions in low-connectivity areas

## 📞 Contact

- GitHub: [@Hacxmr](https://github.com/Hacxmr)
- Repository: [GraminSeva](https://github.com/Hacxmr/GraminSeva)

---

Made with ❤️ for communities worldwide
