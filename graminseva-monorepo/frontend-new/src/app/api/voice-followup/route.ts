import { type NextRequest, NextResponse } from "next/server"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy the request to the backend
    const response = await fetch(`${backendUrl}/api/voice-followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to process follow-up" },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Voice followup error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process follow-up" },
      { status: 500 },
    )
  }
}
