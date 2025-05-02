import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { google } from 'googleapis'

interface EmailRequest {
  senderName: string
  senderEmail: string
  recipientEmails: string
  meetingLink: string
  description: string
  meetingTime: string
  meetingDate: string
  timezone: string
}

// Helper to generate a Google Meet link
async function generateGoogleMeetLink({
  clientId,
  clientSecret,
  refreshToken,
  calendarId = 'primary',
  summary = 'Tyme Meeting',
  description = '',
  startTime = new Date(Date.now() + 5 * 60 * 1000),
  endTime = new Date(Date.now() + 35 * 60 * 1000),
  timeZone = 'UTC',
  attendees = [],
}: {
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  calendarId?: string,
  summary?: string,
  description?: string,
  startTime?: Date,
  endTime?: Date,
  timeZone?: string,
  attendees?: string[],
}) {
  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret)
  oAuth2Client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
  const event = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary,
      description,
      start: { dateTime: startTime.toISOString(), timeZone },
      end: { dateTime: endTime.toISOString(), timeZone },
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(2),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      attendees: attendees.map(email => ({ email })),
    },
    sendUpdates: 'all',
  })
  const meetLink = event.data.conferenceData?.entryPoints?.find(
    (ep) => ep.entryPointType === 'video'
  )?.uri
  return { meetLink, eventId: event.data.id }
}

export async function POST(request: Request) {
  try {
    // Check email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email configuration missing')
      return NextResponse.json(
        {
          error: "Configuration error",
          message: "Email configuration is incomplete. Please check your environment variables."
        },
        { status: 500 }
      )
    }

    // Check Google API configuration
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN || !process.env.GOOGLE_CALENDAR_EMAIL) {
      return NextResponse.json({
        error: 'Google API configuration missing',
        message: 'Google API credentials are missing. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and GOOGLE_CALENDAR_EMAIL in your environment.'
      }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const {
      senderName,
      senderEmail,
      recipientEmails,
      description,
      meetingTime,
      meetingDate,
      timezone,
      onlyGenerateMeetLink
    }: EmailRequest & { onlyGenerateMeetLink?: boolean } = await request.json()

    // Split recipient emails into an array
    const recipients = recipientEmails.split(",").map(email => email.trim())
    // Add senderEmail to recipients if not already present
    if (senderEmail && !recipients.includes(senderEmail)) {
      recipients.push(senderEmail)
    }

    // Generate Google Meet link
    let meetLink = ''
    try {
      // Use meetingDate and meetingTime to set event time if possible
      let startTime = new Date()
      let endTime = new Date()
      if (meetingDate && meetingTime) {
        // Try to parse date and time
        const dateStr = meetingDate.replace(/\s*\(.+\)/, '') // Remove day of week if present
        const [datePart, monthPart, yearPart] = dateStr.split(' ')
        const dateObj = new Date(`${dateStr} ${meetingTime}`)
        if (!isNaN(dateObj.getTime())) {
          startTime = dateObj
          endTime = new Date(dateObj.getTime() + 30 * 60 * 1000)
        }
      }
      const meetResult = await generateGoogleMeetLink({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
        calendarId: process.env.GOOGLE_CALENDAR_EMAIL!,
        summary: description || 'Tyme Meeting',
        description,
        startTime,
        endTime,
        timeZone: timezone || 'UTC',
        attendees: recipients,
      })
      meetLink = meetResult.meetLink || ''
    } catch (err) {
      console.error('Failed to generate Google Meet link:', err)
      return NextResponse.json({ error: 'Failed to generate Google Meet link' }, { status: 500 })
    }

    if (onlyGenerateMeetLink) {
      return NextResponse.json({ meetLink })
    }

    try {
      // Send email using Nodemailer
      await transporter.sendMail({
        from: `Tyme <${process.env.EMAIL_USER}>`,
        to: recipients.join(", "),
        subject: `Meeting Invitation: ${meetingDate} at ${meetingTime} ${timezone}`,
        text: `${senderName} has invited you for a meeting on ${meetingDate} at ${meetingTime} ${timezone}.

Meeting Link: ${meetLink}

Meeting Details:
${description}

Participants:
${recipients.join("\n")}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Meeting Invitation</h2>
            <p><strong>${senderName}</strong> has invited you for a meeting.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Date:</strong> ${meetingDate}</p>
              <p><strong>Time:</strong> ${meetingTime} ${timezone}</p>
              <p><strong>Meeting Link:</strong> <a href="${meetLink}" style="color: #0066cc;">${meetLink}</a></p>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #444;">Meeting Details:</h3>
              <p style="white-space: pre-wrap;">${description}</p>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #444;">Participants:</h3>
              <ul style="list-style: none; padding: 0;">
                ${recipients.map(email => `
                  <li style="margin: 5px 0;">${email}</li>
                `).join("")}
              </ul>
            </div>

            <div style="margin-top: 30px; font-size: 12px; color: #666;">
              <p>This invitation was sent using <a href="https://tyme.neuralarc.ai" style="color: #0066cc; text-decoration: underline;" target="_blank" rel="noopener noreferrer">Tyme</a>.</p>
            </div>
          </div>
        `
      })
    } catch (error) {
      console.error('Error sending email:', error)
      return NextResponse.json(
        {
          error: 'Email sending error',
          message: 'An error occurred while sending the email. Please try again later.'
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Email sent successfully'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while processing the request. Please try again later.'
      },
      { status: 500 }
    )
  }
}
