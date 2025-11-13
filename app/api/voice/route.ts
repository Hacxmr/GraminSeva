import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

const client = twilio(accountSid, authToken)

export async function POST(request: NextRequest) {
  try {
    const { CallSid, Digits, SpeechResult } = await request.json()

    const twiml = new twilio.twiml.VoiceResponse()

    // Welcome message
    if (!Digits && !SpeechResult) {
      twiml.say(
        { voice: "alice", language: "en-IN" },
        "Welcome to GraminSeva. Your trusted health advisor. Say your health question or press 1 for maternal health, 2 for vaccination, or 3 for nutrition.",
      )

      twiml.gather({
        numDigits: 1,
        action: "/api/voice",
        method: "POST",
      })
    }

    // Handle user input
    if (Digits) {
      const menuOptions: { [key: string]: string } = {
        "1": "You selected maternal health. Please describe your concern.",
        "2": "You selected vaccination information. What would you like to know?",
        "3": "You selected nutrition guidance. What is your question?",
      }

      twiml.say({ voice: "alice", language: "en-IN" }, menuOptions[Digits] || "Invalid selection. Please try again.")
    }

    // Handle speech input
    if (SpeechResult) {
      twiml.say({ voice: "alice", language: "en-IN" }, `You asked about ${SpeechResult}. Let me provide guidance.`)

      // Call AI service to get response
      const aiResponse = await getAIResponse(SpeechResult)
      twiml.say({ voice: "alice", language: "en-IN" }, aiResponse)

      // Offer SMS guide
      twiml.say(
        { voice: "alice", language: "en-IN" },
        "I can also send you a picture guide via SMS. Would you like that? Press 1 for yes, or 2 for no.",
      )

      twiml.gather({
        numDigits: 1,
        action: "/api/voice-followup",
        method: "POST",
      })
    }

    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "application/xml" },
    })
  } catch (error) {
    console.error("Voice error:", error)
    const twiml = new twilio.twiml.VoiceResponse()
    twiml.say("An error occurred. Please try again later.")
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "application/xml" },
    })
  }
}

async function getAIResponse(query: string): Promise<string> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are GraminSeva, a compassionate health advisor for mothers and caregivers in rural areas. 
            Provide clear, actionable health guidance in simple language. 
            If something is urgent, always recommend visiting a doctor immediately.
            Keep responses to 2-3 sentences max for voice delivery.
            Focus on: Maternal health, child health, vaccination, nutrition, and general wellness.`,
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("AI error:", error)
    return "I'm sorry, I couldn't process that. Please try again or contact a healthcare provider."
  }
}
