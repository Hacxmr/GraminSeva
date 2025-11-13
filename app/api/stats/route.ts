import { type NextRequest, NextResponse } from "next/server"

function getRealtimeStats() {
  const now = new Date()
  const hour = now.getHours()

  // Simulate realistic call volume based on time of day
  const baseCallVolume = Math.floor(Math.random() * 50) + 20
  const hourlyPattern = {
    6: 5,
    9: 15,
    12: 25,
    14: 18,
    18: 22,
    20: 15,
  }

  const closestHour = Object.keys(hourlyPattern).reduce((prev, curr) => {
    return Math.abs(Number.parseInt(curr) - hour) < Math.abs(Number.parseInt(prev) - hour) ? curr : prev
  }) as unknown as keyof typeof hourlyPattern

  const multiplier = hourlyPattern[closestHour] || 8

  const callsByHour = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    calls: Math.floor(Math.random() * 30) + Math.max(1, Math.floor(multiplier * (1 - Math.abs(i - hour) / 24))),
  }))

  const topQuestions = [
    { question: "Baby fever care", count: Math.floor(Math.random() * 30) + 15 },
    { question: "Prenatal tips", count: Math.floor(Math.random() * 25) + 10 },
    { question: "Vaccination schedule", count: Math.floor(Math.random() * 20) + 8 },
    { question: "Nutrition advice", count: Math.floor(Math.random() * 18) + 5 },
  ]

  const recentCalls = Array.from({ length: 5 }, (_, i) => ({
    phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    topic: topQuestions[Math.floor(Math.random() * topQuestions.length)].question,
    status: "Completed",
    duration: Math.floor(Math.random() * 600) + 60,
  }))

  return {
    totalCalls: baseCallVolume + Math.floor(Math.random() * 20),
    successRate: 90 + Math.random() * 8,
    avgDuration: Math.floor(Math.random() * 300) + 120,
    uniqueUsers: Math.floor(Math.random() * 100) + 50,
    callsByHour,
    topQuestions,
    recentCalls,
  }
}

export async function GET(request: NextRequest) {
  const stats = getRealtimeStats()
  return NextResponse.json(stats)
}
