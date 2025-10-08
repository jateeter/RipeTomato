/**
 * Cache Database Service
 *
 * Provides local SQLite caching for location and shelter data.
 * Uses sql.js for pure JavaScript SQLite implementation.
 */

import initSqlJs, { Database } from 'sql.js';

export interface Location {
  id?: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'shelter' | 'service' | 'clinic' | 'food' | 'other';
  created_at?: string;
  updated_at?: string;
}

export interface Shelter {
  id?: number;
  location_id: number;
  name: string;
  capacity: number;
  available_beds: number;
  occupied_beds: number;
  services: string; // JSON string of available services
  phone?: string;
  hours?: string;
  eligibility?: string;
  metrics: string; // JSON string of metrics
  last_updated: string;
  created_at?: string;
}

export interface CacheMetadata {
  last_sync: string;
  version: string;
  total_locations: number;
  total_shelters: number;
}

class CacheDatabaseService {
  private db: Database | null = null;
  private SQL: any = null;
  private readonly DB_VERSION = '1.0.0';
  private readonly CACHE_MAX_AGE_HOURS = 24;

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.db) return; // Already initialized

    try {
      // Load sql.js library
      this.SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      // Try to load existing database from localStorage
      const savedDb = localStorage.getItem('cache_database');

      if (savedDb) {
        const data = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
        this.db = new this.SQL.Database(data);
        console.log('✅ Loaded existing cache database from localStorage');
      } else {
        this.db = new this.SQL.Database();
        await this.createSchema();
        console.log('✅ Created new cache database');
      }
    } catch (error) {
      console.error('❌ Failed to initialize cache database:', error);
      throw error;
    }
  }

  /**
   * Create database schema
   */
  private async createSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Locations table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('shelter', 'service', 'clinic', 'food', 'other')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Shelters table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS shelters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 0,
        available_beds INTEGER NOT NULL DEFAULT 0,
        occupied_beds INTEGER NOT NULL DEFAULT 0,
        services TEXT NOT NULL DEFAULT '[]',
        phone TEXT,
        hours TEXT,
        eligibility TEXT,
        metrics TEXT NOT NULL DEFAULT '{}',
        last_updated TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
      )
    `);

    // Metadata table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    this.db.run('CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_shelters_location ON shelters(location_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_shelters_available ON shelters(available_beds)');

    // Initialize metadata
    this.setMetadata('version', this.DB_VERSION);
    this.setMetadata('last_sync', new Date().toISOString());

    this.saveToLocalStorage();
  }

  /**
   * Save database to localStorage
   */
  private saveToLocalStorage(): void {
    if (!this.db) return;

    try {
      const data = this.db.export();
      const base64 = btoa(String.fromCharCode(...data));
      localStorage.setItem('cache_database', base64);
      console.log('💾 Cache database saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save database to localStorage:', error);
    }
  }

  /**
   * Check if cache exists and is fresh
   */
  async isCacheFresh(): Promise<boolean> {
    if (!this.db) await this.initialize();

    const lastSync = this.getMetadata('last_sync');
    if (!lastSync) return false;

    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);

    return hoursDiff < this.CACHE_MAX_AGE_HOURS;
  }

  /**
   * Get metadata value
   */
  private getMetadata(key: string): string | null {
    if (!this.db) return null;

    const stmt = this.db.prepare('SELECT value FROM metadata WHERE key = ?');
    stmt.bind([key]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row.value as string;
    }

    stmt.free();
    return null;
  }

  /**
   * Set metadata value
   */
  private setMetadata(key: string, value: string): void {
    if (!this.db) return;

    this.db.run(
      'INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, ?)',
      [key, value, new Date().toISOString()]
    );
  }

  /**
   * Get cache statistics
   */
  async getCacheMetadata(): Promise<CacheMetadata> {
    if (!this.db) await this.initialize();

    const lastSync = this.getMetadata('last_sync') || new Date().toISOString();
    const version = this.getMetadata('version') || this.DB_VERSION;

    const locStmt = this.db!.prepare('SELECT COUNT(*) as count FROM locations');
    locStmt.step();
    const locCount = locStmt.getAsObject().count as number;
    locStmt.free();

    const shelterStmt = this.db!.prepare('SELECT COUNT(*) as count FROM shelters');
    shelterStmt.step();
    const shelterCount = shelterStmt.getAsObject().count as number;
    shelterStmt.free();

    return {
      last_sync: lastSync,
      version,
      total_locations: locCount,
      total_shelters: shelterCount
    };
  }

  // ============ LOCATION OPERATIONS ============

  /**
   * Add location to cache
   */
  async addLocation(location: Location): Promise<number> {
    if (!this.db) await this.initialize();

    const stmt = this.db!.prepare(`
      INSERT INTO locations (name, address, latitude, longitude, type)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run([
      location.name,
      location.address,
      location.latitude,
      location.longitude,
      location.type
    ]);

    stmt.free();

    const lastId = this.db!.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;
    this.saveToLocalStorage();

    return lastId;
  }

  /**
   * Get location by ID
   */
  async getLocation(id: number): Promise<Location | null> {
    if (!this.db) await this.initialize();

    const stmt = this.db!.prepare('SELECT * FROM locations WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row as Location;
    }

    stmt.free();
    return null;
  }

  /**
   * Get all locations
   */
  async getAllLocations(): Promise<Location[]> {
    if (!this.db) await this.initialize();

    const result = this.db!.exec('SELECT * FROM locations ORDER BY name');

    if (result.length === 0) return [];

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map(row => {
      const obj: any = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj as Location;
    });
  }

  /**
   * Get locations by type
   */
  async getLocationsByType(type: string): Promise<Location[]> {
    if (!this.db) await this.initialize();

    const stmt = this.db!.prepare('SELECT * FROM locations WHERE type = ? ORDER BY name');
    stmt.bind([type]);

    const locations: Location[] = [];
    while (stmt.step()) {
      locations.push(stmt.getAsObject() as Location);
    }

    stmt.free();
    return locations;
  }

  /**
   * Update location
   */
  async updateLocation(id: number, updates: Partial<Location>): Promise<void> {
    if (!this.db) await this.initialize();

    const fields = Object.keys(updates).filter(k => k !== 'id');
    const values = fields.map(k => (updates as any)[k]);

    const setClause = fields.map(f => `${f} = ?`).join(', ');

    this.db!.run(
      `UPDATE locations SET ${setClause}, updated_at = ? WHERE id = ?`,
      [...values, new Date().toISOString(), id]
    );

    this.saveToLocalStorage();
  }

  /**
   * Delete location
   */
  async deleteLocation(id: number): Promise<void> {
    if (!this.db) await this.initialize();

    this.db!.run('DELETE FROM locations WHERE id = ?', [id]);
    this.saveToLocalStorage();
  }

  // ============ SHELTER OPERATIONS ============

  /**
   * Add shelter to cache
   */
  async addShelter(shelter: Shelter): Promise<number> {
    if (!this.db) await this.initialize();

    const stmt = this.db!.prepare(`
      INSERT INTO shelters (
        location_id, name, capacity, available_beds, occupied_beds,
        services, phone, hours, eligibility, metrics, last_updated
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      shelter.location_id,
      shelter.name,
      shelter.capacity,
      shelter.available_beds,
      shelter.occupied_beds,
      shelter.services,
      shelter.phone || null,
      shelter.hours || null,
      shelter.eligibility || null,
      shelter.metrics,
      shelter.last_updated
    ]);

    stmt.free();

    const lastId = this.db!.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;
    this.saveToLocalStorage();

    return lastId;
  }

  /**
   * Get shelter by ID
   */
  async getShelter(id: number): Promise<Shelter | null> {
    if (!this.db) await this.initialize();

    const stmt = this.db!.prepare('SELECT * FROM shelters WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row as Shelter;
    }

    stmt.free();
    return null;
  }

  /**
   * Get all shelters with location info
   */
  async getAllShelters(): Promise<Array<Shelter & { location: Location }>> {
    if (!this.db) await this.initialize();

    const result = this.db!.exec(`
      SELECT
        s.*,
        l.name as location_name,
        l.address,
        l.latitude,
        l.longitude,
        l.type
      FROM shelters s
      JOIN locations l ON s.location_id = l.id
      ORDER BY s.name
    `);

    if (result.length === 0) return [];

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map(row => {
      const obj: any = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });

      // Separate shelter and location data
      const shelter: any = {};
      const location: any = {};

      Object.keys(obj).forEach(key => {
        if (['location_name', 'address', 'latitude', 'longitude', 'type'].includes(key)) {
          if (key === 'location_name') {
            location.name = obj[key];
          } else {
            location[key] = obj[key];
          }
        } else {
          shelter[key] = obj[key];
        }
      });

      return { ...shelter, location } as Shelter & { location: Location };
    });
  }

  /**
   * Get shelters with available beds
   */
  async getSheltersWithAvailability(): Promise<Array<Shelter & { location: Location }>> {
    if (!this.db) await this.initialize();

    const result = this.db!.exec(`
      SELECT
        s.*,
        l.name as location_name,
        l.address,
        l.latitude,
        l.longitude,
        l.type
      FROM shelters s
      JOIN locations l ON s.location_id = l.id
      WHERE s.available_beds > 0
      ORDER BY s.available_beds DESC
    `);

    if (result.length === 0) return [];

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map(row => {
      const obj: any = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });

      const shelter: any = {};
      const location: any = {};

      Object.keys(obj).forEach(key => {
        if (['location_name', 'address', 'latitude', 'longitude', 'type'].includes(key)) {
          if (key === 'location_name') {
            location.name = obj[key];
          } else {
            location[key] = obj[key];
          }
        } else {
          shelter[key] = obj[key];
        }
      });

      return { ...shelter, location } as Shelter & { location: Location };
    });
  }

  /**
   * Update shelter
   */
  async updateShelter(id: number, updates: Partial<Shelter>): Promise<void> {
    if (!this.db) await this.initialize();

    const fields = Object.keys(updates).filter(k => k !== 'id');
    const values = fields.map(k => (updates as any)[k]);

    const setClause = fields.map(f => `${f} = ?`).join(', ');

    this.db!.run(
      `UPDATE shelters SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    this.saveToLocalStorage();
  }

  /**
   * Update bed availability
   */
  async updateBedAvailability(
    id: number,
    availableBeds: number,
    occupiedBeds: number
  ): Promise<void> {
    if (!this.db) await this.initialize();

    this.db!.run(
      `UPDATE shelters
       SET available_beds = ?, occupied_beds = ?, last_updated = ?
       WHERE id = ?`,
      [availableBeds, occupiedBeds, new Date().toISOString(), id]
    );

    this.saveToLocalStorage();
  }

  /**
   * Delete shelter
   */
  async deleteShelter(id: number): Promise<void> {
    if (!this.db) await this.initialize();

    this.db!.run('DELETE FROM shelters WHERE id = ?', [id]);
    this.saveToLocalStorage();
  }

  /**
   * Clear all cache data
   */
  async clearCache(): Promise<void> {
    if (!this.db) await this.initialize();

    this.db!.run('DELETE FROM shelters');
    this.db!.run('DELETE FROM locations');
    this.setMetadata('last_sync', new Date().toISOString());

    this.saveToLocalStorage();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('👋 Cache database closed');
    }
  }
}

// Export singleton instance
export const cacheDatabaseService = new CacheDatabaseService();
