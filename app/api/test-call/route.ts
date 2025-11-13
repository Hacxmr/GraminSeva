import { type NextRequest, NextResponse } from "next/server"

const appUrl = process.env.NEXT_PUBLIC_APP_URL

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Test call initiated")

    if (!appUrl) {
      return NextResponse.json({ error: "Application URL not configured" }, { status: 500 })
    }

    const testCallData = {
      query: "Test voice call - Maternal health inquiry",
      duration: Math.floor(Math.random() * 300) + 60,
      status: "completed",
      isTest: true,
    }

    const response = await fetch(`${appUrl}/api/calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testCallData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Failed to log test call:", response.status, errorText)
      return NextResponse.json({ error: `Failed to log test call: ${response.status}` }, { status: response.status })
    }

    const result = await response.json()
    console.log("[v0] Test call logged successfully:", result)

    return NextResponse.json({
      success: true,
      message: "Test call initiated and logged",
    })
  } catch (error: any) {
    console.error("[v0] Test call error:", error)
    return NextResponse.json({ error: error.message || "Failed to initiate test call" }, { status: 500 })
  }
}
