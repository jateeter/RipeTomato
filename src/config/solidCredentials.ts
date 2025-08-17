/**
 * Solid Pod Credentials Configuration
 * Contains user-specific authentication tokens and Pod information
 */

export const SOLID_CREDENTIALS = {
  // User Pod Configuration (OpenCommons.net)
  podOwner: {
    identifier: 'idaho-community-services',
    webId: 'https://idaho-community-services.opencommons.net/profile/card#me',
    podUrl: 'https://idaho-community-services.opencommons.net/',
  },

  // Authentication Tokens (to be configured during initialization)
  tokens: {
    identifier: process.env.REACT_APP_SOLID_CLIENT_ID || 'idaho-community-services',
    secret: process.env.REACT_APP_SOLID_CLIENT_SECRET || '',
    accessToken: process.env.REACT_APP_SOLID_ACCESS_TOKEN || '',
    refreshToken: process.env.REACT_APP_SOLID_REFRESH_TOKEN || ''
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
    name: 'Community Services - Idaho Events',
    description: 'Community services management system for shelters, food, hygiene, and transportation services with agent-based monitoring',
    homepage: 'http://localhost:3000',
    redirectUri: 'http://localhost:3000/solid-callback',
    clientId: 'https://community-services.idaho.app'
  },

  // OpenCommons.net specific configuration
  openCommonsProvider: {
    issuer: 'https://opencommons.net',
    wellKnownEndpoint: 'https://opencommons.net/.well-known/openid_configuration',
    registrationEndpoint: 'https://opencommons.net/register',
    authorizationEndpoint: 'https://opencommons.net/authorize',
    tokenEndpoint: 'https://opencommons.net/token',
    userinfoEndpoint: 'https://opencommons.net/userinfo',
    endSessionEndpoint: 'https://opencommons.net/logout',
    jwksUri: 'https://opencommons.net/.well-known/jwks.json'
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
  const { accessToken, identifier, secret } = SOLID_CREDENTIALS.tokens;
  
  // Prefer Bearer token if available
  if (accessToken) {
    return `Bearer ${accessToken}`;
  }
  
  // Fallback to Basic auth if credentials are available
  if (identifier && secret) {
    const authString = `${identifier}:${secret}`;
    const encoded = btoa(authString);
    return `Basic ${encoded}`;
  }
  
  throw new Error('No valid Solid Pod credentials configured');
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
  const { accessToken, identifier, secret } = SOLID_CREDENTIALS.tokens;
  return !!(accessToken || (identifier && secret));
}

/**
 * Update Solid Pod credentials (for runtime configuration)
 */
export function updateSolidCredentials(credentials: {
  accessToken?: string;
  refreshToken?: string;
  identifier?: string;
  secret?: string;
  webId?: string;
  podUrl?: string;
}): void {
  if (credentials.accessToken) {
    SOLID_CREDENTIALS.tokens.accessToken = credentials.accessToken;
  }
  if (credentials.refreshToken) {
    SOLID_CREDENTIALS.tokens.refreshToken = credentials.refreshToken;
  }
  if (credentials.identifier) {
    SOLID_CREDENTIALS.tokens.identifier = credentials.identifier;
  }
  if (credentials.secret) {
    SOLID_CREDENTIALS.tokens.secret = credentials.secret;
  }
  if (credentials.webId) {
    SOLID_CREDENTIALS.podOwner.webId = credentials.webId;
  }
  if (credentials.podUrl) {
    SOLID_CREDENTIALS.podOwner.podUrl = credentials.podUrl;
  }
}

/**
 * Validate OpenCommons.net connectivity
 */
export async function validateOpenCommonsConnection(): Promise<{
  isValid: boolean;
  error?: string;
  config?: any;
}> {
  try {
    const wellKnownUrl = SOLID_CREDENTIALS.openCommonsProvider.wellKnownEndpoint;
    const response = await fetch(wellKnownUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        isValid: false,
        error: `Failed to fetch OpenCommons configuration: ${response.status}`
      };
    }

    const config = await response.json();
    
    return {
      isValid: true,
      config
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error validating OpenCommons connection'
    };
  }
}