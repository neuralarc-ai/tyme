"use client"

import { useState, useEffect } from "react"

interface Location {
  lat: number
  lon: number
  city?: string
  country?: string
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getLocation = async () => {
      try {
        // Use browser's geolocation API
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords

              // In a real app, we would use a reverse geocoding API to get city and country
              // For demo purposes, we'll just use the coordinates
              setLocation({
                lat: latitude,
                lon: longitude,
              })
              setIsLoading(false)
            },
            (err) => {
              console.error("Geolocation error:", err)
              setError("Unable to retrieve your location. Using default location.")

              // Set default location (New York)
              setLocation({
                lat: 40.7128,
                lon: -74.006,
                city: "New York",
                country: "US",
              })
              setIsLoading(false)
            },
          )
        } else {
          setError("Geolocation is not supported by your browser. Using default location.")

          // Set default location (New York)
          setLocation({
            lat: 40.7128,
            lon: -74.006,
            city: "New York",
            country: "US",
          })
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Error getting location:", err)
        setError("An error occurred while getting your location. Using default location.")

        // Set default location (New York)
        setLocation({
          lat: 40.7128,
          lon: -74.006,
          city: "New York",
          country: "US",
        })
        setIsLoading(false)
      }
    }

    getLocation()
  }, [])

  return { location, error, isLoading }
}
