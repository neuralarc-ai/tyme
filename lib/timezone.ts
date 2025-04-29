export async function getTimezone(latitude: number, longitude: number) {
  const timestamp = Math.floor(Date.now() / 1000)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    throw new Error("Google Maps API key is not configured")
  }

  // Get timezone information
  const timezoneResponse = await fetch(
    `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=${apiKey}`
  )

  if (!timezoneResponse.ok) {
    throw new Error("Failed to fetch timezone data")
  }

  const timezoneData = await timezoneResponse.json()
  console.log('Timezone data from API:', timezoneData) // Debug log

  // Get city information using reverse geocoding
  const geocodeResponse = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
  )

  if (!geocodeResponse.ok) {
    throw new Error("Failed to fetch location data")
  }

  const geocodeData = await geocodeResponse.json()
  
  // Extract city and country from the geocoding results
  let city = ""
  let country = ""
  
  if (geocodeData.results && geocodeData.results.length > 0) {
    const addressComponents = geocodeData.results[0].address_components
    for (const component of addressComponents) {
      if (component.types.includes("locality")) {
        city = component.long_name
      }
      if (component.types.includes("country")) {
        country = component.long_name
      }
    }
  }

  // Ensure we're using the correct timezone ID for India
  const timeZoneId = timezoneData.timeZoneId === 'Asia/Calcutta' ? 'Asia/Kolkata' : timezoneData.timeZoneId

  return {
    timeZoneId,
    timeZoneName: timezoneData.timeZoneName,
    rawOffset: timezoneData.rawOffset,
    dstOffset: timezoneData.dstOffset,
    location: city && country ? `${city}, ${country}` : "Unknown Location"
  }
}

export function getTimezoneAbbreviation(timezoneId: string): string {
  // Common timezone abbreviations mapping
  const timezoneMap: { [key: string]: string } = {
    'Asia/Kolkata': 'IST',
    'Asia/Calcutta': 'IST', // Alternative name
    'Asia/Colombo': 'IST',  // Sri Lanka also uses IST
    'America/New_York': 'EST',
    'America/Chicago': 'CST',
    'America/Denver': 'MST',
    'America/Los_Angeles': 'PST',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Asia/Tokyo': 'JST',
    'Australia/Sydney': 'AEST',
    'Pacific/Auckland': 'NZST'
  }

  // First check if we have a direct mapping
  if (timezoneMap[timezoneId]) {
    return timezoneMap[timezoneId]
  }

  // If no direct mapping, try to get the timezone name
  try {
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezoneId,
      timeZoneName: 'short'
    }
    
    const formatter = new Intl.DateTimeFormat('en-US', options)
    const parts = formatter.formatToParts(date)
    const timeZonePart = parts.find(part => part.type === 'timeZoneName')
    const timezoneName = timeZonePart?.value || ''

    // Special case for India's timezone
    if (timezoneName.includes('GMT+5:30') || timezoneName.includes('GMT+05:30')) {
      return 'IST'
    }

    return timezoneName || timezoneId
  } catch (error) {
    console.error('Error getting timezone abbreviation:', error)
    return timezoneId
  }
} 