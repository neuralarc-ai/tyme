"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DisclaimerDialogProps {
  onAccept: () => void
  onDeny: () => void
}

export function DisclaimerDialog({ onAccept, onDeny }: DisclaimerDialogProps) {
  // Remove the isOpen state since we want it to always be visible when mounted
  const handleAccept = () => {
    // Store the acceptance in localStorage
    localStorage.setItem('disclaimerAccepted', 'true')
    onAccept()
  }

  const handleDeny = () => {
    onDeny()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[500px] backdrop-blur-md bg-black/40 border border-white/20 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Welcome to Tyme</DialogTitle>
            <DialogDescription className="text-white/70">
              Please read and accept our disclaimer before proceeding
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="backdrop-blur-md bg-yellow-500/10 border-yellow-500/20">
              <AlertDescription className="text-white/90">
                This application uses your location data to provide accurate timezone information and meeting scheduling features.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-white/80">
              <p>By using this application, you acknowledge and agree to the following:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Your location data will be used to determine your timezone</li>
                <li>Meeting times will be calculated based on participants' timezones</li>
                <li>Google Calendar integration requires appropriate permissions</li>
                <li>Your data will be handled in accordance with our privacy policy</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleDeny}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Accept & Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 