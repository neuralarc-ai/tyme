"use client"

import { useEffect, useState } from "react"

interface ClockProps {
  time: Date | null
  size: "small" | "medium" | "large"
}

export default function Clock({ time, size = "large" }: ClockProps) {
  const [displayTime, setDisplayTime] = useState("00:00:00")

  const sizeClasses = {
    small: "text-2xl",
    medium: "text-4xl",
    large: "text-7xl",
  }

  useEffect(() => {
    if (time) {
      const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      setDisplayTime(formatter.format(time))
    }
  }, [time])

  return (
    <div className="flex flex-col items-center">
      <div className={`font-fustat font-bold text-white text-7xl transition-all duration-300`}>
        {displayTime}
      </div>
    </div>
  )
}
