import { type NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/backend-url"

async function getBackendStats() {
  const backendUrl = getBackendUrl()
  try {
    const response = await fetch(`${backendUrl}/api/stats`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn("Failed to fetch backend stats:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get real data from backend only
    const backendStats = await getBackendStats()
    
    if (backendStats) {
      return NextResponse.json({
        ...backendStats,
        source: "backend",
      })
    }

    // Return empty stats if backend is unavailable
    return NextResponse.json({
      totalCalls: 0,
      criticalCalls: 0,
      successRate: 0,
      avgDuration: 0,
      uniqueUsers: 0,
      callsByHour: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        calls: 0,
      })),
      topQuestions: [],
      recentCalls: [],
      source: "empty",
    })
  } catch (error: any) {
    console.error("[API] Stats error:", error)
    // Return empty data on error
    return NextResponse.json({
      totalCalls: 0,
      criticalCalls: 0,
      successRate: 0,
      avgDuration: 0,
      uniqueUsers: 0,
      callsByHour: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        calls: 0,
      })),
      topQuestions: [],
      recentCalls: [],
      source: "error",
    })
  }
}
