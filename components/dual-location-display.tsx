import { motion } from "framer-motion"
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiNightClear, WiDayCloudy, WiNightCloudy } from "react-icons/wi"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { MeetingTimeDisplay } from "./meeting-time-display"

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

export function DualLocationDisplay({ firstLocation, secondLocation, currentLocation, query, is24HourFormat }: DualLocationDisplayProps) {
  const firstTime = formatTime(firstLocation.searchedTime || null, is24HourFormat)
  const secondTime = formatTime(secondLocation.searchedTime || null, is24HourFormat)

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
    <div className="flex flex-row h-full w-full relative">
      {/* Main Content Area */}
      <div className="flex flex-col h-full w-full">
        {/* First Location (Top Half) */}
        {renderLocationSection(firstLocation, firstTime, true)}

        {/* Divider */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent from-0% via-black/10 via-50% to-transparent to-100%" />

        {/* Second Location (Bottom Half) */}
        {renderLocationSection(secondLocation, secondTime, false)}
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