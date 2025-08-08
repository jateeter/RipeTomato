# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar synchronization for the Idaho Events app.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console
3. The Idaho Events app running locally

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Give your project a name (e.g., "Idaho Events Calendar")
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on "Google Calendar API" and click "Enable"

## Step 3: Create Credentials

### Create an API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key and save it securely
4. (Optional) Click "Restrict Key" to limit its usage to Google Calendar API only

### Create OAuth 2.0 Client ID

1. In "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" for user type
   - Fill in required fields (App name, User support email, etc.)
   - Add your email to test users
4. Select "Web application" as the application type
5. Add authorized origins:
   - `http://localhost:3001` (for development)
   - Add your production domain when deploying
6. Click "Create"
7. Copy the Client ID and save it securely

## Step 4: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your credentials:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your-client-id-here
   REACT_APP_GOOGLE_API_KEY=your-api-key-here
   ```

## Step 5: Test the Integration

1. Restart your development server:
   ```bash
   npm start
   ```

2. Open the app in your browser (`http://localhost:3001`)

3. You should see a "Google Calendar Integration" section at the top

4. Click "Connect Google Calendar" to authenticate

5. Grant the necessary permissions when prompted

6. Once connected, click "Sync Now" to fetch events from your Google Calendar

## Features

### What the Integration Does

- **Read Events**: Syncs events from your Google Calendar to the app
- **Event Display**: Shows Google Calendar events alongside local events
- **Sync Status**: Displays connection status and last sync time
- **Auto-sync**: Automatically syncs when changing weeks or signing in
- **Visual Indicators**: Shows sync status icons on events

### Event Sync Status Icons

- 🔄 **Synced**: Event is synchronized with Google Calendar
- ⏳ **Pending**: Event sync is in progress
- ⚠️ **Error**: Event sync failed
- 📱 **Local Only**: Event exists only in the local app

## Troubleshooting

### Common Issues

1. **"Not authorized" error**
   - Make sure you've added the correct authorized origins in Google Cloud Console
   - Verify your Client ID is correct in the `.env` file

2. **API Key errors**
   - Ensure the Google Calendar API is enabled
   - Check that your API key is unrestricted or restricted to Calendar API only

3. **No events showing**
   - Make sure you have events in your Google Calendar for the current week
   - Check that the calendar you're syncing from has events marked as "public" or ensure proper permissions

4. **Authentication popup blocked**
   - Allow popups for your domain in browser settings
   - Try using an incognito/private browsing window

### Development Notes

- The app uses Google Calendar API v3
- Events are fetched for the currently displayed week
- The integration respects Google API rate limits
- All sync operations are performed client-side

## Security Notes

- Never commit your `.env` file to version control
- Keep your API keys and Client ID secure
- Only add trusted domains to authorized origins
- Consider restricting API key usage to specific APIs

## Production Deployment

When deploying to production:

1. Update authorized origins in Google Cloud Console with your production domain
2. Set environment variables in your hosting platform
3. Ensure HTTPS is enabled for Google OAuth to work properly
4. Test the integration thoroughly before going live

For more information, visit the [Google Calendar API documentation](https://developers.google.com/calendar/api).