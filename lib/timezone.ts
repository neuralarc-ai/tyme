export async function getTimezone(latitude: number, longitude: number) {
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    )

    if (!response.ok) {
      throw new Error("Failed to fetch timezone")
    }

    const data = await response.json()
    
    if (data.status !== "OK") {
      throw new Error(data.errorMessage || "Invalid timezone response")
    }

    // Get city and country through reverse geocoding
    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    )

    if (!geocodeResponse.ok) {
      throw new Error("Failed to fetch location")
    }

    const geocodeData = await geocodeResponse.json()
    
    if (geocodeData.status !== "OK") {
      throw new Error(geocodeData.errorMessage || "Invalid geocode response")
    }

    // Extract city and country from the first result
    const addressComponents = geocodeData.results[0].address_components
    const city = addressComponents.find((component: any) => 
      component.types.includes("locality") || 
      component.types.includes("administrative_area_level_1")
    )?.long_name

    const country = addressComponents.find((component: any) => 
      component.types.includes("country")
    )?.long_name

    // Calculate total offset including DST
    const totalOffset = (data.rawOffset + data.dstOffset) / 3600 // Convert to hours

    return {
      timeZoneId: data.timeZoneId,
      timeZoneName: data.timeZoneName,
      rawOffset: data.rawOffset,
      dstOffset: data.dstOffset,
      totalOffset: totalOffset,
      location: city && country ? `${city}, ${country}` : "Unknown Location"
    }
  } catch (error) {
    console.error("Error getting timezone:", error)
    throw error
  }
}

export function getTimezoneAbbreviation(timezoneId: string): string {
  try {
    // Create date objects for both timezones
    const now = new Date()
    const targetDate = new Date(now.toLocaleString('en-US', { timeZone: timezoneId }))
    
    // Get the timezone offset in hours
    const offset = targetDate.getTimezoneOffset() / 60
    
    // Format the offset with sign
    const sign = offset > 0 ? '-' : '+'
    const absOffset = Math.abs(offset)
    const hours = Math.floor(absOffset)
    const minutes = Math.round((absOffset - hours) * 60)
    
    // Return formatted timezone string
    return `GMT${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  } catch (error) {
    console.error('Error getting timezone abbreviation:', error)
    return timezoneId.split('/').pop() || timezoneId
  }
}

export function convertTimeBetweenTimezones(time: string, fromTimezone: string, toTimezone: string): string {
  try {
    // Parse the input time
    const [timePart, period] = time.split(' ')
    const [hours, minutes] = timePart.split(':').map(num => parseInt(num, 10))
    
    // Convert to 24-hour format
    let targetHours = hours
    if (period) {
      if (period.toLowerCase() === 'pm' && hours < 12) {
        targetHours += 12
      } else if (period.toLowerCase() === 'am' && hours === 12) {
        targetHours = 0
      }
    }

    // Create date objects for both timezones
    const now = new Date()
    const fromDate = new Date(now.toLocaleString('en-US', { timeZone: fromTimezone }))
    const toDate = new Date(now.toLocaleString('en-US', { timeZone: toTimezone }))

    // Get the timezone offsets in hours
    const fromOffset = fromDate.getTimezoneOffset() / 60
    const toOffset = toDate.getTimezoneOffset() / 60

    // Calculate the time difference (inverse the sign because getTimezoneOffset returns negative for positive offsets)
    const timeDiff = toOffset - fromOffset

    // Calculate the converted time
    let convertedHours = targetHours + timeDiff
    if (convertedHours < 0) convertedHours += 24
    if (convertedHours >= 24) convertedHours -= 24

    // Format the time
    return `${String(convertedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  } catch (error) {
    console.error('Error converting time between timezones:', error)
    return '00:00'
  }
} 