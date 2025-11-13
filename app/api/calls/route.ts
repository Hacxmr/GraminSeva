import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for MVP (replace with database)
const calls: any[] = []

export async function GET() {
  return NextResponse.json(calls)
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const call = {
      id: String(calls.length + 1),
      ...data,
      createdAt: new Date(),
    }
    calls.push(call)
    return NextResponse.json(call, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save call" }, { status: 400 })
  }
}
