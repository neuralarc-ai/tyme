"use client"

import { motion } from "framer-motion"
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiNightClear, WiDayCloudy, WiNightCloudy } from "react-icons/wi"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useMemo, useCallback } from "react"
import { MeetingTimeDisplay } from "./meeting-time-display"
import { toZonedTime, format as formatTz } from 'date-fns-tz'
import { getWeatherIcon } from "@/lib/weather-icons"
import { formatLocation } from "@/lib/utils"

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

// Move utility functions outside component
const getTimeInTimeZone = (
  referenceTime: string,
  referenceZone: string,
  targetZone: string
) => {
  try {
    const [time, period] = referenceTime.split(' ')
    let [hours, minutes] = time.split(':').map(Number)
    if (period && period.toLowerCase() === 'pm' && hours < 12) hours += 12
    if (period && period.toLowerCase() === 'am' && hours === 12) hours = 0
    const now = new Date()
    const dateInRefZone = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    )
    const dateInTargetZone = toZonedTime(dateInRefZone, targetZone)
    return formatTz(dateInTargetZone, 'hh:mm a', { timeZone: targetZone })
  } catch (e) {
    return referenceTime
  }
}

export function DualLocationDisplay({ firstLocation, secondLocation, currentLocation, query }: DualLocationDisplayProps) {
  const is24HourFormat = false

  // Memoize time calculations
  const times = useMemo(() => {
    // Use firstLocation as the reference for searched time
    const referenceTime = firstLocation.searchedTime || null
    const referenceTimezone = firstLocation.timezone

    // Convert reference time to each location's timezone
    const firstTime = referenceTime && referenceTimezone && firstLocation.timezone
      ? getTimeInTimeZone(formatTime(referenceTime, false), referenceTimezone, firstLocation.timezone)
      : new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: firstLocation.timezone
        });

    const secondTime = referenceTime && referenceTimezone && secondLocation.timezone
      ? getTimeInTimeZone(formatTime(referenceTime, false), referenceTimezone, secondLocation.timezone)
      : new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: secondLocation.timezone
        });

    return { firstTime, secondTime }
  }, [firstLocation, secondLocation])

  // Memoize location section render function
  const renderLocationSection = useCallback((location: LocationData, time: string, isFirst: boolean) => {
    const [timePart, period] = time.split(" ")
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: location.timezone
    })

    // Memoize weather icon and temperature
    const weatherIcon = useMemo(() => 
      location.weather ? getWeatherIcon(location.weather.weather[0].main, false) : null
    , [location.weather])

    const temperature = useMemo(() => 
      location.weather ? `${Math.round(location.weather.main.temp)}°C` : null
    , [location.weather])

    const formattedLocationName = useMemo(() => 
      formatLocation(location.location)
    , [location.location])

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
                  {formattedLocationName}
                </div>
                <div className="text-base text-black/50">
                  {currentDate}
                </div>
              </div>

              {/* Weather */}
              {location.weather && (
                <div className="flex flex-col items-end">
                  <div className="text-3xl text-black">
                    {weatherIcon}
                  </div>
                  <div className="text-xl text-black">
                    {temperature}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }, [])

  // Memoize meeting time display locations
  const meetingLocations = useMemo(() => 
    currentLocation ? [
      { timezone: currentLocation.timezone, location: currentLocation.location },
      { timezone: firstLocation.timezone, location: firstLocation.location },
      { timezone: secondLocation.timezone, location: secondLocation.location }
    ] : []
  , [currentLocation, firstLocation, secondLocation])

  return (
    <div className="flex flex-row h-full w-full relative">
      {/* Main Content Area */}
      <div className="flex flex-col h-full w-full">
        {/* First Location (Top Half) */}
        {renderLocationSection(firstLocation, times.firstTime, true)}

        {/* Divider */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent from-0% via-black/10 via-50% to-transparent to-100%" />

        {/* Second Location (Bottom Half) */}
        {renderLocationSection(secondLocation, times.secondTime, false)}
      </div>
      {/* Meeting Time Display */}
      {currentLocation && (
        <MeetingTimeDisplay
          locations={meetingLocations}
          query={query}
        />
      )}
    </div>
  )
} 