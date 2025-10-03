#!/usr/bin/env python3
"""
NOAA Weather Service Integration

Provides real-time weather data and alerts from the National Weather Service API.
Integrates with the weather monitoring agent to provide actual weather conditions
and official weather alerts for community services planning.

Features:
- Real-time weather data from NOAA/NWS API
- Official weather alerts and warnings
- Location-based weather information
- Forecast data retrieval
- Robust error handling and fallback mechanisms
- Rate limiting and API best practices

API Documentation: https://www.weather.gov/documentation/services-web-api
API Base URL: https://api.weather.gov

@license MIT
"""

import asyncio
import aiohttp
import json
import time
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
import re

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class NOAALocation:
    """Represents a NOAA location with grid coordinates"""
    latitude: float
    longitude: float
    grid_id: str
    grid_x: int
    grid_y: int
    forecast_office: str
    city: str
    state: str
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class NOAAWeatherReading:
    """Represents a weather reading from NOAA"""
    timestamp: str
    temperature_f: Optional[float]
    humidity_percent: Optional[float]
    wind_speed_mph: Optional[float]
    wind_direction: Optional[str]
    pressure_mb: Optional[float]
    visibility_miles: Optional[float]
    conditions: str
    detailed_forecast: str
    source: str = "NOAA"
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class NOAAAlert:
    """Represents a NOAA weather alert"""
    alert_id: str
    event: str
    severity: str
    certainty: str
    urgency: str
    headline: str
    description: str
    instruction: Optional[str]
    areas: List[str]
    effective: str
    expires: str
    sender: str
    status: str
    message_type: str
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class NOAAWeatherService:
    """Service for integrating with NOAA/NWS weather API"""
    
    def __init__(self, user_agent: str = "CommunityServices/1.0 (weather-monitoring@community.org)"):
        self.base_url = "https://api.weather.gov"
        self.user_agent = user_agent
        self.session: Optional[aiohttp.ClientSession] = None
        self.location_cache: Dict[str, NOAALocation] = {}
        self.rate_limit_delay = 1.0  # Seconds between requests
        self.last_request_time = 0.0
        self.timeout = aiohttp.ClientTimeout(total=30)
        
        logger.info(f"🌐 NOAA Weather Service initialized with User-Agent: {user_agent}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
    
    async def initialize(self):
        """Initialize the HTTP session"""
        if not self.session:
            headers = {
                'User-Agent': self.user_agent,
                'Accept': 'application/json'
            }
            self.session = aiohttp.ClientSession(
                headers=headers,
                timeout=self.timeout,
                connector=aiohttp.TCPConnector(limit=10)
            )
            logger.info("📡 NOAA API session initialized")
    
    async def close(self):
        """Close the HTTP session"""
        if self.session:
            await self.session.close()
            self.session = None
            logger.info("🔒 NOAA API session closed")
    
    async def _make_request(self, url: str) -> Optional[Dict[str, Any]]:
        """Make a rate-limited request to the NOAA API"""
        # Implement rate limiting
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            wait_time = self.rate_limit_delay - time_since_last
            await asyncio.sleep(wait_time)
        
        self.last_request_time = time.time()
        
        try:
            if not self.session:
                await self.initialize()
            
            logger.debug(f"🌐 Making NOAA API request: {url}")
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.debug(f"✅ NOAA API request successful: {response.status}")
                    return data
                elif response.status == 404:
                    logger.warning(f"⚠️ NOAA API resource not found: {url}")
                    return None
                elif response.status == 429:
                    logger.warning("⚠️ NOAA API rate limit exceeded, waiting...")
                    await asyncio.sleep(5)
                    return await self._make_request(url)  # Retry once
                else:
                    logger.error(f"❌ NOAA API request failed: {response.status} - {await response.text()}")
                    return None
                    
        except asyncio.TimeoutError:
            logger.error(f"⏰ NOAA API request timeout: {url}")
            return None
        except aiohttp.ClientError as e:
            logger.error(f"❌ NOAA API client error: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error in NOAA API request: {e}")
            return None
    
    async def get_location_info(self, latitude: float, longitude: float) -> Optional[NOAALocation]:
        """Get NOAA location information for coordinates"""
        # Round coordinates to 4 decimal places as required by NOAA API
        lat = round(latitude, 4)
        lon = round(longitude, 4)
        
        cache_key = f"{lat},{lon}"
        if cache_key in self.location_cache:
            logger.debug(f"📍 Using cached location info for {cache_key}")
            return self.location_cache[cache_key]
        
        url = f"{self.base_url}/points/{lat},{lon}"
        data = await self._make_request(url)
        
        if not data or 'properties' not in data:
            logger.error(f"❌ Failed to get location info for {lat},{lon}")
            return None
        
        try:
            props = data['properties']
            location = NOAALocation(
                latitude=lat,
                longitude=lon,
                grid_id=props['gridId'],
                grid_x=props['gridX'],
                grid_y=props['gridY'],
                forecast_office=props['cwa'],
                city=props.get('relativeLocation', {}).get('properties', {}).get('city', 'Unknown'),
                state=props.get('relativeLocation', {}).get('properties', {}).get('state', 'Unknown')
            )
            
            self.location_cache[cache_key] = location
            logger.info(f"📍 Retrieved location info: {location.city}, {location.state} (Grid: {location.grid_id}/{location.grid_x},{location.grid_y})")
            return location
            
        except KeyError as e:
            logger.error(f"❌ Missing required field in NOAA location response: {e}")
            return None
    
    async def get_current_weather(self, location: NOAALocation) -> Optional[NOAAWeatherReading]:
        """Get current weather observations for a location"""
        # Try to get the latest observation from the gridpoint
        url = f"{self.base_url}/gridpoints/{location.grid_id}/{location.grid_x},{location.grid_y}"
        data = await self._make_request(url)
        
        if not data or 'properties' not in data:
            logger.warning(f"⚠️ Failed to get gridpoint data for {location.grid_id}/{location.grid_x},{location.grid_y}")
            return None
        
        try:
            props = data['properties']
            
            # Extract current conditions from the gridpoint data
            # Note: NOAA API doesn't always have "current" conditions, but latest forecast period
            current_time = datetime.now(timezone.utc).isoformat()
            
            # Get temperature
            temp_f = None
            if 'temperature' in props and props['temperature']['values']:
                # Get the first temperature value and convert from Celsius to Fahrenheit
                temp_c = props['temperature']['values'][0]['value']
                if temp_c is not None:
                    temp_f = (temp_c * 9/5) + 32
            
            # Get humidity
            humidity = None
            if 'relativeHumidity' in props and props['relativeHumidity']['values']:
                humidity = props['relativeHumidity']['values'][0]['value']
            
            # Get wind information
            wind_speed_mph = None
            wind_direction = None
            if 'windSpeed' in props and props['windSpeed']['values']:
                wind_speed_ms = props['windSpeed']['values'][0]['value']
                if wind_speed_ms is not None:
                    wind_speed_mph = wind_speed_ms * 2.237  # Convert m/s to mph
            
            if 'windDirection' in props and props['windDirection']['values']:
                wind_dir_deg = props['windDirection']['values'][0]['value']
                if wind_dir_deg is not None:
                    wind_direction = self._degrees_to_direction(wind_dir_deg)
            
            # Get atmospheric pressure
            pressure_mb = None
            if 'pressure' in props and props['pressure']['values']:
                pressure_pa = props['pressure']['values'][0]['value']
                if pressure_pa is not None:
                    pressure_mb = pressure_pa / 100  # Convert Pa to mb
            
            # Get visibility
            visibility_miles = None
            if 'visibility' in props and props['visibility']['values']:
                visibility_m = props['visibility']['values'][0]['value']
                if visibility_m is not None:
                    visibility_miles = visibility_m * 0.000621371  # Convert meters to miles
            
            # Get weather conditions from forecast
            forecast_url = f"{self.base_url}/gridpoints/{location.grid_id}/{location.grid_x},{location.grid_y}/forecast"
            forecast_data = await self._make_request(forecast_url)
            
            conditions = "Unknown"
            detailed_forecast = "No forecast available"
            
            if forecast_data and 'properties' in forecast_data and 'periods' in forecast_data['properties']:
                periods = forecast_data['properties']['periods']
                if periods:
                    first_period = periods[0]
                    conditions = first_period.get('shortForecast', 'Unknown')
                    detailed_forecast = first_period.get('detailedForecast', 'No forecast available')
            
            reading = NOAAWeatherReading(
                timestamp=current_time,
                temperature_f=round(temp_f, 1) if temp_f is not None else None,
                humidity_percent=round(humidity, 1) if humidity is not None else None,
                wind_speed_mph=round(wind_speed_mph, 1) if wind_speed_mph is not None else None,
                wind_direction=wind_direction,
                pressure_mb=round(pressure_mb, 1) if pressure_mb is not None else None,
                visibility_miles=round(visibility_miles, 1) if visibility_miles is not None else None,
                conditions=conditions,
                detailed_forecast=detailed_forecast,
                source="NOAA"
            )
            
            logger.info(f"🌤️ Retrieved NOAA weather: {conditions}, {temp_f}°F")
            return reading
            
        except Exception as e:
            logger.error(f"❌ Error parsing NOAA weather data: {e}")
            return None
    
    async def get_hourly_forecast(self, location: NOAALocation, hours: int = 48) -> List[NOAAWeatherReading]:
        """Get hourly forecast for a location"""
        url = f"{self.base_url}/gridpoints/{location.grid_id}/{location.grid_x},{location.grid_y}/forecast/hourly"
        data = await self._make_request(url)
        
        if not data or 'properties' not in data or 'periods' not in data['properties']:
            logger.warning(f"⚠️ Failed to get hourly forecast for {location.grid_id}/{location.grid_x},{location.grid_y}")
            return []
        
        forecast_readings = []
        periods = data['properties']['periods'][:hours]  # Limit to requested hours
        
        for period in periods:
            try:
                # Parse the period data
                start_time = period.get('startTime', datetime.now(timezone.utc).isoformat())
                temp_f = period.get('temperature')
                humidity = None  # Not always available in hourly forecast
                wind_speed = period.get('windSpeed', '0 mph')
                wind_direction = period.get('windDirection', 'Unknown')
                
                # Parse wind speed (format: "5 mph" or "5 to 10 mph")
                wind_speed_mph = self._parse_wind_speed(wind_speed)
                
                # Parse pressure and visibility (not always available)
                pressure_mb = None
                visibility_miles = None
                
                conditions = period.get('shortForecast', 'Unknown')
                detailed_forecast = period.get('detailedForecast', '')
                
                reading = NOAAWeatherReading(
                    timestamp=start_time,
                    temperature_f=temp_f,
                    humidity_percent=humidity,
                    wind_speed_mph=wind_speed_mph,
                    wind_direction=wind_direction,
                    pressure_mb=pressure_mb,
                    visibility_miles=visibility_miles,
                    conditions=conditions,
                    detailed_forecast=detailed_forecast,
                    source="NOAA_Forecast"
                )
                
                forecast_readings.append(reading)
                
            except Exception as e:
                logger.warning(f"⚠️ Error parsing forecast period: {e}")
                continue
        
        logger.info(f"📅 Retrieved {len(forecast_readings)} hourly forecast periods from NOAA")
        return forecast_readings
    
    async def get_active_alerts(self, latitude: float, longitude: float, area_filter: Optional[str] = None) -> List[NOAAAlert]:
        """Get active weather alerts for a location or area"""
        # Build URL for alerts
        if area_filter:
            # Filter by state or zone
            url = f"{self.base_url}/alerts/active?area={area_filter}"
        else:
            # Filter by point (lat,lon)
            lat = round(latitude, 4)
            lon = round(longitude, 4)
            url = f"{self.base_url}/alerts/active?point={lat},{lon}"
        
        data = await self._make_request(url)
        
        if not data or 'features' not in data:
            logger.warning(f"⚠️ No alert data received for location {latitude},{longitude}")
            return []
        
        alerts = []
        for feature in data['features']:
            try:
                props = feature.get('properties', {})
                
                alert = NOAAAlert(
                    alert_id=props.get('id', f"alert_{int(time.time())}"),
                    event=props.get('event', 'Unknown Event'),
                    severity=props.get('severity', 'Unknown'),
                    certainty=props.get('certainty', 'Unknown'),
                    urgency=props.get('urgency', 'Unknown'),
                    headline=props.get('headline', ''),
                    description=props.get('description', ''),
                    instruction=props.get('instruction'),
                    areas=props.get('areaDesc', '').split('; ') if props.get('areaDesc') else [],
                    effective=props.get('effective', ''),
                    expires=props.get('expires', ''),
                    sender=props.get('senderName', 'NWS'),
                    status=props.get('status', 'Unknown'),
                    message_type=props.get('messageType', 'Alert')
                )
                
                alerts.append(alert)
                
            except Exception as e:
                logger.warning(f"⚠️ Error parsing alert: {e}")
                continue
        
        logger.info(f"🚨 Retrieved {len(alerts)} active alerts from NOAA")
        return alerts
    
    async def get_alerts_by_state(self, state_code: str) -> List[NOAAAlert]:
        """Get all active alerts for a state (e.g., 'ID' for Idaho)"""
        return await self.get_active_alerts(0, 0, area_filter=state_code)
    
    def _degrees_to_direction(self, degrees: float) -> str:
        """Convert wind direction degrees to compass direction"""
        directions = [
            'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
            'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
        ]
        index = round(degrees / 22.5) % 16
        return directions[index]
    
    def _parse_wind_speed(self, wind_speed_str: str) -> Optional[float]:
        """Parse wind speed from NOAA string format"""
        if not wind_speed_str:
            return None
        
        # Extract numbers from string like "5 mph" or "5 to 10 mph"
        numbers = re.findall(r'\d+', wind_speed_str)
        if numbers:
            # If range (e.g., "5 to 10 mph"), take the average
            if len(numbers) >= 2:
                return (int(numbers[0]) + int(numbers[1])) / 2
            else:
                return float(numbers[0])
        
        return None
    
    async def test_api_connection(self) -> bool:
        """Test connection to NOAA API"""
        try:
            # Test with Washington DC coordinates
            test_lat, test_lon = 38.8894, -77.0352
            location = await self.get_location_info(test_lat, test_lon)
            
            if location:
                logger.info("✅ NOAA API connection test successful")
                return True
            else:
                logger.error("❌ NOAA API connection test failed")
                return False
                
        except Exception as e:
            logger.error(f"❌ NOAA API connection test error: {e}")
            return False

# Utility functions for coordinate conversion
def geocode_city_state(city: str, state: str) -> Optional[Tuple[float, float]]:
    """
    Basic geocoding for major US cities. In production, use a proper geocoding service.
    Returns (latitude, longitude) or None if not found.
    """
    # Simple lookup table for major cities
    city_coordinates = {
        'boise,id': (43.6150, -116.2023),
        'boise,idaho': (43.6150, -116.2023),
        'seattle,wa': (47.6062, -122.3321),
        'seattle,washington': (47.6062, -122.3321),
        'portland,or': (45.5152, -122.6784),
        'portland,oregon': (45.5152, -122.6784),
        'denver,co': (39.7392, -104.9903),
        'denver,colorado': (39.7392, -104.9903),
        'phoenix,az': (33.4484, -112.0740),
        'phoenix,arizona': (33.4484, -112.0740),
        'los angeles,ca': (34.0522, -118.2437),
        'los angeles,california': (34.0522, -118.2437),
        'san francisco,ca': (37.7749, -122.4194),
        'san francisco,california': (37.7749, -122.4194),
        'chicago,il': (41.8781, -87.6298),
        'chicago,illinois': (41.8781, -87.6298),
        'new york,ny': (40.7128, -74.0060),
        'new york,new york': (40.7128, -74.0060),
        'washington,dc': (38.8951, -77.0364),
        'miami,fl': (25.7617, -80.1918),
        'miami,florida': (25.7617, -80.1918)
    }
    
    key = f"{city.lower()},{state.lower()}"
    return city_coordinates.get(key)

# Example usage and testing functions
async def example_usage():
    """Example of how to use the NOAA Weather Service"""
    async with NOAAWeatherService() as noaa:
        # Test API connection
        if not await noaa.test_api_connection():
            print("❌ Failed to connect to NOAA API")
            return
        
        # Get location info for Boise, ID
        boise_coords = geocode_city_state("Boise", "ID")
        if not boise_coords:
            print("❌ Could not geocode Boise, ID")
            return
        
        lat, lon = boise_coords
        location = await noaa.get_location_info(lat, lon)
        
        if location:
            print(f"📍 Location: {location.city}, {location.state}")
            print(f"🗺️ Grid: {location.grid_id}/{location.grid_x},{location.grid_y}")
            
            # Get current weather
            current = await noaa.get_current_weather(location)
            if current:
                print(f"🌤️ Current: {current.conditions}, {current.temperature_f}°F")
            
            # Get hourly forecast
            forecast = await noaa.get_hourly_forecast(location, hours=6)
            print(f"📅 Got {len(forecast)} forecast periods")
            
            # Get active alerts
            alerts = await noaa.get_active_alerts(lat, lon)
            print(f"🚨 Active alerts: {len(alerts)}")
            for alert in alerts:
                print(f"  - {alert.event}: {alert.headline}")

if __name__ == "__main__":
    asyncio.run(example_usage())