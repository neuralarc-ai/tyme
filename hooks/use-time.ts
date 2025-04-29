"use client"

import { useState, useEffect } from "react"

export function useTime() {
  const [time, setTime] = useState<Date>(new Date())

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return { time }
}
