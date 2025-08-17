export const SOLID_CONFIG = {
  // Default Solid Pod providers (prioritizing opencommons.net)
  providers: [
    'https://opencommons.net',
    'https://solidcommunity.net',
    'https://inrupt.net',
    'https://solidweb.me',
    'https://pod.inrupt.com'
  ],
  
  // Application identifier
  clientName: 'Community Services - Idaho Events',
  clientId: 'https://community-services.idaho.app',
  
  // Redirect URLs (update for production)
  redirectUrl: typeof window !== 'undefined' ? window.location.origin + '/solid-callback' : 'http://localhost:3000/solid-callback',
  
  // Primary pod provider
  defaultProvider: 'https://opencommons.net',
  
  // OpenCommons.net specific configuration
  openCommonsConfig: {
    issuer: 'https://opencommons.net',
    registrationEndpoint: 'https://opencommons.net/register',
    authEndpoint: 'https://opencommons.net/authorize',
    tokenEndpoint: 'https://opencommons.net/token',
    userInfoEndpoint: 'https://opencommons.net/userinfo',
    jwksUri: 'https://opencommons.net/.well-known/jwks',
    introspectionEndpoint: 'https://opencommons.net/introspect'
  },
  
  // Data organization structure in pods
  dataStructure: {
    // Shelter-specific containers
    shelter: '/shelter/',
    clients: '/shelter/clients/',
    staff: '/shelter/staff/',
    consent: '/shelter/consent/',
    logs: '/shelter/logs/',
    
    // Client data containers
    personal: '/personal/',
    medical: '/medical/',
    emergency: '/emergency/',
    preferences: '/preferences/',
    history: '/history/'
  },
  
  // Privacy levels for different data types
  privacyLevels: {
    public: ['bedPreferences', 'activeStatus'],
    restricted: ['firstName', 'lastName', 'phone', 'email'],
    confidential: ['dateOfBirth', 'emergencyContact', 'medicalNotes'],
    sensitive: ['behavioralNotes', 'restrictions', 'stayHistory']
  }
};