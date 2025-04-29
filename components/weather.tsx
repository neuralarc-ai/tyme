"use client"

import { Cloud, CloudRain, Sun, Loader2 } from "lucide-react"

interface WeatherProps {
  weather: any
  isLoading: boolean
  size: "small" | "medium" | "large"
}

export default function Weather({ weather, isLoading, size = "large" }: WeatherProps) {
  const sizeClasses = {
    small: {
      icon: "h-6 w-6",
      text: "text-lg",
    },
    medium: {
      icon: "h-8 w-8",
      text: "text-xl",
    },
    large: {
      icon: "h-10 w-10",
      text: "text-2xl",
    },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className={`${sizeClasses[size].icon} text-white animate-spin`} />
      </div>
    )
  }

  if (!weather) {
    return null
  }

  // Get weather icon based on condition
  const getWeatherIcon = () => {
    if (!weather.weather || !weather.weather[0]) {
      return <Sun className={`${sizeClasses[size].icon} text-yellow-300`} />
    }

    const condition = weather.weather[0].main.toLowerCase()

    if (condition.includes("rain") || condition.includes("drizzle")) {
      return <CloudRain className={`${sizeClasses[size].icon} text-blue-300`} />
    } else if (condition.includes("cloud")) {
      return <Cloud className={`${sizeClasses[size].icon} text-gray-300`} />
    } else {
      return <Sun className={`${sizeClasses[size].icon} text-yellow-300`} />
    }
  }

  // Get temperature
  const getTemperature = () => {
    if (weather.main && typeof weather.main.temp !== "undefined") {
      return `${Math.round(weather.main.temp)}°C`
    }
    return ""
  }

  return (
    <div className="flex items-center gap-2">
      {getWeatherIcon()}
      <span className={`${sizeClasses[size].text} text-white font-medium`}>{getTemperature()}</span>
    </div>
  )
}
