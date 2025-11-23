"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft, Lock, MessageSquare, Moon, Phone, Send, Sun, TrendingUp, Users, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export default function Dashboard() {
  const router = useRouter()
  const [isDark, setIsDark] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [showChatbot, setShowChatbot] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string, timestamp: string}>>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState({
    totalCalls: 0,
    criticalCalls: 0,
    successRate: 0,
    avgDuration: 0,
    uniqueUsers: 0,
    callsByHour: [],
    topQuestions: [],
    recentCalls: [],
    source: "simulated",
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuthenticated')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple password check - in production, use proper authentication
    if (password === 'admin123') {
      setIsAuthenticated(true)
      sessionStorage.setItem('adminAuthenticated', 'true')
      setAuthError('')
    } else {
      setAuthError('Invalid password. Please try again.')
      setPassword('')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('adminAuthenticated')
    router.push('/')
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    
    const newUserMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toLocaleTimeString()
    }
    setChatMessages(prev => [...prev, newUserMsg])
    setIsChatLoading(true)

    try {
      // Check if user is asking about dashboard data/analytics
      const isDashboardQuery = /dashboard|data|calls|statistics|stats|trend|analysis|insight|report|summary|total|critical|how many|show me|tell me about/i.test(userMessage)
      
      if (isDashboardQuery) {
        // Analyze dashboard data and provide insights
        const insights = analyzeDashboardData(userMessage)
        
        const aiMsg = {
          role: 'assistant',
          content: insights,
          timestamp: new Date().toLocaleTimeString()
        }
        setChatMessages(prev => [...prev, aiMsg])
      } else {
        // Regular health query
        const response = await fetch('/api/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            phoneNumber: '+91-DASHBOARD-CHAT'
          })
        })

        const data = await response.json()
        
        const aiMsg = {
          role: 'assistant',
          content: data.reply || data.response || 'Unable to process request',
          timestamp: new Date().toLocaleTimeString()
        }
        setChatMessages(prev => [...prev, aiMsg])
        
        // Refresh stats after chat interaction
        fetchStats()
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const analyzeDashboardData = (query: string) => {
    const lowerQuery = query.toLowerCase()
    
    // Total calls analysis
    if (lowerQuery.includes('total') || lowerQuery.includes('how many call')) {
      if (stats.totalCalls === 0) {
        return `Currently, there are no calls recorded in the system. The dashboard is waiting for real call data from:\n\n1. Phone calls to 09513885656 (after Exotel webhook setup)\n2. Test calls via API\n3. Dashboard chat interactions\n\nOnce calls start coming in, I'll be able to provide detailed analytics.`
      }
      
      const criticalRate = ((stats.criticalCalls / stats.totalCalls) * 100).toFixed(1)
      return `Call Analytics Summary:\n\nTotal Calls: ${stats.totalCalls}\nCritical Cases: ${stats.criticalCalls} (${criticalRate}%)\nSuccess Rate: ${stats.successRate.toFixed(1)}%\nUnique Users: ${stats.uniqueUsers}\nAvg Call Duration: ${Math.floor(stats.avgDuration / 60)}m ${Math.floor(stats.avgDuration % 60)}s\n\n${stats.criticalCalls > 0 ? 'Alert: You have critical cases requiring immediate attention.' : 'All cases are non-critical and handled successfully.'}`
    }
    
    // Critical calls analysis
    if (lowerQuery.includes('critical') || lowerQuery.includes('emergency')) {
      if (stats.criticalCalls === 0) {
        return `No Critical Cases\n\nGreat news! Currently, there are no critical or emergency cases. All ${stats.totalCalls} calls have been handled as routine consultations.\n\nThe system automatically identifies critical cases based on symptoms and refers patients to nearby healthcare centers.`
      }
      
      const criticalCalls = stats.recentCalls.filter((call: any) => call.status?.includes('Critical'))
      return `Critical Cases Analysis:\n\nTotal Critical: ${stats.criticalCalls} out of ${stats.totalCalls} calls\nPercentage: ${((stats.criticalCalls / stats.totalCalls) * 100).toFixed(1)}%\n\nRecent Critical Cases:\n${criticalCalls.slice(0, 3).map((call: any, i: number) => `${i + 1}. ${call.phone} - ${call.topic.substring(0, 40)}`).join('\n')}\n\nAll critical cases have been automatically referred to healthcare facilities.`
    }
    
    // Trends analysis
    if (lowerQuery.includes('trend') || lowerQuery.includes('pattern') || lowerQuery.includes('peak')) {
      const peakHour = stats.callsByHour.reduce((max: any, hour: any) => 
        hour.calls > max.calls ? hour : max, { time: '00:00', calls: 0 }
      )
      
      const totalCallsInDay = stats.callsByHour.reduce((sum: number, hour: any) => sum + hour.calls, 0)
      
      return `Call Trends & Patterns:\n\nPeak Hour: ${peakHour.time} with ${peakHour.calls} calls\nTotal Calls Today: ${totalCallsInDay}\nActive Hours: ${stats.callsByHour.filter((h: any) => h.calls > 0).length} hours with activity\n\nTop Health Concerns:\n${stats.topQuestions.filter((q: any) => q.count > 0).map((q: any, i: number) => `${i + 1}. ${q.question}: ${q.count} calls`).join('\n') || 'No data yet'}\n\nMost calls occur during regular working hours, indicating good service awareness.`
    }
    
    // Recent activity
    if (lowerQuery.includes('recent') || lowerQuery.includes('latest') || lowerQuery.includes('last')) {
      if (stats.recentCalls.length === 0) {
        return `No Recent Activity\n\nThere are currently no calls in the system. Start seeing data by:\n\n1. Testing with: Call 09513885656 (after ngrok setup)\n2. Simulate call via API\n3. Use this chatbot for health queries\n\nAll interactions will appear here in real-time.`
      }
      
      return `Recent Call Activity:\n\n${stats.recentCalls.slice(0, 5).map((call: any, i: number) => 
        `${i + 1}. ${call.phone}\n   Topic: ${call.topic}\n   Status: ${call.status}\n   Duration: ${Math.floor(call.duration / 60)}m ${call.duration % 60}s\n   Time: ${call.timestamp}`
      ).join('\n\n')}\n\n${stats.criticalCalls > 0 ? 'Some cases require follow-up.' : 'All cases handled successfully.'}`
    }
    
    // General insights
    if (lowerQuery.includes('insight') || lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
      return `Dashboard Insights & Recommendations:\n\nPerformance Metrics:\nTotal Calls: ${stats.totalCalls}\nSuccess Rate: ${stats.successRate.toFixed(1)}%\nResponse Quality: ${stats.criticalCalls === 0 ? 'Excellent' : 'Good'}\n\nKey Observations:\n${stats.totalCalls === 0 ? 'System is ready but no calls received yet\nExotel webhook needs to be configured\nConsider running test scenarios' : 
      `${stats.uniqueUsers} unique users served\nAverage call duration: ${Math.floor(stats.avgDuration / 60)} minutes\n${((stats.criticalCalls / stats.totalCalls) * 100).toFixed(0)}% cases required referral`}\n\nRecommendations:\n${stats.criticalCalls > 2 ? 'High critical case rate - consider follow-up protocols' : 'System performing well - continue monitoring'}\n\nUse this chat to ask specific questions like "Show me trends" or "What are the critical cases?"`
    }
    
    // Default response for dashboard queries
    return `Dashboard Assistant Ready\n\nI can help you analyze the call data. Try asking:\n\n"Show me total calls and statistics"\n"What are the critical cases?"\n"Show me call trends"\n"Summarize recent activity"\n"Give me insights on the data"\n\nCurrently tracking:\n${stats.totalCalls} total calls\n${stats.criticalCalls} critical cases\n${stats.uniqueUsers} unique users\n\nWhat would you like to know?`
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
    // Handle invalid or very large numbers
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return "0m 0s"
    }
    
    // Cap at reasonable maximum (24 hours)
    const cappedSeconds = Math.min(seconds, 86400)
    
    const minutes = Math.floor(cappedSeconds / 60)
    const secs = Math.floor(cappedSeconds % 60)
    
    // Format large durations differently
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    }
    
    return `${minutes}m ${secs}s`
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/90 backdrop-blur-xl border-primary/30 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Enter password to access dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  autoFocus
                />
                {authError && (
                  <p className="text-red-500 text-sm mt-2">{authError}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50"
                size="lg"
              >
                Login
              </Button>
              <Button
                type="button"
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Back to Home
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Default password: admin123
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-lg shadow-purple-500/10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleLogout}
                variant="outline"
                size="icon"
                className="rounded-full bg-card/50 backdrop-blur border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300"
                aria-label="Logout"
              >
                <ArrowLeft className="h-4 w-4 text-purple-400" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  GraminSeva Dashboard
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Real-time health call analytics
                  {lastUpdated && <span className="ml-2">• Last updated: {lastUpdated}</span>}
                </p>
              </div>
            </div>
            <Button
              onClick={toggleDarkMode}
              variant="outline"
              size="icon"
              className="rounded-full bg-card/50 backdrop-blur border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-4 w-4 text-purple-400" /> : <Moon className="h-4 w-4 text-purple-400" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card/50 border-purple-500/30 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <Phone className="h-5 w-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{loading ? "-" : stats.totalCalls}</div>
              <p className="text-xs text-muted-foreground mt-2">Active calls in system</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-purple-500/30 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 border border-green-500/30">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{loading ? "-" : formatPercentage(stats.successRate)}</div>
              <p className="text-xs text-muted-foreground mt-2">Call completion rate</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-purple-500/30 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-indigo-500/20 border border-blue-500/30">
                <MessageSquare className="h-5 w-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{loading ? "-" : formatDuration(stats.avgDuration)}</div>
              <p className="text-xs text-muted-foreground mt-2">Average call length</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-purple-500/30 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unique Users</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 border border-purple-500/30">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{loading ? "-" : stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground mt-2">Unique callers today</p>
            </CardContent>
          </Card>

          <Card className="bg-red-950/20 border-red-500/30 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-400">Critical Referrals</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-r from-red-500/30 via-orange-500/30 to-pink-500/30 border border-red-500/40">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{loading ? "-" : (stats.criticalCalls || 0)}</div>
              <p className="text-xs text-red-300/80 mt-2">Emergency transfers to healthcare centers</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Card className="bg-card/50 border-purple-500/30 backdrop-blur shadow-xl shadow-purple-500/10">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                Calls by Hour
              </CardTitle>
              <CardDescription>Real-time call volume throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.callsByHour || []}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                  <XAxis dataKey="time" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: `1px solid #a855f7`,
                      color: "var(--color-foreground)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#a855f7"
                    fillOpacity={1}
                    fill="url(#colorCalls)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-purple-500/30 backdrop-blur shadow-xl shadow-purple-500/10">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 border border-purple-500/30">
                  <MessageSquare className="h-5 w-5 text-pink-400" />
                </div>
                Top Questions
              </CardTitle>
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
                      border: `1px solid #a855f7`,
                      color: "var(--color-foreground)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#a855f7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-card/50 border-purple-500/30 backdrop-blur shadow-xl shadow-purple-500/10">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <Phone className="h-5 w-5 text-purple-400" />
              </div>
              Recent Calls
            </CardTitle>
            <CardDescription>Latest interactions with the system (live updates)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading call data...</p>
              ) : stats.recentCalls && stats.recentCalls.length > 0 ? (
                stats.recentCalls.slice(0, 5).map((call: any, i: number) => {
                  const isCritical = call.status?.includes("Critical") || call.status?.includes("Referred");
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between border-b border-border/50 pb-4 last:border-0 px-4 py-3 rounded-lg transition-all duration-300 group ${
                        isCritical
                          ? "hover:bg-red-500/5 hover:border-red-500/30 bg-red-500/2 border border-red-500/20"
                          : "hover:bg-purple-500/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 bg-purple-500/5 border border-purple-500/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isCritical && <AlertTriangle className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />}
                        <div>
                          <p className={`font-medium ${isCritical ? "text-red-400" : "text-foreground"} group-hover:${isCritical ? "text-red-300" : "text-purple-400"} transition-colors`}>
                            {call.phone || `+91 XXXXXXXXXX`}
                          </p>
                          <p className={`text-sm ${isCritical ? "text-muted-foreground" : "text-muted-foreground group-hover:text-purple-300/70"} transition-colors`}>{call.topic || "Health inquiry"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isCritical ? "text-red-400" : "text-purple-400 group-hover:text-purple-300"} transition-colors`}>
                          {call.status || "Completed"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {call.duration ? formatDuration(call.duration) : "0m 0s"}
                        </p>
                        {call.timestamp && <p className="text-xs text-muted-foreground">{call.timestamp}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-sm">No recent calls yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Floating Chatbot Button - Minimal */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 border-2 border-white/30"
        aria-label="Dashboard Chat Assistant"
      >
        {showChatbot ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chatbot Interface */}
      {showChatbot && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] shadow-2xl rounded-2xl overflow-hidden border-2 border-purple-500/30 backdrop-blur-xl bg-card">
          <div className="h-[32rem] flex flex-col">
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-6 py-4 border-b border-white/20">
              <div className="flex items-center gap-2 text-white">
                <MessageSquare className="h-5 w-5" />
                <h3 className="font-semibold text-lg">Dashboard Analytics Assistant</h3>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <MessageSquare className="h-16 w-16 mx-auto mb-6 opacity-40 text-purple-400" />
                  <p className="font-semibold text-foreground text-lg mb-2">Dashboard Analytics Assistant</p>
                  <p className="text-sm mb-6">Ask me to analyze call data, show trends, or provide health advice!</p>
                  <div className="text-sm text-left bg-muted/50 p-4 rounded-lg max-w-xs mx-auto">
                    <p className="font-semibold mb-3 text-foreground">Try asking:</p>
                    <p className="mb-2">• "Show me total calls"</p>
                    <p className="mb-2">• "What are the critical cases?"</p>
                    <p className="mb-2">• "Analyze call trends"</p>
                    <p>• "Give me insights"</p>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-br-none'
                          : 'bg-card border-purple-500/30 text-foreground rounded-bl-none border-2'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border-purple-500/30 rounded-2xl rounded-bl-none px-4 py-3 border-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChatMessage()
                    }
                  }}
                  placeholder="Type your health query..."
                  disabled={isChatLoading}
                  className="flex-1 px-4 py-2 rounded-xl border border-purple-500/30 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-300 disabled:opacity-50"
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50"
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send • Get instant health advice
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
