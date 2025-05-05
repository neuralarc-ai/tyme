import { motion } from "framer-motion"
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiNightClear, WiDayCloudy, WiNightCloudy } from "react-icons/wi"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { MeetingTimeDisplay } from "./meeting-time-display"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoCircledIcon } from "@radix-ui/react-icons"

interface LocationData {
  timezone: string
  location: string
  weather?: {
    main: {
      temp: number
    }
    weather: {
      main: string
      description: string
      icon: string
    }[]
  }
  searchedTime?: string
}

interface DualLocationDisplayProps {
  firstLocation: LocationData
  secondLocation: LocationData
  currentLocation?: LocationData
  query?: string
  is24HourFormat: boolean
}

// interface MeetingTimeResponse {
//   time: string | null
//   timezone: string | null
//   explanation?: string
//   error?: string
//   localTimes?: { [key: string]: string }
//   isOutsideBusinessHours?: boolean
//   alternateTime?: {
//     time: string
//     timezone: string
//     localTimes: { [key: string]: string }
//     explanation: string
//     isOutsideBusinessHours: boolean
//   }
// }

const getWeatherIcon = (weatherData: LocationData["weather"]) => {
  if (!weatherData) return '☀️'
  const main = weatherData.weather[0].main.toLowerCase()
  const hour = new Date().getHours()
  const isNightTime = hour < 6 || hour > 18

  switch (main) {
    case 'clear':
      return isNightTime ? <WiNightClear size={32} /> : <WiDaySunny size={32} />
    case 'clouds':
      return isNightTime ? <WiNightCloudy size={32} /> : <WiDayCloudy size={32} />
    case 'rain':
      return <WiRain size={32} />
    case 'snow':
      return <WiSnow size={32} />
    case 'thunderstorm':
      return <WiThunderstorm size={32} />
    case 'fog':
    case 'mist':
      return <WiFog size={32} />
    default:
      return isNightTime ? <WiNightCloudy size={32} /> : <WiDayCloudy size={32} />
  }
}

const formatTime = (time: string | null, is24HourFormat: boolean) => {
  if (!time) return "--:--"
  if (!is24HourFormat) return time
  // Convert "hh:mm AM/PM" to 24hr
  const [timePart, period] = time.split(" ")
  if (!period) return timePart // already 24hr
  let [h, m] = timePart.split(":").map(Number)
  if (period.toLowerCase() === "pm" && h < 12) h += 12
  if (period.toLowerCase() === "am" && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

const formatLocation = (location: string) => {
  // Split by comma and capitalize each word
  return location.split(',')
    .map(part => part.trim())
    .map(part => part.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' '))
    .join(', ')
}



export function DualLocationDisplay({ firstLocation, secondLocation, currentLocation, query, is24HourFormat }: DualLocationDisplayProps) {
  const [bestMeetingTime, setBestMeetingTime] = useState<MeetingTimeResponse | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLocationsLoaded, setIsLocationsLoaded] = useState(false)
  const [meetingDate, setMeetingDate] = useState<string>("")

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


  // Reset states when locations change
  useEffect(() => {
    setBestMeetingTime(null)
    setError(null)
    setIsLocationsLoaded(false)
  }, [firstLocation, secondLocation])

  // Check if locations are loaded
  useEffect(() => {
    if (firstLocation.timezone && secondLocation.timezone) {
      setIsLocationsLoaded(true)
    }
  }, [firstLocation.timezone, secondLocation.timezone])

  useEffect(() => {
    const calculateMeetingTime = async () => {
      if (!isLocationsLoaded) {
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
            locations: [
              { timezone: firstLocation.timezone, location: firstLocation.location },
              { timezone: secondLocation.timezone, location: secondLocation.location }
            ],
            query
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to calculate meeting time')
        }

        setBestMeetingTime(data)
        // Set meeting date if we found a valid time
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
        console.error('Error calculating best meeting time:', error)
        setError(error instanceof Error ? error.message : "Failed to calculate meeting time")
        setBestMeetingTime(null)
      } finally {
        setIsCalculating(false)
      }
    }

    calculateMeetingTime()
  }, [firstLocation, secondLocation, query, isLocationsLoaded])

  const renderLocationSection = (location: LocationData, isFirst: boolean) => {
    // Get the appropriate time for this location
    let displayTime = location.searchedTime || "--:--"
    if (bestMeetingTime?.localTimes) {
      const locationTime = bestMeetingTime.localTimes[location.location]
      if (locationTime) {
        displayTime = formatTime(locationTime, is24HourFormat)
      }
    }

    const [timePart, period] = (displayTime || "").split(" ")
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: location.timezone
    })



    return (
      <motion.div
        initial={{ opacity: 0, y: isFirst ? -20 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-1/2 w-full relative overflow-hidden grain bg-white"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-fit mx-auto flex flex-col gap-6">
            {/* Time Display */}
            <div className="text-8xl font-black text-black">
              {bestMeetingTime?.time || "--:--"}
            </div>

            {/* Location, Date and Weather */}
            <div className="flex flex-row justify-between items-center">
              {/* Location and Date */}
              <div className="flex flex-col">
                <div className="text-lg font-semibold text-black/50">
                  {formatLocation(location.location)}
                </div>
                <div className="text-base text-black/50">
                  {currentDate}
                </div>
                {bestMeetingTime?.isOutsideBusinessHours && (
                  <div className="text-sm text-yellow-600 mt-1">
                    Outside business hours (9 AM - 8 PM)
                  </div>
                )}
              </div>

              {/* Weather */}
              {location.weather && (
                <div className="flex flex-col items-end">
                  <div className="text-3xl text-black">
                    {getWeatherIcon(location.weather)}
                  </div>
                  <div className="text-xl text-black">
                    {Math.round(location.weather.main.temp)}°C
                  </div>
                </div>
              )}
            </div>

            {/* Meeting Time Explanation */}
            {bestMeetingTime?.explanation && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-sm text-black/60 cursor-help">
                      <InfoCircledIcon />
                      <span>Why this time?</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[250px] whitespace-pre-wrap">{bestMeetingTime.explanation}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-row h-full w-full relative">
      {/* Main Content Area */}
      <div className="flex flex-col h-full w-full">
        {isCalculating ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
              <span>Calculating best time...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            {/* First Location (Top Half) */}
            {renderLocationSection(firstLocation, true)}

            {/* Divider */}
            <div className="w-full h-[2px] bg-gradient-to-r from-transparent from-0% via-black/10 via-50% to-transparent to-100%" />

            {/* Second Location (Bottom Half) */}
            {renderLocationSection(secondLocation, false)}
          </>
        )}
      </div>

      {/* Meeting Time Display */}
      {currentLocation && (
        <MeetingTimeDisplay
          locations={[
            { timezone: currentLocation.timezone, location: currentLocation.location },
            { timezone: firstLocation.timezone, location: firstLocation.location },
            { timezone: secondLocation.timezone, location: secondLocation.location }
          ]}
          query={query}
          is24HourFormat={is24HourFormat}
        />
      )}
    </div>
  )
} 