import { useState, useEffect } from "react"
import { getTimezone } from "@/lib/timezone"
import { getGoogleTimezone } from "@/lib/google-timezone"
import { LocationPermission } from "./location-permission"
import { parseTimeQuery } from "@/lib/openai"
import { motion, AnimatePresence } from "framer-motion"
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiNightClear, WiDayCloudy, WiNightCloudy } from "react-icons/wi"
import { CurrentLocationDisplay } from "./current-location-display"
import { SearchedLocationDisplay } from "./searched-location-display"

interface TimeDisplayProps {
  searchQuery?: string
}

interface SearchResult {
  hasTime: boolean
  time: string | null
  location: string
  timezone: string
  weather?: any
  date?: string | null
  currentLocationTime?: string | null
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

const getGradientForTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  const timeValue = hours + minutes / 60

  if (timeValue >= 4 && timeValue < 7) {
    // Sunrise: Orange to Pink
    return {
      gradient: "radial-gradient(circle at center, #f97316, #ec4899, #f472b6)",
      textColor: "text-white"
    }
  } else if (timeValue >= 7 && timeValue < 12) {
    // Morning: Light Blue
    return {
      gradient: "radial-gradient(circle at center, #38bdf8, #60a5fa, #93c5fd)",
      textColor: "text-black"
    }
  } else if (timeValue >= 12 && timeValue < 16) {
    // Afternoon: Sky Blue + Off White
    return {
      gradient: "radial-gradient(circle at center, #e0f2fe, #bae6fd, #f8fafc)",
      textColor: "text-black"
    }
  } else if (timeValue >= 16 && timeValue < 19) {
    // Evening: Orange + Pink
    return {
      gradient: "radial-gradient(circle at center, #fb923c, #f472b6, #ec4899)",
      textColor: "text-white"
    }
  } else {
    // Night: Dark Blue
    return {
      gradient: "radial-gradient(circle at center, #1e3a8a, #1e40af, #1d4ed8)",
      textColor: "text-white"
    }
  }
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

export function TimeDisplay({ searchQuery }: TimeDisplayProps) {
  const [timezone, setTimezone] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [showPermission, setShowPermission] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [weather, setWeather] = useState<any>(null)

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
          setIsLoading(true)
          const result = await parseTimeQuery(searchQuery)
          
          if (result.hasTime && result.time && result.timezone) {
            setSearchResult({
              ...result,
              time: result.time,
              date: result.date || null,
              currentLocationTime: result.currentLocationTime || null
            })
          } else {
            setSearchResult(result)
          }

          // Get weather for the searched location
          if (result.location) {
            const weatherResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?q=${result.location}&units=metric&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
            )
            if (weatherResponse.ok) {
              const weatherData = await weatherResponse.json()
              setSearchResult(prev => prev ? { ...prev, weather: weatherData } : null)
            }
          }
        } catch (error) {
          console.error("Error processing search:", error)
          setError("Error processing search query")
        } finally {
          setIsLoading(false)
        }
      }
      handleSearch()
    }
  }, [searchQuery])

  const handleLocationGranted = async (position: GeolocationPosition) => {
    try {
      setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const handleLocationDenied = () => {
    // Save the denied permission
    localStorage.setItem('locationPermission', 'denied')
    setShowPermission(false)
    setError("Location access denied. Using local time.")
  }

  return (
    <div className="relative w-full h-full overflow-hidden grain">
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
                  searchedTime={searchResult.time || null}
                  searchedTimezone={searchResult.timezone}
                />
              </motion.div>

              <motion.div
                key="search-result"
                initial={{ width: "0%", opacity: 0 }}
                animate={{ width: "50%", opacity: 1 }}
                exit={{ width: "0%", opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <SearchedLocationDisplay
                  timezone={searchResult.timezone}
                  location={searchResult.location}
                  weather={searchResult.weather}
                  searchedTime={searchResult.time || ""}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 