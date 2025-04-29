"use client"

import { useState, useEffect } from "react"

export function useWeather(lat?: number, lon?: number) {
  const [weather, setWeather] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchWeather = async () => {
      if (!lat || !lon) {
        setIsLoading(false)
        return
      }

      try {
        // In a real app, you would use your actual API key
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "demo_key"

        // For demo purposes, if no API key is provided, use mock data
        if (apiKey === "demo_key") {
          // Mock weather data
          const mockWeather = {
            weather: [
              {
                main: "Clear",
                description: "clear sky",
                icon: "01d",
              },
            ],
            main: {
              temp: 22,
              feels_like: 21,
              humidity: 65,
            },
            wind: {
              speed: 3.5,
            },
            name: "Your Location",
          }

          setTimeout(() => {
            setWeather(mockWeather)
            setIsLoading(false)
          }, 500)
          return
        }

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch weather data")
        }

        const data = await response.json()
        setWeather(data)
      } catch (err) {
        console.error("Error fetching weather:", err)
        setError("Failed to fetch weather data")

        // Set mock weather data on error
        const mockWeather = {
          weather: [
            {
              main: "Clear",
              description: "clear sky",
              icon: "01d",
            },
          ],
          main: {
            temp: 22,
            feels_like: 21,
            humidity: 65,
          },
          wind: {
            speed: 3.5,
          },
          name: "Your Location",
        }

        setWeather(mockWeather)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeather()
  }, [lat, lon])

  return { weather, error, isLoading }
}
