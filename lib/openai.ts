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
    
    // Ensure all required properties are present
    if (!result.hasTime || !result.location || !result.timezone) {
      throw new Error('Invalid response format from API')
    }

    return {
      hasTime: result.hasTime,
      time: result.time,
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