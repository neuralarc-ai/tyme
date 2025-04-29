import { useEffect, useState } from "react"
import { getTimezoneAbbreviation } from "@/lib/timezone"
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiNightClear, WiDayCloudy, WiNightCloudy } from "react-icons/wi"
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

interface CurrentLocationDisplayProps {
  timezone: string
  location: string
  weather: any
  searchedTime: string | null
  searchedTimezone: string | null
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

const formatLocation = (location: string): string => {
  try {
    // Split by comma and clean up parts
    const parts = location.split(',').map(part => part.trim())
    
    // If we have at least two parts
    if (parts.length >= 2) {
      // Check if the first part is a number (postal code)
      if (!isNaN(Number(parts[0]))) {
        // If it's a postal code, take the next part as city and last part as country
        const city = parts[1]
        const country = parts[parts.length - 1]
        return `${city}, ${country}`
      }
      
      // Check if the last part is a country name (common countries)
      const commonCountries = ['India', 'Japan', 'USA', 'UK', 'China', 'Germany', 'France', 'Italy', 'Spain', 'Canada', 'Australia']
      const lastPart = parts[parts.length - 1].toLowerCase()
      
      if (commonCountries.some(country => lastPart.includes(country.toLowerCase()))) {
        // If last part is a country, format as "City, Country"
        return `${parts[0]}, ${parts[parts.length - 1]}`
      } else {
        // If first part is a country, format as "Country, City"
        return `${parts[parts.length - 1]}, ${parts[0]}`
      }
    }
    
    // If we only have one part, return it as is
    return parts[0]
  } catch (error) {
    console.error('Error formatting location:', error)
    return location
  }
}

const convertTimeBetweenTimezones = (time: string, fromTimezone: string, toTimezone: string): string => {
  try {
    // Parse the input time
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

    // Get the timezone offsets
    const fromOffset = new Date().toLocaleString('en-US', { timeZone: fromTimezone, timeZoneName: 'longOffset' }).split(' ').pop() || ''
    const toOffset = new Date().toLocaleString('en-US', { timeZone: toTimezone, timeZoneName: 'longOffset' }).split(' ').pop() || ''

    // Calculate the time difference in hours
    const fromHours = parseInt(fromOffset.replace('GMT', '').split(':')[0])
    const toHours = parseInt(toOffset.replace('GMT', '').split(':')[0])
    const timeDiff = toHours - fromHours

    // Adjust the time based on the timezone difference
    date.setHours(date.getHours() + timeDiff)

    // Format the time in 12-hour format
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: toTimezone
    })
  } catch (error) {
    console.error('Error converting time:', error)
    return time
  }
}

export function CurrentLocationDisplay({
  timezone,
  location,
  weather,
  searchedTime,
  searchedTimezone
}: CurrentLocationDisplayProps) {
  const [time, setTime] = useState<string>("")
  const [date, setDate] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      
      try {
        if (searchedTime && searchedTimezone && timezone) {
          // Convert the searched time to the current timezone
          const convertedTime = convertTimeBetweenTimezones(searchedTime, searchedTimezone, timezone)
          setTime(convertedTime)
        } else if (timezone) {
          setTime(now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: timezone
          }))
        } else {
          setTime(now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }))
        }

        // Update date
        if (timezone) {
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
        setTime(now.toLocaleTimeString('en-US', {
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
  }, [timezone, searchedTime, searchedTimezone])

  const timeInfo = getGradientForTime(time)
  const formattedLocation = formatLocation(location)

  return (
    <div className="grain w-full h-full bg-black">
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {weather && (
              <>
                <span className="text-4xl font-light text-white">
                  {getWeatherIcon(weather.weather[0].main, false)}
                </span>
                <span className="text-4xl font-light text-white">
                  {Math.round(weather.main.temp)}°C
                </span>
              </>
            )}
          </div>

          <div className="text-[220px] font-black tracking-tight text-white mb-4">
            {time}
          </div>

          <div className="text-xl font-light text-white/50 mb-2">
            {formattedLocation}
          </div>

          <div className="h-px w-32 bg-white/20 my-4 mx-auto" />

          <div className="text-lg font-light text-white/50">
            {date}
          </div>
        </div>
      </div>
    </div>
  )
} 