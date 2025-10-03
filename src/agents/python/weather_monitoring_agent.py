#!/usr/bin/env python3
"""
Weather Monitoring Agent

Monitors hourly weather conditions for community services planning.
Simulates weather data collection and provides alerts for extreme conditions
that might affect shelter operations, outdoor events, or transportation services.

Features:
- Hourly weather data collection simulation
- 7-day weather monitoring with trend analysis
- Extreme weather alerting (temperature, precipitation, wind)
- Historical data tracking and analysis
- Integration with community services event planning

@license MIT
"""

import asyncio
import json
import sys
import time
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, asdict
from base_agent import BaseAgent, CrossLanguageMessage
# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Try to import NOAA service, fallback if not available
try:
    from noaa_weather_service import (
        NOAAWeatherService, 
        NOAALocation, 
        NOAAWeatherReading, 
        NOAAAlert,
        geocode_city_state
    )
    NOAA_AVAILABLE = True
except ImportError as e:
    logger.warning(f"NOAA service not available: {e}")
    NOAA_AVAILABLE = False
    NOAAWeatherService = None
    NOAALocation = None
    NOAAWeatherReading = None
    NOAAAlert = None
    geocode_city_state = None

@dataclass
class WeatherReading:
    """Represents a single weather reading"""
    timestamp: str
    temperature_f: float
    humidity_percent: float
    precipitation_inches: float
    wind_speed_mph: float
    wind_direction: str
    pressure_mb: float
    visibility_miles: float
    conditions: str
    uv_index: int
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'WeatherReading':
        return cls(**data)

@dataclass
class WeatherAlert:
    """Represents a weather alert for extreme conditions"""
    alert_id: str
    timestamp: str
    alert_type: str  # 'temperature', 'precipitation', 'wind', 'visibility'
    severity: str    # 'low', 'medium', 'high', 'extreme'
    message: str
    recommendations: List[str]
    affected_services: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class WeatherSimulator:
    """Simulates realistic weather patterns for testing"""
    
    def __init__(self, base_temp: float = 70.0, location: str = "Boise, ID"):
        self.base_temp = base_temp
        self.location = location
        self.current_conditions = {
            'temperature_trend': 0,
            'pressure_trend': 0,
            'storm_probability': 0.1
        }
    
    def generate_hourly_reading(self, hour_offset: int = 0) -> WeatherReading:
        """Generate a simulated weather reading"""
        timestamp = (datetime.now(timezone.utc) + timedelta(hours=hour_offset)).isoformat()
        
        # Temperature with daily and seasonal variation
        hour_of_day = (datetime.now().hour + hour_offset) % 24
        daily_temp_variation = 15 * (0.5 - abs(hour_of_day - 14) / 24)  # Peak at 2 PM
        temp_noise = random.normalvariate(0, 3)
        temperature = self.base_temp + daily_temp_variation + temp_noise + self.current_conditions['temperature_trend']
        
        # Humidity (inverse relationship with temperature)
        base_humidity = max(30, min(90, 80 - (temperature - self.base_temp) * 1.5))
        humidity = max(20, min(95, base_humidity + random.normalvariate(0, 10)))
        
        # Precipitation based on conditions
        precip_chance = random.random()
        if precip_chance < self.current_conditions['storm_probability']:
            precipitation = random.uniform(0.01, 0.5)
            if precip_chance < self.current_conditions['storm_probability'] * 0.2:
                precipitation = random.uniform(0.5, 2.0)  # Heavy rain
        else:
            precipitation = 0.0
        
        # Wind speed
        base_wind = 5 + random.uniform(0, 10)
        if precipitation > 0.1:
            base_wind += random.uniform(5, 20)  # Higher winds with storms
        wind_speed = max(0, base_wind + random.normalvariate(0, 3))
        
        # Wind direction
        directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
        wind_direction = random.choice(directions)
        
        # Atmospheric pressure
        base_pressure = 1013.25 + self.current_conditions['pressure_trend']
        pressure = base_pressure + random.normalvariate(0, 5)
        
        # Visibility
        visibility = 10.0
        if precipitation > 0.1:
            visibility = max(0.5, 10 - precipitation * 8)
        if humidity > 85:
            visibility = min(visibility, 5.0)
        
        # Conditions
        if precipitation > 0.5:
            conditions = "Heavy Rain" if temperature > 32 else "Heavy Snow"
        elif precipitation > 0.1:
            conditions = "Rain" if temperature > 32 else "Snow"
        elif humidity > 85:
            conditions = "Fog"
        elif wind_speed > 25:
            conditions = "Windy"
        elif temperature > 90:
            conditions = "Hot"
        elif temperature < 32:
            conditions = "Cold"
        else:
            conditions = "Clear"
        
        # UV Index (simplified)
        if 6 <= hour_of_day <= 18 and conditions in ["Clear", "Hot"]:
            uv_index = min(11, max(1, int((hour_of_day - 6) / 2) + random.randint(0, 2)))
        else:
            uv_index = 0
        
        # Update trends for next reading
        self._update_trends()
        
        return WeatherReading(
            timestamp=timestamp,
            temperature_f=round(temperature, 1),
            humidity_percent=round(humidity, 1),
            precipitation_inches=round(precipitation, 2),
            wind_speed_mph=round(wind_speed, 1),
            wind_direction=wind_direction,
            pressure_mb=round(pressure, 1),
            visibility_miles=round(visibility, 1),
            conditions=conditions,
            uv_index=uv_index
        )
    
    def _update_trends(self):
        """Update weather trends for more realistic simulation"""
        # Temperature trend changes
        if random.random() < 0.1:
            self.current_conditions['temperature_trend'] = random.uniform(-5, 5)
        
        # Pressure trend changes
        if random.random() < 0.15:
            self.current_conditions['pressure_trend'] = random.uniform(-10, 10)
        
        # Storm probability changes
        if random.random() < 0.2:
            self.current_conditions['storm_probability'] = max(0.05, min(0.8, 
                self.current_conditions['storm_probability'] + random.uniform(-0.2, 0.2)))

