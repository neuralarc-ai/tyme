import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { geminiChatCompletion } from '@/lib/gemini'

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
      // Fallback to Gemini if OpenAI key is missing
      return await handleGemini(request)
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

    let response: string | undefined = undefined
    let usedGemini = false
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
      response = completion.choices[0].message.content ?? undefined
    } catch (openaiError) {
      // Fallback to Gemini if OpenAI fails
      try {
        const geminiRes = await geminiChatCompletion({
          prompt,
          systemPrompt: "You are a timezone and scheduling expert. Find optimal meeting times considering business hours and timezone differences.",
          maxTokens: 1000,
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

    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(response)
    } catch (parseError) {
      // Try to extract JSON from Gemini's or OpenAI's response if extra text is present
      const match = response.match(/\{[\s\S]*\}/)
      if (match) {
        parsedResponse = JSON.parse(match[0])
      } else {
        throw new Error("Failed to parse AI response")
      }
    }

        // Validate the response format
        if (!parsedResponse.time || !parsedResponse.timezone || !parsedResponse.localTimes) {
          throw new Error("Invalid response format from AI")
        }

        // If we have a business hours time in the response, prioritize that
        if (parsedResponse.businessHoursTime) {
          return NextResponse.json({
        time: parsedResponse.businessHoursTime.time || '',
        timezone: parsedResponse.businessHoursTime.timezone || '',
            localTimes: parsedResponse.businessHoursTime.localTimes,
            explanation: "This time works within business hours (9 AM - 8 PM) for all locations.",
            isOutsideBusinessHours: false,
            alternateTime: {
          time: parsedResponse.time || '',
          timezone: parsedResponse.timezone || '',
              localTimes: parsedResponse.localTimes,
          explanation: parsedResponse.explanation || '',
              isOutsideBusinessHours: true
            }
          })
        }

        // Otherwise, return the suggested time with appropriate flags
        return NextResponse.json({
      time: parsedResponse.time || '',
      timezone: parsedResponse.timezone || '',
          localTimes: parsedResponse.localTimes,
      explanation: parsedResponse.explanation || '',
          isOutsideBusinessHours: parsedResponse.isOutsideBusinessHours
        })
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

// Gemini fallback handler
async function handleGemini(request: Request) {
  try {
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
    let preferredTime = null
    if (query) {
      const timeMatch = query.match(/(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/);
      if (timeMatch) {
        preferredTime = timeMatch[1];
      }
    }
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
        throw new Error(`Invalid timezone: ${loc.timezone}`)
      }
    })
    const prompt = `Given these locations and their current times:\n${times.map(t => `${t.location} (${t.timezone}): ${t.time}`).join('\n')}\n\nFind TWO suitable meeting times:\n1. A time that works within business hours (9 AM - 8 PM) for all locations\n2. If no business hours time is found, suggest any suitable time that works for all locations\n\nConsider:\n- Business hours are 9 AM to 8 PM in each location's local time\n- Prefer times that are convenient for all participants\n- Account for timezone differences\n${preferredTime ? `- Consider the preferred time: ${preferredTime}` : ''}\n\nRespond with a JSON object in this format:\n{\n  "time": "string", // The suggested meeting time (e.g., "10:00 AM")\n  "timezone": "string", // The timezone for the suggested time\n  "localTimes": {}, // Object with local times for each location\n  "explanation": "string", // Explanation of why this time was chosen\n  "isOutsideBusinessHours": boolean, // Whether the suggested time is outside business hours for any location\n  "businessHoursTime": { // Optional, only if a business hours time is found when suggesting outside hours\n    "time": "string",\n    "timezone": "string",\n    "localTimes": {}\n  }\n}`
    const geminiRes = await geminiChatCompletion({
      prompt,
      systemPrompt: "You are a timezone and scheduling expert. Find optimal meeting times considering business hours and timezone differences.",
      maxTokens: 1000,
      temperature: 0.1,
    })
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(geminiRes.content)
    } catch (parseError) {
      const match = geminiRes.content.match(/\{[\s\S]*\}/)
      if (match) {
        parsedResponse = JSON.parse(match[0])
      } else {
        throw new Error("Failed to parse Gemini response")
      }
    }
    if (!parsedResponse.time || !parsedResponse.timezone || !parsedResponse.localTimes) {
      throw new Error("Invalid response format from Gemini")
    }
    if (parsedResponse.businessHoursTime) {
      return NextResponse.json({
        time: parsedResponse.businessHoursTime.time || '',
        timezone: parsedResponse.businessHoursTime.timezone || '',
        localTimes: parsedResponse.businessHoursTime.localTimes,
        explanation: "This time works within business hours (9 AM - 8 PM) for all locations.",
        isOutsideBusinessHours: false,
        alternateTime: {
          time: parsedResponse.time || '',
          timezone: parsedResponse.timezone || '',
          localTimes: parsedResponse.localTimes,
          explanation: parsedResponse.explanation || '',
          isOutsideBusinessHours: true
        }
      })
    }
    return NextResponse.json({
      time: parsedResponse.time || '',
      timezone: parsedResponse.timezone || '',
      localTimes: parsedResponse.localTimes,
      explanation: parsedResponse.explanation || '',
      isOutsideBusinessHours: parsedResponse.isOutsideBusinessHours
    })
  } catch (error) {
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