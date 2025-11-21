# Start ngrok to expose backend (PowerShell)
# Usage: .\scripts\start-ngrok.ps1

param()

Write-Output "Starting ngrok for backend (port 5001)..."

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
  Write-Error 'ngrok not found. Install from https://ngrok.com/download and put it on your PATH.'
  exit 1
}

# Start ngrok in a new window so it doesn't block this shell
Start-Process -FilePath ngrok -ArgumentList "http 5001 --log=stdout" -NoNewWindow

# Wait a moment for ngrok's local API to become available
Start-Sleep -Seconds 2

try {
  $api = Invoke-RestMethod -Uri http://127.0.0.1:4040/api/tunnels -ErrorAction Stop
  if ($api.tunnels.Count -gt 0) {
    $url = $api.tunnels[0].public_url
    Write-Output "ngrok public URL: $url"
    Write-Output "Use this full URL for Twilio webhook: $url/api/voice/twiml"
    Write-Output "Example (set in Twilio Console): https://dashboard.twilio.com/voice-settings or Incoming Phone Number webhook"
  } else {
    Write-Output "ngrok started but no tunnels found yet. Check http://127.0.0.1:4040"
  }
} catch {
  Write-Output "Couldn't query ngrok API at http://127.0.0.1:4040. If ngrok is still starting, try again in a few seconds."
}
