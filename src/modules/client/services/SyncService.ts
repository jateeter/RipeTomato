import { OfflineStorageService } from './OfflineStorageService';

export class SyncService {
  private offlineStorage: OfflineStorageService;
  private syncInProgress = false;

  constructor() {
    this.offlineStorage = new OfflineStorageService();
  }

  async queueUpdate(type: string, data: any): Promise<void> {
    await this.offlineStorage.queueForSync(type, data);
  }

  async syncPendingUpdates(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('Cannot sync while offline');
      return;
    }

    this.syncInProgress = true;

    try {
      const queue = await this.offlineStorage.getSyncQueue();

      for (const item of queue) {
        await this.syncItem(item);
      }

      await this.offlineStorage.clearSyncQueue();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: any): Promise<void> {
    const { storeName, data } = item;

    const endpoint = this.getEndpointForStore(storeName);

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  private getEndpointForStore(storeName: string): string {
    const endpoints: Record<string, string> = {
      'bed-reservation': '/api/client/bed-reservation',
      'service-request': '/api/client/service-request',
      'profile-update': '/api/client/profile'
    };

    return endpoints[storeName] || '/api/client/sync';
  }
}
