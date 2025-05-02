"use client"

import { useState, useEffect } from "react"
import { getGoogleTimezone } from "@/lib/google-timezone"
import { LocationPermission } from "./location-permission"
import { parseTimeQuery } from "@/lib/openai"
import { motion, AnimatePresence } from "framer-motion"
import { CurrentLocationDisplay } from "./current-location-display"
import { SearchedLocationDisplay } from "./searched-location-display"
import { useToast } from "@/components/ui/use-toast"
import { DualLocationDisplay } from "./dual-location-display"

interface WeatherData {
  main: {
    temp: number
  }
  weather: {
    main: string
    description: string
    icon: string
  }[]
}

interface TimeDisplayProps {
  searchQuery?: string
  isLoading?: boolean
  setIsLoading?: (loading: boolean) => void
}

interface SearchResult {
  location: string
  timezone: string
  hasTime: boolean
  time?: string | null
  date?: string | null
  currentLocationTime?: string | null
  secondLocation: string | null
  secondTimezone: string | null
  secondLocationTime?: string | null
  weather?: WeatherData
  secondWeather?: WeatherData
  error?: string
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

const calculateLocalTime = (targetTime: string, targetTimezone: string, currentTimezone: string) => {
  try {
    // Parse the target time
    const [timePart, period] = targetTime.split(' ')
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

    // Create date objects for both timezones
    const now = new Date()
    const targetDate = new Date(now.toLocaleString('en-US', { timeZone: targetTimezone }))
    const currentDate = new Date(now.toLocaleString('en-US', { timeZone: currentTimezone }))

    // Get the timezone offsets in hours
    const targetOffset = targetDate.getTimezoneOffset() / 60
    const currentOffset = currentDate.getTimezoneOffset() / 60

    // Calculate the time difference (inverse the sign because getTimezoneOffset returns negative for positive offsets)
    const timeDiff = currentOffset - targetOffset

    // Calculate the local time
    let localHours = targetHours + timeDiff
    if (localHours < 0) localHours += 24
    if (localHours >= 24) localHours -= 24

    // Format the time
    return `${String(localHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  } catch (error) {
    console.error('Error calculating local time:', error)
    return '00:00'
  }
}

export default function TimeDisplay({ searchQuery, isLoading, setIsLoading }: TimeDisplayProps) {
  const [timezone, setTimezone] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [showPermission, setShowPermission] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [weather, setWeather] = useState<any>(null)
  const { toast } = useToast()

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      if (!response.ok) {
        throw new Error('Weather data fetch failed')
      }
      const data = await response.json()
      setWeather(data)
    } catch (error) {
      console.error('Error fetching weather:', error)
    }
  }

  useEffect(() => {
    // Check if location permission was previously granted
    const locationPermission = localStorage.getItem('locationPermission')
    if (locationPermission === 'granted') {
      setShowPermission(false)
      // Get the saved location data
      const savedLocation = localStorage.getItem('locationData')
      if (savedLocation) {
        const { latitude, longitude } = JSON.parse(savedLocation)
        handleLocationGranted({ coords: { latitude, longitude } } as GeolocationPosition)
      }
    } else if (locationPermission === 'denied') {
      setShowPermission(false)
    }
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const handleSearch = async () => {
        try {
          setIsLoading && setIsLoading(true)
          const result = await parseTimeQuery(searchQuery)
          
          if (result.error || !result.location || !result.timezone) {
            toast({
              variant: "destructive",
              title: "Invalid Query",
              description: "Please ask about time in a specific location. For example: 'What time is it in Tokyo?' or 'Time in New York'",
            })
            setSearchResult(null)
            return
          }

          if (result.hasTime) {
            // Parse the input time
            const [timePart, period] = result.time!.split(' ')
            let [hours, minutes] = timePart.split(':').map(num => parseInt(num, 10))
            
            // Convert to 24-hour format
            if (period?.toLowerCase() === 'pm' && hours < 12) hours += 12
            if (period?.toLowerCase() === 'am' && hours === 12) hours = 0

            // Create date objects for both timezones
            const now = new Date()
            const targetDate = new Date(now.toLocaleString('en-US', { timeZone: result.timezone }))
            const currentDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))

            // Get the timezone offsets in hours
            const targetOffset = targetDate.getTimezoneOffset() / 60
            const currentOffset = currentDate.getTimezoneOffset() / 60

            // Calculate the time difference
            const timeDiff = currentOffset - targetOffset

            // Calculate the local time
            let localHours = hours + timeDiff
            if (localHours < 0) localHours += 24
            if (localHours >= 24) localHours -= 24

            // Format the time
            const displayHours = localHours % 12 || 12
            const displayPeriod = localHours >= 12 ? 'PM' : 'AM'
            const currentLocationTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${displayPeriod}`

            // If there's a second location, calculate its time as well
            let secondLocationTime = null
            if (result.secondLocation && result.secondTimezone) {
              const secondDate = new Date(now.toLocaleString('en-US', { timeZone: result.secondTimezone }))
              const secondOffset = secondDate.getTimezoneOffset() / 60
              const secondTimeDiff = currentOffset - secondOffset
              
              let secondHours = hours + secondTimeDiff
              if (secondHours < 0) secondHours += 24
              if (secondHours >= 24) secondHours -= 24
              
              const secondDisplayHours = secondHours % 12 || 12
              const secondDisplayPeriod = secondHours >= 12 ? 'PM' : 'AM'
              secondLocationTime = `${String(secondDisplayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${secondDisplayPeriod}`
            }

            setSearchResult({
              ...result,
              time: result.time || null,
              date: result.date || null,
              currentLocationTime: currentLocationTime || null,
              secondLocationTime: secondLocationTime || null
            })
          } else {
            // For location-only queries, get current time in that location
            const now = new Date()
            const currentTime = now.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: result.timezone
            })
            
