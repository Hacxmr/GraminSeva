import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(request: NextRequest) {
  try {
    const { Digits, CallSid } = await request.json()

    const twiml = new twilio.twiml.VoiceResponse()

    if (Digits === "1") {
      twiml.say({ voice: "alice", language: "en-IN" }, "Great! We will send you a picture guide shortly. Goodbye!")

      // Send SMS with guide (integration point)
      await sendSMSGuide(CallSid)
    } else {
      twiml.say({ voice: "alice", language: "en-IN" }, "No problem. Take care and stay healthy. Goodbye!")
    }

    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "application/xml" },
    })
  } catch (error) {
    console.error("Followup error:", error)
    const twiml = new twilio.twiml.VoiceResponse()
    twiml.hangup()
    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "application/xml" },
    })
  }
}

async function sendSMSGuide(callSid: string) {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    // Get call details to extract phone number
    const call = await client.calls(callSid).fetch()

    await client.messages.create({
      body: "GraminSeva Health Guide: https://example.com/guides - View helpful tips for your health concern",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: call.from,
    })
  } catch (error) {
    console.error("SMS error:", error)
  }
}
