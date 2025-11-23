#!/bin/bash
# Shell script to start ngrok and help with setup

echo "🚀 Starting ngrok tunnel for port 3000..."
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Please install it first:"
    echo "   Download from: https://ngrok.com/download"
    echo "   Or use: brew install ngrok (on macOS)"
    exit 1
fi

echo "✅ ngrok is installed"
echo ""
echo "📝 Important steps:"
echo "   1. Copy the https://xxxx.ngrok.io URL that appears below"
echo "   2. Update NEXT_PUBLIC_APP_URL in your .env file"
echo "   3. Update Twilio webhook URL in Twilio Console"
echo ""
echo "Starting ngrok..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start ngrok
ngrok http 3000
