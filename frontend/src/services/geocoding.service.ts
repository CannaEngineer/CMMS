// Geocoding service for converting addresses to GPS coordinates
// Using Nominatim OpenStreetMap API (free, no API key required)

interface GeocodingResult {
  lat: number;
  lng: number;
  display_name?: string;
}

export const geocodingService = {
  // Geocode an address to get coordinates
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!address || address.trim().length === 0) {
      console.warn('Geocoding: Empty address provided');
      return null;
    }

    try {
      // Using Nominatim OpenStreetMap API
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
        {
          headers: {
            'User-Agent': 'CMMS-Application/1.0', // Required by Nominatim
          },
        }
      );

      if (!response.ok) {
        console.error('Geocoding API error:', response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          display_name: result.display_name,
        };
      }

      console.warn('No geocoding results found for address:', address);
      return null;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  },

  // Reverse geocode coordinates to get an address
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'CMMS-Application/1.0',
          },
        }
      );

      if (!response.ok) {
        console.error('Reverse geocoding API error:', response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  },

  // Validate coordinates
  isValidCoordinates(lat: number | undefined, lng: number | undefined): boolean {
    if (lat === undefined || lng === undefined) {
      return false;
    }
    
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },

  // Format coordinates for display
  formatCoordinates(lat: number, lng: number, precision: number = 6): string {
    return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
  },

  // Calculate distance between two points (in meters)
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  },
};