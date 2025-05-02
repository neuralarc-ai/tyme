import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Function to check if a time is within business hours (9 AM - 8 PM)
function isWithinBusinessHours(time: string): boolean {
  try {
    const [timePart, period] = time.split(' ')
    const [hours, minutes] = timePart.split(':').map(Number)
    
    // Convert to 24-hour format
    let hour24 = hours
    if (period.toLowerCase() === 'pm' && hours !== 12) {
      hour24 += 12
    } else if (period.toLowerCase() === 'am' && hours === 12) {
      hour24 = 0
    }

    return hour24 >= 9 && hour24 <= 20 // 9 AM to 8 PM
  } catch (error) {
    console.error("Error parsing time:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    // Check OpenAI API key first
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey) {
      console.error("OpenAI API key is missing")
      return NextResponse.json(
        {
          error: "Configuration error",
          time: null,
          timezone: null,
          explanation: "OpenAI API key is not configured. Please check your environment variables."
        },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    const { locations, query } = await request.json()

    // Validate input
    if (!locations || !Array.isArray(locations) || locations.length < 2) {
      return NextResponse.json(
        { 
          error: "Invalid input: At least two locations are required",
          time: null,
          timezone: null,
          explanation: "Please provide at least two valid locations"
        },
        { status: 400 }
      )
    }

    // Validate each location has required fields
    for (const loc of locations) {
      if (!loc.timezone || !loc.location) {
        return NextResponse.json(
          {
            error: "Invalid location data",
            time: null,
            timezone: null,
            explanation: "Each location must have a timezone and location name"
          },
          { status: 400 }
        )
      }
    }

    // Extract time from query if present
    let preferredTime = null
    if (query) {
      const timeMatch = query.match(/(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/);
      if (timeMatch) {
        preferredTime = timeMatch[1];
      }
    }

    // Get current time in each timezone
    const now = new Date()
    const times = locations.map(loc => {
      try {
        const time = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: loc.timezone
        })
        return { time, timezone: loc.timezone, location: loc.location }
      } catch (error) {
        console.error(`Error formatting time for timezone ${loc.timezone}:`, error)
        throw new Error(`Invalid timezone: ${loc.timezone}`)
      }
    })

    // Create a prompt for finding both business hours and any suitable time
    const prompt = `Given these locations and their current times:
${times.map(t => `${t.location} (${t.timezone}): ${t.time}`).join('\n')}

Find TWO suitable meeting times:
1. A time that works within business hours (9 AM - 8 PM) for all locations
2. If no business hours time is found, suggest any suitable time that works for all locations

Consider:
- Business hours are 9 AM to 8 PM in each location's local time
- Prefer times that are convenient for all participants
- Account for timezone differences
${preferredTime ? `- Consider the preferred time: ${preferredTime}` : ''}

Respond with a JSON object in this format:
{
  "time": "string", // The suggested meeting time (e.g., "10:00 AM")
  "timezone": "string", // The timezone for the suggested time
  "localTimes": {}, // Object with local times for each location
  "explanation": "string", // Explanation of why this time was chosen
  "isOutsideBusinessHours": boolean, // Whether the suggested time is outside business hours for any location
  "businessHoursTime": { // Optional, only if a business hours time is found when suggesting outside hours
    "time": "string",
    "timezone": "string",
    "localTimes": {}
  }
}`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a timezone and scheduling expert. Find optimal meeting times considering business hours and timezone differences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })

      const response = completion.choices[0].message.content
      if (!response) {
        throw new Error("No response from AI")
      }

      try {
        const parsedResponse = JSON.parse(response)

        // Validate the response format
        if (!parsedResponse.time || !parsedResponse.timezone || !parsedResponse.localTimes) {
          throw new Error("Invalid response format from AI")
        }

        // If we have a business hours time in the response, prioritize that
        if (parsedResponse.businessHoursTime) {
          return NextResponse.json({
            time: parsedResponse.businessHoursTime.time,
            timezone: parsedResponse.businessHoursTime.timezone,
            localTimes: parsedResponse.businessHoursTime.localTimes,
            explanation: "This time works within business hours (9 AM - 8 PM) for all locations.",
            isOutsideBusinessHours: false,
            alternateTime: {
              time: parsedResponse.time,
              timezone: parsedResponse.timezone,
              localTimes: parsedResponse.localTimes,
              explanation: parsedResponse.explanation,
              isOutsideBusinessHours: true
            }
          })
        }

        // Otherwise, return the suggested time with appropriate flags
        return NextResponse.json({
          time: parsedResponse.time,
          timezone: parsedResponse.timezone,
          localTimes: parsedResponse.localTimes,
          explanation: parsedResponse.explanation,
          isOutsideBusinessHours: parsedResponse.isOutsideBusinessHours
        })
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError)
        console.error("Raw response:", response)
        throw new Error("Failed to parse AI response")
      }

    } catch (error) {
      console.error("Error in OpenAI API call:", error)
      throw new Error(error instanceof Error ? error.message : "Failed to get AI suggestions")
    }
  } catch (error) {
    console.error("Error in meeting-time API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        time: null,
        timezone: null,
        explanation: error instanceof Error ? error.message : "Failed to calculate meeting time"
      },
      { status: 500 }
    )
  }
} 