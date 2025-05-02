import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

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
      meetingLink,
      description,
      meetingTime,
      meetingDate,
      timezone
    }: EmailRequest = await request.json()

    // Split recipient emails into an array
    const recipients = recipientEmails.split(",").map(email => email.trim())
    // Add senderEmail to recipients if not already present
    if (senderEmail && !recipients.includes(senderEmail)) {
      recipients.push(senderEmail)
    }

    try {
      // Send email using Nodemailer
      await transporter.sendMail({
        from: `Tyme <${process.env.EMAIL_USER}>`,
        to: recipients.join(", "),
        subject: `Meeting Invitation: ${meetingDate} at ${meetingTime} ${timezone}`,
        text: `${senderName} has invited you for a meeting on ${meetingDate} at ${meetingTime} ${timezone}.

Meeting Link: ${meetingLink}

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
              <p><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #0066cc;">${meetingLink}</a></p>
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
