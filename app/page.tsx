"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Leaf, MessageSquare, Moon, Phone, Smartphone, Sun } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Home() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(true)
  const [isCalling, setIsCalling] = useState(false)
  const [callStatus, setCallStatus] = useState("")
  const [phoneInput, setPhoneInput] = useState("")
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add("dark")
    setIsDark(true)
    localStorage.setItem("theme", "dark")
    setMounted(true)
    fetchCalls()
    const interval = setInterval(fetchCalls, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showPhoneDialog) {
        setShowPhoneDialog(false)
        setPhoneInput("")
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [showPhoneDialog])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem("theme", newTheme ? "dark" : "light")

    if (newTheme) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const fetchCalls = async () => {
    try {
      const res = await fetch("/api/calls")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setCalls(data)
      setLoading(false)
    } catch (error) {
      console.error("[v0] Failed to fetch calls:", error)
      setLoading(false)
    }
  }

  const handleCallNow = async () => {
    setShowPhoneDialog(true)
  }

  const initiateCall = async () => {
    if (!phoneInput.trim()) {
      setCallStatus("⚠️ Please enter a valid phone number")
      setTimeout(() => setCallStatus(""), 3000)
      return
    }

    setIsCalling(true)
    setShowPhoneDialog(false)
    setCallStatus("📞 Initiating call...")

    try {
      const response = await fetch("/api/initiate-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneInput }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.isDevelopment) {
          setCallStatus(
            `🧪 Development Mode: Call simulated to ${phoneInput}. For real calls, see TWILIO_SETUP.md`,
          )
        } else {
          setCallStatus(
            `✅ Call initiated successfully! Calling ${phoneInput}. Please wait for the incoming call...`,
          )
        }
        setPhoneInput("")
        setTimeout(() => {
          setCallStatus("")
          setIsCalling(false)
          fetchCalls()
        }, 5000)
      } else {
        setCallStatus(`❌ Failed: ${data.error || "Unknown error"}`)
        setTimeout(() => {
          setCallStatus("")
          setIsCalling(false)
        }, 5000)
      }
    } catch (error) {
      console.error("[v0] Call error:", error)
      setCallStatus("❌ Error initiating call. Please check your internet connection and try again.")
      setTimeout(() => {
        setCallStatus("")
        setIsCalling(false)
      }, 5000)
    }
  }

  const handleTestVoiceCall = async () => {
    setIsCalling(true)
    setCallStatus("Starting test call...")

    try {
      const response = await fetch("/api/test-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        setCallStatus("✅ Test call started successfully! Check the dashboard for details.")
        setTimeout(() => {
          setCallStatus("")
          setIsCalling(false)
          fetchCalls()
        }, 3000)
      } else {
        setCallStatus(`❌ Failed: ${data.error || "Failed to start test call"}`)
        setTimeout(() => {
          setCallStatus("")
          setIsCalling(false)
        }, 5000)
      }
    } catch (error) {
      console.error("[v0] Test call error:", error)
      setCallStatus("❌ Error starting test call. Please check your connection.")
      setTimeout(() => {
        setCallStatus("")
        setIsCalling(false)
      }, 5000)
    }
  }

  const features = [
    {
      icon: Phone,
      title: "Voice-First Access",
      description: "Works on any phone, no app needed",
    },
    {
      icon: MessageSquare,
      title: "Multilingual",
      description: "Understand local languages and dialects",
    },
    {
      icon: Heart,
      title: "Maternal Health",
      description: "Expert guidance on pregnancy and childcare",
    },
    {
      icon: Leaf,
      title: "Agriculture",
      description: "Climate and farming best practices",
    },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Development Mode Banner */}
      {mounted && typeof window !== "undefined" && window.location.hostname === "localhost" && (
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-primary/30 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
            <p className="text-sm text-center text-foreground">
              🧪 <strong>Development Mode</strong> - Calls are simulated. For real calls, see{" "}
              <a
                href="https://github.com/yourusername/graminseva/blob/main/TWILIO_SETUP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                TWILIO_SETUP.md
              </a>
            </p>
          </div>
        </div>
      )}
      
      {/* Header with Theme Toggle */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl shadow-lg shadow-primary/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold shadow-lg shadow-primary/30 border border-primary/20">
              GS
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              GraminSeva
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-all duration-300">
                Dashboard
              </Button>
            </Link>
            <Button
              onClick={handleCallNow}
              disabled={isCalling}
              className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 disabled:opacity-50 text-primary-foreground transition-all duration-300 border border-primary/20"
            >
              <Phone className="mr-2 h-5 w-5" />
              {isCalling ? "Calling..." : "Call Now"}
            </Button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-primary/10 transition-all duration-300 text-primary border border-transparent hover:border-primary/20"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </nav>
        </div>
      </header>

      {showPhoneDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <Card className="w-full max-w-md mx-4 shadow-2xl shadow-primary/20 bg-card/90 backdrop-blur-xl border-primary/30">
            <CardHeader>
              <CardTitle className="text-foreground">Enter Your Phone Number</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isCalling) {
                      initiateCall()
                    }
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-primary/20 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all duration-300"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">Enter 10-digit Indian number or with country code (Press Enter to call)</p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPhoneDialog(false)
                    setPhoneInput("")
                  }}
                  className="border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={initiateCall}
                  disabled={isCalling}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/50 transition-all duration-300"
                >
                  Call Me
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Call Status Message */}
      {callStatus && (
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-primary shadow-lg shadow-primary/10 backdrop-blur animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="flex items-center gap-2 font-medium">{callStatus}</p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute top-10 right-10 w-72 h-72 bg-accent rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float opacity-20"></div>
        </div>

        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Healthcare at Your Fingertips
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-xl text-muted-foreground leading-relaxed">
            Just pick up your phone and call. GraminSeva provides expert maternal and child health guidance in your
            language, available 24/7 to support rural communities.
          </p>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row justify-center">
            <Button
              size="lg"
              onClick={handleTestVoiceCall}
              disabled={isCalling}
              className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 text-primary-foreground px-10 text-lg h-14 disabled:opacity-50"
            >
              <Phone className="mr-3 h-6 w-6" />
              {isCalling ? "Initiating..." : "Test Voice Call"}
            </Button>
            <Link href="/dashboard" className="flex">
              <Button
                size="lg"
                variant="outline"
                className="px-10 text-lg h-14 border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h3 className="text-3xl font-bold text-center mb-12">Why GraminSeva?</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 group"
            >
              <CardHeader>
                <div className="inline-flex p-3 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors mb-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Calls Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="border-primary/20 bg-card/80 backdrop-blur-xl shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              Recent Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin">
                  <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full"></div>
                </div>
                <span className="ml-3 text-muted-foreground">Loading calls...</span>
              </div>
            ) : calls.length === 0 ? (
              <div className="py-8 text-center">
                <Phone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No calls yet. Start with a test call!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calls.slice(0, 5).map((call: any, idx: number) => (
                  <div
                    key={call.id || idx}
                    className="flex items-center justify-between p-4 rounded-lg bg-background/30 hover:bg-primary/5 hover:border hover:border-primary/30 transition-all duration-300 group"
                  >
                    <div className="flex-1">
                      <p className="font-medium line-clamp-1 text-foreground group-hover:text-primary transition-colors">{call.query || "Health Query"}</p>
                      <p className="text-sm text-muted-foreground">{new Date(call.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="ml-4 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-medium">
                      Completed
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/90 to-accent/90 px-8 py-16 text-center text-primary-foreground shadow-2xl">
          <div className="absolute inset-0 -z-10 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <h3 className="text-4xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="mb-10 text-lg opacity-90 max-w-2xl mx-auto">
            Call our number and experience healthcare information at your fingertips. Our AI assistant is available 24/7
            to help you and your family.
          </p>
          <Button
            size="lg"
            onClick={handleCallNow}
            disabled={isCalling}
            className="bg-primary-foreground text-primary hover:bg-white px-10 text-lg h-14 hover:shadow-lg disabled:opacity-50"
          >
            <Phone className="mr-3 h-6 w-6" />
            {isCalling ? "Calling..." : "Start Your Call Now"}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-background/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                GraminSeva
              </h3>
              <p className="text-sm text-muted-foreground mt-2">Healthcare for rural communities</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Made with care for communities worldwide. Built for Hackathon 2024.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
