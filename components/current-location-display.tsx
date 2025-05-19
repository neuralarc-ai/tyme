"use client"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiNightClear, WiDayCloudy, WiNightCloudy } from "react-icons/wi"
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { motion } from "framer-motion"
import { getWeatherIcon } from "../lib/weather-icons"
import { formatLocation } from "../lib/utils"

interface CurrentLocationDisplayProps {
  timezone: string
  location: string
  weather: any
  searchedTime: string | null
  searchedTimezone: string | null
  date: string | null
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
  searchedTimezone,
  date
}: CurrentLocationDisplayProps) {
  const [time, setTime] = useState<string>("")
  const [displayDate, setDisplayDate] = useState<string>("")
  const isInitialMount = useRef(true)
  const lastUpdateRef = useRef<number>(0)

  // Memoize the time update function
  const updateTime = useCallback(() => {
    const now = Date.now()
    // Only update if more than 900ms have passed (to avoid unnecessary updates)
    if (now - lastUpdateRef.current < 900) return
    lastUpdateRef.current = now

    try {
      if (searchedTime) {
        setTime(searchedTime)
      } else if (timezone) {
        setTime(new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: timezone
        }))
      } else {
        setTime(new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }))
      }

      setDisplayDate(formatDate(date, timezone))
    } catch (error) {
      console.error('Error updating time:', error)
      setTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }))
      setDisplayDate(formatDate(null, timezone))
    }
  }, [timezone, searchedTime, date])

  useEffect(() => {
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [updateTime])

  // Memoize expensive calculations
  const timeInfo = useMemo(() => getGradientForTime(time), [time])
  const formattedLocation = useMemo(() => formatLocation(location), [location])
  const [timePart, period] = useMemo(() => time.split(" "), [time])

  // Memoize the weather icon
  const weatherIcon = useMemo(() => 
    weather ? getWeatherIcon(weather.weather[0].main, false) : null
  , [weather])

  // Memoize the temperature
  const temperature = useMemo(() => 
    weather ? `${Math.round(weather.main.temp)}°C` : null
  , [weather])

  return (
    <div className="grain w-full h-full bg-white">
      <motion.div 
        initial={isInitialMount.current ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
          delay: isInitialMount.current ? 0.2 : 0
        }}
        onAnimationComplete={() => {
          isInitialMount.current = false
        }}
        className="relative z-10 flex flex-col items-center justify-center h-full p-8"
      >
        <motion.div 
          initial={isInitialMount.current ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: isInitialMount.current ? 0.3 : 0
          }}
          className="text-center"
        >
          <motion.div 
            initial={isInitialMount.current ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
              delay: isInitialMount.current ? 0.5 : 0
            }}
            className="2xl:text-[220px] lg:text-8xl text-5xl font-black text-black mb-4"
          >
            {timePart}
            <span className="text-3xl lg:text-5xl font-bold ml-2">{period}</span>
          </motion.div>

          <div className="flex justify-between items-center w-full max-w-2xl mx-auto">
            <motion.div 
              initial={isInitialMount.current ? { opacity: 0, x: -20 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                delay: isInitialMount.current ? 0.6 : 0
              }}
              className="text-left"
            >
              <div className="text-xl lg:text-lg font-semibold text-black/50 mb-2">
                {formattedLocation}
              </div>
              <div className="text-lg lg:text-base text-black/50">
                {displayDate}
              </div>
            </motion.div>

            {weather && (
              <motion.div 
                initial={isInitialMount.current ? { opacity: 0, x: 20 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: isInitialMount.current ? 0.7 : 0
                }}
                className="flex items-center gap-2"
              >
                <span className="text-4xl lg:text-3xl font-light text-black">
                  {weatherIcon}
                </span>
                <span className="text-4xl lg:text-3xl font-light text-black">
                  {temperature}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
} 