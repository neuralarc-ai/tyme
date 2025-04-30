import { useEffect, useState } from "react"
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

export function SearchedLocationDisplay({
  timezone,
  location,
  weather,
  searchedTime
}: SearchedLocationDisplayProps) {
  const [displayDate, setDisplayDate] = useState("")

  useEffect(() => {
    const updateDate = () => {
      try {
        const now = new Date()
        const date = formatInTimeZone(now, timezone, "EEEE, MMMM d, yyyy")
        setDisplayDate(date)
      } catch (error) {
        console.error("Error updating date:", error)
        setDisplayDate("Error")
      }
    }

    updateDate()
    const interval = setInterval(updateDate, 1000)
    return () => clearInterval(interval)
  }, [timezone])

  const [time, period] = searchedTime.split(" ")
  const isNight = period?.toUpperCase() === "PM" && parseInt(time.split(":")[0]) >= 6

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
            {time}
            <span className="text-3xl lg:text-5xl font-bold ml-2">{period}</span>
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