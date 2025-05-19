import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTimeOfDayGradient(hour: number): { gradient: string; icon: "sun" | "moon" } {
  // Early morning (6 AM)
  if (hour >= 5 && hour < 10) {
    return {
      gradient:
        "bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-yellow-200 via-orange-300 to-red-400",
      icon: "sun",
    }
  }
  // Daytime (10 AM - 4 PM)
  else if (hour >= 10 && hour < 16) {
    return {
      gradient:
        "bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-sky-300 via-blue-400 to-blue-600",
      icon: "sun",
    }
  }
  // Sunset (5 PM - 7 PM)
  else if (hour >= 16 && hour < 20) {
    return {
      gradient:
        "bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-300 via-rose-400 to-purple-500",
      icon: "sun",
    }
  }
  // Late night (11 PM - 4 AM)
  else if (hour >= 23 || hour < 4) {
    return {
      gradient:
        "bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-900 via-gray-900 to-black",
      icon: "moon",
    }
  }
  // Early night (8 PM - 10 PM)
  else {
    return {
      gradient:
        "bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-700 via-dark-blue-900 to-slate-900",
      icon: "moon",
    }
  }
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function parseTimeString(timeStr: string): Date | null {
  try {
    // Handle formats like "2pm", "14:00", etc.
    const now = new Date()
    const isPM = timeStr.toLowerCase().includes("pm")
    const isAM = timeStr.toLowerCase().includes("am")

    // Remove am/pm and any spaces
    const cleanTime = timeStr
      .toLowerCase()
      .replace(/\s*(am|pm)\s*/i, "")
      .trim()

    // Handle hour-only format (e.g., "2pm")
    if (/^\d{1,2}$/.test(cleanTime)) {
      let hour = Number.parseInt(cleanTime, 10)

      // Adjust for PM
      if (isPM && hour < 12) {
        hour += 12
      }

      // Adjust for 12 AM
      if (isAM && hour === 12) {
        hour = 0
      }

      const result = new Date(now)
      result.setHours(hour, 0, 0, 0)
      return result
    }

    // Handle hour:minute format (e.g., "2:30pm")
    if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
      const [hourStr, minuteStr] = cleanTime.split(":")
      let hour = Number.parseInt(hourStr, 10)
      const minute = Number.parseInt(minuteStr, 10)

      // Adjust for PM
      if (isPM && hour < 12) {
        hour += 12
      }

      // Adjust for 12 AM
      if (isAM && hour === 12) {
        hour = 0
      }

      const result = new Date(now)
      result.setHours(hour, minute, 0, 0)
      return result
    }

    return null
  } catch (error) {
    console.error("Error parsing time string:", error)
    return null
  }
}

export const formatLocation = (location: string) => {
  return location.split(',')
    .map(part => part.trim())
    .map(part => part.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' '))
    .join(', ')
}
