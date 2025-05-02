import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { geminiChatCompletion } from '@/lib/gemini'

// Check if API key is available
if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
  console.error('NEXT_PUBLIC_OPENAI_API_KEY is not set in environment variables')
}

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

// Function to validate timezone
function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone })
    return true
  } catch (e) {
    return false
  }
}

// Function to get a fallback timezone for a location
function getFallbackTimezone(location: string): string {
  const commonTimezones = new Map([
    ['new york', 'America/New_York'],
    ['london', 'Europe/London'],
    ['paris', 'Europe/Paris'],
    ['tokyo', 'Asia/Tokyo'],
    ['singapore', 'Asia/Singapore'],
    ['sydney', 'Australia/Sydney'],
    ['dubai', 'Asia/Dubai'],
    ['hong kong', 'Asia/Hong_Kong'],
    ['los angeles', 'America/Los_Angeles'],
    ['chicago', 'America/Chicago'],
  ])

  const normalizedLocation = location.toLowerCase().trim()
  for (const [key, timezone] of commonTimezones.entries()) {
    if (normalizedLocation.includes(key)) {
      return timezone
    }
  }
  
  return 'UTC' // Default fallback
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    console.log('Received query:', query)

    if (!query) {
      throw new Error('No query provided')
    }

    const prompt = `Given the query "${query}", extract the following information and respond with a valid JSON object:

{
  "hasTime": boolean, // true if a specific time was mentioned
  "time": string | null, // the time mentioned in 12-hour format (e.g., "3:00 PM" or "2pm")
  "location": string, // the first location mentioned
  "timezone": string, // IANA timezone identifier for the first location (e.g., "Asia/Tokyo")
  "date": string | null, // the date if mentioned (e.g., "tomorrow", "28 May", "day after tomorrow", "today")
  "currentLocationTime": string | null, // the current time in the location if no specific time was mentioned
  "secondLocation": string | null, // the second location if mentioned
  "secondTimezone": string | null, // IANA timezone identifier for the second location
  "secondLocationTime": string | null // the current time in the second location
}

Rules:
1. Always use IANA timezone identifiers
2. Format times in 12-hour format with AM/PM
3. If no specific time is mentioned, set hasTime to false and time to null
4. If two locations are mentioned, include both in the response
5. Handle time formats like "2pm", "4am", "3:00 PM", etc.
6. Handle date formats like:
   - Relative dates: "tomorrow", "today", "day after tomorrow"
   - Specific dates: "28 May", "May 28", "28th May"
   - Day names: "next Monday", "this Friday"
7. Respond with ONLY the JSON object, no additional text

Example for "2pm tomorrow in Dubai":
{
  "hasTime": true,
  "time": "2:00 PM",
  "location": "Dubai, UAE",
  "timezone": "Asia/Dubai",
  "date": "tomorrow",
  "currentLocationTime": null,
  "secondLocation": null,
  "secondTimezone": null,
  "secondLocationTime": null
}

Example for "4am on 28 May in Tokyo, Singapore":
{
  "hasTime": true,
  "time": "4:00 AM",
  "location": "Tokyo, Japan",
  "timezone": "Asia/Tokyo",
  "date": "28 May",
  "currentLocationTime": null,
  "secondLocation": "Singapore",
  "secondTimezone": "Asia/Singapore",
  "secondLocationTime": "3:00 AM"
}`

    let response: string | undefined = undefined
    let result: any = undefined
    let usedGemini = false
    try {
      const openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      })
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a timezone expert. Extract location and time information from queries. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
      response = completion.choices[0].message.content ?? undefined
    } catch (openaiError) {
      // Fallback to Gemini if OpenAI fails
      try {
        const geminiRes = await geminiChatCompletion({
          prompt,
          systemPrompt: "You are a timezone expert. Extract location and time information from queries. Always respond with valid JSON.",
          maxTokens: 500,
          temperature: 0.1,
        })
        response = geminiRes.content
        usedGemini = true
      } catch (geminiError) {
        console.error("Both OpenAI and Gemini failed:", openaiError, geminiError)
        throw new Error("Both OpenAI and Gemini failed: " + (geminiError instanceof Error ? geminiError.message : String(geminiError)))
      }
    }

    if (!response) {
      throw new Error(usedGemini ? "No response from Gemini" : "No response from OpenAI")
    }

    try {
      result = JSON.parse(response)
    } catch (parseError) {
      // Try to extract JSON from Gemini's or OpenAI's response if extra text is present
      const match = response.match(/\{[\s\S]*\}/)
      if (match) {
        result = JSON.parse(match[0])
      } else {
        throw new Error("Failed to parse AI response")
      }
    }

    // Validate and fix timezones
    if (result.timezone && !isValidTimezone(result.timezone)) {
      console.warn(`Invalid timezone received: ${result.timezone}`)
      result.timezone = getFallbackTimezone(result.location)
    }

    if (result.secondTimezone && !isValidTimezone(result.secondTimezone)) {
      console.warn(`Invalid second timezone received: ${result.secondTimezone}`)
      result.secondTimezone = getFallbackTimezone((result.secondLocation ?? '') + '')
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in time API route:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      hasTime: false,
      time: null,
      location: "",
      timezone: "",
      date: null,
      currentLocationTime: null,
      secondLocation: null,
      secondTimezone: null,
      secondLocationTime: null
    }, { status: 500 })
  }
} 