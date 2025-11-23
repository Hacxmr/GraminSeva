import { type NextRequest, NextResponse } from "next/server"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"

export async function GET() {
  try {
    const response = await fetch(`${backendUrl}/api/calls`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch calls:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${backendUrl}/api/calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const data = await response.json()
      return NextResponse.json(
        { error: data.error || "Failed to save call" },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("Failed to save call:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save call" },
      { status: 400 },
    )
  }
}
