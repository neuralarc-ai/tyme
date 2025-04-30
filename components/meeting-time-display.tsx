import { useState, useEffect } from "react"

interface MeetingTimeDisplayProps {
  locations: {
    timezone: string
    location: string
  }[]
  query?: string
}

export function MeetingTimeDisplay({ locations, query }: MeetingTimeDisplayProps) {
  const [bestMeetingTime, setBestMeetingTime] = useState<{ time: string; timezone: string } | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isLocationsLoaded, setIsLocationsLoaded] = useState(false)

  // Reset states when query changes
  useEffect(() => {
    setBestMeetingTime(null)
    setIsLocationsLoaded(false)
  }, [query])

  // Check if all locations are loaded
  useEffect(() => {
    if (locations.length >= 2 && locations.every(loc => loc.timezone && loc.location)) {
      setIsLocationsLoaded(true)
    }
  }, [locations])

  useEffect(() => {
    const calculateMeetingTime = async () => {
      // Only calculate if we have at least two locations and they are all loaded
      if (locations.length < 2 || !isLocationsLoaded) {
        setBestMeetingTime(null)
        return
      }

      setIsCalculating(true)
      try {
        const response = await fetch('/api/meeting-time', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            locations,
            query,
            constraints: {
              businessHours: {
                start: 9, // 9 AM
                end: 17   // 5 PM
              }
            }
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to calculate meeting time')
        }

        const result = await response.json()
        setBestMeetingTime(result)
      } catch (error) {
        console.error("Error getting meeting time:", error)
      } finally {
        setIsCalculating(false)
      }
    }

    calculateMeetingTime()
  }, [locations, query, isLocationsLoaded])

  // Don't render anything if we have less than two locations or they're not loaded
  if (locations.length < 2 || !isLocationsLoaded) {
    return null
  }

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[200px]">
      {isCalculating ? (
        <div className="flex items-center justify-center gap-2 text-white/80">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <span className="text-lg">Finding best time...</span>
        </div>
      ) : bestMeetingTime ? (
        <div className="flex flex-col items-center gap-2 p-4 bg-black rounded-lg border border-white/10 relative">
          <div className="text-lg font-medium text-white/90">Best Meeting Time</div>
          <div className="text-2xl font-semibold text-white">{bestMeetingTime.time}</div>
          <div className="text-lg text-white/70">{bestMeetingTime.timezone}</div>
        </div>
      ) : null}
    </div>
  )
} 