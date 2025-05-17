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
          if (response.status === 429) {
            throw new Error("OpenAI API quota exceeded. Please try again later or upgrade your plan.")
          }
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
    <div className="flex w-[78%] items-center justify-center z-50 p-7">
      {isCalculating ? (
        <div className="flex items-center justify-center gap-3 text-white/80 backdrop-blur-md bg-black/40 rounded-lg p-4 border border-white/20 shadow-lg">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <span className="text-xl">Finding best time...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="backdrop-blur-md bg-red-500/10 border-red-500/20">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : bestMeetingTime ? (
        bestMeetingTime.time && bestMeetingTime.timezone ? (
          <div className="flex flex-col items-center gap-7 py-7 px-12 backdrop-blur-md bg-black/40 rounded-lg border border-white/20 shadow-lg relative w-full">
            {/* Main Meeting Time Section */}
            <div className="w-full">
              <div className="text-xl font-medium text-white/90 mb-3">
                {bestMeetingTime.isOutsideBusinessHours ? "Suggested Meeting Time" : "Best Meeting Time"}
              </div>
              {bestMeetingTime.isOutsideBusinessHours && (
                <Alert variant="warning" className="mb-3 backdrop-blur-md bg-yellow-500/10 border-yellow-500/20">
                  <AlertDescription>
                    This time is outside business hours (9 AM - 8 PM) for some locations
                  </AlertDescription>
                </Alert>
              )}
              <div className="text-3xl font-semibold text-white">{bestMeetingTime.time}</div>
              <div className="text-xl text-white/70">{bestMeetingTime.timezone}</div>
              
              {/* Local times for main suggestion */}
              {bestMeetingTime.localTimes && (
                <div className="w-full mt-3 space-y-2 text-base text-white/80 backdrop-blur-sm bg-black/30 rounded-lg p-4">
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
              <div className="w-full mt-5 pt-5 border-t border-white/10">
                <div className="text-xl font-medium text-white/90 mb-3">
                  {bestMeetingTime.isOutsideBusinessHours ? "Business Hours Alternative" : "Alternative Time"}
                </div>
                <div className="text-2xl font-semibold text-white">{bestMeetingTime.alternateTime.time}</div>
                <div className="text-lg text-white/70">{bestMeetingTime.alternateTime.timezone}</div>
                
                {bestMeetingTime.alternateTime.localTimes && (
                  <div className="w-full mt-3 space-y-2 text-base text-white/80 backdrop-blur-sm bg-black/30 rounded-lg p-4">
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
                  <div className="flex items-center gap-2 text-base text-white/60 cursor-help hover:text-white/80 transition-colors">
                    <InfoCircledIcon className="w-5 h-5" />
                    <span>Why this time?</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="backdrop-blur-md bg-black/40 border border-white/20 shadow-lg">
                  <p className="max-w-[300px] whitespace-pre-wrap">{bestMeetingTime.explanation}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Invite Dialog */}
            <div className="mt-3">
              <InviteDialog
                meetingTime={bestMeetingTime.time}
                meetingDate={meetingDate}
                timezone={bestMeetingTime.timezone}
              />
            </div>
          </div>
        ) : (
          <Alert variant="destructive" className="backdrop-blur-md bg-red-500/10 border-red-500/20">
            <AlertDescription>
              {bestMeetingTime.explanation || "No suitable time found"}
            </AlertDescription>
          </Alert>
        )
      ) : null}
    </div>
  )
} 