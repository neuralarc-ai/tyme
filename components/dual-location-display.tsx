import { motion } from "framer-motion"
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiNightClear, WiDayCloudy, WiNightCloudy } from "react-icons/wi"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import OpenAI from "openai"

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
}

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
  if (!time) return "00:00"
  
  try {
    // Handle different time formats
    let hours = 0
    let minutes = 0
    
    if (time.includes(':')) {
      // Handle "HH:MM" or "HH:MM AM/PM" format
      const [timePart, period] = time.split(' ')
      const [h, m] = timePart.split(':').map(num => parseInt(num, 10))
      
      if (!isNaN(h) && !isNaN(m)) {
        hours = h
        minutes = m
        
        // Convert to 24-hour format if period is specified
        if (period) {
          if (period.toLowerCase() === 'pm' && hours < 12) {
            hours += 12
          } else if (period.toLowerCase() === 'am' && hours === 12) {
            hours = 0
          }
        }
      }
    } else if (time.includes('am') || time.includes('pm')) {
      // Handle "2pm" format
      const period = time.toLowerCase().includes('pm') ? 'pm' : 'am'
      const num = parseInt(time.replace(/[^0-9]/g, ''), 10)
      
      if (!isNaN(num)) {
        hours = num
        if (period === 'pm' && hours < 12) {
          hours += 12
        } else if (period === 'am' && hours === 12) {
          hours = 0
        }
      }
    }

    if (is24HourFormat) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    } else {
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`
    }
  } catch (error) {
    console.error('Error formatting time:', error)
    return "00:00"
  }
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

const calculateBestMeetingTime = async (locations: LocationData[]) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    })

    // Get current time in each timezone
    const now = new Date()
    const times = locations.map(loc => {
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: loc.timezone
      })
      return { time, timezone: loc.timezone, location: loc.location }
    })

    // Create a prompt for OpenAI
    const prompt = `Given the following locations and their current times:
${times.map(t => `${t.location}: ${t.time} (${t.timezone})`).join('\n')}

Find the best meeting time considering:
1. The first location (${times[0].location}) is the most important
2. Business hours are 9 AM to 5 PM
3. Try to find a time that works for all locations
4. If no perfect time exists, prioritize the first location's business hours
5. Consider timezone differences and working hours
6. Provide a brief explanation of why this time was chosen

Respond with ONLY a JSON object in this format:
{
  "time": "HH:MM AM/PM",
  "timezone": "timezone identifier",
  "explanation": "brief explanation of why this time was chosen"
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a timezone expert. Find the best meeting time across multiple timezones, prioritizing the first location's business hours."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    })

    const response = completion.choices[0].message.content
    if (!response) {
      throw new Error("No response from OpenAI")
    }

    return JSON.parse(response)
  } catch (error) {
    console.error("Error calculating best meeting time:", error)
    // Fallback to simple calculation
    const now = new Date()
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: locations[0].timezone
    })
    return {
      time,
      timezone: locations[0].timezone,
      explanation: "Using current time as fallback"
    }
  }
}

export function DualLocationDisplay({ firstLocation, secondLocation, currentLocation }: DualLocationDisplayProps) {
  const is24HourFormat = false
  const firstTime = formatTime(firstLocation.searchedTime || null, is24HourFormat)
  const secondTime = formatTime(secondLocation.searchedTime || null, is24HourFormat)
  const [showMeetingTime, setShowMeetingTime] = useState(false)
  const [bestMeetingTime, setBestMeetingTime] = useState<{ time: string; timezone: string; explanation: string } | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const handleShowMeetingTime = async () => {
    if (currentLocation) {
      setIsCalculating(true)
      try {
        const locations = [currentLocation, firstLocation, secondLocation]
        const bestTime = await calculateBestMeetingTime(locations)
        setBestMeetingTime(bestTime)
        setShowMeetingTime(true)
      } catch (error) {
        console.error("Error getting meeting time:", error)
      } finally {
        setIsCalculating(false)
      }
    }
  }

  const renderLocationSection = (location: LocationData, time: string, isFirst: boolean) => {
    const [timePart, period] = time.split(" ")
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
              {timePart}
              <span className="text-xl font-bold ml-2">{period}</span>
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
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* First Location (Top Half) */}
      {renderLocationSection(firstLocation, firstTime, true)}

      {/* Divider */}
      <div className="w-full h-px bg-black/10" />

      {/* Second Location (Bottom Half) */}
      {renderLocationSection(secondLocation, secondTime, false)}

      {/* Meeting Time Button */}
      {currentLocation && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50">
          <Button
            variant="outline"
            className="bg-white hover:bg-gray-50 border border-black/10 shadow-sm relative min-w-[200px]"
            onClick={handleShowMeetingTime}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                <span>Calculating...</span>
              </div>
            ) : showMeetingTime && bestMeetingTime ? (
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <span>Best Meeting Time:</span>
                  <span className="font-semibold">{bestMeetingTime.time}</span>
                  <span className="text-black/50">({bestMeetingTime.timezone})</span>
                </div>
                <div className="text-xs text-black/50">{bestMeetingTime.explanation}</div>
              </div>
            ) : (
              "Find Best Meeting Time"
            )}
          </Button>
        </div>
      )}
    </div>
  )
} 