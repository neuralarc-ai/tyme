import { useEffect, useState } from "react"
import { getTimezoneAbbreviation } from "@/lib/timezone"
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiNightClear, WiDayCloudy, WiNightCloudy } from "react-icons/wi"

interface SearchedLocationDisplayProps {
  timezone: string
  location: string
  weather: any
  searchedTime: string | null
}

const getWeatherIcon = (weatherCode: string, isNight: boolean) => {
  const hour = new Date().getHours()
  const isNightTime = hour < 6 || hour > 18

  switch (weatherCode.toLowerCase()) {
    case 'clear':
      return isNightTime ? <WiNightClear size={48} /> : <WiDaySunny size={48} />
    case 'clouds':
      return isNightTime ? <WiNightCloudy size={48} /> : <WiDayCloudy size={48} />
    case 'rain':
      return <WiRain size={48} />
    case 'snow':
      return <WiSnow size={48} />
    case 'thunderstorm':
      return <WiThunderstorm size={48} />
    case 'fog':
    case 'mist':
      return <WiFog size={48} />
    default:
      return isNightTime ? <WiNightCloudy size={48} /> : <WiDayCloudy size={48} />
  }
}

const getGradientForTime = (time: string) => {
  const [timePart, period] = time.split(' ')
  const [hours, minutes] = timePart.split(':').map(Number)
  const isPM = period?.toLowerCase() === 'pm'
  const timeValue = isPM && hours !== 12 ? hours + 12 : hours

  if (timeValue >= 4 && timeValue < 7) {
    // Sunrise
    return {
      gradient: "radial-gradient(circle at center, #f97316, #ec4899, #f472b6)",
      textColor: "text-white"
    }
  } else if (timeValue >= 7 && timeValue < 12) {
    // Morning
    return {
      gradient: "radial-gradient(circle at center, #38bdf8, #60a5fa, #93c5fd)",
      textColor: "text-black"
    }
  } else if (timeValue >= 12 && timeValue < 16) {
    // Afternoon
    return {
      gradient: "radial-gradient(circle at center, #e0f2fe, #bae6fd, #f8fafc)",
      textColor: "text-black"
    }
  } else if (timeValue >= 16 && timeValue < 19) {
    // Evening
    return {
      gradient: "radial-gradient(circle at center, #fb923c, #f472b6, #ec4899)",
      textColor: "text-white"
    }
  } else {
    // Night
    return {
      gradient: "radial-gradient(circle at center, #1e3a8a, #1e40af, #1d4ed8)",
      textColor: "text-white"
    }
  }
}

const isValidTimezone = (timezone: string): boolean => {
  try {
    new Date().toLocaleString('en-US', { timeZone: timezone })
    return true
  } catch (e) {
    return false
  }
}

const formatTime = (time: string): string => {
  try {
    const [timePart, period] = time.split(' ')
    const [hours, minutes] = timePart.split(':').map(num => parseInt(num, 10))
    
    // Convert to 24-hour format
    let targetHours = hours
    if (period) {
      if (period.toLowerCase() === 'pm' && hours < 12) {
        targetHours += 12
      } else if (period.toLowerCase() === 'am' && hours === 12) {
        targetHours = 0
      }
    }

    // Create a date object for the input time
    const now = new Date()
    const date = new Date(now)
    date.setHours(targetHours, minutes, 0, 0)

    // Format back to 12-hour format
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error('Error formatting time:', error)
    return time
  }
}

export function SearchedLocationDisplay({
  timezone,
  location,
  weather,
  searchedTime
}: SearchedLocationDisplayProps) {
  const [formattedTime, setFormattedTime] = useState<string>("")
  const [date, setDate] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      
      try {
        if (searchedTime) {
          setFormattedTime(formatTime(searchedTime))
        } else if (isValidTimezone(timezone)) {
          setFormattedTime(now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: timezone
          }))
        } else {
          setFormattedTime(now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }))
        }

        if (isValidTimezone(timezone)) {
          setDate(now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: timezone
          }))
        } else {
          setDate(now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }))
        }
      } catch (error) {
        console.error('Error updating time:', error)
        setFormattedTime(now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }))
        setDate(now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }))
      }
    }

    const interval = setInterval(updateTime, 1000)
    updateTime()
    return () => clearInterval(interval)
  }, [timezone, searchedTime])

  const timeInfo = getGradientForTime(formattedTime)

  return (
    <div className="relative w-full h-full">
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: timeInfo.gradient }}
      />
      <div className={`relative z-10 flex flex-col items-center justify-center h-full p-8 ${timeInfo.textColor}`}>
        <div className="flex items-center justify-center gap-8">
          {/* Left side - Time */}
          <div className="flex flex-col items-center">
            <div className="flex items-baseline">
              <h1 className="text-[125px] font-black tracking-tight">
                {formattedTime.split(' ')[0]}
              </h1>
              <span className="text-2xl font-medium ml-2 opacity-70">
                {formattedTime.split(' ')[1]}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className={`h-32 w-px ${timeInfo.textColor === 'text-black' ? 'bg-black/20' : 'bg-white/20'}`} />

          {/* Right side - Weather */}
          {weather && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                {getWeatherIcon(weather.weather[0].main, false)}
                <p className="text-4xl font-medium">{Math.round(weather.main.temp)}°C</p>
              </div>
              <p className="mt-2 text-xl capitalize">
                {weather.weather[0].description}
              </p>
              <div className="mt-2 flex gap-4 text-sm">
                <span>Humidity: {weather.main.humidity}%</span>
                <span>Wind: {Math.round(weather.wind.speed * 3.6)} km/h</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom - Location, Date and Timezone */}
        {location && (
          <div className="mt-8 text-center">
            <p className="text-2xl font-medium opacity-90">
              {location}
            </p>
            <p className="mt-2 text-xl opacity-90">
              {date}
            </p>
            {timezone && (
              <p className="mt-2 text-xl opacity-70">
                {getTimezoneAbbreviation(timezone)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 