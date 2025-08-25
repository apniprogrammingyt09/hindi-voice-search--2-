"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Home, ChevronLeft, ChevronRight, User, LogOut, FileText, Phone, Settings, CheckSquare, Database } from "lucide-react"

interface SidebarProps {
  userType: "admin" | "user"
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function Sidebar({ userType, activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { logout, user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const adminMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "profile", label: "Profile & Verification", icon: User },
    { id: "complaints", label: "All Complaints", icon: FileText },
    { id: "complaint-management", label: "Complaint Management", icon: CheckSquare },
    { id: "knowledge-management", label: "Knowledge Management", icon: Database },
  ]

  const userMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "profile", label: "Profile & Verification", icon: User },
    { id: "complaints", label: "My Complaints", icon: FileText },
    { id: "outbound-call", label: "Outbound Call", icon: Phone },
  ]

  const menuItems = userType === "admin" ? adminMenuItems : userMenuItems

  return (
    <div className={cn("bg-card border-r transition-all duration-300 flex flex-col", collapsed ? "w-16" : "w-64")}>
      <div className="p-4 border-b flex items-center justify-between">
        {!collapsed && <h2 className="font-semibold text-lg">{userType === "admin" ? "Admin Panel" : "Services"}</h2>}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <Button
                  variant={activeTab === item.id ? "secondary" : "ghost"}
                  className={cn("w-full justify-start gap-3 h-10", collapsed && "justify-center px-2")}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-2 border-t">
        {!collapsed && (
          <div className="mb-2 px-2">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-10 text-red-600 hover:text-red-700 hover:bg-red-50",
            collapsed && "justify-center px-2",
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  )
}
