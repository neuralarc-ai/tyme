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
  "time": string | null, // the time mentioned in 12-hour format (e.g., "3:00 PM")
  "location": string, // the location mentioned
  "timezone": string, // IANA timezone identifier (e.g., "Asia/Tokyo")
  "date": string | null, // the date if mentioned, otherwise null
  "currentLocationTime": string | null // the current time in the location if no specific time was mentioned
}

Rules:
1. Always use IANA timezone identifiers
2. Format times in 12-hour format with AM/PM
3. If no specific time is mentioned, set hasTime to false and time to null
4. Respond with ONLY the JSON object, no additional text

Example for "3 PM in Tokyo":
{
  "hasTime": true,
  "time": "3:00 PM",
  "location": "Tokyo, Japan",
  "timezone": "Asia/Tokyo",
  "date": null,
  "currentLocationTime": null
}

Example for "current time in London":
{
  "hasTime": false,
  "time": null,
  "location": "London, UK",
  "timezone": "Europe/London",
  "date": null,
  "currentLocationTime": "2:30 PM"
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
      currentLocationTime: null
    }, { status: 500 })
  }
} 