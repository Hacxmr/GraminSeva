import { type NextRequest, NextResponse } from "next/server"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy the request to the backend Exotel handler
    const response = await fetch(`${backendUrl}/api/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to process voice call" },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Voice API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process voice call" },
      { status: 500 },
    )
  }
}
