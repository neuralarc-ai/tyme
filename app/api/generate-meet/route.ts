import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

interface MeetingConfig {
  summary: string
  description: string
  startTime: string
  timezone: string
}

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
})

// Initialize Google Calendar API client with OAuth2
const calendar = google.calendar({
  version: 'v3',
  auth: oauth2Client,
})

export async function POST(request: Request) {
  try {
    // Check Google Calendar OAuth credentials
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.error('Google Calendar OAuth credentials missing')
      return NextResponse.json(
        {
          error: "Configuration error",
          message: "Google Calendar OAuth is not configured. Please check your environment variables."
        },
        { status: 500 }
      )
    }

    // Set credentials using refresh token
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    })

    const config: MeetingConfig = await request.json()

    // Parse the start time
    const startDateTime = new Date(config.startTime)
    
    // Set end time to 1 hour after start time
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)

    // Create calendar event with Google Meet
    const event = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary: config.summary,
        description: config.description,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: config.timezone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: config.timezone,
        },
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    })

    // Get the Google Meet link from the event
    const meetLink = event.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === 'video'
    )?.uri

    if (!meetLink) {
      throw new Error('Failed to generate Google Meet link')
    }

    return NextResponse.json({ meetLink })
  } catch (error) {
    console.error('Error generating Google Meet link:', error)
    return NextResponse.json(
      {
        error: "Failed to generate meeting link",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      },
      { status: 500 }
    )
  }
} 