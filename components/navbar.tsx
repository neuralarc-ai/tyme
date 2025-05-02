"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import Switch from "@/components/ui/switch"
import Image from "next/image"

// Context for time format
export type TimeFormat = "12hr" | "24hr"
interface TimeFormatContextType {
  timeFormat: TimeFormat
  setTimeFormat: (format: TimeFormat) => void
}
const TimeFormatContext = createContext<TimeFormatContextType | undefined>(undefined)

export function useTimeFormat() {
  const ctx = useContext(TimeFormatContext)
  if (!ctx) throw new Error("useTimeFormat must be used within TimeFormatProvider")
  return ctx
}

export function TimeFormatProvider({ children }: { children: ReactNode }) {
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("timeFormat") === "24hr" ? "24hr" : "12hr"
    }
    return "12hr"
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("timeFormat", timeFormat)
    }
  }, [timeFormat])

  return (
    <TimeFormatContext.Provider value={{ timeFormat, setTimeFormat }}>
      {children}
    </TimeFormatContext.Provider>
  )
}

export default function Navbar() {
  return (
    <nav
      className="fixed left-1/2 mt-4 -translate-x-1/2 w-full flex items-center justify-center px-8 py-3
        bg-transparent backdrop-blur-3xl z-50 transition-all duration-300"
    >
      <div className="flex items-center gap-2 select-none">
        <span
          className="font-black text-2xl tracking-tight text-black flex items-center gap-2 cursor-pointer"
          onClick={() => window.dispatchEvent(new Event('reset-time-display'))}
        >
          <Image src="/images/tyme.png" alt="Tyme Logo" width={100} height={100} className="inline h-10 w-10" /> Tyme
        </span>
      </div>
    </nav>
  )
} 