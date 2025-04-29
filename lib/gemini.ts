import { GoogleGenerativeAI } from "@google/generative-ai"

// Check if API key is available
if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  console.error('NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables')
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "")

interface TimeQueryResult {
  hasTime: boolean
  time: string | null
  location: string
  currentLocationTime: string | null
  timezone: string
  weather?: any // Add weather property as optional
}

export async function parseTimeQuery(query: string): Promise<TimeQueryResult> {
  try {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      throw new Error('Google API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.')
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `Parse this time query and return a JSON response with the following structure:
    {
      "hasTime": boolean, // whether the query contains a specific time
      "time": string | null, // the time mentioned in the query (in 12-hour format with AM/PM)
      "location": string, // the location mentioned in the query
      "currentLocationTime": string | null, // what time it would be in the user's current location
      "timezone": string // the timezone of the mentioned location (e.g., "Asia/Tokyo")
    }

    Query: "${query}"

    Only return the JSON object, no other text or markdown formatting.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Clean the response text to ensure it's valid JSON
    const cleanedText = text.trim()
      .replace(/```json\s*/, '') // Remove ```json if present
      .replace(/```\s*$/, '')    // Remove trailing ```
      .trim()

    const parsedResult = JSON.parse(cleanedText) as TimeQueryResult

    // Validate the response structure
    if (!parsedResult || typeof parsedResult !== 'object') {
      throw new Error('Invalid response structure')
    }

    // Ensure all required fields are present
    const requiredFields = ['hasTime', 'time', 'location', 'currentLocationTime', 'timezone']
    for (const field of requiredFields) {
      if (!(field in parsedResult)) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    return parsedResult
  } catch (error) {
    console.error('Error parsing time query:', error)
    // Return a default response in case of error
    return {
      hasTime: false,
      time: null,
      location: '',
      currentLocationTime: null,
      timezone: '',
      weather: null
    }
  }
} 