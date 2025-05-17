import { NextResponse } from 'next/server'

// Function to check if a time is within business hours (9 AM - 8 PM)
function isWithinBusinessHours(time: string): boolean {
  try {
    if (!time || typeof time !== 'string') return false
    
    const [timePart, period] = time.split(' ')
    if (!timePart || !period) return false
    
    const [hours, minutes] = timePart.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return false
    
    // Convert to 24-hour format
    let hour24 = hours
    const periodLower = period.toLowerCase()
    if (periodLower === 'pm' && hours !== 12) {
      hour24 += 12
    } else if (periodLower === 'am' && hours === 12) {
      hour24 = 0
    }

    return hour24 >= 9 && hour24 <= 20 // 9 AM to 8 PM
  } catch (error) {
    console.error("Error parsing time:", error)
    return false
  }
}

// Function to get time difference between timezones
function getTimeDifference(timezone1: string, timezone2: string): number {
  try {
    if (!timezone1 || !timezone2) return 0
    
    const date = new Date()
    
    // Get the time in both timezones
    const time1 = new Date(date.toLocaleString('en-US', { timeZone: timezone1 }))
    const time2 = new Date(date.toLocaleString('en-US', { timeZone: timezone2 }))
    
    // Get the UTC time
    const utcTime = new Date(date.toISOString())
    
    // Calculate the offset in hours for each timezone
    const offset1 = (time1.getTime() - utcTime.getTime()) / (1000 * 60 * 60)
    const offset2 = (time2.getTime() - utcTime.getTime()) / (1000 * 60 * 60)
    
    // Return the difference between the offsets
    return offset2 - offset1
  } catch (error) {
    console.error("Error calculating time difference:", error)
    return 0
  }
}

// Function to convert time to 24-hour format with minutes
function to24Hour(time: string): number {
  try {
    if (!time || typeof time !== 'string') return 0
    
    const [timePart, period] = time.split(' ')
    if (!timePart || !period) return 0
    
    const [hours, minutes] = timePart.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return 0
    
    let hour24 = hours
    const periodLower = period.toLowerCase()
    if (periodLower === 'pm' && hours !== 12) {
      hour24 += 12
    } else if (periodLower === 'am' && hours === 12) {
      hour24 = 0
    }
    
    // Include minutes in the decimal representation
    return hour24 + (minutes / 60)
  } catch (error) {
    console.error("Error converting time to 24-hour format:", error)
    return 0
  }
}

// Function to convert 24-hour format to 12-hour format with minutes
function to12Hour(hour24: number): string {
  try {
    if (isNaN(hour24) || hour24 < 0 || hour24 >= 24) {
      return "12:00 AM"
    }
    
    const hours = Math.floor(hour24)
    const minutes = Math.round((hour24 - hours) * 60)
    
    const period = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 || 12
    
    // Format minutes with leading zero if needed
    const minutesStr = minutes.toString().padStart(2, '0')
    
    return `${hour12}:${minutesStr} ${period}`
  } catch (error) {
    console.error("Error converting time to 12-hour format:", error)
    return "12:00 AM"
  }
}

// Function to find suitable meeting times
function findSuitableTimes(locations: { timezone: string, location: string }[], preferredTime?: string | null) {
  const now = new Date()
  const times = locations.map(loc => {
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: loc.timezone
    })
    // Use timezone as the location name for display
    return { time, timezone: loc.timezone, location: loc.timezone }
  })

  // Get time differences between all locations
  const timeDiffs = locations.map((loc1, i) => 
    locations.map((loc2, j) => ({
      from: loc1.timezone,
      to: loc2.timezone,
      diff: getTimeDifference(loc1.timezone, loc2.timezone)
    }))
  )

  // Find overlapping business hours (now using decimal hours)
  const businessHours = Array.from({ length: 24 * 2 }, (_, i) => i / 2) // Half-hour intervals
  const suitableHours = businessHours.filter(hour => {
    return locations.every((loc, i) => {
      const localHour = (hour + timeDiffs[0][i].diff + 24) % 24
      return localHour >= 9 && localHour <= 20
    })
  })

  // If we have a preferred time, try to use it
  let suggestedTime = null
  if (preferredTime) {
    const preferredHour = to24Hour(preferredTime)
    // Find the closest suitable hour to the preferred time
    const closestHour = suitableHours.reduce((prev, curr) => {
      return Math.abs(curr - preferredHour) < Math.abs(prev - preferredHour) ? curr : prev
    })
    if (closestHour !== undefined) {
      suggestedTime = to12Hour(Math.round(closestHour))
    }
  }

  // If no preferred time or preferred time not suitable, use first suitable hour
  if (!suggestedTime && suitableHours.length > 0) {
    suggestedTime = to12Hour(Math.round(suitableHours[0]))
  }

  // If no suitable business hours, find any overlapping time
  if (!suggestedTime) {
    const anySuitableHour = businessHours.find(hour => {
      return locations.every((loc, i) => {
        const localHour = (hour + timeDiffs[0][i].diff + 24) % 24
        return localHour >= 0 && localHour <= 23
      })
    })
    if (anySuitableHour !== undefined) {
      suggestedTime = to12Hour(Math.round(anySuitableHour))
    }
  }

  // Calculate local times for each location
  const localTimes: { [key: string]: string } = {}
  if (suggestedTime) {
    const baseHour = to24Hour(suggestedTime)
    locations.forEach((loc, i) => {
      const localHour = (baseHour + timeDiffs[0][i].diff + 24) % 24
      // Use timezone as the key instead of location
      localTimes[loc.timezone] = to12Hour(localHour)
    })
  }

  return {
    time: suggestedTime || "No suitable time found",
    timezone: locations[0].timezone,
    localTimes,
    explanation: suggestedTime 
      ? "This time was chosen to accommodate all participants' time zones."
      : "No suitable time found that works for all participants.",
    isOutsideBusinessHours: suggestedTime ? !isWithinBusinessHours(suggestedTime) : false
  }
}

export async function POST(request: Request) {
  try {
    const { locations, query } = await request.json()

    // Validate input
    if (!locations || !Array.isArray(locations) || locations.length < 2) {
      return NextResponse.json(
        { 
          error: "Invalid input: At least two locations are required",
          time: null,
          timezone: null,
          explanation: "Please provide at least two valid locations"
        },
        { status: 400 }
      )
    }

    // Validate each location has required fields
    for (const loc of locations) {
      if (!loc.timezone || !loc.location) {
        return NextResponse.json(
          {
            error: "Invalid location data",
            time: null,
            timezone: null,
            explanation: "Each location must have a timezone and location name"
          },
          { status: 400 }
        )
      }
    }

    // Extract time from query if present
    let preferredTime = null
    if (query) {
      const timeMatch = query.match(/(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/);
      if (timeMatch) {
        preferredTime = timeMatch[1];
      }
    }

    // Find suitable meeting times
    const result = findSuitableTimes(locations, preferredTime)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in meeting-time API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        time: null,
        timezone: null,
        explanation: error instanceof Error ? error.message : "Failed to calculate meeting time"
      },
      { status: 500 }
    )
  }
} 