"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/Sidebar"
import PhoneVerification from "@/components/PhoneVerification"
import UserProfile from "@/components/UserProfile"
import AdminDashboardOverview from "@/components/AdminDashboardOverview"
import Footer from "@/components/Footer"
import dynamic from "next/dynamic"

const ComplaintsViewPage = dynamic(() => import("../complaints-view/page"), { ssr: false })
const ComplaintManagementPage = dynamic(() => import("../complaint-management/page"), { ssr: false })
const KnowledgeManagementPage = dynamic(() => import("./knowledge-management/page"), { ssr: false })

export default function AdminDashboard() {
  const { user, loading, sendVerificationEmail } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    if (!loading && (!user || user.email !== "bhagatkrish65@gmail.com")) {
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

  if (!user || user.email !== "bhagatkrish65@gmail.com") {
    return null
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboardOverview onNavigate={setActiveTab} />
      case "profile":
        return <UserProfile />
      case "complaints":
        return <ComplaintsViewPage />
      case "complaint-management":
        return <ComplaintManagementPage />
      case "knowledge-management":
        return <KnowledgeManagementPage />
      default:
        return <AdminDashboardOverview onNavigate={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1">
        <Sidebar userType="admin" activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col">
          <header className="bg-primary text-primary-foreground py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm opacity-90">Municipal Services Management</p>
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
