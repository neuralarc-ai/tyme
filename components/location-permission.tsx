import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LocationPermissionProps {
  onLocationGranted: (position: GeolocationPosition) => void
  onLocationDenied: () => void
}

export function LocationPermission({ onLocationGranted, onLocationDenied }: LocationPermissionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)

  const requestLocation = () => {
    setIsRequesting(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationGranted(position)
          setIsOpen(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          onLocationDenied()
          setIsOpen(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      )
    } else {
      onLocationDenied()
      setIsOpen(false)
    }
  }

  const handleDeny = () => {
    onLocationDenied()
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Location Access Required</DialogTitle>
          <DialogDescription>
            To show you the accurate local time, we need access to your location.
            This will help us determine your timezone correctly.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleDeny} disabled={isRequesting}>
            Deny
          </Button>
          <Button onClick={requestLocation} disabled={isRequesting}>
            {isRequesting ? "Requesting..." : "Allow"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 