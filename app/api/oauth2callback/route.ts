import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = process.env.GOOGLE_REDIRECT_URI! || 'http://localhost:3000/oauth2callback'

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  try {
    const { tokens } = await oAuth2Client.getToken(code)
    // Print the refresh token to the server log (for you to copy securely)
    console.log('\nYour refresh token is:\n')
    console.log(tokens.refresh_token)
    console.log('\nAdd this to your .env as GOOGLE_REFRESH_TOKEN')
    return NextResponse.json({
      message: 'Success! Check your server logs for the refresh token.',
      refresh_token: tokens.refresh_token || null,
      note: 'For security, store this in your .env and do not expose it to the frontend.'
    })
  } catch (err) {
    console.error('Error retrieving access token', err)
    return NextResponse.json({ error: 'Failed to get token', details: err }, { status: 500 })
  }
} 