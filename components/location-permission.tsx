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
  const [error, setError] = useState<string | null>(null)

  const requestLocation = () => {
    setIsRequesting(true)
    setError(null)

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationGranted(position)
          setIsOpen(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setIsRequesting(false)
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setError("Location access was denied. Please allow location access to use this feature.")
              break
            case error.POSITION_UNAVAILABLE:
              setError("Location information is unavailable. Please check your device's location services.")
              break
            case error.TIMEOUT:
              setError("Location request timed out. Please try again.")
              break
            default:
              setError("Unable to get your location. Please try again later.")
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // Increased timeout to 10 seconds
          maximumAge: 0,
        }
      )
    } else {
      setError("Geolocation is not supported by your browser.")
      setIsRequesting(false)
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
        
        {error && (
          <div className="text-red-500 text-sm mb-4">
            {error}
          </div>
        )}

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