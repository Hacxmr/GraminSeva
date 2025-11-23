"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, AlertTriangle, Phone, Loader2, CheckCircle, Mic } from "lucide-react"
import { useState } from "react"

export default function VoiceCallPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState("")

  const handleMakeCall = async () => {
    if (!message.trim() || !phoneNumber.trim()) {
      setError("Please enter both phone number and health concern")
      return
    }

    setIsLoading(true)
    setError("")
    setResponse(null)

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          phoneNumber: phoneNumber,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to process call")
      }

      const data = await res.json()
      setResponse(data)
      setMessage("")
    } catch (err: any) {
      setError(err.message || "Failed to process your health concern")
    } finally {
      setIsLoading(false)
    }
  }

  const commonConcerns = [
    "Mere bacche ko tez bukhar hai (My child has high fever)",
    "Garbhvati hoon aur bleeding ho raha hai (Pregnant and bleeding)",
    "Saans lene mein takleef (Difficulty breathing)",
    "Newborn ko jaundice ke lakshan (Newborn with jaundice symptoms)",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Health Consultation Call
          </h1>
          <p className="text-muted-foreground">
            Connect with AI-powered maternal and child health guidance
          </p>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Make a Health Inquiry Call
            </CardTitle>
            <CardDescription>
              Describe your or your child's health concern in Hindi or English
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Phone Number Input */}
            <div className="space-y-2">
              <Label htmlFor="phone">Your Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
                className="border-primary/30"
              />
              <p className="text-xs text-muted-foreground">
                Your number will be used to contact you with health guidance
              </p>
            </div>

            {/* Health Concern Input */}
            <div className="space-y-2">
              <Label htmlFor="concern">Health Concern (हिंदी या English)</Label>
              <Textarea
                id="concern"
                placeholder="Describe your symptoms or health concern in Hindi or English..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
                rows={4}
                className="border-primary/30 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about symptoms, duration, and any relevant details
              </p>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Quick Templates (Click to use)</Label>
              <div className="grid grid-cols-1 gap-2">
                {commonConcerns.map((concern, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMessage(concern)}
                    className="text-left px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all text-sm text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {concern}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Response */}
            {response && (
              <div className={`p-4 rounded-lg border ${
                response.isCritical
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-green-500/10 border-green-500/30"
              }`}>
                <div className="flex items-start gap-3">
                  {response.isCritical ? (
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2 flex-1">
                    <p className={`font-semibold ${response.isCritical ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
                      {response.isCritical ? "🚨 CRITICAL - Emergency Referral" : "✅ Health Guidance Provided"}
                    </p>
                    <p className="text-sm text-foreground">{response.reply}</p>
                    {response.referredTo && (
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        📍 Referred to: {response.referredTo}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleMakeCall}
              disabled={isLoading || !message.trim() || !phoneNumber.trim()}
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Your Call...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Make Health Inquiry Call
                </>
              )}
            </Button>

            {/* Info */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400 text-sm">
              <p className="font-medium mb-1">ℹ️ How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Describe your health concern in detail</li>
                <li>AI provides immediate first-aid guidance</li>
                <li>If critical, we transfer you to nearest healthcare center</li>
                <li>All interactions are logged for medical records</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
