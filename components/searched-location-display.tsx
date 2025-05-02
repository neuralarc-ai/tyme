import { useEffect, useState, useRef } from "react"
import { formatInTimeZone } from "date-fns-tz"
import { WiDaySunny, WiNightClear, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog } from "react-icons/wi"
import { motion } from "framer-motion"

interface SearchedLocationDisplayProps {
  timezone: string
  location: string
  weather?: {
    main: {
      temp: number
    }
    weather: Array<{
      main: string
      description: string
    }>
  }
  searchedTime: string
  date: string | null
  is24HourFormat: boolean
}

function getWeatherIcon(code: string, isNight: boolean) {
  switch (code.toLowerCase()) {
    case 'clear':
      return isNight ? <WiNightClear className="w-8 h-8" /> : <WiDaySunny className="w-8 h-8" />
    case 'clouds':
      return <WiCloudy className="w-8 h-8" />
    case 'rain':
      return <WiRain className="w-8 h-8" />
    case 'snow':
      return <WiSnow className="w-8 h-8" />
    case 'thunderstorm':
      return <WiThunderstorm className="w-8 h-8" />
    case 'fog':
    case 'mist':
      return <WiFog className="w-8 h-8" />
    default:
      return <WiDaySunny className="w-8 h-8" />
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

const formatDate = (dateString: string | null, timezone: string) => {
  if (!timezone || !isValidTimezone(timezone)) {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!dateString) {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    })
  }

  const now = new Date()
  const today = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  
  switch (dateString.toLowerCase()) {
    case 'today':
      return today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone
      })
    case 'tomorrow':
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone
      })
    case 'day after tomorrow':
      const dayAfterTomorrow = new Date(today)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
      return dayAfterTomorrow.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone
      })
    default:
      // Handle specific dates like "28 May"
      const [day, month] = dateString.split(' ')
      const year = today.getFullYear()
      const specificDate = new Date(`${month} ${day}, ${year}`)
      if (!isNaN(specificDate.getTime())) {
        return specificDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: timezone
        })
      }
      return today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone
      })
  }
}

export function SearchedLocationDisplay({
  timezone,
  location,
  weather,
  searchedTime,
  date,
  is24HourFormat
}: SearchedLocationDisplayProps) {
  const [time, setTime] = useState<string>("")
  const [displayDate, setDisplayDate] = useState<string>("")
  const isInitialMount = useRef(true)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      try {
        if (searchedTime && timezone) {
          const [timePart, period] = searchedTime.split(' ')
          const [hours, minutes] = timePart.split(':')
          if (is24HourFormat) {
            let h = parseInt(hours, 10)
            if (period && period.toLowerCase() === 'pm' && h < 12) h += 12
            if (period && period.toLowerCase() === 'am' && h === 12) h = 0
            setTime(`${String(h).padStart(2, '0')}:${minutes}`)
          } else {
          setTime(`${hours.padStart(2, '0')}:${minutes} ${period}`)
          }
        } else if (timezone) {
          setTime(now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !is24HourFormat,
            timeZone: timezone
          }))
        } else {
          setTime(now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !is24HourFormat
          }))
        }
        setDisplayDate(formatDate(date, timezone))
      } catch (error) {
        console.error('Error updating time:', error)
        setTime(now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: !is24HourFormat
        }))
        setDisplayDate(formatDate(null, timezone))
      }
    }
    updateTime() // Call immediately for instant display
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [timezone, searchedTime, date, is24HourFormat])

  const isNight = !is24HourFormat && time.toUpperCase().includes("PM") && parseInt(time.split(":")[0]) >= 6

  let timePart = time
  let period = ""
  if (!is24HourFormat && time.includes(" ")) {
    [timePart, period] = time.split(" ")
  }
  return (
    <div className="grain w-full h-full bg-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.2
        }}
        className="relative z-10 flex flex-col items-center justify-center h-full p-8"
      >
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.3
          }}
          className="text-center"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.5
            }}
            className="2xl:text-[220px] lg:text-8xl text-5xl font-black text-black mb-4"
          >
            {timePart}
            {period && (
              <span className="text-2xl lg:text-5xl font-bold ml-2">{period}</span>
            )}
          </motion.div>

          <div className="flex justify-between items-center w-full max-w-2xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.6
              }}
              className="text-left"
            >
              <div className="text-xl lg:text-lg font-semibold text-black/50 mb-2">
                {location}
              </div>
              <div className="text-lg lg:text-base text-black/50">
                {displayDate}
              </div>
            </motion.div>

            {weather && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.7
                }}
                className="flex items-center gap-2"
              >
                <span className="text-4xl lg:text-3xl font-light text-black">
                  {getWeatherIcon(weather.weather[0].main, isNight)}
                </span>
                <span className="text-4xl lg:text-3xl font-light text-black">
                  {Math.round(weather.main.temp)}°C
                </span>
                <span className="text-lg lg:text-base font-light text-black/50">
                  {weather.weather[0].description}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
} 