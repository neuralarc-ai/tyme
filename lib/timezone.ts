interface TimezoneData {
  timeZoneId: string
  timeZoneName: string
}

interface LocationData {
  address: string
}

interface FullLocationInfo {
  timeZoneId: string
  timeZoneName: string
  address: string
}

export async function getFullLocationInfo(latitude: number, longitude: number): Promise<FullLocationInfo> {
  const timestamp = Math.floor(Date.now() / 1000)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured')
  }

  // Fetch timezone
  const timezoneResponse = await fetch(
    `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=${apiKey}`
  )

  if (!timezoneResponse.ok) {
    throw new Error('Failed to fetch timezone data')
  }

  const timezoneData = await timezoneResponse.json()

  if (timezoneData.status !== 'OK') {
    throw new Error(`Timezone API error: ${timezoneData.status}`)
  }

  // Fetch location (reverse geocoding)
  const locationResponse = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
  )

  if (!locationResponse.ok) {
    throw new Error('Failed to fetch location data')
  }

  const locationData = await locationResponse.json()

  if (locationData.status !== 'OK') {
    throw new Error(`Geocoding API error: ${locationData.status}`)
  }

  return {
    timeZoneId: timezoneData.timeZoneId,
    timeZoneName: timezoneData.timeZoneName,
    address: locationData.results[0]?.formatted_address || 'Unknown location'
  }
}

export function getTimezoneAbbreviation(timezoneId: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneId,
      timeZoneName: 'short'
    })
    const parts = formatter.formatToParts(new Date())
    const tzPart = parts.find(part => part.type === 'timeZoneName')
    return tzPart?.value || timezoneId.split('/').pop() || timezoneId
  } catch (error) {
    console.error('Error getting timezone abbreviation:', error)
    return timezoneId.split('/').pop() || timezoneId
  }
}

export function convertTimeBetweenTimezones(time: string, fromTimezone: string, toTimezone: string): string {
  try {
    const [timePart, period] = time.split(' ')
    let [hours, minutes] = timePart.split(':').map(num => parseInt(num, 10))

    // Convert to 24-hour format
    if (period?.toLowerCase() === 'pm' && hours < 12) hours += 12
    if (period?.toLowerCase() === 'am' && hours === 12) hours = 0

    // Create date objects with the specified time
    const now = new Date()
    const [year, month, day] = [now.getFullYear(), now.getMonth(), now.getDate()]
    const fromDate = new Date(Date.UTC(year, month, day, hours, minutes))

    // Format the time in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: toTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    return formatter.format(fromDate)
  } catch (error) {
    console.error('Error converting time between timezones:', error)
    return time
  }
} 