"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, Send, FileText, CheckCircle } from "lucide-react"
import type SpeechRecognition from "speech-recognition"
import VoiceWave from "./voice-wave"

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface ComplaintData {
  complaintType: string
  subType: string
  location: string
  complainantAddress: string
  reportId?: string
}

const COMPLAINT_QUESTIONS = [
  "आपकी शिकायत का प्रकार क्या है? (जैसे: SEWAGE, WATER SUPPLY, ELECTRICITY, आदि)",
  "शिकायत का उप-प्रकार क्या है?",
  "शिकायत का स्थान बताएं",
  "शिकायतकर्ता का पूरा पता बताएं"
]

export default function ComplaintVoiceAssistant() {
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [finalText, setFinalText] = useState("")
  const [interimText, setInterimText] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Complaint collection state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [complaintData, setComplaintData] = useState<ComplaintData>({
    complaintType: "",
    subType: "",
    location: "",
    complainantAddress: ""
  })
  const [isCollectingComplaint, setIsCollectingComplaint] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)

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

  const generateReportId = (): string => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `RPT${timestamp}${random}`
  }

  const saveReportToJson = async (data: ComplaintData) => {
    try {
      const reportData = {
        ...data,
        timestamp: new Date().toISOString(),
        status: "submitted"
      }
      
      // In a real application, you would save this to a backend
      // For now, we'll save to localStorage and create a JSON file
      const existingReports = JSON.parse(localStorage.getItem('complaintReports') || '[]')
      existingReports.push(reportData)
      localStorage.setItem('complaintReports', JSON.stringify(existingReports))
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `complaint_${data.reportId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Error saving report:', error)
      return false
    }
  }

  const handleComplaintResponse = async (response: string) => {
    const trimmedResponse = response.trim()
    if (!trimmedResponse) return

    const newComplaintData = { ...complaintData }
    
    switch (currentQuestionIndex) {
      case 0:
        newComplaintData.complaintType = trimmedResponse
        break
      case 1:
        newComplaintData.subType = trimmedResponse
        break
      case 2:
        newComplaintData.location = trimmedResponse
        break
      case 3:
        newComplaintData.complainantAddress = trimmedResponse
        break
    }

    setComplaintData(newComplaintData)

    if (currentQuestionIndex < COMPLAINT_QUESTIONS.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      const nextQuestion = COMPLAINT_QUESTIONS[currentQuestionIndex + 1]
      speakText(nextQuestion)
    } else {
      // All data collected, generate report
      const reportId = generateReportId()
      newComplaintData.reportId = reportId
      setComplaintData(newComplaintData)
      
      const saved = await saveReportToJson(newComplaintData)
      if (saved) {
        const confirmationMessage = `आपकी शिकायत सफलतापूर्वक दर्ज हो गई है। आपकी रिपोर्ट आईडी है: ${reportId}`
        speakText(confirmationMessage)
        setReportGenerated(true)
        setIsCollectingComplaint(false)
      } else {
        speakText("रिपोर्ट सेव करने में समस्या हुई। कृपया दोबारा कोशिश करें।")
      }
    }

    setFinalText("")
    setInterimText("")
  }

  const startComplaintCollection = () => {
    setIsCollectingComplaint(true)
    setCurrentQuestionIndex(0)
    setComplaintData({
      complaintType: "",
      subType: "",
      location: "",
      complainantAddress: ""
    })
    setReportGenerated(false)
    
    const welcomeMessage = "मैं आपकी शिकायत दर्ज करूंगा। " + COMPLAINT_QUESTIONS[0]
    speakText(welcomeMessage)
  }

  const handleSubmit = () => {
    if (finalText.trim()) {
      stopRecording()
      setTimeout(() => {
        if (isCollectingComplaint) {
          handleComplaintResponse(finalText.trim())
        }
      }, 100)
    }
  }

  const resetComplaint = () => {
    setIsCollectingComplaint(false)
    setCurrentQuestionIndex(0)
    setComplaintData({
      complaintType: "",
      subType: "",
      location: "",
      complainantAddress: ""
    })
    setReportGenerated(false)
    setFinalText("")
    setInterimText("")
    setError(null)
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
  }, [])

  const startRecording = async () => {
    if (!speechSupported || !recognitionRef.current) {
      setError("वॉयस रिकग्निशन उपलब्ध नहीं है")
      return
    }

    try {
      setError(null)
      setFinalText("")
      setInterimText("")
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
  }

  const displayText = finalText + interimText

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-light bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 bg-clip-text text-transparent">
            शिकायत दर्ज करें
            <br />
            Voice Assistant
          </h1>

          <VoiceWave isActive={isRecording} isProcessing={isSpeaking} />
        </div>

        {!isCollectingComplaint && !reportGenerated && (
          <div className="space-y-4">
            <p className="text-lg text-slate-700">
              अपनी शिकायत दर्ज करने के लिए नीचे दिए गए बटन पर क्लिक करें
            </p>
            <Button
              onClick={startComplaintCollection}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full shadow-lg"
            >
              <FileText className="w-5 h-5 mr-2" />
              शिकायत दर्ज करना शुरू करें
            </Button>
          </div>
        )}

        {isCollectingComplaint && (
          <div className="space-y-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-lg font-medium text-slate-700 mb-4">
                प्रश्न {currentQuestionIndex + 1} / {COMPLAINT_QUESTIONS.length}
              </h3>
              <p className="text-slate-600 mb-4">
                {COMPLAINT_QUESTIONS[currentQuestionIndex]}
              </p>
              
              <div className="relative w-full max-w-lg mx-auto mb-4">
                <Input
                  type="text"
                  value={displayText}
                  onChange={(e) => setFinalText(e.target.value)}
                  placeholder="आपका उत्तर..."
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
              </div>

              {finalText.trim() && (
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full shadow-lg"
                >
                  <Send className="w-4 h-4 mr-2" />
                  जमा करें
                </Button>
              )}
            </div>

            {/* Progress indicator */}
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4">
              <h4 className="text-sm font-medium text-slate-600 mb-2">एकत्रित जानकारी:</h4>
              <div className="space-y-2 text-sm">
                <div className={`flex items-center ${complaintData.complaintType ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  शिकायत का प्रकार: {complaintData.complaintType || 'अभी तक नहीं भरा गया'}
                </div>
                <div className={`flex items-center ${complaintData.subType ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  उप-प्रकार: {complaintData.subType || 'अभी तक नहीं भरा गया'}
                </div>
                <div className={`flex items-center ${complaintData.location ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  स्थान: {complaintData.location || 'अभी तक नहीं भरा गया'}
                </div>
                <div className={`flex items-center ${complaintData.complainantAddress ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  पता: {complaintData.complainantAddress || 'अभी तक नहीं भरा गया'}
                </div>
              </div>
            </div>
          </div>
        )}

        {reportGenerated && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-lg">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-2xl font-bold text-green-700">शिकायत सफलतापूर्वक दर्ज!</h3>
              <p className="text-green-600">
                आपकी रिपोर्ट आईडी: <span className="font-mono font-bold">{complaintData.reportId}</span>
              </p>
              <p className="text-sm text-green-600">
                रिपोर्ट फाइल आपके डाउनलोड फोल्डर में सेव हो गई है।
              </p>
              
              <div className="bg-white/60 rounded-xl p-4 mt-4">
                <h4 className="font-medium text-slate-700 mb-2">दर्ज की गई जानकारी:</h4>
                <div className="text-left space-y-1 text-sm">
                  <p><strong>शिकायत का प्रकार:</strong> {complaintData.complaintType}</p>
                  <p><strong>उप-प्रकार:</strong> {complaintData.subType}</p>
                  <p><strong>स्थान:</strong> {complaintData.location}</p>
                  <p><strong>पता:</strong> {complaintData.complainantAddress}</p>
                </div>
              </div>

              <Button
                onClick={resetComplaint}
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full shadow-lg mt-4"
              >
                नई शिकायत दर्ज करें
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="text-center">
          <h2 className="text-xl font-medium text-slate-700">
            {isRecording
              ? "सुन रहे हैं..."
              : isSpeaking
                ? "AI बोल रहा है..."
                : isCollectingComplaint
                  ? "कृपया अपना उत्तर दें"
                  : "शिकायत दर्ज करने के लिए तैयार"}
          </h2>
        </div>
      </div>
    </div>
  )
}