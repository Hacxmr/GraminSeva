import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
const appUrl = process.env.NEXT_PUBLIC_APP_URL

export async function POST(request: NextRequest) {
  try {
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error("[v0] Missing Twilio credentials:", {
        hasSid: !!accountSid,
        hasToken: !!authToken,
        hasPhone: !!twilioPhoneNumber,
      })
      return NextResponse.json(
        {
          error:
            "Twilio is not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to your environment variables.",
        },
        { status: 500 },
      )
    }

    if (!appUrl) {
      console.error("[v0] Missing NEXT_PUBLIC_APP_URL")
      return NextResponse.json(
        {
          error: "Application URL is not configured. Please set NEXT_PUBLIC_APP_URL environment variable.",
        },
        { status: 500 },
      )
    }

    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const cleaned = phoneNumber.replace(/\D/g, "")
    let formattedNumber = ""

    if (cleaned.length === 10) {
      formattedNumber = "+91" + cleaned
    } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
      formattedNumber = "+" + cleaned
    } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
      formattedNumber = "+91" + cleaned.substring(1)
    } else if (phoneNumber.startsWith("+")) {
      formattedNumber = phoneNumber
    } else if (cleaned.length >= 10) {
      formattedNumber = "+91" + cleaned.slice(-10)
    } else {
      return NextResponse.json(
        { error: "Invalid phone number. Please enter a valid Indian phone number." },
        { status: 400 },
      )
    }

    console.log("[v0] Initiating call to:", formattedNumber)

    // Check if in development mode with localhost
    const isDevelopment = appUrl.includes("localhost") || appUrl.includes("127.0.0.1")

    if (isDevelopment) {
      // Simulate call for development without Twilio
      console.log("[v0] Development mode: Simulating call without Twilio")
      const mockCallSid = `MOCK_${Date.now()}`

      // Log the simulated call
      fetch(`${appUrl}/api/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Simulated call to ${formattedNumber}`,
          duration: Math.floor(Math.random() * 300) + 60,
          status: "completed",
          callSid: mockCallSid,
          isSimulated: true,
        }),
      }).catch((err) => console.error("[v0] Failed to log call:", err))

      return NextResponse.json({
        success: true,
        callSid: mockCallSid,
        message: `Development mode: Call simulated to ${formattedNumber}. Deploy to production or use ngrok for real calls.`,
        isDevelopment: true,
      })
    }

    // Production mode: Use actual Twilio
    const client = twilio(accountSid, authToken)

    const call = await client.calls.create({
      to: formattedNumber,
      from: twilioPhoneNumber,
      url: `${appUrl}/api/voice`,
    })

    console.log("[v0] Call created successfully. SID:", call.sid)

    // Log the call asynchronously
    fetch(`${appUrl}/api/calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `Outbound call to ${formattedNumber}`,
        duration: 0,
        status: "initiated",
        callSid: call.sid,
      }),
    }).catch((err) => console.error("[v0] Failed to log call:", err))

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      message: `Call initiated to ${formattedNumber}`,
    })
  } catch (error: any) {
    console.error("[v0] Call initiation error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to initiate call. Please check your phone number and try again.",
      },
      { status: 500 },
    )
  }
}
