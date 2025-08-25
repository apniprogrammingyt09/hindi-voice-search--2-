"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  FileText,
  Droplets,
  Trash2,
  Building,
  Briefcase,
  Users,
  Phone,
  ArrowRight,
  CheckCircle,
  Mic,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import AuthModal from "@/components/auth/AuthModal"
import Footer from "@/components/Footer"

export default function LandingPage() {
  const { user, loading, isAdmin } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        router.push("/admin-dashboard")
      } else {
        router.push("/user-dashboard")
      }
    }
  }, [user, loading, isAdmin, router])

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

  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  const services = [
    {
      title: "Property Tax Application",
      icon: <Building className="w-8 h-8" />,
      color: "bg-blue-500",
      description: "Pay & manage your property tax easily",
      status: "Available Now",
    },
    {
      title: "Water & Sewerage Connection",
      icon: <Droplets className="w-8 h-8" />,
      color: "bg-cyan-500",
      description: "Apply for water and sewerage services",
      status: "Available Now",
    },
    {
      title: "Solid Waste Management",
      icon: <Trash2 className="w-8 h-8" />,
      color: "bg-green-500",
      description: "Request waste collection and track status",
      status: "Available Now",
    },
    {
      title: "Birth / Death / Marriage Certificate",
      icon: <FileText className="w-8 h-8" />,
      color: "bg-purple-500",
      description: "Get vital records quickly",
      status: "Available Now",
    },
    {
      title: "Trade & Business License",
      icon: <Briefcase className="w-8 h-8" />,
      color: "bg-orange-500",
      description: "Apply or renew municipal trade licenses",
      status: "Available Now",
    },
    {
      title: "Restaurant / Food Permit",
      icon: <Users className="w-8 h-8" />,
      color: "bg-red-500",
      description: "Get approvals for food and hospitality",
      status: "Available Now",
    },
  ]

  const quickLinks = [
    "Grievances",
    "Bill Tracking",
    "Citizen Charter",
    "Tree Cutting NOC",
    "Business Licenses",
    "Environmental Approvals",
  ]

  const steps = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Register Yourself",
      description: "Create your account with mobile number",
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Select Category",
      description: "Choose the service you need",
    },
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Voice Assistant",
      description: "Use voice commands to fill applications",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-2 text-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>🇮🇳 Government of India</span>
            <span>Skip to main content</span>
          </div>
          <div className="flex items-center gap-4">
            <span>A+ | A | A-</span>
            <span>हिन्दी</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-background border-b border-border py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Mic className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">NigamAI</h1>
              <p className="text-xs text-muted-foreground">Voice AI for Municipal Services</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsAuthModalOpen(true)}>Login / Register</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-lg opacity-90">Voice-Based AI Assistant</p>
                <h2 className="text-5xl font-bold leading-tight">
                  Municipal services
                  <br />
                  made simple
                </h2>
                <p className="text-lg opacity-90">
                  Fill applications using voice commands or typing for all your civic needs
                </p>
              </div>
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <div className="relative">
              <img
                src="/voice-assistant-municipal-services-illustration.png"
                alt="NigamAI voice assistant illustration"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* New in NigamAI */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-12">New in NigamAI</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="category-card cursor-pointer">
                <CardContent className="p-6">
                  <div
                    className={`w-16 h-16 ${service.color} rounded-lg flex items-center justify-center text-white mb-4`}
                  >
                    {service.icon}
                  </div>
                  <h4 className="font-semibold mb-2">{service.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                  <p className="text-xs text-green-600 font-medium mb-4">{service.status}</p>
                  <Button variant="outline" size="sm">
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-medium mb-2">EXPLORE</p>
            <h3 className="text-3xl font-bold">Quick Access Services</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {quickLinks.map((link, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 justify-start gap-3 hover:bg-accent hover:text-accent-foreground bg-transparent"
              >
                <span className="font-medium">{link}</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Fill Application Form</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              With NigamAI, citizens can fill and submit municipal applications using voice commands or typing.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.slice(0, 4).map((service, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 justify-between hover:bg-accent hover:text-accent-foreground bg-transparent"
              >
                <span className="font-medium text-left">{service.title}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="link" className="text-primary">
              More Services
            </Button>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">Voice AI to Empower Citizens</h3>
              <p className="text-muted-foreground mb-6">
                NigamAI is a voice-based AI assistant for citizen services. NigamAI aims at 'Digital Empowerment' of
                citizens by providing easy access to municipal services through voice commands and intelligent
                assistance.
              </p>
              <div className="flex gap-4">
                <Button variant="outline">More about NigamAI</Button>
                <Button>View Statistics</Button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-background p-6 rounded-lg border">
                <div className="text-3xl font-bold text-primary mb-2">1,20,45,220</div>
                <div className="text-muted-foreground">Citizens Served</div>
              </div>
              <div className="bg-background p-6 rounded-lg border">
                <div className="text-3xl font-bold text-primary mb-2">Since Jan 2024</div>
                <div className="text-muted-foreground">Service Launch</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Getting started is quick and easy</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground mx-auto mb-4">
                  {step.icon}
                </div>
                <h4 className="font-semibold mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-muted-foreground mx-auto mt-4 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner & Support */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-orange-400 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Become a NigamAI Municipal Partner</h3>
              <p className="mb-6 opacity-90">Partner with NigamAI to bring voice-based services to citizens.</p>
              <Button variant="secondary" className="bg-white text-orange-400 hover:bg-gray-100">
                GET INTEGRATED
              </Button>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Call NigamAI Support</h3>
              <p className="text-muted-foreground mb-6">
                For property tax, water charges, licenses, or civic issues — use our AI-powered helpline.
              </p>
              <div className="w-32 h-32 bg-muted rounded-lg mx-auto mb-6 flex items-center justify-center">
                <div className="w-24 h-24 bg-foreground rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-1">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-background rounded-sm" />
                    ))}
                  </div>
                </div>
              </div>
              <Button className="mb-4">
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
              <div className="flex justify-center gap-4">
                <img src="/google-play-badge.png" alt="Google Play" className="h-10" />
                <img src="/app-store-badge.png" alt="App Store" className="h-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer variant="landing" />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
