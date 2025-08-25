"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/Sidebar"
import PhoneVerification from "@/components/PhoneVerification"
import HindiVoiceAssistant from "@/components/hindi-voice-assistant"
import UserProfile from "@/components/UserProfile"
import Footer from "@/components/Footer"
import dynamic from "next/dynamic"

const OutboundCallPage = dynamic(() => import("./outbound-call/page"), { ssr: false })
const UserComplaintsPage = dynamic(() => import("./complaints/page"), { ssr: false })

export default function UserDashboard() {
  const { user, loading, sendVerificationEmail } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <HindiVoiceAssistant />
          </div>
        )
      case "profile":
        return <UserProfile />
      case "outbound-call":
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <OutboundCallPage />
          </div>
        )
      case "complaints":
        return <UserComplaintsPage />
      default:
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <h1 className="text-4xl font-bold text-foreground">This is dashboard for user</h1>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1">
        <Sidebar userType="user" activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col">
          <header className="bg-primary text-primary-foreground py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">My Dashboard</h1>
                <p className="text-sm opacity-90">Welcome back, {user.email}</p>
              </div>
              <Button variant="secondary" onClick={() => router.push("/")}>
                Back to Home
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6">{renderContent()}</main>
        </div>
      </div>
      
      <Footer variant="dashboard" />
    </div>
  )
}
