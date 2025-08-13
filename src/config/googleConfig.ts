export const GOOGLE_CONFIG = {
  // You'll need to replace these with your actual Google API credentials
  // Get them from: https://console.developers.google.com/
  CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '<Your API Credentials>',
  API_KEY: process.env.REACT_APP_GOOGLE_API_KEY || '<Your API key>',
  
  // Discovery doc URL for APIs used by the quickstart
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  
  // Authorization scopes required by the API
  SCOPES: 'https://www.googleapis.com/auth/calendar',
  
  // Default calendar ID (primary calendar)
  CALENDAR_ID: 'primary'
};

export const GOOGLE_CALENDAR_CONFIG = {
  // Calendar-specific settings
  MAX_RESULTS: 100,
  TIME_ZONE: 'America/Boise', // Idaho timezone
  SINGLE_EVENTS: true,
  ORDER_BY: 'startTime'
};
