/**
 * CORS-Compliant HTTP Client Utilities
 * 
 * Utilities for making cross-origin requests to HMIS systems with proper
 * CORS headers, error handling, and fallback mechanisms.
 * 
 * @license MIT
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export interface CORSRequestConfig extends AxiosRequestConfig {
  // Additional CORS-specific options
  withCredentials?: boolean;
  corsMode?: 'cors' | 'no-cors' | 'same-origin';
  proxyUrl?: string; // Optional proxy for CORS bypass
  retryAttempts?: number;
  retryDelay?: number;
}

export interface CORSError extends Error {
  isCORSError: boolean;
  originalError: AxiosError;
  statusCode?: number;
  responseHeaders?: Record<string, string>;
}

/**
 * CORS-compliant HTTP client with automatic error handling and fallback mechanisms
 */
export class CORSHttpClient {
  private static instance: CORSHttpClient;
  private proxyUrl?: string;
  private fallbackEnabled: boolean = true;

  constructor(config?: { proxyUrl?: string; fallbackEnabled?: boolean }) {
    this.proxyUrl = config?.proxyUrl;
    this.fallbackEnabled = config?.fallbackEnabled ?? true;
  }

  static getInstance(config?: { proxyUrl?: string; fallbackEnabled?: boolean }): CORSHttpClient {
    if (!CORSHttpClient.instance) {
      CORSHttpClient.instance = new CORSHttpClient(config);
    }
    return CORSHttpClient.instance;
  }

  /**
   * Make a CORS-compliant GET request
   */
  async get<T = any>(url: string, config?: CORSRequestConfig): Promise<AxiosResponse<T>> {
    return await this.makeRequest<T>('GET', url, undefined, config);
  }

  /**
   * Make a CORS-compliant POST request
   */
  async post<T = any>(url: string, data?: any, config?: CORSRequestConfig): Promise<AxiosResponse<T>> {
    return await this.makeRequest<T>('POST', url, data, config);
  }

  /**
   * Make a CORS-compliant PUT request
   */
  async put<T = any>(url: string, data?: any, config?: CORSRequestConfig): Promise<AxiosResponse<T>> {
    return await this.makeRequest<T>('PUT', url, data, config);
  }

  /**
   * Make a CORS-compliant DELETE request
   */
  async delete<T = any>(url: string, config?: CORSRequestConfig): Promise<AxiosResponse<T>> {
    return await this.makeRequest<T>('DELETE', url, undefined, config);
  }

