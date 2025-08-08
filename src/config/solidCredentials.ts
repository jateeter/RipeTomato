/**
 * Solid Pod Credentials Configuration
 * Contains user-specific authentication tokens and Pod information
 */

export const SOLID_CREDENTIALS = {
  // User Pod Configuration
  podOwner: {
    identifier: 'JohnFromIdaho_5465cee4-800f-41c9-a25c-ae15f55d7819',
    webId: 'https://johnfromidaho.solidcommunity.net/profile/card#me',
    podUrl: 'https://johnfromidaho.solidcommunity.net/',
  },

  // Authentication Tokens
  tokens: {
    identifier: 'JohnFromIdaho_5465cee4-800f-41c9-a25c-ae15f55d7819',
    secret: 'b860d28dc66dc4ba6fd3b9fb035134ee7eba34360576083555ceab4a41b74faaaa67dcca75d72823ec087f1c2bee4948f22900f8dbac03f1e5db0e8dcab91c85'
  },

  // Pod Access Configuration
  permissions: {
    read: true,
    write: true,
    append: true,
    control: false // Usually false for application tokens
  },

  // Application Registration
  application: {
    name: 'Homeless Shelter Management System',
    description: 'Homeless shelter bed management and health monitoring system',
    homepage: 'http://localhost:3001',
    redirectUri: 'http://localhost:3001/solid-callback'
  },

  // Data Storage Locations
  containers: {
    shelter: '/shelter/',
    clients: '/shelter/clients/',
    health: '/shelter/health/',
    agents: '/shelter/agents/',
    communication: '/shelter/communication/',
    logs: '/shelter/logs/'
  }
};

/**
 * Generate authorization header for Solid Pod API calls
 */
export function getSolidAuthHeader(): string {
  const { identifier, secret } = SOLID_CREDENTIALS.tokens;
  // Create base64 encoded auth string
  const authString = `${identifier}:${secret}`;
  const encoded = btoa(authString);
  return `Basic ${encoded}`;
}

/**
 * Get full Pod URL with container path
 */
export function getPodContainerUrl(containerName: keyof typeof SOLID_CREDENTIALS.containers): string {
  const { podUrl } = SOLID_CREDENTIALS.podOwner;
  const containerPath = SOLID_CREDENTIALS.containers[containerName];
  return `${podUrl}${containerPath}`;
}

/**
 * Check if Pod credentials are configured
 */
export function hasSolidCredentials(): boolean {
  return !!(SOLID_CREDENTIALS.tokens.identifier && SOLID_CREDENTIALS.tokens.secret);
}