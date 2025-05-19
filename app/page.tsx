"use client"

import { useState, useEffect } from "react"
import TimeDisplay from "@/components/time-display"
import { BottomSection } from "@/components/bottom-section"
import { DisclaimerDialog } from "@/components/disclaimer-dialog"
import { useRouter } from "next/navigation"

export default function Home() {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showDisclaimer, setShowDisclaimer] = useState(true) // Start with true to prevent flash
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
    // Check if disclaimer has been accepted
    const disclaimerAccepted = localStorage.getItem('disclaimerAccepted')
    if (disclaimerAccepted === 'true') {
      setShowDisclaimer(false)
    }
  }, [])

  const handleQuerySubmit = async (text: string) => {
    setSearchQuery(text)
  }

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false)
  }

  const handleDisclaimerDeny = () => {
    router.push('/disclaimer-denied')
  }

  // Don't render anything until we've checked localStorage
  if (!isClient) {
    return null
  }

  // Show the disclaimer if it hasn't been accepted
  if (showDisclaimer) {
    return (
      <div className="min-h-screen bg-black">
        <DisclaimerDialog
          onAccept={handleDisclaimerAccept}
          onDeny={handleDisclaimerDeny}
        />
      </div>
    )
  }

  // Show the main app if disclaimer has been accepted
  return (
    <main className="flex flex-col h-screen w-full overflow-hidden">
      <div className="h-2/3">
        <TimeDisplay searchQuery={searchQuery} />
      </div>
      <div className="h-1/3">
        <BottomSection onSubmit={handleQuerySubmit} />
      </div>
    </main>
  )
}
