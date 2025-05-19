"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DisclaimerDenied() {
  const router = useRouter()

  const handleAccept = () => {
    // Store acceptance and redirect back to home
    localStorage.setItem('disclaimerAccepted', 'true')
    router.push('/')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md p-8 backdrop-blur-md bg-black/40 rounded-lg border border-white/20 shadow-lg text-center">
        <h1 className="text-2xl font-semibold text-white mb-4">Disclaimer Required</h1>
        <p className="text-white/70 mb-6">
          To use Tyme, you need to accept our disclaimer which outlines how we use your location data
          and other information to provide accurate timezone and meeting scheduling features.
        </p>
        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            Accept & Continue
          </Button>
          <p className="text-white/50 text-sm">
            By clicking "Accept & Continue", you agree to our terms of use and privacy policy.
          </p>
        </div>
      </div>
    </main>
  )
} 