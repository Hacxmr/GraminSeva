# GraminSeva Frontend

Modern Next.js-based frontend for maternal and child health consultation platform.

## Features

- 🎨 Beautiful, accessible UI with Tailwind CSS
- 📱 Fully responsive design
- 📊 Real-time analytics dashboard
- 🗣️ Voice call interface for health consultations
- 🌙 Dark mode support
- ⚡ Fast builds with Next.js Turbopack

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Environment Setup

Create `.env` file at project root:

```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:5001"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### Development

```bash
npm run dev
# Runs on http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

## Pages

- **`/`** - Home/Landing page
- **`/dashboard`** - Real-time call analytics
- **`/voice-call`** - Make health inquiry calls
- **`/test`** - API endpoint testing

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Analytics dashboard
│   ├── voice-call/       # Call interface
│   ├── test/            # Testing page
│   └── page.tsx         # Home page
├── components/
│   ├── ui/              # Reusable UI components
│   └── theme-provider.tsx
├── hooks/               # React hooks
├── lib/                 # Utilities
└── styles/             # Global styles
```

## Components Used

- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **React Hook Form** - Form handling

## For Full Setup Instructions

See [SETUP.md](../SETUP.md) at project root for complete deployment and configuration guide.


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
