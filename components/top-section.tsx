"use client"

import { useState, useEffect } from "react"
import Clock from "./clock"
import Weather from "./weather"
import { getTimeOfDayGradient } from "@/lib/utils"

interface TopSectionProps {
  currentTime: Date | null
  currentWeather: any
  weatherLoading: boolean
  queryLocation: {
    name: string
    lat: number
    lon: number
    time: Date | null
  } | null
  queryWeather: any
}

export default function TopSection({
  currentTime,
  currentWeather,
  weatherLoading,
  queryLocation,
  queryWeather,
}: TopSectionProps) {
  const [gradient, setGradient] = useState("")
  const [timeIcon, setTimeIcon] = useState<"sun" | "moon">("sun")

  useEffect(() => {
    if (currentTime) {
      const hours = currentTime.getHours()
      const { gradient, icon } = getTimeOfDayGradient(hours)
      setGradient(gradient)
      setTimeIcon(icon)
    }
  }, [currentTime])

  return (
    <div
      className={`h-[50vh] w-full transition-all duration-1000 ease-in-out flex items-center justify-center relative overflow-hidden ${gradient}`}
    >
      <div className="container mx-auto px-4 py-12 z-10 relative">
        <div className={`flex ${queryLocation ? "justify-between" : "justify-center"} items-center gap-8 flex-wrap`}>
          {/* Current Location Time and Weather */}
          <div className={`transition-all duration-500 ease-in-out ${queryLocation ? "w-5/12" : "w-full text-center"}`}>
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-medium text-white/80 mb-2">
                {queryLocation ? "Your Location" : "Current Time"}
              </h2>
              <div className="flex items-center gap-4">
                <Clock time={currentTime} size={queryLocation ? "medium" : "large"} />
                <Weather
                  weather={currentWeather}
                  isLoading={weatherLoading}
                  size={queryLocation ? "medium" : "large"}
                />
              </div>
            </div>
          </div>

          {/* Query Location Time and Weather */}
          {queryLocation && (
            <div className="w-5/12 transition-all duration-500 ease-in-out animate-fadeIn">
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-medium text-white/80 mb-2">{queryLocation.name}</h2>
                <div className="flex items-center gap-4">
                  <Clock time={queryLocation.time} size="medium" />
                  <Weather weather={queryWeather} isLoading={!queryWeather} size="medium" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
