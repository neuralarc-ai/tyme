import { useState, useEffect } from "react"
import { InviteDialog } from "./invite-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoCircledIcon } from "@radix-ui/react-icons"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MeetingTimeDisplayProps {
  locations: {
    timezone: string
    location: string
  }[]
  query?: string
}

interface MeetingTimeResponse {
  time: string | null
  timezone: string | null
  explanation?: string
  error?: string
  localTimes?: { [key: string]: string }
  isOutsideBusinessHours?: boolean
  alternateTime?: {
    time: string
    timezone: string
    localTimes: { [key: string]: string }
    explanation: string
    isOutsideBusinessHours: boolean
  }
}

export function MeetingTimeDisplay({ locations, query }: MeetingTimeDisplayProps) {
  const [bestMeetingTime, setBestMeetingTime] = useState<MeetingTimeResponse | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isLocationsLoaded, setIsLocationsLoaded] = useState(false)
  const [meetingDate, setMeetingDate] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Reset states when query changes
  useEffect(() => {
    setBestMeetingTime(null)
    setIsLocationsLoaded(false)
    setError(null)
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
      setError(null)

      try {
        const response = await fetch('/api/meeting-time', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            locations,
            query,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to calculate meeting time')
        }

        setBestMeetingTime(data)
        
        // Only set meeting date if we found a valid time
        if (data.time && data.timezone) {
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          setMeetingDate(tomorrow.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: data.timezone
          }))
        }
      } catch (error) {
        console.error("Error getting meeting time:", error)
        setError(error instanceof Error ? error.message : "Failed to calculate meeting time")
        setBestMeetingTime(null)
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
    <div className="flex w-1/2 items-center justify-center z-50 p-4">
      {isCalculating ? (
        <div className="flex items-center justify-center gap-2 text-white/80 bg-white">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <span className="text-lg">Finding best time...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : bestMeetingTime ? (
        bestMeetingTime.time && bestMeetingTime.timezone ? (
          <div className="flex flex-col items-center gap-4 py-4 px-8 bg-black rounded-lg border border-white/10 relative w-full">
            {/* Main Meeting Time Section */}
            <div className="w-full">
              <div className="text-lg font-medium text-white/90 mb-2">
                {bestMeetingTime.isOutsideBusinessHours ? "Suggested Meeting Time" : "Best Meeting Time"}
              </div>
              {bestMeetingTime.isOutsideBusinessHours && (
                <Alert variant="warning" className="mb-2">
                  <AlertDescription>
                    This time is outside business hours (9 AM - 8 PM) for some locations
                  </AlertDescription>
                </Alert>
              )}
              <div className="text-2xl font-semibold text-white">{bestMeetingTime.time}</div>
              <div className="text-lg text-white/70">{bestMeetingTime.timezone}</div>
              
              {/* Local times for main suggestion */}
              {bestMeetingTime.localTimes && (
                <div className="w-full mt-2 space-y-1 text-sm text-white/80">
                  {Object.entries(bestMeetingTime.localTimes).map(([timezone, time]) => (
                    <div key={timezone} className="flex justify-between">
                      <span>{timezone}:</span>
                      <span className={time.includes('PM') && parseInt(time) >= 8 || time.includes('AM') && parseInt(time) < 9 ? 'text-yellow-400' : ''}>
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Alternate Time Section (if available) */}
            {bestMeetingTime.alternateTime && (
              <div className="w-full mt-4 pt-4 border-t border-white/10">
                <div className="text-lg font-medium text-white/90 mb-2">
                  {bestMeetingTime.isOutsideBusinessHours ? "Business Hours Alternative" : "Alternative Time"}
                </div>
                <div className="text-xl font-semibold text-white">{bestMeetingTime.alternateTime.time}</div>
                <div className="text-md text-white/70">{bestMeetingTime.alternateTime.timezone}</div>
                
                {bestMeetingTime.alternateTime.localTimes && (
                  <div className="w-full mt-2 space-y-1 text-sm text-white/80">
                    {Object.entries(bestMeetingTime.alternateTime.localTimes).map(([timezone, time]) => (
                      <div key={timezone} className="flex justify-between">
                        <span>{timezone}:</span>
                        <span className={time.includes('PM') && parseInt(time) >= 8 || time.includes('AM') && parseInt(time) < 9 ? 'text-yellow-400' : ''}>
                          {time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Explanation tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-sm text-white/60 cursor-help">
                    <InfoCircledIcon />
                    <span>Why this time?</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[250px] whitespace-pre-wrap">{bestMeetingTime.explanation}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Invite Dialog */}
            <div className="mt-2">
              <InviteDialog
                meetingTime={bestMeetingTime.time}
                meetingDate={meetingDate}
                timezone={bestMeetingTime.timezone}
              />
            </div>
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>
              {bestMeetingTime.explanation || "No suitable time found"}
            </AlertDescription>
          </Alert>
        )
      ) : null}
    </div>
  )
} 