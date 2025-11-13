"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Moon, Phone, Sun, TrendingUp, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export default function Dashboard() {
  const [isDark, setIsDark] = useState(false)
  const [stats, setStats] = useState({
    totalCalls: 0,
    successRate: 0,
    avgDuration: 0,
    uniqueUsers: 0,
    callsByHour: [],
    topQuestions: [],
    recentCalls: [],
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode")
    if (savedDarkMode !== null) {
      const isDarkMode = JSON.parse(savedDarkMode)
      setIsDark(isDarkMode)
      applyDarkMode(isDarkMode)
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setIsDark(prefersDark)
      applyDarkMode(prefersDark)
    }
  }, [])

  const applyDarkMode = (dark: boolean) => {
    const html = document.documentElement
    if (dark) {
      html.classList.add("dark")
    } else {
      html.classList.remove("dark")
    }
  }

  const toggleDarkMode = () => {
    const newDarkMode = !isDark
    setIsDark(newDarkMode)
    localStorage.setItem("darkMode", JSON.stringify(newDarkMode))
    applyDarkMode(newDarkMode)
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats")
      const data = await res.json()
      setStats(data)
      setLastUpdated(new Date().toLocaleTimeString())
      setLoading(false)
    } catch (error) {
      console.error("[v0] Failed to fetch stats:", error)
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-lg shadow-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                GraminSeva Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Real-time health call analytics
                {lastUpdated && <span className="ml-2">• Last updated: {lastUpdated}</span>}
              </p>
            </div>
            <Button
              onClick={toggleDarkMode}
              variant="outline"
              size="icon"
              className="rounded-full bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Phone className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{loading ? "-" : stats.totalCalls}</div>
              <p className="text-xs text-muted-foreground mt-2">Active calls in system</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-accent/20 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{loading ? "-" : formatPercentage(stats.successRate)}</div>
              <p className="text-xs text-muted-foreground mt-2">Call completion rate</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{loading ? "-" : formatDuration(stats.avgDuration)}</div>
              <p className="text-xs text-muted-foreground mt-2">Average call length</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-accent/20 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unique Users</CardTitle>
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <Users className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{loading ? "-" : stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground mt-2">Unique callers today</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20 backdrop-blur shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-foreground">Calls by Hour</CardTitle>
              <CardDescription>Real-time call volume throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.callsByHour || []}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                  <XAxis dataKey="time" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: `1px solid var(--color-primary)`,
                      color: "var(--color-foreground)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="var(--color-primary)"
                    fillOpacity={1}
                    fill="url(#colorCalls)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-accent/20 backdrop-blur shadow-lg shadow-accent/5">
            <CardHeader>
              <CardTitle className="text-foreground">Top Questions</CardTitle>
              <CardDescription>Most frequently asked health topics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topQuestions || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                  <XAxis
                    dataKey="question"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: `1px solid var(--color-accent)`,
                      color: "var(--color-foreground)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-gradient-to-br from-card to-card/50 border-primary/20 backdrop-blur shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Calls</CardTitle>
            <CardDescription>Latest interactions with the system (live updates)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading call data...</p>
              ) : stats.recentCalls && stats.recentCalls.length > 0 ? (
                stats.recentCalls.slice(0, 5).map((call: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 hover:bg-primary/5 hover:border-primary/30 px-4 py-3 rounded-lg transition-all duration-300 group"
                  >
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">{call.phone || `+91 XXXXXXXXXX`}</p>
                      <p className="text-sm text-muted-foreground">{call.topic || "Health inquiry"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-accent">{call.status || "Completed"}</p>
                      <p className="text-xs text-muted-foreground">
                        {call.duration ? formatDuration(call.duration) : "0m 0s"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No recent calls yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
