const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = '837161369193-q4kn6oi82t23mbb91lpgol0n8hpffq54.apps.googleusercontent.com'; // <-- Paste your client ID here
const CLIENT_SECRET = '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'; // <-- Paste your client secret here
const REDIRECT_URI = 'http://localhost:3000/api/oauth2callback'; // Or your deployed callback

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('Authorize this app by visiting this url:\n', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nEnter the code from that page here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('\nYour refresh token is:\n');
    console.log(tokens.refresh_token);
    console.log('\nAdd this to your .env as GOOGLE_REFRESH_TOKEN');
    process.exit(0);
  } catch (err) {
    console.error('Error retrieving access token', err);
    process.exit(1);
  }
});