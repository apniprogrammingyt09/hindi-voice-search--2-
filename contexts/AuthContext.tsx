"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  isAdmin: boolean
  sendVerificationEmail: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  lastVerificationSent: number | null
  updateUserProfile: (updates: { displayName?: string; phoneNumber?: string }) => Promise<void>
  emailNotVerified: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastVerificationSent, setLastVerificationSent] = useState<number | null>(null)
  const [emailNotVerified, setEmailNotVerified] = useState(false)

  const isAdmin = user?.email === "bhagatkrish65@gmail.com"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      setEmailNotVerified(user ? !user.emailVerified : false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    setEmailNotVerified(!result.user.emailVerified)
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName: name })
      await sendEmailVerification(user)
      setLastVerificationSent(Date.now())
    } catch (error: any) {
      if (error.code === "auth/too-many-requests") {
        throw new Error("Too many verification emails sent. Please wait a few minutes before requesting another.")
      }
      throw error
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const sendVerificationEmail = async () => {
    if (!user) {
      throw new Error("No user logged in")
    }

    if (user.emailVerified) {
      throw new Error("Email is already verified")
    }

    const now = Date.now()
    if (lastVerificationSent && now - lastVerificationSent < 60000) {
      const remainingTime = Math.ceil((60000 - (now - lastVerificationSent)) / 1000)
      throw new Error(`Please wait ${remainingTime} seconds before requesting another verification email`)
    }

    try {
      await sendEmailVerification(user)
      setLastVerificationSent(now)
    } catch (error: any) {
      if (error.code === "auth/too-many-requests") {
        throw new Error("Too many verification emails sent. Please wait a few minutes before trying again.")
      }
      throw error
    }
  }

  const updateUserProfile = async (updates: { displayName?: string; phoneNumber?: string }) => {
    if (!user) {
      throw new Error("No user logged in")
    }

    try {
      // Update Firebase Auth profile
      const profileUpdates: { displayName?: string } = {}
      if (updates.displayName) {
        profileUpdates.displayName = updates.displayName
      }

      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(user, profileUpdates)
      }

      // For phone number, we'll store it in localStorage for now since Firebase Auth
      // phone number updates require additional verification
      if (updates.phoneNumber) {
        localStorage.setItem(`phoneNumber_${user.uid}`, updates.phoneNumber)
      }
    } catch (error: any) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }
  }

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        throw new Error("This email address is not registered")
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address")
      } else if (error.code === "auth/too-many-requests") {
        throw new Error("Too many requests. Please try again later.")
      }
      throw new Error(`Error sending password reset: ${error.message}`)
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin,
    sendVerificationEmail,
    sendPasswordReset,
    lastVerificationSent,
    updateUserProfile,
    emailNotVerified,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export { AuthContext }
