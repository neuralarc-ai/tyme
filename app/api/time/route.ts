import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Check if API key is available
if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
  console.error('NEXT_PUBLIC_OPENAI_API_KEY is not set in environment variables')
}

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

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

    const response = completion.choices[0].message.content
    if (!response) {
      throw new Error("No response from OpenAI")
    }

    const result = JSON.parse(response)
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