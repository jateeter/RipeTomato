import { OfflineStorageService } from './OfflineStorageService';
import { SyncService } from './SyncService';

export interface DashboardData {
  bedStatus: 'available' | 'occupied' | 'pending';
  upcomingServices: Service[];
  notifications: Notification[];
}

export interface Service {
  id: string;
  name: string;
  date: string;
  time: string;
  location?: string;
  description?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  timestamp: string;
}

export class ClientDataService {
  private offlineStorage: OfflineStorageService;
  private syncService: SyncService;

  constructor() {
    this.offlineStorage = new OfflineStorageService();
    this.syncService = new SyncService();
  }

  async getDashboardData(): Promise<DashboardData> {
    try {
      if (navigator.onLine) {
        const response = await fetch('/api/client/dashboard');
        const data = await response.json();

        await this.offlineStorage.set('dashboard-data', data);

        return data;
      } else {
        const cached = await this.offlineStorage.get('dashboard-data');
        if (!cached) {
          throw new Error('No offline data available');
        }
        return cached;
      }
    } catch (error) {
      const cached = await this.offlineStorage.get('dashboard-data');
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  async updateBedReservation(status: 'reserve' | 'cancel'): Promise<void> {
    const update = {
      action: status,
      timestamp: new Date().toISOString()
    };

    if (navigator.onLine) {
      await fetch('/api/client/bed-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      });
    } else {
      await this.syncService.queueUpdate('bed-reservation', update);
    }
  }

  async getServices(): Promise<Service[]> {
    try {
      if (navigator.onLine) {
        const response = await fetch('/api/client/services');
        const services = await response.json();

        await this.offlineStorage.set('services', services);

        return services;
      } else {
        const cached = await this.offlineStorage.get('services');
        return cached || [];
      }
    } catch (error) {
      const cached = await this.offlineStorage.get('services');
      return cached || [];
    }
  }

  async requestService(serviceType: string, details: any): Promise<void> {
    const request = {
      serviceType,
      details,
      timestamp: new Date().toISOString()
    };

    if (navigator.onLine) {
      await fetch('/api/client/service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
    } else {
      await this.syncService.queueUpdate('service-request', request);
    }
  }

  async syncOfflineChanges(): Promise<void> {
    await this.syncService.syncPendingUpdates();
  }
}
