/**
 * Map Initialization Diagnostic Service
 * 
 * Helps debug OpenStreetMap initialization issues
 */

export interface MapDiagnosticResult {
  leafletLoaded: boolean;
  leafletVersion?: string;
  domReady: boolean;
  facilitiesWithCoords: number;
  totalFacilities: number;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  timestamp: Date;
}

export class MapInitializationDiagnostic {
  static async runDiagnostic(facilities: any[] = []): Promise<MapDiagnosticResult> {
    const result: MapDiagnosticResult = {
      leafletLoaded: false,
      domReady: false,
      facilitiesWithCoords: 0,
      totalFacilities: facilities.length,
      errors: [],
      warnings: [],
      recommendations: [],
      timestamp: new Date()
    };

    // Check DOM readiness
    result.domReady = document.readyState === 'complete' || document.readyState === 'interactive';
    if (!result.domReady) {
      result.warnings.push('DOM not fully ready - this may cause map initialization issues');
    }

    // Check Leaflet library
    if (typeof window !== 'undefined' && (window as any).L) {
      result.leafletLoaded = true;
      try {
        result.leafletVersion = (window as any).L.version;
      } catch (e) {
        result.warnings.push('Leaflet loaded but version check failed');
      }
    } else {
      result.errors.push('Leaflet library not found in window object');
      result.recommendations.push('Ensure Leaflet CSS and JS are properly loaded before map initialization');
    }

    // Check facility coordinate data
    result.facilitiesWithCoords = facilities.filter(f => 
      f.address?.latitude && 
      f.address?.longitude && 
      !isNaN(f.address.latitude) && 
      !isNaN(f.address.longitude)
    ).length;

    if (result.totalFacilities === 0) {
      result.errors.push('No facilities data available');
      result.recommendations.push('Check HMIS data loading - facilities array is empty');
    } else if (result.facilitiesWithCoords === 0) {
      result.errors.push('No facilities have valid coordinate data');
      result.recommendations.push('Ensure facility data includes latitude/longitude coordinates');
    } else if (result.facilitiesWithCoords < result.totalFacilities) {
      result.warnings.push(`${result.totalFacilities - result.facilitiesWithCoords} facilities missing coordinates`);
      result.recommendations.push('Consider geocoding missing addresses to improve map coverage');
    }

    // Check for common map container issues
    const mapContainers = document.querySelectorAll('[ref*="map"], .leaflet-container, #map');
    if (mapContainers.length === 0) {
      result.warnings.push('No map containers found in DOM');
    } else if (mapContainers.length > 1) {
      result.warnings.push(`Multiple potential map containers found: ${mapContainers.length}`);
    }

    // Check network connectivity for tile loading
    if (navigator.onLine === false) {
      result.errors.push('Device appears to be offline - map tiles will not load');
      result.recommendations.push('Check internet connection for map tile loading');
    }

    // Check for CORS/CSP issues
    const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    if (metaTags.length > 0) {
      result.warnings.push('Content Security Policy detected - ensure map tile URLs are allowed');
    }

    return result;
  }

  static async testLeafletLoading(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).L) {
        resolve(true);
        return;
      }

      // Try to load Leaflet if not already loaded
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      
      script.onload = () => {
        console.log('✅ Leaflet loaded successfully by diagnostic test');
        resolve(true);
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load Leaflet in diagnostic test');
        resolve(false);
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        console.warn('⏰ Leaflet loading timed out in diagnostic test');
        resolve(false);
      }, 10000);

      document.head.appendChild(script);
    });
  }

  static logDiagnosticResults(result: MapDiagnosticResult): void {
    console.group('🗺️ Map Initialization Diagnostic Results');
    
    console.log('📊 Status Summary:');
    console.log(`  ✅ Leaflet Loaded: ${result.leafletLoaded ? 'Yes' : 'No'}`);
    if (result.leafletVersion) {
      console.log(`  📦 Leaflet Version: ${result.leafletVersion}`);
    }
    console.log(`  🌐 DOM Ready: ${result.domReady ? 'Yes' : 'No'}`);
    console.log(`  📍 Facilities with Coordinates: ${result.facilitiesWithCoords}/${result.totalFacilities}`);
    
    if (result.errors.length > 0) {
      console.error('❌ Errors:');
      result.errors.forEach(error => console.error(`  • ${error}`));
    }
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Warnings:');
      result.warnings.forEach(warning => console.warn(`  • ${warning}`));
    }
    
    if (result.recommendations.length > 0) {
      console.info('💡 Recommendations:');
      result.recommendations.forEach(rec => console.info(`  • ${rec}`));
    }
    
    console.log(`🕐 Diagnostic completed at: ${result.timestamp.toLocaleTimeString()}`);
    console.groupEnd();
  }

  static async fixCommonIssues(): Promise<{ fixed: string[]; failed: string[] }> {
    const fixed: string[] = [];
    const failed: string[] = [];

    // Try to load Leaflet if missing
    if (!((window as any).L)) {
      try {
        const loaded = await this.testLeafletLoading();
        if (loaded) {
          fixed.push('Loaded missing Leaflet library');
        } else {
          failed.push('Could not load Leaflet library');
        }
      } catch (error) {
        failed.push('Failed to attempt Leaflet loading');
      }
    }

    // Try to add Leaflet CSS if missing
    const existingCSS = document.querySelector('link[href*="leaflet"][href*=".css"]');
    if (!existingCSS) {
      try {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);
        fixed.push('Added missing Leaflet CSS');
      } catch (error) {
        failed.push('Could not add Leaflet CSS');
      }
    }

    return { fixed, failed };
  }
}

// Export singleton instance
export const mapDiagnostic = new MapInitializationDiagnostic();
export default mapDiagnostic;