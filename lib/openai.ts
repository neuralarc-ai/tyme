interface TimeQueryResult {
  hasTime: boolean
  time: string | null
  location: string
  timezone: string
  date?: string
  currentLocationTime?: string
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
      const errorText = await response.text()
      console.error('API Error Response:', errorText)
      throw new Error(`Failed to parse time query: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    // Validate required properties
    if (!result.location || !result.timezone) {
      throw new Error('Invalid response format from API: Missing required location or timezone')
    }

    // For time-specific queries, validate time
    if (result.hasTime && !result.time) {
      throw new Error('Invalid response format from API: Time-specific query missing time value')
    }

    return {
      hasTime: result.hasTime || false,
      time: result.time || null,
      location: result.location,
      timezone: result.timezone,
      date: result.date || undefined,
      currentLocationTime: result.currentLocationTime || undefined,
      error: result.error
    }
  } catch (error) {
    console.error("Error in parseTimeQuery:", error)
    return {
      hasTime: false,
      time: null,
      location: "",
      timezone: "",
      date: undefined,
      currentLocationTime: undefined,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 