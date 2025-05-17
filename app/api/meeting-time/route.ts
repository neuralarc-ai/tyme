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

// Function to convert time to 24-hour format
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
    
    return hour24
  } catch (error) {
    console.error("Error converting time to 24-hour format:", error)
    return 0
  }
}

// Function to convert 24-hour format to 12-hour format
function to12Hour(hour24: number): string {
  try {
    if (isNaN(hour24) || hour24 < 0 || hour24 > 23) {
      return "12:00 AM"
    }
    const period = hour24 >= 12 ? 'PM' : 'AM'
    const hour12 = hour24 % 12 || 12
    return `${hour12}:00 ${period}`
  } catch (error) {
    console.error("Error converting time to 12-hour format:", error)
    return "12:00 AM"
  }
}

// Function to get time difference between timezones
function getTimeDifference(timezone1: string, timezone2: string): number {
  try {
    if (!timezone1 || !timezone2) return 0
    
    const date = new Date()
    const time1 = date.toLocaleTimeString('en-US', { timeZone: timezone1, hour12: false })
    const time2 = date.toLocaleTimeString('en-US', { timeZone: timezone2, hour12: false })
    
    const [hours1] = time1.split(':').map(Number)
    const [hours2] = time2.split(':').map(Number)
    
    if (isNaN(hours1) || isNaN(hours2)) return 0
    
    return (hours2 - hours1 + 24) % 24
  } catch (error) {
    console.error("Error calculating time difference:", error)
    return 0
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
    return { time, timezone: loc.timezone, location: loc.location }
  })

  // Get time differences between all locations
  const timeDiffs = locations.map((loc1, i) => 
    locations.map((loc2, j) => ({
      from: loc1.timezone,
      to: loc2.timezone,
      diff: getTimeDifference(loc1.timezone, loc2.timezone)
    }))
  )

  // Find overlapping business hours
  const businessHours = Array.from({ length: 24 }, (_, i) => i)
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
    if (suitableHours.includes(preferredHour)) {
      suggestedTime = preferredTime
    }
  }

  // If no preferred time or preferred time not suitable, use first suitable hour
  if (!suggestedTime && suitableHours.length > 0) {
    suggestedTime = to12Hour(suitableHours[0])
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
      suggestedTime = to12Hour(anySuitableHour)
    }
  }

  // Calculate local times for each location
  const localTimes: { [key: string]: string } = {}
  if (suggestedTime) {
    const baseHour = to24Hour(suggestedTime)
    locations.forEach((loc, i) => {
      const localHour = (baseHour + timeDiffs[0][i].diff + 24) % 24
      localTimes[loc.location] = to12Hour(localHour)
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