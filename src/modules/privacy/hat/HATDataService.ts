export interface HATRecord {
  id?: string;
  data: any;
  timestamp?: string;
}

export class HATDataService {
  private accessToken: string;
  private serviceUrl: string;
  private namespace: string;

  constructor(accessToken: string, serviceUrl: string, namespace: string) {
    this.accessToken = accessToken;
    this.serviceUrl = serviceUrl;
    this.namespace = namespace;
  }

  async createRecord(endpoint: string, data: any): Promise<HATRecord> {
    try {
      const response = await fetch(`${this.serviceUrl}/data/${this.namespace}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': this.accessToken
        },
        body: JSON.stringify({
          data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create record: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create HAT record:', error);
      throw error;
    }
  }

  async getRecords(endpoint: string, options?: { startDate?: string; endDate?: string }): Promise<HATRecord[]> {
    try {
      const params = new URLSearchParams();
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);

      const url = `${this.serviceUrl}/data/${this.namespace}/${endpoint}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Auth-Token': this.accessToken
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get records: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get HAT records:', error);
      throw error;
    }
  }

  async updateRecord(endpoint: string, recordId: string, data: any): Promise<HATRecord> {
    try {
      const response = await fetch(`${this.serviceUrl}/data/${this.namespace}/${endpoint}/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': this.accessToken
        },
        body: JSON.stringify({
          data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update record: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update HAT record:', error);
      throw error;
    }
  }

  async deleteRecord(endpoint: string, recordId: string): Promise<void> {
    try {
      const response = await fetch(`${this.serviceUrl}/data/${this.namespace}/${endpoint}/${recordId}`, {
        method: 'DELETE',
        headers: {
          'X-Auth-Token': this.accessToken
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete record: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to delete HAT record:', error);
      throw error;
    }
  }
}
