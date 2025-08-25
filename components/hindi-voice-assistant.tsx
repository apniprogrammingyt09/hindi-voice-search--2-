"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, RotateCcw, Send } from "lucide-react"
import type SpeechRecognition from "speech-recognition"
import VoiceWave from "./voice-wave"
import { useAuth } from "@/contexts/AuthContext"

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export default function HindiVoiceAssistant() {
  const { user } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [finalText, setFinalText] = useState("")
  const [interimText, setInterimText] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`)
  const [reportId, setReportId] = useState<string | null>(null)
  const [mongoId, setMongoId] = useState<string | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  const recognitionRef = useRef<any | null>(null)

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "hi-IN"
      utterance.rate = 0.9
      utterance.pitch = 1

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    }
  }

  const processWithAI = async (text: string) => {
    if (!text.trim()) return

    setIsProcessingAI(true)
    setError(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: text.trim(),
          sessionId: sessionId,
          userId: user?.uid || null,
          userEmail: user?.email || null,
          userName: user?.displayName || null
        }),
      })

      if (!response.ok) {
        throw new Error("AI processing failed")
      }

      const data = await response.json()
      setAiResponse(data.response)
      
      // If complaint was saved, store report ID and speak confirmation
      if (data.saved && data.reportId) {
        setReportId(data.reportId)
        setMongoId(data.mongoId)
        speakText(`${data.response}`)
      } else {
        speakText(data.response)
      }
    } catch (error) {
      console.error("AI processing error:", error)
      setError("AI प्रोसेसिंग में समस्या हुई")
    } finally {
      setIsProcessingAI(false)
    }
  }

  const handleSubmit = () => {
    if (finalText.trim()) {
      stopRecording() // Always stop recognition before sending to AI
      setTimeout(() => {
        processWithAI(finalText.trim())
      }, 100) // slight delay to ensure recognition stops
    }
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (finalText.trim()) {
      processWithAI(finalText.trim())
    }
  }

  const startNewMessage = () => {
    setFinalText("")
    setInterimText("")
    setError(null)
    setReportId(null) // Clear report ID for new conversation
    setMongoId(null) // Clear mongo ID for new conversation
    // Keep aiResponse visible for reference
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "hi-IN"

        recognition.onstart = () => {
          setIsRecording(true)
          setError(null)
          setInterimText("")
          setAiResponse("")
          setFinalText("")
        }

        recognition.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " "
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            setFinalText((prev) => prev + finalTranscript)
          }
          setInterimText(interimTranscript)
        }

        recognition.onerror = (event: any) => {
          setIsRecording(false)
          setInterimText("")

          let errorMessage = "वॉयस रिकग्निशन में समस्या हुई"
          switch (event.error) {
            case "no-speech":
              errorMessage = "कोई आवाज़ नहीं सुनाई दी"
              break
            case "audio-capture":
              errorMessage = "माइक्रोफोन तक पहुंच नहीं मिली"
              break
            case "not-allowed":
              errorMessage = "माइक्रोफोन की अनुमति नहीं दी गई"
              break
            case "network":
              errorMessage = "इंटरनेट कनेक्शन की समस्या"
              break
            case "aborted":
              errorMessage = ""
              break
            default:
              errorMessage = `एरर: ${event.error}`
          }
          if (errorMessage) setError(errorMessage)
        }

        recognition.onend = () => {
          setIsRecording(false)
          setInterimText("")
        }

        recognitionRef.current = recognition
      } else {
        setSpeechSupported(false)
        setError("आपका ब्राउज़र वॉयस रिकग्निशन को सपोर्ट नहीं करता")
      }
    }
  }, [finalText])

  const startRecording = async () => {
    if (!speechSupported || !recognitionRef.current) {
      setError("वॉयस रिकग्निशन उपलब्ध नहीं है")
      return
    }

    try {
      setError(null)
      setFinalText("")
      setInterimText("")
      
      // Get audio stream for voice wave visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setAudioStream(stream)
      
      recognitionRef.current.start()
    } catch (error) {
      setError("वॉयस रिकग्निशन शुरू करने में समस्या")
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
    
    // Clean up audio stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      setAudioStream(null)
    }
  }

  const clearText = () => {
    setFinalText("")
    setInterimText("")
    setError(null)
    setAiResponse("")
    setReportId(null) // Clear report ID
    setMongoId(null) // Clear mongo ID
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const displayText = finalText + interimText

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-light bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 bg-clip-text text-transparent">
            Talk to your
            <br />
            AI assistant now
          </h1>

          <VoiceWave isActive={isRecording} isProcessing={isProcessingAI || isSpeaking} audioStream={audioStream} />
        </div>

        <div className="relative w-full max-w-lg mx-auto">
          <form onSubmit={handleInputSubmit} className="relative">
            <Input
              type="text"
              value={displayText}
              onChange={(e) => setFinalText(e.target.value)}
              placeholder="Type your message or use voice..."
              className="w-full h-14 pl-6 pr-16 text-lg bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-full shadow-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
              disabled={isRecording}
            />
            <Button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              size="sm"
              className={`absolute right-2 top-2 w-10 h-10 rounded-full transition-all duration-300 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25"
                  : "bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/25"
              }`}
              disabled={!speechSupported}
            >
              {isRecording ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-medium text-slate-700">
            {isRecording
              ? "सुन रहे हैं..."
              : isProcessingAI
                ? "AI से जवाब आ रहा है..."
                : isSpeaking
                  ? "AI बोल रहा है..."
                  : aiResponse
                    ? "AI का जवाब तैयार है"
                    : displayText.trim()
                      ? "टेक्स्ट पहचाना गया"
                      : "क्या आप हिंदी में कुछ बोलना चाहेंगे?"}
          </h2>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {finalText.trim() && !isProcessingAI && (
          <Button
            onClick={handleSubmit}
            size="lg"
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full shadow-lg"
          >
            <Send className="w-5 h-5 mr-2" />
            AI को भेजें
          </Button>
        )}

        {aiResponse && !finalText.trim() && !isProcessingAI && (
          <Button
            onClick={startNewMessage}
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full shadow-lg"
          >
            <Mic className="w-5 h-5 mr-2" />
            नया सवाल पूछें
          </Button>
        )}

        {(displayText.trim() || aiResponse) && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="space-y-4">
              {displayText.trim() && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">आपने कहा:</h3>
                  <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">
                    {finalText}
                    {interimText && <span className="text-muted-foreground italic">{interimText}</span>}
                  </p>
                </div>
              )}

              {aiResponse && (
                <div className={displayText.trim() ? "border-t border-border/20 pt-4" : ""}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">AI का जवाब:</h3>
                  <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                  
                  {/* Show Report ID if available */}
                  {reportId && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-green-600 font-semibold">✅ Complaint Registered!</span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">Report ID: <span className="font-mono font-bold">{reportId}</span></p>
                      {mongoId && (
                        <p className="text-green-600 text-xs mt-1">Database ID: <span className="font-mono text-xs">{mongoId}</span></p>
                      )}
                      <p className="text-green-600 text-xs mt-1">कृपया इस ID को safe रखें।</p>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speakText(aiResponse)}
                    className="mt-2 text-purple-600 hover:text-purple-700"
                    disabled={isSpeaking}
                  >
                    {isSpeaking ? "बोल रहा है..." : "फिर से सुनें"}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 mt-6">
              {aiResponse && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNewMessage}
                  className="bg-card/50 backdrop-blur-sm border-border/30"
                >
                  <Send className="w-4 h-4 mr-2" />
                  नया सवाल
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={clearText}
                className="bg-card/50 backdrop-blur-sm border-border/30"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                फिर से शुरू करें
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
