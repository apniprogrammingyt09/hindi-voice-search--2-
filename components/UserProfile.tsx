"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Edit2, 
  Save, 
  Shield, 
  CheckCircle, 
  XCircle,
  Clock,
  RefreshCw,
  Camera
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function UserProfilePage() {
  const { user, updateUserProfile, sendVerificationEmail, sendPasswordReset, lastVerificationSent } = useAuth()
  
  // Basic Profile States
  const [displayName, setDisplayName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")
  const [bio, setBio] = useState("")
  
  // Editing States
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  
  // Loading States
  const [loading, setLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  
  // Success/Error States
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  
  // MongoDB data
  const [mongoId, setMongoId] = useState<string | null>(null)
  const [profileStats, setProfileStats] = useState({
    complaintsCount: 0,
    lastLoginDate: "",
    accountCreated: ""
  })

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "")
      
      // Load phone number from localStorage or Firebase
      const storedPhone = localStorage.getItem(`phoneNumber_${user.uid}`)
      if (storedPhone) {
        setPhoneNumber(storedPhone)
      } else if (user.phoneNumber) {
        setPhoneNumber(user.phoneNumber)
      }
      
      // Load additional profile data from localStorage
      const storedAddress = localStorage.getItem(`address_${user.uid}`)
      const storedBio = localStorage.getItem(`bio_${user.uid}`)
      if (storedAddress) setAddress(storedAddress)
      if (storedBio) setBio(storedBio)
      
      // Fetch MongoDB data
      fetchUserData()
      fetchProfileStats()
    }
  }, [user])

  const fetchUserData = async () => {
    if (!user?.uid) return
    
    try {
      const response = await fetch(`/api/phone-verification?userId=${user.uid}`)
      const data = await response.json()
      
      if (data.success && data.verification) {
        setMongoId(data.verification._id)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchProfileStats = async () => {
    if (!user?.uid) return
    
    try {
      const response = await fetch(`/api/complaints?userId=${user.uid}`)
      const data = await response.json()
      
      if (data.success) {
        setProfileStats(prev => ({
          ...prev,
          complaintsCount: data.complaints?.length || 0,
          lastLoginDate: user.metadata.lastSignInTime || "",
          accountCreated: user.metadata.creationTime || ""
        }))
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error)
    }
  }

  // Validation Functions
  const isValidIndianMobile = (phone: string): boolean => {
    const cleaned = phone.replace(/\s+/g, '').replace(/[-()+]/g, '')
    const indianMobileRegex = /^(\+91)?[6-9]\d{9}$/
    return indianMobileRegex.test(cleaned)
  }

  const isValidName = (name: string): boolean => {
    return name.trim().length >= 2 && name.trim().length <= 50
  }

  // Save Profile Function
  const handleSaveProfile = async () => {
    if (!user) return

    if (!isValidName(displayName)) {
      setErrorMessage("Please enter a valid name with 2-50 characters")
      return
    }

    setLoading(true)
    setErrorMessage("")
    
    try {
      await updateUserProfile({ displayName: displayName.trim() })
      
      // Save additional data to localStorage
      localStorage.setItem(`address_${user.uid}`, address.trim())
      localStorage.setItem(`bio_${user.uid}`, bio.trim())
      
      setIsEditingProfile(false)
      setSuccessMessage("Profile updated successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error: any) {
      setErrorMessage(error.message || "Error updating profile")
    } finally {
      setLoading(false)
    }
  }

  // Save Phone Function
  const handleSavePhone = async () => {
    if (!user || !isValidIndianMobile(phoneNumber)) {
      setErrorMessage("Please enter a valid Indian mobile number")
      return
    }

    setLoading(true)
    setErrorMessage("")
    
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
        mongoResponse = await fetch('/api/phone-verification', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: mongoId, ...mongoPayload })
        })
      } else {
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
      
      setIsEditingPhone(false)
      setSuccessMessage("Phone number saved successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error: any) {
      setErrorMessage(error.message || "Error saving phone number")
    } finally {
      setLoading(false)
    }
  }

  // Send Email Verification
  const handleSendVerification = async () => {
    setEmailLoading(true)
    setErrorMessage("")
    
    try {
      await sendVerificationEmail()
      setSuccessMessage("Verification email sent! Please check your inbox.")
      setTimeout(() => setSuccessMessage(""), 5000)
    } catch (error: any) {
      setErrorMessage(error.message || "Error sending verification email")
    } finally {
      setEmailLoading(false)
    }
  }

  // Send Password Reset
  const handlePasswordReset = async () => {
    if (!user?.email) return
    
    setEmailLoading(true)
    setErrorMessage("")
    
    try {
      await sendPasswordReset(user.email)
      setSuccessMessage("Password reset email sent! Please check your inbox.")
      setTimeout(() => setSuccessMessage(""), 5000)
    } catch (error: any) {
      setErrorMessage(error.message || "Error sending password reset email")
    } finally {
      setEmailLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "अज्ञात"
    return new Date(dateString).toLocaleDateString('hi-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getVerificationTimeRemaining = () => {
    if (!lastVerificationSent) return 0
    const remaining = Math.max(0, 60 - Math.floor((Date.now() - lastVerificationSent) / 1000))
    return remaining
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please login first
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        <Badge variant={user.emailVerified ? "default" : "destructive"} className="text-sm">
          {user.emailVerified ? "Verified Account" : "Unverified Account"}
        </Badge>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture Placeholder */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{displayName || "Name not provided"}</h3>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
              </div>

              <Separator />

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name</Label>
                {isEditingProfile ? (
                  <div className="flex gap-2">
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                    <Button onClick={handleSaveProfile} disabled={loading} size="sm">
                      <Save className="h-4 w-4" />
                      {loading ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditingProfile(false)
                      setDisplayName(user.displayName || "")
                    }} size="sm">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>{displayName || "Name not provided"}</span>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(true)}>
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              {/* Bio/Description */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us something about yourself..."
                  rows={3}
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your complete address..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                    {user.emailVerified ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        असत्यापित
                      </Badge>
                    )}
                  </div>
                  {!user.emailVerified && (
                    <Button 
                      onClick={handleSendVerification} 
                      disabled={emailLoading || getVerificationTimeRemaining() > 0}
                      size="sm"
                      variant="outline"
                    >
                      {emailLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : getVerificationTimeRemaining() > 0 ? (
                        `Wait ${getVerificationTimeRemaining()} seconds`
                      ) : (
                        "Send Verification"
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label>मोबाइल नंबर</Label>
                {isEditingPhone ? (
                  <div className="space-y-2">
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 9876543210"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSavePhone} disabled={loading} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setIsEditingPhone(false)
                        const storedPhone = localStorage.getItem(`phoneNumber_${user.uid}`)
                        setPhoneNumber(storedPhone || user.phoneNumber || "")
                      }} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{phoneNumber || "Phone number not provided"}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingPhone(true)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{profileStats.complaintsCount}</div>
                  <div className="text-sm text-muted-foreground">Total Complaints</div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Account Created:</span>
                  </div>
                  <p className="text-muted-foreground ml-6">
                    {formatDate(profileStats.accountCreated)}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">अंतिम लॉगिन:</span>
                  </div>
                  <p className="text-muted-foreground ml-6">
                    {formatDate(profileStats.lastLoginDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Verification</span>
                {user.emailVerified ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    No
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Phone Verification</span>
                {phoneNumber ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    No
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Profile Completeness</span>
                <Badge variant="outline">
                  {Math.round(((displayName ? 1 : 0) + (phoneNumber ? 1 : 0) + (user.emailVerified ? 1 : 0) + (address ? 1 : 0)) / 4 * 100)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handlePasswordReset}
                disabled={emailLoading}
              >
                {emailLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Reset Password
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsEditingAddress(true)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Update Address
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
