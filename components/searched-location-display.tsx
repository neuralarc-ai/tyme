import { useEffect, useState } from "react"
import { formatInTimeZone } from "date-fns-tz"
import { WiDaySunny, WiNightClear, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog } from "react-icons/wi"

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
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {weather && (
              <>
                <span className="text-4xl font-light text-black">
                  {getWeatherIcon(weather.weather[0].main, isNight)}
                </span>
                <span className="text-4xl font-light text-black">
                  {Math.round(weather.main.temp)}°C
                </span>
                <span className="text-lg font-light text-black/50">
                  {weather.weather[0].description}
                </span>
              </>
            )}
          </div>

          <div className="text-[220px] font-black tracking-tight text-black mb-4">
            {time}
            <span className="text-2xl font-medium ml-2 opacity-70">{period}</span>
          </div>

          <div className="text-xl font-light text-black/50 mb-2">
            {location}
          </div>

          <div className="h-px w-32 bg-black/20 my-4 mx-auto" />

          <div className="text-lg font-light text-black/50">
            {displayDate}
          </div>
        </div>
      </div>
    </div>
  )
} 