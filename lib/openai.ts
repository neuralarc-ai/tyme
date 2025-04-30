export interface TimeQueryResult {
  location: string
  timezone: string
  hasTime: boolean
  time?: string | null
  date?: string | null
  currentLocationTime?: string | null
  secondLocation: string | null
  secondTimezone: string | null
  secondLocationTime?: string | null
  error?: string
}

export async function parseTimeQuery(query: string): Promise<TimeQueryResult> {
  try {
    const response = await fetch('/api/time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      throw new Error('Failed to parse time query')
    }

    const data = await response.json()
    
    // Validate required properties
    if (!data.location || !data.timezone) {
      throw new Error('Invalid response format from API: Missing required properties')
    }

    // Return the validated data with fallback values
    return {
      hasTime: data.hasTime ?? false,
      time: data.time ?? null,
      date: data.date ?? null,
      location: data.location,
      timezone: data.timezone,
      secondLocation: data.secondLocation || null,
      secondTimezone: data.secondTimezone || null,
      secondLocationTime: data.secondLocationTime || null,
    }
  } catch (error) {
    console.error('Error parsing time query:', error)
    return {
      hasTime: false,
      time: null,
      date: null,
      location: '',
      timezone: '',
      secondLocation: null,
      secondTimezone: null,
      secondLocationTime: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 