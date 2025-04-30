import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { locations } = await request.json()

    // Get current time in each timezone
    const now = new Date()
    const times = locations.map((loc: { timezone: string; location: string }) => {
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: loc.timezone
      })
      return { time, timezone: loc.timezone, location: loc.location }
    })

    // Create a prompt for OpenAI
    const prompt = `Given the following locations and their current times:
${times.map(t => `${t.location}: ${t.time} (${t.timezone})`).join('\n')}

Find the best meeting time considering:
1. The first location (${times[0].location}) is the most important
2. Business hours are 9 AM to 5 PM
3. Try to find a time that works for all locations
4. If no perfect time exists, prioritize the first location's business hours
5. Consider timezone differences and working hours
6. Provide a brief explanation of why this time was chosen

Respond with ONLY a JSON object in this format:
{
  "time": "HH:MM AM/PM",
  "timezone": "timezone identifier",
  "explanation": "brief explanation of why this time was chosen"
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a timezone expert. Find the best meeting time across multiple timezones, prioritizing the first location's business hours."
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

    return NextResponse.json(JSON.parse(response))
  } catch (error) {
    console.error("Error calculating best meeting time:", error)
    return NextResponse.json({ error: "Failed to calculate meeting time" }, { status: 500 })
  }
} 