            // If there's a second location, get its current time as well
            let secondLocationTime = null
            if (result.secondLocation && result.secondTimezone) {
              secondLocationTime = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: result.secondTimezone
              })
            }
            
            setSearchResult({
              ...result,
              time: currentTime,
              date: now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: result.timezone
              }),
              currentLocationTime: null,
              secondLocationTime: secondLocationTime
            })
          }

          // Get weather for the searched location and second location in parallel
          const weatherPromises = []
          if (result.location) {
            weatherPromises.push(
              fetch(`https://api.openweathermap.org/data/2.5/weather?q=${result.location}&units=metric&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`)
                .then(res => res.ok ? res.json() : null)
                .then(weatherData => weatherData && setSearchResult(prev => prev ? { ...prev, weather: weatherData } : null))
            )
          }
          if (result.secondLocation) {
            weatherPromises.push(
              fetch(`https://api.openweathermap.org/data/2.5/weather?q=${result.secondLocation}&units=metric&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`)
                .then(res => res.ok ? res.json() : null)
                .then(secondWeatherData => secondWeatherData && setSearchResult(prev => prev ? { ...prev, secondWeather: secondWeatherData } : null))
            )
          }
          await Promise.all(weatherPromises)
        } catch (error) {
          console.error("Error processing search:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please ask about time in a specific location. For example: 'What time is it in Tokyo?' or 'Time in New York'",
          })
          setSearchResult(null)
        } finally {
          setIsLoading && setIsLoading(false)
        }
      }
      handleSearch()
    }
  }, [searchQuery, timezone, toast])

  const handleLocationGranted = async (position: GeolocationPosition) => {
    try {
      setIsLoading && setIsLoading(true)
      const { latitude, longitude } = position.coords
      
      // Save location permission and data
      localStorage.setItem('locationPermission', 'granted')
      localStorage.setItem('locationData', JSON.stringify({ latitude, longitude }))
      
      // Get timezone using Google Timezone API
      const timezoneData = await getGoogleTimezone(latitude, longitude)
      setTimezone(timezoneData.timeZoneId)
      
      // Get location name using reverse geocoding
      const locationResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      )
      
      if (locationResponse.ok) {
        const locationData = await locationResponse.json()
        if (locationData.results && locationData.results[0]) {
          setLocation(locationData.results[0].formatted_address)
        }
      }

      setShowPermission(false)
      setError("")

      // Fetch weather data
      await fetchWeather(latitude, longitude)
    } catch (error) {
      console.error("Error getting location data:", error)
      setError("Error getting location information")
    } finally {
      setIsLoading && setIsLoading(false)
    }
  }

  const handleLocationDenied = () => {
    // Save the denied permission
    localStorage.setItem('locationPermission', 'denied')
    setShowPermission(false)
    setError("Location access denied. Using local time.")
  }

  return (
    <div className="relative w-full h-full overflow-hidden grain bg-white">
      {showPermission && (
        <LocationPermission 
          onLocationGranted={handleLocationGranted} 
          onLocationDenied={handleLocationDenied}
        />
      )}

      <div className="flex h-full">
        <AnimatePresence mode="wait">
          {!searchResult ? (
            <motion.div
              key="single-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full relative"
            >
              <CurrentLocationDisplay
                timezone={timezone}
                location={location}
                weather={weather}
                searchedTime={null}
                searchedTimezone={null}
                date={null}
              />
            </motion.div>
          ) : (
            <>
              <motion.div
                key="current-location"
                initial={{ width: "100%", opacity: 0 }}
                animate={{ width: "50%", opacity: 1 }}
                exit={{ width: "0%", opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <CurrentLocationDisplay
                  timezone={timezone}
                  location={location}
                  weather={weather}
                  searchedTime={searchResult.currentLocationTime || null}
                  searchedTimezone={searchResult.timezone}
                  date={searchResult.date || null}
                />
              </motion.div>

              <div className="w-[2px] h-full bg-gradient-to-b from-transparent from-10% via-black/10 to-transparent to-90%" />

              <motion.div
                key="search-result"
                initial={{ width: "0%", opacity: 0 }}
                animate={{ width: "50%", opacity: 1 }}
                exit={{ width: "0%", opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                {searchResult.secondLocation ? (
                  <DualLocationDisplay
                    firstLocation={{
                      timezone: searchResult.timezone,
                      location: searchResult.location,
                      weather: searchResult.weather,
                      searchedTime: searchResult.time || ""
                    }}
                    secondLocation={{
                      timezone: searchResult.secondTimezone || "",
                      location: searchResult.secondLocation,
                      weather: searchResult.secondWeather,
                      searchedTime: searchResult.secondLocationTime || searchResult.time || ""
                    }}
                    currentLocation={{
                      timezone: timezone,
                      location: location,
                      weather: weather
                    }}
                    query={searchQuery}
                  />
                ) : (
                  <SearchedLocationDisplay
                    timezone={searchResult.timezone}
                    location={searchResult.location}
                    weather={searchResult.weather}
                    searchedTime={searchResult.time || ""}
                    date={searchResult.date || null}
                  />
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 