import { createClient } from '@supabase/supabase-js';
import { ZeroKnowledgeEncryption } from '../encryption';

interface ApiConfig {
  name: string;
  baseUrl: string;
  authType: 'bearer' | 'basic' | 'apiKey' | 'oauth2';
  credentials: {
    apiKey?: string;
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
  };
  headers?: Record<string, string>;
}

interface ApiEndpoint {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  parameters?: Array<{
    name: string;
    type: 'query' | 'path' | 'body';
    required: boolean;
  }>;
  headers?: Record<string, string>;
}

export class ApiIntegration {
  private supabase;
  private encryption: ZeroKnowledgeEncryption;
  private apis: Map<string, ApiConfig> = new Map();
  private endpoints: Map<string, ApiEndpoint[]> = new Map();

  constructor(
    private supabaseUrl: string,
    private supabaseKey: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.encryption = new ZeroKnowledgeEncryption();
  }

  /**
   * Register a new API integration
   */
  async registerApi(
    userId: string,
    config: ApiConfig
  ): Promise<void> {
    try {
      // Encrypt sensitive credentials
      const encryptedCredentials = await ZeroKnowledgeEncryption.encrypt(
        JSON.stringify(config.credentials),
        Buffer.from(this.supabaseKey)
      );

      // Store API configuration
      await this.supabase
        .from('api_integrations')
        .upsert({
          user_id: userId,
          name: config.name,
          base_url: config.baseUrl,
          auth_type: config.authType,
          credentials: encryptedCredentials,
          headers: config.headers,
          status: 'active'
        });

      this.apis.set(config.name, config);

    } catch (error) {
      console.error('API registration failed:', error);
      throw error;
    }
  }

  /**
   * Register API endpoints
   */
  async registerEndpoints(
    apiName: string,
    endpoints: ApiEndpoint[]
  ): Promise<void> {
    if (!this.apis.has(apiName)) {
      throw new Error(`API ${apiName} not registered`);
    }

    try {
      // Store endpoints
      await this.supabase
        .from('api_endpoints')
        .upsert(
          endpoints.map(endpoint => ({
            api_name: apiName,
            name: endpoint.name,
            method: endpoint.method,
            path: endpoint.path,
            parameters: endpoint.parameters,
            headers: endpoint.headers
          }))
        );

      this.endpoints.set(apiName, endpoints);

    } catch (error) {
      console.error('Endpoint registration failed:', error);
      throw error;
    }
  }

  /**
   * Make an API call
   */
  async call(
    userId: string,
    apiName: string,
    endpointName: string,
    parameters: Record<string, any> = {}
  ): Promise<any> {
    const api = this.apis.get(apiName);
    if (!api) {
      throw new Error(`API ${apiName} not found`);
    }

    const endpoints = this.endpoints.get(apiName);
    if (!endpoints) {
      throw new Error(`No endpoints registered for API ${apiName}`);
    }

    const endpoint = endpoints.find(e => e.name === endpointName);
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointName} not found`);
    }

    try {
      // Build request URL
      let url = api.baseUrl + endpoint.path;
      const queryParams: Record<string, string> = {};
      const pathParams: Record<string, string> = {};
      let body: any;

      // Process parameters
      endpoint.parameters?.forEach(param => {
        if (!parameters[param.name] && param.required) {
          throw new Error(`Required parameter ${param.name} not provided`);
        }

        switch (param.type) {
          case 'query':
            if (parameters[param.name]) {
              queryParams[param.name] = parameters[param.name];
            }
            break;
          case 'path':
            if (parameters[param.name]) {
              pathParams[param.name] = parameters[param.name];
            }
            break;
          case 'body':
            body = parameters[param.name];
            break;
        }
      });

      // Replace path parameters
      Object.entries(pathParams).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      });

      // Add query parameters
      if (Object.keys(queryParams).length > 0) {
        url += '?' + new URLSearchParams(queryParams).toString();
      }

      // Prepare headers
      const headers: Record<string, string> = {
        ...api.headers,
        ...endpoint.headers
      };

      // Add authentication
      switch (api.authType) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${api.credentials.accessToken}`;
          break;
        case 'basic':
          const auth = Buffer.from(
            `${api.credentials.username}:${api.credentials.password}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
          break;
        case 'apiKey':
          headers['X-API-Key'] = api.credentials.apiKey!;
          break;
      }

      // Make the request
      const response = await fetch(url, {
        method: endpoint.method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      // Log the API call
      await this.logApiCall(userId, apiName, endpointName, response.status);

      return await response.json();

    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  /**
   * Log API call
   */
  private async logApiCall(
    userId: string,
    apiName: string,
    endpointName: string,
    status: number
  ): Promise<void> {
    await this.supabase
      .from('api_logs')
      .insert({
        user_id: userId,
        api_name: apiName,
        endpoint_name: endpointName,
        status,
        timestamp: new Date().toISOString()
      });
  }

  /**
   * Test API connection
   */
  async testConnection(
    apiName: string
  ): Promise<boolean> {
    const api = this.apis.get(apiName);
    if (!api) {
      throw new Error(`API ${apiName} not found`);
    }

    try {
      const response = await fetch(api.baseUrl, {
        method: 'HEAD',
        headers: api.headers
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Refresh OAuth2 token
   */
  async refreshOAuthToken(
    userId: string,
    apiName: string
  ): Promise<void> {
    const api = this.apis.get(apiName);
    if (!api || api.authType !== 'oauth2') {
      throw new Error(`OAuth2 API ${apiName} not found`);
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: api.credentials.clientId!,
          client_secret: api.credentials.clientSecret!,
          refresh_token: api.credentials.refreshToken!,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const { access_token, expires_in } = await response.json();

      // Update stored credentials
      const updatedCredentials = {
        ...api.credentials,
        accessToken: access_token
      };

      await this.registerApi(userId, {
        ...api,
        credentials: updatedCredentials
      });

    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }
}

export default ApiIntegration;
