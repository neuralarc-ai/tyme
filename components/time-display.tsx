import { useState, useEffect } from "react"
import { getTimezone, getTimezoneAbbreviation } from "@/lib/timezone"
import { LocationPermission } from "./location-permission"
import { parseTimeQuery } from "@/lib/gemini"
import { motion, AnimatePresence } from "framer-motion"
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiNightClear, WiDayCloudy, WiNightCloudy } from "react-icons/wi"

interface TimeDisplayProps {
  searchQuery?: string
}

interface SearchResult {
  hasTime: boolean
  time: string | null
  location: string
  currentLocationTime: string | null
  timezone: string
  weather?: any
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
    
    // Calculate the time difference in hours
    const targetOffset = targetDate.getTimezoneOffset()
    const currentOffset = currentDate.getTimezoneOffset()
    const timeDiff = (targetOffset - currentOffset) / 60

    // Calculate the local time
    let localHours = targetHours - timeDiff
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
  const [time, setTime] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [timezone, setTimezone] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [showPermission, setShowPermission] = useState<boolean>(true)
  const [gradient, setGradient] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [is24HourFormat, setIs24HourFormat] = useState<boolean>(false)
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
          
          // Get weather for the searched location
          if (result.location) {
            const weatherResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?q=${result.location}&units=metric&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
            )
            if (weatherResponse.ok) {
              const weatherData = await weatherResponse.json()
              result.weather = weatherData
            }
          }

          setSearchResult(result)
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

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      
      // Calculate gradient based on exact time
      const timeValue = hours + minutes / 60
      
      if (timeValue >= 5 && timeValue < 12) {
        // Morning: Blue to Purple to Pink
        setGradient("radial-gradient(at bottom center, #60a5fa, #8b5cf6, #ec4899)")
      } else if (timeValue >= 12 && timeValue < 17) {
        // Afternoon: Yellow to Orange to Red
        setGradient("radial-gradient(at bottom center, #fbbf24, #f97316, #ef4444)")
      } else if (timeValue >= 17 && timeValue < 20) {
        // Evening: Orange to Red to Purple
        setGradient("radial-gradient(at bottom center, #f97316, #ef4444, #8b5cf6)")
      } else {
        // Night: Dark Blue to Purple to Gray
        setGradient("radial-gradient(at bottom center, #1e40af, #6b21a8, #1f2937)")
      }

      try {
        if (searchResult?.hasTime) {
          // Use the static time from search result
          setTime(searchResult.time || "")
          setDate(now.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: timezone || undefined
          }))
        } else {
          // Use real-time clock
          const timeString = timezone 
            ? now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: !is24HourFormat,
                timeZone: timezone
              })
            : now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: !is24HourFormat
              })
          
          setTime(timeString)
          setDate(now.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: timezone || undefined
          }))
        }
      } catch (err) {
        console.error("Error formatting time:", err)
        setError("Error displaying time")
        // Fallback to local time if timezone is invalid
        setTime(now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: !is24HourFormat
        }))
        setDate(now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }))
      }
    }

    const interval = setInterval(updateTime, 1000)
    updateTime()
    return () => clearInterval(interval)
  }, [timezone, searchResult, is24HourFormat])

  const handleLocationGranted = async (position: GeolocationPosition) => {
    try {
      setIsLoading(true)
      const { latitude, longitude } = position.coords
      
      // Save location permission and data
      localStorage.setItem('locationPermission', 'granted')
      localStorage.setItem('locationData', JSON.stringify({ latitude, longitude }))
      
      const timezoneData = await getTimezone(latitude, longitude)
      setTimezone(timezoneData.timeZoneId)
      setLocation(timezoneData.location)
      setShowPermission(false)
      setError("")

      // Fetch weather data
      await fetchWeather(latitude, longitude)
    } catch (error) {
      console.error("Error getting timezone:", error)
      setError("Error getting timezone information")
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

  const formatTimeForLocation = (time: string, targetTimezone: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    const targetDate = new Date(now)
    targetDate.setHours(hours, minutes, 0)

    return targetDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: !is24HourFormat,
      timeZone: targetTimezone
    })
  }

  return (
    <div className="relative w-full h-full overflow-hidden grain">
      {showPermission && (
        <LocationPermission 
          onLocationGranted={handleLocationGranted} 
          onLocationDenied={handleLocationDenied}
        />
      )}
      
      {/* Time Format Toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <span className="text-sm text-white/70">12h</span>
        <button
          onClick={() => setIs24HourFormat(!is24HourFormat)}
          className="relative w-12 h-6 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <motion.div
            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
            animate={{
              x: is24HourFormat ? 24 : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </button>
        <span className="text-sm text-white/70">24h</span>
      </div>

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
              <div 
                className="absolute inset-0 transition-all duration-1000"
                style={{ background: gradient }}
              />
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-white p-8">
                <div className="flex items-center justify-center gap-8">
                  {/* Left side - Time */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline">
                      <h1 className="text-[125px] font-black tracking-tight">
                        {isLoading ? "Loading..." : time.split(' ')[0] || "00:00:00"}
                      </h1>
                      {!is24HourFormat && (
                        <span className="text-2xl font-medium ml-2 opacity-70">
                          {time.split(' ')[1]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-32 w-px bg-white/20" />

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
                {(() => {
                  const timeInfo = getGradientForTime(
                    calculateLocalTime(
                      searchResult.time || '',
                      searchResult.timezone,
                      timezone
                    )
                  )
                  return (
                    <>
                      <div 
                        className="absolute inset-0 transition-all duration-1000"
                        style={{ background: timeInfo.gradient }}
                      />
                      <div className={`relative z-10 flex flex-col items-center justify-center h-full p-8 ${timeInfo.textColor}`}>
                        <div className="flex items-center justify-center gap-8">
                          {/* Left side - Current Location Time */}
                          <div className="flex flex-col items-center">
                            <div className="flex items-baseline">
                              <h1 className="text-[125px] font-black tracking-tight">
                                {isLoading ? "Loading..." : formatTime(
                                  calculateLocalTime(
                                    searchResult.time || '',
                                    searchResult.timezone,
                                    timezone
                                  ),
                                  is24HourFormat
                                ).split(' ')[0]}
                              </h1>
                              {!is24HourFormat && (
                                <span className="text-2xl font-medium ml-2 opacity-70">
                                  {formatTime(
                                    calculateLocalTime(
                                      searchResult.time || '',
                                      searchResult.timezone,
                                      timezone
                                    ),
                                    is24HourFormat
                                  ).split(' ')[1]}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Divider */}
                          <div className={`h-32 w-px ${timeInfo.textColor === 'text-black' ? 'bg-black/20' : 'bg-white/20'}`} />

                          {/* Right side - Current Location Weather */}
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

                        {/* Bottom - Current Location Info */}
                        {location && (
                          <div className="mt-8 text-center">
                            <p className="text-2xl font-medium opacity-90">
                              {formatLocation(location)}
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
                    </>
                  )
                })()}
              </motion.div>

              <motion.div
                key="search-result"
                initial={{ width: "0%", opacity: 0 }}
                animate={{ width: "50%", opacity: 1 }}
                exit={{ width: "0%", opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                {(() => {
                  const timeInfo = getGradientForTime(searchResult.time || '')
                  return (
                    <>
                      <div 
                        className="absolute inset-0 transition-all duration-1000"
                        style={{ background: timeInfo.gradient }}
                      />
                      <div className={`relative z-10 flex flex-col items-center justify-center h-full p-8 ${timeInfo.textColor}`}>
                        <div className="flex items-center justify-center gap-8">
                          {/* Left side - Searched Location Time */}
                          <div className="flex flex-col items-center">
                            <div className="flex items-baseline">
                              <h1 className="text-[125px] font-black tracking-tight">
                                {formatTime(searchResult.time, is24HourFormat).split(' ')[0]}
                              </h1>
                              {!is24HourFormat && (
                                <span className="text-2xl font-medium ml-2 opacity-70">
                                  {formatTime(searchResult.time, is24HourFormat).split(' ')[1]}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Divider */}
                          <div className={`h-32 w-px ${timeInfo.textColor === 'text-black' ? 'bg-black/20' : 'bg-white/20'}`} />

                          {/* Right side - Searched Location Weather */}
                          {searchResult.weather && (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-2">
                                {getWeatherIcon(searchResult.weather.weather[0].main, false)}
                                <p className="text-4xl font-medium">{Math.round(searchResult.weather.main.temp)}°C</p>
                              </div>
                              <p className="mt-2 text-xl capitalize">
                                {searchResult.weather.weather[0].description}
                              </p>
                              <div className="mt-2 flex gap-4 text-sm">
                                <span>Humidity: {searchResult.weather.main.humidity}%</span>
                                <span>Wind: {Math.round(searchResult.weather.wind.speed * 3.6)} km/h</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom - Searched Location Info */}
                        <div className="mt-8 text-center">
                          <p className="text-2xl font-medium opacity-90">
                            {formatLocation(searchResult.location)}
                          </p>
                          <p className="mt-2 text-xl opacity-90">
                            {date}
                          </p>
                          {searchResult.timezone && (
                            <p className="mt-2 text-xl opacity-70">
                              {getTimezoneAbbreviation(searchResult.timezone)}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 