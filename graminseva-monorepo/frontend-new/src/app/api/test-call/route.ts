import { type NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/backend-url"

const backendUrl = getBackendUrl()

// Sample health-related test queries in Hindi and English
const testQueries = [
  "Mere bacche ko tez bukhar hai (My child has high fever)",
  "Pregnant aur bleeding ho raha hai (Pregnant and bleeding)",
  "Saans lene mein takleef (Difficulty breathing)",
  "Newborn ko jaundice symptoms (Newborn with jaundice symptoms)",
  "Bacche ko chest pain (Child with chest pain)",
  "Pregnancy mein nausea aur weakness (Nausea and weakness in pregnancy)",
]

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Test call initiated")

    const backendAvailable = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/calls`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        return response.ok
      } catch {
        return false
      }
    }

    if (!(await backendAvailable())) {
      // If backend is not available, simulate local test call
      const randomQuery = testQueries[Math.floor(Math.random() * testQueries.length)]
      const testCall = {
        id: Math.random().toString(36).substr(2, 9),
        query: randomQuery,
        duration: Math.floor(Math.random() * 300) + 60,
        status: "completed",
        isCritical: Math.random() > 0.7,
        timestamp: new Date().toISOString(),
        phoneNumber: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      }

      return NextResponse.json({
        success: true,
        message: "Test call completed (simulated)",
        call: testCall,
        backendStatus: "offline",
      })
    }

    // Backend is available - make a real test call
    const randomQuery = testQueries[Math.floor(Math.random() * testQueries.length)]
    const testPhoneNumber = `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`

    // Make the call to backend
    const callResponse = await fetch(`${backendUrl}/api/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: randomQuery,
        phoneNumber: testPhoneNumber,
      }),
    })

    if (!callResponse.ok) {
      const errorData = await callResponse.json()
      console.error("[API] Backend call failed:", errorData)
      return NextResponse.json(
        {
          error: `Backend error: ${errorData.error || "Failed to process call"}`,
          backendUrl: backendUrl,
        },
        { status: callResponse.status }
      )
    }

    const callResult = await callResponse.json()
    console.log("[API] Test call successful:", callResult)

    return NextResponse.json({
      success: true,
      message: "Test call initiated and logged",
      call: {
        query: randomQuery,
        response: callResult.reply,
        isCritical: callResult.isCritical || false,
        referredTo: callResult.referredTo || null,
        phoneNumber: testPhoneNumber,
        duration: Math.floor(Math.random() * 300) + 60,
        timestamp: new Date().toISOString(),
      },
      backendStatus: "online",
    })
  } catch (error: any) {
    console.error("[API] Test call error:", error)
    return NextResponse.json(
      { 
        error: error.message || "Failed to initiate test call",
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
