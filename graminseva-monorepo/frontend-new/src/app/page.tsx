"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Leaf, MessageSquare, Moon, Phone, Send, Smartphone, Sun, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export default function Home() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(true)
  const [isCalling, setIsCalling] = useState(false)
  const [callStatus, setCallStatus] = useState("")
  const [phoneInput, setPhoneInput] = useState("")
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string, timestamp: string}>>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [voiceLanguage, setVoiceLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.add("dark")
    setIsDark(true)
    localStorage.setItem("theme", "dark")
    setMounted(true)
    // Don't fetch calls initially - only fetch after real calls are made
    setLoading(false)
    setCalls([])
    
    // Initialize speech synthesis voices
    if ('speechSynthesis' in window) {
      // Load voices
      window.speechSynthesis.getVoices()
      
      // Some browsers require this event listener
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices()
        console.log('🎤 Voices loaded:', voices.length)
        voices.forEach((voice, index) => {
          if (voice.lang.includes('hi') || voice.lang.includes('en-IN')) {
            console.log(`Voice ${index}: ${voice.name} (${voice.lang})`)
          }
        })
      }
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

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

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return

    const userMessage = chatInput.trim()
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    setChatMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp }])
    setChatInput('')
    
    // Speak user message if voice enabled
    if (voiceEnabled) {
      speakText(userMessage, voiceLanguage)
    }
    
    setIsChatLoading(true)

    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          phoneNumber: 'chat-user' // Default for chat interface
        })
      })

      const data = await response.json()
      const aiResponse = data.reply || data.response || data.message || 'Sorry, I could not process your request.'

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }])
      
      // Speak AI response if voice enabled
      if (voiceEnabled) {
        // Small delay to avoid overlapping with user speech
        setTimeout(() => {
          speakText(aiResponse, voiceLanguage)
        }, 500)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMsg = 'Sorry, I encountered an error. Please try again.'
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }])
      
      if (voiceEnabled) {
        setTimeout(() => {
          speakText(errorMsg, voiceLanguage)
        }, 500)
      }
    } finally {
      setIsChatLoading(false)
    }
  }

  // Text-to-Speech function for accessibility
  const speakText = (text: string, lang: string = 'hi-IN') => {
    // Validate text parameter
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn('⚠️ Invalid text for speech synthesis:', text)
      return
    }
    
    if (!('speechSynthesis' in window)) {
      console.warn('⚠️ Speech synthesis not supported in this browser')
      return
    }

    console.log('🔊 Speaking:', text.substring(0, 50) + '...', 'Language:', lang)
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    // Small delay to ensure cancel completes
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = lang
        utterance.rate = 0.9
        utterance.pitch = 2.0 // MAXIMUM pitch for female voice
        utterance.volume = 1
        
        // Get all available voices
        const voices = window.speechSynthesis.getVoices()
        console.log('🎤 Total voices available:', voices.length)
        
        // Get language prefix (e.g., 'hi' from 'hi-IN', 'en' from 'en-IN')
        const langPrefix = lang.split('-')[0]
        
        // Filter voices by language
        const langVoices = voices.filter(voice => 
          voice.lang.toLowerCase().startsWith(langPrefix.toLowerCase())
        )
        console.log(`🌐 Found ${langVoices.length} voices for ${langPrefix}`)
        
        // AGGRESSIVE FEMALE VOICE SELECTION
        let femaleVoice = null
        
        // Log available voices
        langVoices.forEach(v => {
          console.log(`  - ${v.name} (${v.lang})${v.default ? ' [DEFAULT]' : ''}`)
        })
        
        // Priority 1: Voices with explicit "Female" in name
        femaleVoice = langVoices.find(v => 
          v.name.toLowerCase().includes('female')
        )
        if (femaleVoice) console.log('✅ Found explicit female voice:', femaleVoice.name)
        
        // Priority 2: Known female voice names (comprehensive list)
        if (!femaleVoice) {
          const femaleNames = [
            // Indian female names
            'heera', 'raveena', 'aditi', 'swara', 'kajal', 'lekha', 'veena',
            // English female names
            'zira', 'samantha', 'susan', 'karen', 'fiona', 'moira', 'tessa',
            'salli', 'joanna', 'kendra', 'kimberly', 'amy', 'emma', 'victoria',
            // Provider hints (Google/Microsoft female voices)
            'google हिन्दी', 'google hindi female'
          ]
          
          femaleVoice = langVoices.find(v => {
            const name = v.name.toLowerCase()
            const match = femaleNames.some(fname => name.includes(fname))
            if (match) console.log('✅ Matched female name pattern:', v.name)
            return match
          })
        }
        
        // Priority 3: Google voices (typically female by default)
        if (!femaleVoice) {
          femaleVoice = langVoices.find(v => 
            v.name.includes('Google') && !v.name.toLowerCase().includes('male')
          )
          if (femaleVoice) console.log('✅ Using Google voice:', femaleVoice.name)
        }
        
        // Priority 4: Microsoft voices (exclude male)
        if (!femaleVoice) {
          femaleVoice = langVoices.find(v => 
            v.name.includes('Microsoft') && !v.name.toLowerCase().includes('male')
          )
          if (femaleVoice) console.log('✅ Using Microsoft voice:', femaleVoice.name)
        }
        
        // Priority 5: ANY voice that doesn't contain "male"
        if (!femaleVoice) {
          femaleVoice = langVoices.find(v => !v.name.toLowerCase().includes('male'))
          if (femaleVoice) console.log('✅ Using non-male voice:', femaleVoice.name)
        }
        
        // Priority 6: First voice in language (better than wrong language)
        if (!femaleVoice && langVoices.length > 0) {
          femaleVoice = langVoices[0]
          console.log('⚠️ Using first available voice:', femaleVoice.name)
        }
        
        // Priority 7: Global fallback
        if (!femaleVoice && voices.length > 0) {
          femaleVoice = voices.find(v => v.name.toLowerCase().includes('female')) ||
                       voices.find(v => !v.name.toLowerCase().includes('male')) ||
                       voices[0]
          console.log('⚠️ Using global fallback:', femaleVoice?.name)
        }
        
        // Apply the selected voice
        if (femaleVoice) {
          utterance.voice = femaleVoice
          console.log('🎤 FINAL VOICE:', femaleVoice.name, '| Lang:', femaleVoice.lang, '| Pitch: 2.0 (MAX)')
        } else {
          console.error('❌ No voice found! Using system default')
        }
        
        utterance.onstart = () => {
          console.log('🎤 Speech started')
          setIsSpeaking(true)
        }
        
        utterance.onend = () => {
          console.log('✅ Speech ended')
          setIsSpeaking(false)
        }
        
        utterance.onerror = (event) => {
          console.error('❌ Speech error:', {
            error: event.error,
            type: event.type
          })
          setIsSpeaking(false)
          
          // Don't retry if it's a canceled error (normal behavior)
          if (event.error !== 'canceled' && event.error !== 'interrupted') {
            console.warn('Speech failed, this might be a browser limitation')
          }
        }
        
        window.speechSynthesis.speak(utterance)
      } catch (error) {
        console.error('❌ Error creating speech:', error)
        setIsSpeaking(false)
      }
    }, 100)
  }

  // Stop speaking
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  // Toggle voice
  const toggleVoice = () => {
    const newState = !voiceEnabled
    setVoiceEnabled(newState)
    
    if (newState) {
      // Test voice when enabled
      console.log('✅ Voice enabled')
      const message = voiceLanguage === 'hi-IN'
        ? 'आवाज सहायक सक्षम है। मैं अब सभी संदेशों को जोर से पढूंगी।'
        : 'Voice assistant enabled. I will now read all messages aloud.'
      speakText(message, voiceLanguage)
    } else {
      console.log('🔇 Voice disabled')
      stopSpeaking()
    }
  }

  // Handle language change
  const handleLanguageChange = (newLang: 'hi-IN' | 'en-IN') => {
    setVoiceLanguage(newLang)
    console.log('🌐 Language changed to:', newLang)
    
    if (voiceEnabled) {
      const message = newLang === 'hi-IN'
        ? 'मैंने भाषा हिंदी में बदल दी है।'
        : 'I have changed the language to English.'
      setTimeout(() => {
        speakText(message, newLang)
      }, 200)
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
            `✅ Call demonstration successful to ${phoneInput}. ${data.note ? '(Real calls will be enabled once Exotel account is fully activated)' : 'Configure Exotel to enable real calls.'}`,
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
        }, 8000)
      } else {
        // Handle error responses
        if (data.isDevelopment && data.note) {
          setCallStatus(`ℹ️ Call demonstration mode: ${phoneInput}. Real calls require Exotel account activation.`)
        } else {
          setCallStatus(`❌ Failed: ${data.error || "Unknown error"}`)
        }
        setTimeout(() => {
          setCallStatus("")
          setIsCalling(false)
        }, 8000)
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
      description: "Smart farming guidance, crop health monitoring, and climate-resilient practices",
    },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Header with Theme Toggle */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl shadow-lg shadow-primary/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/30 border border-white/20">
              GS
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              GraminSeva
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button className="bg-transparent hover:bg-purple-500/10 hover:text-purple-400 text-foreground transition-all duration-300 hover:scale-105 border-0">
                Dashboard
              </Button>
            </Link>
            <Button
              onClick={() => setShowChatbot(!showChatbot)}
              className="bg-transparent hover:bg-purple-500/10 hover:text-purple-400 text-foreground transition-all duration-300 hover:scale-105 border-0"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Assistant
            </Button>
            <Button
              onClick={handleCallNow}
              disabled={isCalling}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 text-white transition-all duration-300 border border-white/20"
            >
              <Phone className="mr-2 h-5 w-5" />
              {isCalling ? "Calling..." : "Call Now"}
            </Button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-purple-500/10 transition-all duration-300 text-purple-400 border border-purple-500/30 hover:border-purple-500 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30 hover:rotate-12"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </nav>
        </div>
      </header>

      {showPhoneDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <Card className="w-full max-w-md mx-4 shadow-2xl shadow-purple-500/30 bg-card/95 backdrop-blur-xl border-2 border-purple-500/40">
            <CardHeader className="border-b border-purple-500/20">
              <CardTitle className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Enter Your Phone Number</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
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
                  className="w-full px-4 py-3 rounded-lg border-2 border-purple-500/30 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-500/50 transition-all duration-300"
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
                  className="border-2 border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50 text-foreground hover:text-purple-400 transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={initiateCall}
                  disabled={isCalling}
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isCalling ? "Calling..." : "Call Me"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Call Status Message */}
      {callStatus && (
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-purple-500/10 border-2 border-purple-500/30 px-4 py-3 text-purple-400 shadow-lg shadow-purple-500/20 backdrop-blur animate-in fade-in slide-in-from-top-2 duration-300">
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
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Healthcare at Your Fingertips
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-xl text-muted-foreground leading-relaxed">
            Just pick up your phone and call. GraminSeva provides expert maternal and child health guidance in your
            language, available 24/7 to support rural communities.
          </p>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row justify-center">
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="px-10 text-lg h-14 border-2 border-purple-500 hover:bg-purple-500/10 bg-transparent text-foreground hover:text-foreground hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:border-purple-400"
              >
                View Dashboard
              </Button>
            </Link>
            <Button
              size="lg"
              onClick={handleCallNow}
              disabled={isCalling}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50 text-white px-10 text-lg h-14 disabled:opacity-50"
            >
              <Phone className="mr-3 h-6 w-6" />
              {isCalling ? "Initiating..." : "Call Now for Urgent Help"}
            </Button>
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
              className="border-purple-500/30 bg-card/50 backdrop-blur hover:border-purple-500/60 hover:bg-card/80 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 group"
            >
              <CardHeader>
                <div className="inline-flex p-3 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 group-hover:from-blue-500/30 group-hover:via-purple-500/30 group-hover:to-pink-500/30 transition-colors mb-3 border border-purple-500/20">
                  <feature.icon className="h-6 w-6 text-purple-400" />
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
        <Card className="border-purple-500/30 bg-card/80 backdrop-blur-xl shadow-xl shadow-purple-500/10">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <Smartphone className="h-6 w-6 text-purple-400" />
              </div>
              Recent Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin">
                  <div className="h-8 w-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full"></div>
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
                    className="flex items-center justify-between p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group"
                  >
                    <div className="flex-1">
                      <p className="font-medium line-clamp-1 text-foreground group-hover:text-purple-400 transition-colors">{call.user_transcript || call.query || "Health Query"}</p>
                      <p className="text-sm text-muted-foreground group-hover:text-purple-300/70 transition-colors">{new Date(call.created_at || call.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="ml-4 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-300 text-xs font-medium group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all">
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-8 py-16 text-center text-white shadow-2xl">
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
            className="bg-white text-purple-600 hover:bg-gray-100 px-10 text-lg h-14 hover:shadow-lg disabled:opacity-50 font-semibold"
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
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
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

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 border-2 border-white/30"
        aria-label="Health Assistant Chat"
      >
        {showChatbot ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chatbot Interface */}
      {showChatbot && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] shadow-2xl rounded-2xl overflow-hidden border-2 border-border backdrop-blur-xl bg-card">
          <div className="h-[32rem] flex flex-col">
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-6 py-4 border-b border-white/20">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <h3 className="font-semibold text-lg">Health Assistant</h3>
                </div>
                <div className="flex items-center gap-2">
                  {voiceEnabled && (
                    <select
                      value={voiceLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value as 'hi-IN' | 'en-IN')}
                      className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all cursor-pointer"
                      title="Select voice language"
                    >
                      <option value="hi-IN" className="bg-purple-600 text-white">🇮🇳 हिंदी</option>
                      <option value="en-IN" className="bg-purple-600 text-white">🇬🇧 English</option>
                    </select>
                  )}
                  <button
                    onClick={toggleVoice}
                    className={`p-2 rounded-lg transition-all ${
                      voiceEnabled 
                        ? 'bg-white/30 hover:bg-white/40' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                    title={voiceEnabled ? "Voice enabled - Click to disable" : "Enable voice for audio responses"}
                  >
                    {isSpeaking ? (
                      <div className="flex gap-1 items-center">
                        <div className="w-1 h-3 bg-white rounded-full animate-pulse"></div>
                        <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{animationDelay: '100ms'}}></div>
                        <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                      </div>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {voiceEnabled && (
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-white/80">
                    🔊 Voice: {voiceLanguage === 'hi-IN' ? 'हिंदी (Hindi)' : 'English'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-40 text-primary" />
                  <p className="font-semibold text-foreground text-lg mb-2">💬 Health Assistant Ready</p>
                  <p className="text-sm mb-4 text-purple-400">Ask me anything about maternal & child health!</p>
                  <div className="text-sm text-left bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-4 rounded-lg max-w-xs mx-auto">
                    <p className="font-semibold mb-3 text-foreground">💡 Example Questions:</p>
                    <div className="space-y-2">
                      <p className="bg-purple-500/5 p-2 rounded hover:bg-purple-500/10 transition-colors cursor-pointer">• "Pregnancy mein kya khana chahiye?"</p>
                      <p className="bg-purple-500/5 p-2 rounded hover:bg-purple-500/10 transition-colors cursor-pointer">• "Baby ko fever hai, kya karein?"</p>
                      <p className="bg-purple-500/5 p-2 rounded hover:bg-purple-500/10 transition-colors cursor-pointer">• "Mujhe chakkar aa rahe hain"</p>
                      <p className="bg-purple-500/5 p-2 rounded hover:bg-purple-500/10 transition-colors cursor-pointer">• "Bacche ko pet dard hai"</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Online 24/7
                    </div>
                    <div className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full">
                      🔊 Voice Available
                    </div>
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
                  placeholder="💬 Type your question here... (Hindi or English)"
                  disabled={isChatLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-purple-500/30 bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-background transition-all duration-300 disabled:opacity-50 text-sm"
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
              <p className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
                <span>⌨️ Press Enter to send</span>
                <span className="text-purple-400">✨ Ask anything!</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
