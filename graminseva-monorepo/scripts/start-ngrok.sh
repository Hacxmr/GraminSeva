#!/usr/bin/env bash
# Start ngrok to expose backend port 5001
# Usage: ./scripts/start-ngrok.sh

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok not found. Install from https://ngrok.com/download and put it on your PATH."
  exit 1
fi

echo "Starting ngrok http 5001..."
ngrok http 5001 --log=stdout &
NGROK_PID=$!

# Wait for ngrok local API
sleep 2

TUNNELS_JSON=$(curl -s http://127.0.0.1:4040/api/tunnels || true)
if [ -n "$TUNNELS_JSON" ] && echo "$TUNNELS_JSON" | grep -q "public_url"; then
  # Try to extract public_url without jq
  PUBURL=$(echo "$TUNNELS_JSON" | sed -n 's/.*"public_url"\s*:\s*"\([^"]*\)".*/\1/p' | head -n1)
  echo "ngrok public URL: $PUBURL"
  echo "Twilio webhook for voice should be: $PUBURL/api/voice/twiml"
else
  echo "ngrok started but couldn't read API. Check http://127.0.0.1:4040"
fi

echo "ngrok PID: $NGROK_PID"
