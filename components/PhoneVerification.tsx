"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Phone, Save, Edit2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function PhoneVerification() {
  const { user, updateUserProfile } = useAuth()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mongoId, setMongoId] = useState<string | null>(null)

  // Validate Indian mobile number
  const isValidIndianMobile = (phone: string): boolean => {
    const cleaned = phone.replace(/\s+/g, '').replace(/[-()+]/g, '')
    const indianMobileRegex = /^(\+91)?[6-9]\d{9}$/
    return indianMobileRegex.test(cleaned)
  }

  useEffect(() => {
    if (user?.uid) {
      // First check MongoDB for phone verification data
      fetchPhoneVerification()
      
      const storedPhone = localStorage.getItem(`phoneNumber_${user.uid}`)
      if (storedPhone) {
        setPhoneNumber(storedPhone)
      } else if (user?.phoneNumber) {
        setPhoneNumber(user.phoneNumber)
      }
    }
  }, [user])

  const fetchPhoneVerification = async () => {
    if (!user?.uid) return
    
    try {
      const response = await fetch(`/api/phone-verification?userId=${user.uid}`)
      const data = await response.json()
      
      if (data.success && data.verification) {
        setPhoneNumber(data.verification.phoneNumber)
        setMongoId(data.verification._id)
      }
    } catch (error) {
      console.error('Error fetching phone verification:', error)
    }
  }

  const handleSavePhone = async () => {
    if (!user || !isValidIndianMobile(phoneNumber)) {
      alert('कृपया एक मान्य भारतीय मोबाइल नंबर दर्ज करें')
      return
    }

    setLoading(true)
    try {
      // Save to MongoDB
      const mongoPayload = {
        userId: user.uid,
        phoneNumber: phoneNumber.trim(),
        userName: user.displayName || user.email || '',
        userEmail: user.email || '',
        verifiedAt: new Date().toISOString()
      }

      let mongoResponse
      if (mongoId) {
        // Update existing record
        mongoResponse = await fetch('/api/phone-verification', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: mongoId, ...mongoPayload })
        })
      } else {
        // Create new record
        mongoResponse = await fetch('/api/phone-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mongoPayload)
        })
      }

      const mongoResult = await mongoResponse.json()
      if (mongoResult.success) {
        setMongoId(mongoResult.data._id)
      }

      // Update Firebase profile
      await updateUserProfile({ phoneNumber: phoneNumber.trim() })
      
      // Store in localStorage as backup
      localStorage.setItem(`phoneNumber_${user.uid}`, phoneNumber.trim())
      
      setIsEditing(false)
      setSaved(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaved(false), 3000)
      
      alert('फोन नंबर सफलतापूर्वक सहेजा गया!')
    } catch (error) {
      console.error('Error saving phone number:', error)
      alert('फोन नंबर सहेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Number
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing && phoneNumber ? (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-sm text-muted-foreground">Current Phone Number</Label>
                <p className="font-medium">{phoneNumber}</p>
              </div>
              <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Phone Number
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">This will be saved for future interactive sessions</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSavePhone} disabled={!phoneNumber.trim() || loading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save Phone Number"}
                </Button>
                {phoneNumber && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setPhoneNumber(user?.phoneNumber || "")
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}

          {saved && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">Phone number saved successfully!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
