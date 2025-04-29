interface TimezoneData {
  timeZoneId: string
  timeZoneName: string
  rawOffset: number
  dstOffset: number
}

export async function getGoogleTimezone(latitude: number, longitude: number): Promise<TimezoneData> {
  const timestamp = Math.floor(Date.now() / 1000)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured')
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=${apiKey}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch timezone data')
  }

  const data = await response.json()

  if (data.status !== 'OK') {
    throw new Error(`Timezone API error: ${data.status}`)
  }

  return {
    timeZoneId: data.timeZoneId,
    timeZoneName: data.timeZoneName,
    rawOffset: data.rawOffset,
    dstOffset: data.dstOffset
  }
} 