class WeatherMonitoringAgent(BaseAgent):
    """Weather monitoring agent for community services"""
    
    def __init__(self, agent_id: str, location: str = "Boise, ID", use_real_weather: bool = True):
        super().__init__(agent_id, "Weather Monitoring Agent", "1.0.0")
        self.location = location
        self.use_real_weather = use_real_weather
        self.simulator = WeatherSimulator(location=location)
        self.weather_data: List[WeatherReading] = []
        self.active_alerts: List[WeatherAlert] = []
        self.noaa_alerts: List[NOAAAlert] = []
        self.monitoring_active = False
        self.monitoring_task: Optional[asyncio.Task] = None
        self.noaa_service: Optional[NOAAWeatherService] = None
        self.noaa_location: Optional[NOAALocation] = None
        
        # Weather thresholds for alerts
        self.alert_thresholds = {
            'temperature_high': 95.0,      # °F
            'temperature_low': 20.0,       # °F
            'precipitation_heavy': 0.5,    # inches/hour
            'precipitation_extreme': 1.0,  # inches/hour
            'wind_high': 30.0,             # mph
            'wind_extreme': 50.0,          # mph
            'visibility_low': 2.0,         # miles
            'uv_extreme': 8
        }
        
        # Register custom message handlers
        self.register_weather_handlers()
        
        logger.info(f"🌤️ Weather Monitoring Agent initialized for {self.location} (Real weather: {self.use_real_weather})")
    
    def register_weather_handlers(self):
        """Register weather-specific message handlers"""
        self.register_handler('start_monitoring', self.handle_start_monitoring)
        self.register_handler('stop_monitoring', self.handle_stop_monitoring)
        self.register_handler('get_current_weather', self.handle_get_current_weather)
        self.register_handler('get_weather_history', self.handle_get_weather_history)
        self.register_handler('get_weather_forecast', self.handle_get_weather_forecast)
        self.register_handler('get_weather_alerts', self.handle_get_weather_alerts)
        self.register_handler('update_alert_thresholds', self.handle_update_alert_thresholds)
        self.register_handler('weather_analysis_request', self.handle_weather_analysis_request)
        self.register_handler('get_noaa_alerts', self.handle_get_noaa_alerts)
        self.register_handler('refresh_noaa_data', self.handle_refresh_noaa_data)
    
    async def initialize(self):
        """Initialize the weather monitoring agent"""
        logger.info("🚀 Initializing Weather Monitoring Agent")
        
        # Initialize NOAA service if using real weather and NOAA is available
        if self.use_real_weather and NOAA_AVAILABLE:
            try:
                self.noaa_service = NOAAWeatherService(
                    user_agent=f"CommunityServices/{self.version} (weather-monitoring+{self.agent_id}@community.org)"
                )
                await self.noaa_service.initialize()
                
                # Get location information from NOAA
                coords = geocode_city_state(*self.location.split(', '))
                if coords:
                    lat, lon = coords
                    self.noaa_location = await self.noaa_service.get_location_info(lat, lon)
                    if self.noaa_location:
                        logger.info(f"📍 NOAA location configured: {self.noaa_location.city}, {self.noaa_location.state}")
                    else:
                        logger.warning("⚠️ Failed to get NOAA location info, falling back to simulation")
                        self.use_real_weather = False
                else:
                    logger.warning(f"⚠️ Could not geocode location '{self.location}', falling back to simulation")
                    self.use_real_weather = False
                    
            except Exception as e:
                logger.error(f"❌ Failed to initialize NOAA service: {e}")
                logger.info("🔄 Falling back to simulated weather data")
                self.use_real_weather = False
        elif self.use_real_weather and not NOAA_AVAILABLE:
            logger.warning("⚠️ NOAA service not available (missing aiohttp), falling back to simulation")
            self.use_real_weather = False
        
        # Get initial weather reading
        if self.use_real_weather and self.noaa_service and self.noaa_location:
            try:
                noaa_reading = await self.noaa_service.get_current_weather(self.noaa_location)
                if noaa_reading:
                    # Convert NOAA reading to our internal format
                    initial_reading = self._convert_noaa_reading(noaa_reading)
                    self.weather_data.append(initial_reading)
                    logger.info(f"📊 Initial NOAA weather reading: {initial_reading.conditions}, {initial_reading.temperature_f}°F")
                else:
                    raise Exception("Failed to get NOAA weather reading")
            except Exception as e:
                logger.warning(f"⚠️ Failed to get initial NOAA reading: {e}")
                # Fall back to simulation for this reading
                initial_reading = self.simulator.generate_hourly_reading()
                self.weather_data.append(initial_reading)
                logger.info(f"📊 Initial simulated weather reading: {initial_reading.conditions}, {initial_reading.temperature_f}°F")
        else:
            # Use simulated data
            initial_reading = self.simulator.generate_hourly_reading()
            self.weather_data.append(initial_reading)
            logger.info(f"📊 Initial simulated weather reading: {initial_reading.conditions}, {initial_reading.temperature_f}°F")
        
        # Get initial NOAA alerts if available
        if self.use_real_weather and self.noaa_service and self.noaa_location:
            try:
                noaa_alerts = await self.noaa_service.get_active_alerts(
                    self.noaa_location.latitude, 
                    self.noaa_location.longitude
                )
                self.noaa_alerts = noaa_alerts
                logger.info(f"🚨 Retrieved {len(noaa_alerts)} active NOAA alerts")
            except Exception as e:
                logger.warning(f"⚠️ Failed to get initial NOAA alerts: {e}")
    
    async def cleanup(self):
        """Cleanup agent resources"""
        logger.info("🛑 Cleaning up Weather Monitoring Agent")
        if self.monitoring_active:
            await self.stop_weather_monitoring()
        
        # Close NOAA service
        if self.noaa_service:
            await self.noaa_service.close()
            self.noaa_service = None
    
    async def get_capabilities(self) -> List[str]:
        """Get agent capabilities"""
        capabilities = [
            "ping", "status", "heartbeat",
            "start_monitoring", "stop_monitoring", 
            "get_current_weather", "get_weather_history",
            "get_weather_forecast", "get_weather_alerts",
            "weather_analysis_request"
        ]
        
        # Add NOAA-specific capabilities always (they work in fallback mode too)
        capabilities.extend([
            "get_noaa_alerts", "refresh_noaa_data"
        ])
        
        return capabilities
    
    # Core weather monitoring functionality
    
    async def start_weather_monitoring(self, duration_hours: int = 168) -> bool:
        """Start hourly weather monitoring for specified duration (default: 1 week)"""
        if self.monitoring_active:
            logger.warning("Weather monitoring already active")
            return False
        
        self.monitoring_active = True
        self.monitoring_task = asyncio.create_task(
            self._monitoring_loop(duration_hours)
        )
        
        logger.info(f"🌤️ Started weather monitoring for {duration_hours} hours")
        return True
    
    async def stop_weather_monitoring(self) -> bool:
        """Stop weather monitoring"""
        if not self.monitoring_active:
            return False
        
        self.monitoring_active = False
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
        
        logger.info("🛑 Stopped weather monitoring")
        return True
    
    async def _monitoring_loop(self, duration_hours: int):
        """Main monitoring loop"""
        start_time = time.time()
        end_time = start_time + (duration_hours * 3600)
        
        try:
            while self.monitoring_active and time.time() < end_time:
                # Generate/fetch new weather reading
                if self.use_real_weather and self.noaa_service and self.noaa_location:
                    try:
                        # Get real weather data from NOAA
                        noaa_reading = await self.noaa_service.get_current_weather(self.noaa_location)
                        if noaa_reading:
                            reading = self._convert_noaa_reading(noaa_reading)
                        else:
                            # Fallback to simulation
                            reading = self.simulator.generate_hourly_reading()
                            logger.warning("⚠️ NOAA data unavailable, using simulation")
                    except Exception as e:
                        logger.warning(f"⚠️ NOAA API error, falling back to simulation: {e}")
                        reading = self.simulator.generate_hourly_reading()
                else:
                    # Use simulated data
                    reading = self.simulator.generate_hourly_reading()
                
                self.weather_data.append(reading)
                
                # Keep only last 7 days of data
                if len(self.weather_data) > 168:  # 7 days * 24 hours
                    self.weather_data = self.weather_data[-168:]
                
                logger.info(f"📊 Weather reading: {reading.conditions}, {reading.temperature_f}°F, "
                           f"Humidity: {reading.humidity_percent}%, Wind: {reading.wind_speed_mph}mph")
                
                # Check for alerts (both local and NOAA)
                await self._check_weather_alerts(reading)
                await self._check_noaa_alerts()
                
                # Send weather update to other agents
                await self._broadcast_weather_update(reading)
                
                # Wait for next hour (in simulation, wait 1 minute = 1 hour)
                # For real weather, wait longer between updates
                if self.use_real_weather:
                    await asyncio.sleep(300)  # 5 minutes for real weather
                else:
                    await asyncio.sleep(60)   # 1 minute = 1 simulated hour
                
        except asyncio.CancelledError:
            logger.info("🛑 Weather monitoring loop cancelled")
        except Exception as e:
            logger.error(f"❌ Error in weather monitoring loop: {e}")
        finally:
            self.monitoring_active = False
    
    async def _check_weather_alerts(self, reading: WeatherReading):
        """Check weather reading against alert thresholds"""
        alerts_generated = []
        
        # Temperature alerts
        if reading.temperature_f >= self.alert_thresholds['temperature_high']:
            alert = self._create_temperature_alert(reading, 'high')
            alerts_generated.append(alert)
        elif reading.temperature_f <= self.alert_thresholds['temperature_low']:
            alert = self._create_temperature_alert(reading, 'low')
            alerts_generated.append(alert)
        
        # Precipitation alerts
        if reading.precipitation_inches >= self.alert_thresholds['precipitation_extreme']:
            alert = self._create_precipitation_alert(reading, 'extreme')
            alerts_generated.append(alert)
        elif reading.precipitation_inches >= self.alert_thresholds['precipitation_heavy']:
            alert = self._create_precipitation_alert(reading, 'heavy')
            alerts_generated.append(alert)
        
        # Wind alerts
        if reading.wind_speed_mph >= self.alert_thresholds['wind_extreme']:
            alert = self._create_wind_alert(reading, 'extreme')
            alerts_generated.append(alert)
        elif reading.wind_speed_mph >= self.alert_thresholds['wind_high']:
            alert = self._create_wind_alert(reading, 'high')
            alerts_generated.append(alert)
        
        # Visibility alerts
        if reading.visibility_miles <= self.alert_thresholds['visibility_low']:
            alert = self._create_visibility_alert(reading)
            alerts_generated.append(alert)
        
        # UV alerts
        if reading.uv_index >= self.alert_thresholds['uv_extreme']:
            alert = self._create_uv_alert(reading)
            alerts_generated.append(alert)
        
        # Add new alerts and broadcast them
        for alert in alerts_generated:
            self.active_alerts.append(alert)
            await self._broadcast_weather_alert(alert)
            logger.warning(f"⚠️ Weather Alert: {alert.message}")
        
        # Clean up old alerts (remove alerts older than 6 hours)
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=6)
        self.active_alerts = [
            alert for alert in self.active_alerts 
            if datetime.fromisoformat(alert.timestamp.replace('Z', '+00:00')) > cutoff_time
        ]
    
    def _create_temperature_alert(self, reading: WeatherReading, temp_type: str) -> WeatherAlert:
        """Create temperature-related alert"""
        severity = 'extreme' if (
            (temp_type == 'high' and reading.temperature_f > 100) or
            (temp_type == 'low' and reading.temperature_f < 10)
        ) else 'high'
        
        if temp_type == 'high':
            message = f"Extreme heat warning: {reading.temperature_f}°F"
            recommendations = [
                "Open cooling centers for vulnerable populations",
                "Increase hydration stations at outdoor events",
                "Consider rescheduling outdoor activities",
                "Check on elderly and homeless individuals"
            ]
        else:
            message = f"Extreme cold warning: {reading.temperature_f}°F"
            recommendations = [
                "Open warming centers immediately",
                "Conduct wellness checks on homeless population",
                "Prepare for increased shelter demand",
                "Check heating systems in facilities"
            ]
        
        return WeatherAlert(
            alert_id=f"temp_{temp_type}_{int(time.time())}",
            timestamp=reading.timestamp,
            alert_type='temperature',
            severity=severity,
            message=message,
            recommendations=recommendations,
            affected_services=['shelter', 'outreach', 'outdoor_events', 'transportation']
        )
    
    def _create_precipitation_alert(self, reading: WeatherReading, precip_type: str) -> WeatherAlert:
        """Create precipitation-related alert"""
        severity = 'extreme' if precip_type == 'extreme' else 'high'
        message = f"{precip_type.title()} precipitation: {reading.precipitation_inches}\" per hour"
        
        recommendations = [
            "Monitor for flooding in low-lying areas",
            "Prepare emergency transportation",
            "Check drainage systems around facilities",
            "Consider postponing outdoor events"
        ]
        
        if precip_type == 'extreme':
            recommendations.extend([
                "Activate emergency response protocols",
                "Prepare evacuation routes",
                "Coordinate with emergency services"
            ])
        
        return WeatherAlert(
            alert_id=f"precip_{precip_type}_{int(time.time())}",
            timestamp=reading.timestamp,
            alert_type='precipitation',
            severity=severity,
            message=message,
            recommendations=recommendations,
            affected_services=['transportation', 'outdoor_events', 'facility_operations']
        )
    
    def _create_wind_alert(self, reading: WeatherReading, wind_type: str) -> WeatherAlert:
        """Create wind-related alert"""
        severity = 'extreme' if wind_type == 'extreme' else 'high'
        message = f"{wind_type.title()} winds: {reading.wind_speed_mph} mph from {reading.wind_direction}"
        
        recommendations = [
            "Secure outdoor equipment and signage",
            "Check building integrity",
            "Avoid outdoor activities",
            "Monitor for power outages"
        ]
        
        if wind_type == 'extreme':
            recommendations.extend([
                "Consider facility evacuation if necessary",
                "Prepare for extended power outages",
                "Coordinate with emergency services"
            ])
        
        return WeatherAlert(
            alert_id=f"wind_{wind_type}_{int(time.time())}",
            timestamp=reading.timestamp,
            alert_type='wind',
            severity=severity,
            message=message,
            recommendations=recommendations,
            affected_services=['facility_operations', 'outdoor_events', 'transportation']
        )
    
    def _create_visibility_alert(self, reading: WeatherReading) -> WeatherAlert:
        """Create visibility-related alert"""
        return WeatherAlert(
            alert_id=f"visibility_{int(time.time())}",
            timestamp=reading.timestamp,
            alert_type='visibility',
            severity='medium',
            message=f"Low visibility conditions: {reading.visibility_miles} miles",
            recommendations=[
                "Use caution with transportation services",
                "Increase lighting at outdoor facilities",
                "Consider delaying non-essential travel",
                "Enhance safety protocols for outdoor staff"
            ],
            affected_services=['transportation', 'outreach', 'outdoor_events']
        )
    
    def _create_uv_alert(self, reading: WeatherReading) -> WeatherAlert:
        """Create UV index alert"""
        return WeatherAlert(
            alert_id=f"uv_{int(time.time())}",
            timestamp=reading.timestamp,
            alert_type='uv',
            severity='medium',
            message=f"Extreme UV levels: Index {reading.uv_index}",
            recommendations=[
                "Provide sunscreen at outdoor events",
                "Ensure shaded areas are available",
                "Limit prolonged outdoor exposure",
                "Educate staff about UV protection"
            ],
            affected_services=['outdoor_events', 'outreach', 'recreation']
        )
    
    async def _broadcast_weather_update(self, reading: WeatherReading):
        """Broadcast weather update to other agents"""
        message = CrossLanguageMessage(
            msg_id=f"weather_update_{int(time.time() * 1000)}",
            msg_type="weather_update",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination={"broadcast": True},
            payload={
                "location": self.location,
                "weather_data": reading.to_dict(),
                "data_quality": "simulated"
            },
            metadata={
                "priority": "normal",
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(message)
    
    async def _broadcast_weather_alert(self, alert: WeatherAlert):
        """Broadcast weather alert to other agents"""
        message = CrossLanguageMessage(
            msg_id=f"weather_alert_{int(time.time() * 1000)}",
            msg_type="weather_alert",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination={"broadcast": True},
            payload={
                "location": self.location,
                "alert": alert.to_dict()
            },
            metadata={
                "priority": "high",
                "retryCount": 0,
                "maxRetries": 3,
                "timeoutMs": 5000
            }
        )
        await self.send_message(message)
    
    def get_weather_analysis(self, hours_back: int = 24) -> Dict[str, Any]:
        """Analyze weather trends over specified period"""
        if not self.weather_data:
            return {"error": "No weather data available"}
        
        # Get data from specified time period
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        recent_data = [
            reading for reading in self.weather_data
            if datetime.fromisoformat(reading.timestamp.replace('Z', '+00:00')) > cutoff_time
        ]
        
        if not recent_data:
            return {"error": f"No data available for last {hours_back} hours"}
        
        # Calculate statistics
        temps = [r.temperature_f for r in recent_data]
        humidity = [r.humidity_percent for r in recent_data]
        precipitation = [r.precipitation_inches for r in recent_data]
        wind_speeds = [r.wind_speed_mph for r in recent_data]
        
        analysis = {
            "period": f"Last {hours_back} hours",
            "data_points": len(recent_data),
            "temperature": {
                "current": recent_data[-1].temperature_f,
                "min": min(temps),
                "max": max(temps),
                "avg": round(sum(temps) / len(temps), 1),
                "trend": "rising" if temps[-1] > temps[0] else "falling" if temps[-1] < temps[0] else "stable"
            },
            "humidity": {
                "current": recent_data[-1].humidity_percent,
                "min": min(humidity),
                "max": max(humidity),
                "avg": round(sum(humidity) / len(humidity), 1)
            },
            "precipitation": {
                "total": round(sum(precipitation), 2),
                "max_hourly": max(precipitation),
                "hours_with_precip": len([p for p in precipitation if p > 0])
            },
            "wind": {
                "current_speed": recent_data[-1].wind_speed_mph,
                "current_direction": recent_data[-1].wind_direction,
                "max_speed": max(wind_speeds),
                "avg_speed": round(sum(wind_speeds) / len(wind_speeds), 1)
            },
            "conditions": {
                "current": recent_data[-1].conditions,
                "conditions_summary": self._get_conditions_summary(recent_data)
            },
            "alerts_active": len(self.active_alerts)
        }
        
        return analysis
    
    def _get_conditions_summary(self, data: List[WeatherReading]) -> Dict[str, int]:
        """Get summary of weather conditions frequency"""
        conditions_count = {}
        for reading in data:
            condition = reading.conditions
            conditions_count[condition] = conditions_count.get(condition, 0) + 1
        return conditions_count
    
    # NOAA Integration Helper Methods
    
    def _convert_noaa_reading(self, noaa_reading: NOAAWeatherReading) -> WeatherReading:
        """Convert NOAA weather reading to internal format"""
        return WeatherReading(
            timestamp=noaa_reading.timestamp,
            temperature_f=noaa_reading.temperature_f or 70.0,  # Default if None
            humidity_percent=noaa_reading.humidity_percent or 50.0,
            precipitation_inches=0.0,  # NOAA current doesn't include precipitation rate
            wind_speed_mph=noaa_reading.wind_speed_mph or 0.0,
            wind_direction=noaa_reading.wind_direction or "N",
            pressure_mb=noaa_reading.pressure_mb or 1013.0,
            visibility_miles=noaa_reading.visibility_miles or 10.0,
            conditions=noaa_reading.conditions,
            uv_index=0  # NOAA current weather doesn't include UV
        )
    
    async def _check_noaa_alerts(self):
        """Check for new NOAA alerts and broadcast them"""
        if not (self.use_real_weather and self.noaa_service and self.noaa_location and NOAA_AVAILABLE):
            return
        
        try:
            # Get current NOAA alerts
            current_alerts = await self.noaa_service.get_active_alerts(
                self.noaa_location.latitude,
                self.noaa_location.longitude
            )
            
            # Find new alerts (not in our current list)
            existing_alert_ids = {alert.alert_id for alert in self.noaa_alerts}
            new_alerts = [alert for alert in current_alerts if alert.alert_id not in existing_alert_ids]
            
            # Update our alert list
            self.noaa_alerts = current_alerts
            
            # Broadcast new alerts
            for alert in new_alerts:
                await self._broadcast_noaa_alert(alert)
                logger.warning(f"🚨 New NOAA Alert: {alert.event} - {alert.headline}")
                
        except Exception as e:
            logger.error(f"❌ Error checking NOAA alerts: {e}")
    
    async def _broadcast_noaa_alert(self, alert: NOAAAlert):
        """Broadcast NOAA weather alert to other agents"""
        message = CrossLanguageMessage(
            msg_id=f"noaa_alert_{int(time.time() * 1000)}",
            msg_type="noaa_weather_alert",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination={"broadcast": True},
            payload={
                "location": self.location,
                "noaa_location": self.noaa_location.to_dict() if self.noaa_location else None,
                "alert": alert.to_dict()
            },
            metadata={
                "priority": "high" if alert.severity in ["Extreme", "Severe"] else "normal",
                "retryCount": 0,
                "maxRetries": 3,
                "timeoutMs": 5000
            }
        )
        await self.send_message(message)
    
    # Message handlers
    
    async def handle_start_monitoring(self, message: CrossLanguageMessage):
        """Handle start monitoring request"""
        duration = message.payload.get('duration_hours', 168)  # Default 1 week
        success = await self.start_weather_monitoring(duration)
        
        response = CrossLanguageMessage(
            msg_id=f"monitoring_response_{int(time.time() * 1000)}",
            msg_type="monitoring_response",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination=message.source,
            payload={
                "success": success,
                "duration_hours": duration,
                "message": "Weather monitoring started" if success else "Weather monitoring already active"
            },
            metadata={
                "priority": "normal",
                "correlationId": message.id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(response)
    
    async def handle_stop_monitoring(self, message: CrossLanguageMessage):
        """Handle stop monitoring request"""
        success = await self.stop_weather_monitoring()
        
        response = CrossLanguageMessage(
            msg_id=f"monitoring_response_{int(time.time() * 1000)}",
            msg_type="monitoring_response",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination=message.source,
            payload={
                "success": success,
                "message": "Weather monitoring stopped" if success else "Weather monitoring was not active"
            },
            metadata={
                "priority": "normal",
                "correlationId": message.id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(response)
    
    async def handle_get_current_weather(self, message: CrossLanguageMessage):
        """Handle current weather request"""
        current_weather = self.weather_data[-1] if self.weather_data else None
        
        response = CrossLanguageMessage(
            msg_id=f"weather_response_{int(time.time() * 1000)}",
            msg_type="weather_response",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination=message.source,
            payload={
                "location": self.location,
                "current_weather": current_weather.to_dict() if current_weather else None,
                "monitoring_active": self.monitoring_active
            },
            metadata={
                "priority": "normal",
                "correlationId": message.id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(response)
    
    async def handle_get_weather_history(self, message: CrossLanguageMessage):
        """Handle weather history request"""
        hours_back = message.payload.get('hours_back', 24)
        
        # Get historical data
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        historical_data = [
            reading.to_dict() for reading in self.weather_data
            if datetime.fromisoformat(reading.timestamp.replace('Z', '+00:00')) > cutoff_time
        ]
        
        response = CrossLanguageMessage(
            msg_id=f"history_response_{int(time.time() * 1000)}",
            msg_type="weather_history_response",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination=message.source,
            payload={
                "location": self.location,
                "hours_requested": hours_back,
                "data_points": len(historical_data),
                "weather_history": historical_data
            },
            metadata={
                "priority": "normal",
                "correlationId": message.id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(response)
    
    async def handle_get_weather_forecast(self, message: CrossLanguageMessage):
        """Handle weather forecast request (simulated)"""
        hours_ahead = message.payload.get('hours_ahead', 24)
        
        # Generate simulated forecast
        forecast_data = []
        for i in range(1, hours_ahead + 1):
            forecast_reading = self.simulator.generate_hourly_reading(i)
            forecast_data.append(forecast_reading.to_dict())
        
        response = CrossLanguageMessage(
            msg_id=f"forecast_response_{int(time.time() * 1000)}",
            msg_type="weather_forecast_response",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination=message.source,
            payload={
                "location": self.location,
                "hours_ahead": hours_ahead,
                "forecast": forecast_data,
                "data_quality": "simulated"
            },
            metadata={
                "priority": "normal",
                "correlationId": message.id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(response)
    
    async def handle_get_weather_alerts(self, message: CrossLanguageMessage):
        """Handle weather alerts request"""
        response = CrossLanguageMessage(
            msg_id=f"alerts_response_{int(time.time() * 1000)}",
            msg_type="weather_alerts_response",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination=message.source,
            payload={
                "location": self.location,
                "active_alerts": [alert.to_dict() for alert in self.active_alerts],
                "alert_count": len(self.active_alerts)
            },
            metadata={
                "priority": "normal",
                "correlationId": message.id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(response)
    
    async def handle_update_alert_thresholds(self, message: CrossLanguageMessage):
        """Handle alert threshold update request"""
        new_thresholds = message.payload.get('thresholds', {})
        
        # Update thresholds
        for key, value in new_thresholds.items():
            if key in self.alert_thresholds:
                self.alert_thresholds[key] = value
        
        response = CrossLanguageMessage(
            msg_id=f"thresholds_response_{int(time.time() * 1000)}",
            msg_type="thresholds_update_response",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination=message.source,
            payload={
                "success": True,
                "updated_thresholds": self.alert_thresholds
            },
            metadata={
                "priority": "normal",
                "correlationId": message.id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(response)
    
    async def handle_weather_analysis_request(self, message: CrossLanguageMessage):
        """Handle weather analysis request"""
        hours_back = message.payload.get('hours_back', 24)
        analysis = self.get_weather_analysis(hours_back)
        
        response = CrossLanguageMessage(
            msg_id=f"analysis_response_{int(time.time() * 1000)}",
            msg_type="weather_analysis_response",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination=message.source,
            payload={
                "location": self.location,
                "analysis": analysis
            },
            metadata={
                "priority": "normal",
                "correlationId": message.id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(response)
    
    async def handle_get_noaa_alerts(self, message: CrossLanguageMessage):
        """Handle NOAA alerts request"""
        response_payload = {
            "location": self.location,
            "noaa_enabled": self.use_real_weather,
            "fallback_mode": not (self.use_real_weather and NOAA_AVAILABLE),
            "alerts": [alert.to_dict() for alert in self.noaa_alerts] if NOAA_AVAILABLE else [],
            "alert_count": len(self.noaa_alerts) if NOAA_AVAILABLE else 0
        }
        
        if self.noaa_location and NOAA_AVAILABLE:
            response_payload["noaa_location"] = self.noaa_location.to_dict()
        
        response = CrossLanguageMessage(
            msg_id=f"noaa_alerts_response_{int(time.time() * 1000)}",
            msg_type="noaa_alerts_response",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination=message.source,
            payload=response_payload,
            metadata={
                "priority": "normal",
                "correlationId": message.id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(response)
    
    async def handle_refresh_noaa_data(self, message: CrossLanguageMessage):
        """Handle request to refresh NOAA data"""
        success = False
        error_message = None
        
        if self.use_real_weather and self.noaa_service and self.noaa_location and NOAA_AVAILABLE:
            try:
                # Refresh current weather
                noaa_reading = await self.noaa_service.get_current_weather(self.noaa_location)
                if noaa_reading:
                    reading = self._convert_noaa_reading(noaa_reading)
                    self.weather_data.append(reading)
                    
                    # Keep only last 7 days of data
                    if len(self.weather_data) > 168:
                        self.weather_data = self.weather_data[-168:]
                
                # Refresh alerts
                await self._check_noaa_alerts()
                
                success = True
                logger.info("🔄 NOAA data refreshed successfully")
                
            except Exception as e:
                error_message = str(e)
                logger.error(f"❌ Failed to refresh NOAA data: {e}")
        else:
            error_message = "NOAA service not available or not enabled"
            if not NOAA_AVAILABLE:
                error_message += " (missing aiohttp dependency)"
        
        response = CrossLanguageMessage(
            msg_id=f"refresh_response_{int(time.time() * 1000)}",
            msg_type="noaa_data_refreshed",
            source={
                "agentId": self.agent_id,
                "language": "python",
                "runtime": "python3"
            },
            destination=message.source,
            payload={
                "success": success,
                "error": error_message,
                "noaa_enabled": self.use_real_weather,
                "fallback_mode": not (self.use_real_weather and NOAA_AVAILABLE),
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            metadata={
                "priority": "normal",
                "correlationId": message.id,
                "retryCount": 0,
                "maxRetries": 0,
                "timeoutMs": 5000
            }
        )
        await self.send_message(response)

# Main entry point for the agent
async def main():
    """Main entry point for the weather monitoring agent"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Weather Monitoring Agent')
    parser.add_argument('--agent-id', required=True, help='Unique agent identifier')
    parser.add_argument('--location', default='Boise, ID', help='Weather monitoring location')
    parser.add_argument('--log-level', default='INFO', help='Logging level')
    parser.add_argument('--use-simulation', action='store_true', help='Use simulated weather instead of NOAA')
    args = parser.parse_args()
    
    # Set log level
    logging.getLogger().setLevel(getattr(logging, args.log_level.upper()))
    
    logger.info(f"🌤️ Starting Weather Monitoring Agent: {args.agent_id}")
    
    try:
        # Create and start the weather agent
        use_real_weather = not args.use_simulation
        agent = WeatherMonitoringAgent(args.agent_id, args.location, use_real_weather)
        await agent.start()
    except KeyboardInterrupt:
        logger.info("🛑 Weather agent stopped by user")
    except Exception as e:
        logger.error(f"❌ Weather agent failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())