  /**
   * Core request method with CORS handling
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    config?: CORSRequestConfig
  ): Promise<AxiosResponse<T>> {
    const requestConfig = this.buildRequestConfig(url, config);
    const maxAttempts = config?.retryAttempts ?? 3;
    let lastError: AxiosError | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🌐 CORS Request attempt ${attempt}/${maxAttempts}: ${method} ${requestConfig.url}`);

        let response: AxiosResponse<T>;
        
        switch (method) {
          case 'GET':
            response = await axios.get<T>(requestConfig.url!, requestConfig);
            break;
          case 'POST':
            response = await axios.post<T>(requestConfig.url!, data, requestConfig);
            break;
          case 'PUT':
            response = await axios.put<T>(requestConfig.url!, data, requestConfig);
            break;
          case 'DELETE':
            response = await axios.delete<T>(requestConfig.url!, requestConfig);
            break;
        }

        console.log(`✅ CORS Request successful: ${method} ${url}`);
        return response;

      } catch (error) {
        lastError = error as AxiosError;
        
        if (this.isCORSError(lastError)) {
          console.warn(`⚠️ CORS error detected on attempt ${attempt}:`, lastError.message);
          
          // Try proxy fallback if enabled and available
          if (this.fallbackEnabled && this.proxyUrl && !requestConfig.url!.includes(this.proxyUrl)) {
            console.log(`🔄 Attempting proxy fallback via ${this.proxyUrl}`);
            return this.makeProxyRequest<T>(method, url, data, config);
          }
        } else {
          console.error(`❌ Non-CORS error on attempt ${attempt}:`, lastError.message);
        }

        // Wait before retry (except on last attempt)
        if (attempt < maxAttempts) {
          const delay = config?.retryDelay ?? (1000 * attempt); // Progressive delay
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed, throw enhanced error
    throw this.createCORSError(lastError!, url);
  }

  /**
   * Make request through CORS proxy
   */
  private async makeProxyRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    originalUrl: string,
    data?: any,
    config?: CORSRequestConfig
  ): Promise<AxiosResponse<T>> {
    if (!this.proxyUrl) {
      throw new Error('Proxy URL not configured');
    }

    // Construct proxy URL
    const proxyRequestUrl = `${this.proxyUrl}?url=${encodeURIComponent(originalUrl)}`;
    
    const proxyConfig = this.buildRequestConfig(proxyRequestUrl, {
      ...config,
      corsMode: 'cors',
      withCredentials: false // Usually not needed for proxy requests
    });

    // Add original URL to headers for proxy identification
    proxyConfig.headers = {
      ...proxyConfig.headers,
      'X-Original-URL': originalUrl,
      'X-Requested-With': 'XMLHttpRequest'
    };

    console.log(`🔄 Making proxy request via: ${proxyRequestUrl}`);

    try {
      let response: AxiosResponse<T>;
      
      switch (method) {
        case 'GET':
          response = await axios.get<T>(proxyRequestUrl, proxyConfig);
          break;
        case 'POST':
          response = await axios.post<T>(proxyRequestUrl, data, proxyConfig);
          break;
        case 'PUT':
          response = await axios.put<T>(proxyRequestUrl, data, proxyConfig);
          break;
        case 'DELETE':
          response = await axios.delete<T>(proxyRequestUrl, proxyConfig);
          break;
      }

      console.log(`✅ Proxy request successful: ${method} ${originalUrl}`);
      return response;

    } catch (error) {
      console.error(`❌ Proxy request failed: ${method} ${originalUrl}`, error);
      throw this.createCORSError(error as AxiosError, originalUrl);
    }
  }

  /**
   * Build axios request configuration with CORS headers
   */
  private buildRequestConfig(url: string, config?: CORSRequestConfig): AxiosRequestConfig {
    const corsHeaders: Record<string, string> = {
      'Accept': 'application/json, text/html, application/xml, */*',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
      // Removed User-Agent as it's a restricted browser header
    };

    // Add CORS-specific headers
    if (config?.corsMode === 'cors') {
      corsHeaders['Access-Control-Request-Method'] = config?.method || 'GET';
      corsHeaders['Access-Control-Request-Headers'] = 'Content-Type, Authorization, X-Requested-With';
    }

    // Handle proxy URL if configured
    const requestUrl = config?.proxyUrl ? `${config.proxyUrl}?url=${encodeURIComponent(url)}` : url;

    return {
      url: requestUrl,
      method: config?.method || 'GET',
      headers: {
        ...corsHeaders,
        ...config?.headers
      },
      timeout: config?.timeout || 30000, // 30 second timeout
      withCredentials: config?.withCredentials || false,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Accept 4xx as valid responses
      ...config
    };
  }

  /**
   * Check if error is CORS-related
   */
  private isCORSError(error: AxiosError): boolean {
    // Check for common CORS error patterns
    const corsIndicators = [
      'cross-origin',
      'cors',
      'blocked by cors policy',
      'access-control-allow-origin',
      'preflight',
      'network error',
      'failed to fetch'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    const responseText = error.response?.statusText?.toLowerCase() || '';
    
    // Network errors without response are often CORS
    if (!error.response && error.code === 'ERR_NETWORK') {
      return true;
    }

    // Check error message for CORS indicators
    return corsIndicators.some(indicator => 
      errorMessage.includes(indicator) || responseText.includes(indicator)
    );
  }

  /**
   * Create enhanced CORS error with additional context
   */
  private createCORSError(originalError: AxiosError, url: string): CORSError {
    const corsError = new Error(
      `CORS request failed for ${url}: ${originalError.message}`
    ) as CORSError;
    
    corsError.isCORSError = this.isCORSError(originalError);
    corsError.originalError = originalError;
    corsError.statusCode = originalError.response?.status;
    corsError.responseHeaders = originalError.response?.headers as Record<string, string>;
    corsError.name = 'CORSError';

    return corsError;
  }

  /**
   * Test CORS connectivity to a URL
   */
  async testCORSConnectivity(url: string): Promise<{
    accessible: boolean;
    corsEnabled: boolean;
    errorMessage?: string;
    responseHeaders?: Record<string, string>;
  }> {
    try {
      const response = await this.get(url, {
        timeout: 10000,
        retryAttempts: 1
      });

      const corsHeaders = response.headers;
      const corsEnabled = !!(
        corsHeaders['access-control-allow-origin'] ||
        corsHeaders['Access-Control-Allow-Origin']
      );

      return {
        accessible: true,
        corsEnabled,
        responseHeaders: corsHeaders as Record<string, string>
      };

    } catch (error) {
      const corsError = error as CORSError;
      
      return {
        accessible: false,
        corsEnabled: false,
        errorMessage: corsError.message,
        responseHeaders: corsError.responseHeaders
      };
    }
  }

  /**
   * Configure proxy URL for CORS bypass
   */
  setProxyUrl(proxyUrl: string): void {
    this.proxyUrl = proxyUrl;
  }

  /**
   * Enable or disable fallback mechanisms
   */
  setFallbackEnabled(enabled: boolean): void {
    this.fallbackEnabled = enabled;
  }
}

// Export singleton instance
export const corsHttpClient = CORSHttpClient.getInstance({
  proxyUrl: process.env.REACT_APP_CORS_PROXY_URL,
  fallbackEnabled: true
});

// Export common CORS configurations
export const CORSConfigs = {
  hmisOpenCommons: {
    corsMode: 'cors' as const,
    withCredentials: false,
    retryAttempts: 3,
    retryDelay: 2000,
    timeout: 30000,
    headers: {
      'Accept': 'application/json, text/html, */*',
      // Removed Origin as it's a restricted browser header
    }
  },
  
  mediaWiki: {
    corsMode: 'cors' as const,
    withCredentials: false,
    retryAttempts: 2,
    retryDelay: 1500,
    timeout: 25000,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  },

  hmisAPI: {
    corsMode: 'cors' as const,
    withCredentials: false,
    retryAttempts: 3,
    retryDelay: 2000,
    timeout: 35000,
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  }
};