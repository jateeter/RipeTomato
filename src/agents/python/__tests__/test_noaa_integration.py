#!/usr/bin/env python3
"""
Unit Tests for NOAA Weather Service Integration

Comprehensive test suite for the NOAA weather service integration including:
- NOAA API communication and data parsing
- Weather data conversion and validation
- Alert detection and broadcasting
- Error handling and fallback mechanisms
- Rate limiting and API best practices

@license MIT
"""

import asyncio
import json
import sys
import os
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any, List

# Add the parent directory to the path to import the agent modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from noaa_weather_service import (
    NOAAWeatherService,
    NOAALocation,
    NOAAWeatherReading,
    NOAAAlert,
    geocode_city_state
)
from weather_monitoring_agent import WeatherMonitoringAgent
from base_agent import CrossLanguageMessage

class SimpleTestRunner:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
    
    def assert_true(self, condition, message="Assertion failed"):
        self.tests_run += 1
        if condition:
            self.tests_passed += 1
            print(f"✅ PASS: {message}")
        else:
            self.tests_failed += 1
            print(f"❌ FAIL: {message}")
    
    def assert_equal(self, actual, expected, message="Values not equal"):
        self.tests_run += 1
        if actual == expected:
            self.tests_passed += 1
            print(f"✅ PASS: {message}")
        else:
            self.tests_failed += 1
            print(f"❌ FAIL: {message} (expected: {expected}, actual: {actual})")
    
    def assert_not_none(self, value, message="Value is None"):
        self.tests_run += 1
        if value is not None:
            self.tests_passed += 1
            print(f"✅ PASS: {message}")
        else:
            self.tests_failed += 1
            print(f"❌ FAIL: {message}")
    
    def assert_in(self, item, container, message="Item not in container"):
        self.tests_run += 1
        if item in container:
            self.tests_passed += 1
            print(f"✅ PASS: {message}")
        else:
            self.tests_failed += 1
            print(f"❌ FAIL: {message}")
    
    def print_summary(self):
        print(f"\n📊 Test Results:")
        print(f"   Tests run: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_failed}")
        if self.tests_failed == 0:
            print("🎉 All tests passed!")
            return True
        else:
            print("💥 Some tests failed!")
            return False

class MockNOAAResponse:
    """Mock NOAA API responses for testing"""
    
    @staticmethod
    def get_points_response():
        """Mock response for /points endpoint"""
        return {
            "properties": {
                "gridId": "BOI",
                "gridX": 73,
                "gridY": 87,
                "cwa": "BOI",
                "relativeLocation": {
                    "properties": {
                        "city": "Boise",
                        "state": "ID"
                    }
                }
            }
        }
    
    @staticmethod
    def get_gridpoint_response():
        """Mock response for /gridpoints endpoint"""
        return {
            "properties": {
                "temperature": {
                    "values": [{"value": 20.0}]  # 20°C = 68°F
                },
                "relativeHumidity": {
                    "values": [{"value": 65.0}]
                },
                "windSpeed": {
                    "values": [{"value": 5.0}]  # 5 m/s
                },
                "windDirection": {
                    "values": [{"value": 270.0}]  # West
                },
                "pressure": {
                    "values": [{"value": 101325.0}]  # Pa
                },
                "visibility": {
                    "values": [{"value": 16093.44}]  # 10 miles in meters
                }
            }
        }
    
    @staticmethod
    def get_forecast_response():
        """Mock response for /gridpoints/.../forecast endpoint"""
        return {
            "properties": {
                "periods": [
                    {
                        "name": "This Afternoon",
                        "startTime": "2024-01-15T14:00:00-07:00",
                        "shortForecast": "Partly Cloudy",
                        "detailedForecast": "Partly cloudy with a high near 68 degrees."
                    }
                ]
            }
        }
    
    @staticmethod
    def get_hourly_forecast_response():
        """Mock response for /gridpoints/.../forecast/hourly endpoint"""
        return {
            "properties": {
                "periods": [
                    {
                        "startTime": "2024-01-15T14:00:00-07:00",
                        "temperature": 68,
                        "windSpeed": "5 mph",
                        "windDirection": "W",
                        "shortForecast": "Partly Cloudy",
                        "detailedForecast": "Partly cloudy conditions."
                    },
                    {
                        "startTime": "2024-01-15T15:00:00-07:00",
                        "temperature": 70,
                        "windSpeed": "7 mph",
                        "windDirection": "NW",
                        "shortForecast": "Sunny",
                        "detailedForecast": "Sunny skies."
                    }
                ]
            }
        }
    
    @staticmethod
    def get_alerts_response():
        """Mock response for /alerts endpoint"""
        return {
            "features": [
                {
                    "properties": {
                        "id": "urn:oid:2.49.0.1.840.0.abc123",
                        "event": "Heat Advisory",
                        "severity": "Moderate",
                        "certainty": "Likely",
                        "urgency": "Expected",
                        "headline": "Heat Advisory in effect from 12 PM to 8 PM MDT",
                        "description": "Temperatures up to 100 degrees expected.",
                        "instruction": "Drink plenty of fluids and stay in air conditioning.",
                        "areaDesc": "Ada County; Canyon County",
                        "effective": "2024-01-15T12:00:00-07:00",
                        "expires": "2024-01-15T20:00:00-07:00",
                        "senderName": "NWS Boise ID",
                        "status": "Actual",
                        "messageType": "Alert"
                    }
                }
            ]
        }

async def test_noaa_service_initialization():
    """Test NOAA service initialization and configuration"""
    print("\n🌐 Testing NOAA Service Initialization...")
    test = SimpleTestRunner()
    
    # Test service creation
    service = NOAAWeatherService("TestAgent/1.0 (test@example.com)")
    test.assert_equal(service.base_url, "https://api.weather.gov", "Base URL set correctly")
    test.assert_equal(service.user_agent, "TestAgent/1.0 (test@example.com)", "User agent set correctly")
    test.assert_true(service.session is None, "Session not initialized yet")
    
    # Test async context manager
    async with NOAAWeatherService() as service:
        test.assert_not_none(service.session, "Session initialized in context manager")
    
    return test.print_summary()

async def test_geocoding_functionality():
    """Test city geocoding functionality"""
    print("\n📍 Testing Geocoding Functionality...")
    test = SimpleTestRunner()
    
    # Test known cities
    boise_coords = geocode_city_state("Boise", "ID")
    test.assert_not_none(boise_coords, "Boise coordinates found")
    test.assert_equal(boise_coords[0], 43.6150, "Boise latitude correct")
    test.assert_equal(boise_coords[1], -116.2023, "Boise longitude correct")
    
    # Test case insensitive
    seattle_coords = geocode_city_state("SEATTLE", "wa")
    test.assert_not_none(seattle_coords, "Seattle coordinates found (case insensitive)")
    
    # Test unknown city
    unknown_coords = geocode_city_state("Unknown", "ZZ")
    test.assert_true(unknown_coords is None, "Unknown city returns None")
    
    return test.print_summary()

async def test_noaa_data_structures():
    """Test NOAA data structure creation and serialization"""
    print("\n📊 Testing NOAA Data Structures...")
    test = SimpleTestRunner()
    
    # Test NOAALocation
    location = NOAALocation(
        latitude=43.6150,
        longitude=-116.2023,
        grid_id="BOI",
        grid_x=73,
        grid_y=87,
        forecast_office="BOI",
        city="Boise",
        state="ID"
    )
    
    location_dict = location.to_dict()
    test.assert_true(isinstance(location_dict, dict), "Location serializes to dict")
    test.assert_equal(location_dict['city'], "Boise", "City preserved in serialization")
    test.assert_equal(location_dict['grid_id'], "BOI", "Grid ID preserved")
    
    # Test NOAAWeatherReading
    reading = NOAAWeatherReading(
        timestamp="2024-01-15T14:00:00Z",
        temperature_f=68.0,
        humidity_percent=65.0,
        wind_speed_mph=11.2,
        wind_direction="W",
        pressure_mb=1013.25,
        visibility_miles=10.0,
        conditions="Partly Cloudy",
        detailed_forecast="Partly cloudy conditions."
    )
    
    reading_dict = reading.to_dict()
    test.assert_true(isinstance(reading_dict, dict), "Reading serializes to dict")
    test.assert_equal(reading_dict['temperature_f'], 68.0, "Temperature preserved")
    test.assert_equal(reading_dict['source'], "NOAA", "Source set to NOAA")
    
    # Test NOAAAlert
    alert = NOAAAlert(
        alert_id="test_alert_001",
        event="Heat Advisory",
        severity="Moderate",
        certainty="Likely",
        urgency="Expected",
        headline="Heat Advisory in effect",
        description="High temperatures expected",
        instruction="Stay hydrated",
        areas=["Ada County", "Canyon County"],
        effective="2024-01-15T12:00:00Z",
        expires="2024-01-15T20:00:00Z",
        sender="NWS Boise",
        status="Actual",
        message_type="Alert"
    )
    
    alert_dict = alert.to_dict()
    test.assert_true(isinstance(alert_dict, dict), "Alert serializes to dict")
    test.assert_equal(alert_dict['event'], "Heat Advisory", "Event preserved")
    test.assert_equal(len(alert_dict['areas']), 2, "Areas list preserved")
    
    return test.print_summary()

async def test_noaa_api_requests():
    """Test NOAA API request handling with mocked responses"""
    print("\n🔗 Testing NOAA API Requests...")
    test = SimpleTestRunner()
    
    async with NOAAWeatherService() as service:
        # Mock the _make_request method
        service._make_request = AsyncMock()
        
        # Test location info request
        service._make_request.return_value = MockNOAAResponse.get_points_response()
        location = await service.get_location_info(43.6150, -116.2023)
        
        test.assert_not_none(location, "Location info retrieved")
        test.assert_equal(location.city, "Boise", "City parsed correctly")
        test.assert_equal(location.grid_id, "BOI", "Grid ID parsed correctly")
        test.assert_equal(location.grid_x, 73, "Grid X parsed correctly")
        
        # Verify caching
        cached_location = await service.get_location_info(43.6150, -116.2023)
        test.assert_equal(location.city, cached_location.city, "Location cached correctly")
        
        # Test current weather request
        service._make_request.side_effect = [
            MockNOAAResponse.get_gridpoint_response(),
            MockNOAAResponse.get_forecast_response()
        ]
        
        weather = await service.get_current_weather(location)
        test.assert_not_none(weather, "Weather data retrieved")
        test.assert_equal(weather.temperature_f, 68.0, "Temperature converted correctly")
        test.assert_equal(weather.wind_direction, "W", "Wind direction parsed correctly")
        test.assert_equal(weather.conditions, "Partly Cloudy", "Conditions parsed correctly")
        
        # Test hourly forecast request
        service._make_request.return_value = MockNOAAResponse.get_hourly_forecast_response()
        forecast = await service.get_hourly_forecast(location, hours=2)
        
        test.assert_equal(len(forecast), 2, "Correct number of forecast periods")
        test.assert_equal(forecast[0].temperature_f, 68, "First period temperature correct")
        test.assert_equal(forecast[1].temperature_f, 70, "Second period temperature correct")
        
        # Test alerts request
        service._make_request.return_value = MockNOAAResponse.get_alerts_response()
        alerts = await service.get_active_alerts(43.6150, -116.2023)
        
        test.assert_equal(len(alerts), 1, "Correct number of alerts")
        test.assert_equal(alerts[0].event, "Heat Advisory", "Alert event parsed correctly")
        test.assert_equal(alerts[0].severity, "Moderate", "Alert severity parsed correctly")
        test.assert_in("Ada County", alerts[0].areas, "Alert areas parsed correctly")
    
    return test.print_summary()

async def test_noaa_error_handling():
    """Test NOAA service error handling and fallback mechanisms"""
    print("\n🛡️ Testing NOAA Error Handling...")
    test = SimpleTestRunner()
    
    async with NOAAWeatherService() as service:
        # Test API failure handling
        service._make_request = AsyncMock(return_value=None)
        
        location = await service.get_location_info(43.6150, -116.2023)
        test.assert_true(location is None, "Handles API failure for location")
        
        # Test malformed response handling
        service._make_request.return_value = {"invalid": "response"}
        location = await service.get_location_info(43.6150, -116.2023)
        test.assert_true(location is None, "Handles malformed location response")
        
        # Test weather data error handling
        mock_location = NOAALocation(43.6150, -116.2023, "BOI", 73, 87, "BOI", "Boise", "ID")
        service._make_request.return_value = None
        weather = await service.get_current_weather(mock_location)
        test.assert_true(weather is None, "Handles weather API failure")
        
        # Test alerts error handling
        alerts = await service.get_active_alerts(43.6150, -116.2023)
        test.assert_equal(len(alerts), 0, "Handles alerts API failure gracefully")
    
    return test.print_summary()

async def test_weather_agent_noaa_integration():
    """Test weather monitoring agent integration with NOAA service"""
    print("\n🤖 Testing Weather Agent NOAA Integration...")
    test = SimpleTestRunner()
    
    # Create agent with NOAA enabled
    agent = WeatherMonitoringAgent("test_noaa_agent", "Boise, ID", use_real_weather=True)
    
    # Mock the NOAA service
    mock_noaa = AsyncMock()
    mock_noaa.initialize = AsyncMock()
    mock_noaa.close = AsyncMock()
    mock_noaa.get_location_info = AsyncMock()
    mock_noaa.get_current_weather = AsyncMock()
    mock_noaa.get_active_alerts = AsyncMock()
    
    # Configure mock responses
    mock_location = NOAALocation(43.6150, -116.2023, "BOI", 73, 87, "BOI", "Boise", "ID")
    mock_noaa.get_location_info.return_value = mock_location
    
    mock_weather = NOAAWeatherReading(
        timestamp="2024-01-15T14:00:00Z",
        temperature_f=72.5,
        humidity_percent=58.0,
        wind_speed_mph=8.5,
        wind_direction="NW",
        pressure_mb=1013.2,
        visibility_miles=10.0,
        conditions="Clear",
        detailed_forecast="Clear skies."
    )
    mock_noaa.get_current_weather.return_value = mock_weather
    
    mock_alerts = [
        NOAAAlert(
            alert_id="test_alert",
            event="Heat Advisory",
            severity="Moderate",
            certainty="Likely",
            urgency="Expected",
            headline="Heat Advisory",
            description="Hot weather",
            instruction="Stay cool",
            areas=["Ada County"],
            effective="2024-01-15T12:00:00Z",
            expires="2024-01-15T20:00:00Z",
            sender="NWS",
            status="Actual",
            message_type="Alert"
        )
    ]
    mock_noaa.get_active_alerts.return_value = mock_alerts
    
    # Patch the NOAAWeatherService constructor
    with patch('weather_monitoring_agent.NOAAWeatherService', return_value=mock_noaa):
        with patch('weather_monitoring_agent.geocode_city_state', return_value=(43.6150, -116.2023)):
            # Initialize the agent
            await agent.initialize()
            
            test.assert_true(agent.use_real_weather, "Real weather enabled")
            test.assert_not_none(agent.noaa_service, "NOAA service initialized")
            test.assert_not_none(agent.noaa_location, "NOAA location set")
            test.assert_equal(len(agent.weather_data), 1, "Initial weather reading created")
            test.assert_equal(len(agent.noaa_alerts), 1, "Initial NOAA alerts retrieved")
            
            # Test capabilities include NOAA features
            capabilities = await agent.get_capabilities()
            test.assert_in("get_noaa_alerts", capabilities, "NOAA alerts capability present")
            test.assert_in("refresh_noaa_data", capabilities, "NOAA refresh capability present")
            
            # Test NOAA conversion
            converted = agent._convert_noaa_reading(mock_weather)
            test.assert_equal(converted.temperature_f, 72.5, "NOAA temperature converted")
            test.assert_equal(converted.conditions, "Clear", "NOAA conditions converted")
            
            # Cleanup
            await agent.cleanup()
    
    return test.print_summary()

async def test_noaa_message_handlers():
    """Test NOAA-specific message handlers"""
    print("\n💬 Testing NOAA Message Handlers...")
    test = SimpleTestRunner()
    
    # Create agent with NOAA enabled
    agent = WeatherMonitoringAgent("test_handlers", "Boise, ID", use_real_weather=True)
    
    # Mock NOAA components
    mock_location = NOAALocation(43.6150, -116.2023, "BOI", 73, 87, "BOI", "Boise", "ID")
    agent.noaa_location = mock_location
    agent.noaa_alerts = [
        NOAAAlert(
            alert_id="handler_test_alert",
            event="Winter Weather Advisory",
            severity="Minor",
            certainty="Likely",
            urgency="Expected",
            headline="Snow expected",
            description="Light snow possible",
            instruction="Drive carefully",
            areas=["Ada County"],
            effective="2024-01-15T18:00:00Z",
            expires="2024-01-16T06:00:00Z",
            sender="NWS",
            status="Actual",
            message_type="Alert"
        )
    ]
    
    # Mock send_message
    sent_messages = []
    async def mock_send(message):
        sent_messages.append(message)
    agent.send_message = mock_send
    
    # Test get_noaa_alerts handler
    noaa_alerts_message = CrossLanguageMessage(
        msg_id="test_noaa_alerts",
        msg_type="get_noaa_alerts",
        source={"agentId": "test_requester", "language": "javascript", "runtime": "nodejs"},
        destination={"agentId": agent.agent_id},
        payload={},
        metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
    )
    
    await agent.handle_get_noaa_alerts(noaa_alerts_message)
    
    test.assert_equal(len(sent_messages), 1, "NOAA alerts response sent")
    response = sent_messages[0]
    test.assert_equal(response.type, "noaa_alerts_response", "Correct response type")
    test.assert_equal(response.payload['alert_count'], 1, "Correct alert count in response")
    test.assert_true(response.payload['noaa_enabled'], "NOAA enabled flag correct")
    
    # Test refresh_noaa_data handler
    sent_messages.clear()
    
    # Mock NOAA service for refresh
    mock_noaa = AsyncMock()
    mock_weather = NOAAWeatherReading(
        timestamp="2024-01-15T15:00:00Z",
        temperature_f=68.0,
        humidity_percent=60.0,
        wind_speed_mph=5.0,
        wind_direction="E",
        pressure_mb=1015.0,
        visibility_miles=10.0,
        conditions="Sunny",
        detailed_forecast="Sunny skies."
    )
    mock_noaa.get_current_weather.return_value = mock_weather
    mock_noaa.get_active_alerts.return_value = []
    agent.noaa_service = mock_noaa
    
    refresh_message = CrossLanguageMessage(
        msg_id="test_refresh",
        msg_type="refresh_noaa_data",
        source={"agentId": "test_requester", "language": "javascript", "runtime": "nodejs"},
        destination={"agentId": agent.agent_id},
        payload={},
        metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
    )
    
    await agent.handle_refresh_noaa_data(refresh_message)
    
    test.assert_equal(len(sent_messages), 1, "Refresh response sent")
    refresh_response = sent_messages[0]
    test.assert_equal(refresh_response.type, "refresh_noaa_response", "Correct refresh response type")
    test.assert_true(refresh_response.payload['success'], "Refresh successful")
    test.assert_equal(len(agent.weather_data), 2, "New weather reading added after refresh")
    
    return test.print_summary()

async def test_noaa_fallback_behavior():
    """Test fallback behavior when NOAA service fails"""
    print("\n🔄 Testing NOAA Fallback Behavior...")
    test = SimpleTestRunner()
    
    # Test agent initialization with NOAA failure
    with patch('weather_monitoring_agent.NOAAWeatherService') as mock_service_class:
        mock_service_class.side_effect = Exception("NOAA service unavailable")
        
        agent = WeatherMonitoringAgent("test_fallback", "Boise, ID", use_real_weather=True)
        await agent.initialize()
        
        test.assert_true(not agent.use_real_weather, "Fallback to simulation on NOAA failure")
        test.assert_true(agent.noaa_service is None, "NOAA service not initialized")
        test.assert_equal(len(agent.weather_data), 1, "Fallback weather reading created")
    
    # Test agent with successful NOAA init but failed geocoding
    with patch('weather_monitoring_agent.geocode_city_state', return_value=None):
        agent2 = WeatherMonitoringAgent("test_fallback2", "Unknown City, ZZ", use_real_weather=True)
        await agent2.initialize()
        
        test.assert_true(not agent2.use_real_weather, "Fallback on geocoding failure")
    
    # Test runtime fallback during monitoring
    agent3 = WeatherMonitoringAgent("test_fallback3", "Boise, ID", use_real_weather=True)
    
    # Mock successful initialization
    mock_noaa = AsyncMock()
    mock_location = NOAALocation(43.6150, -116.2023, "BOI", 73, 87, "BOI", "Boise", "ID")
    
    with patch('weather_monitoring_agent.NOAAWeatherService', return_value=mock_noaa):
        with patch('weather_monitoring_agent.geocode_city_state', return_value=(43.6150, -116.2023)):
            mock_noaa.get_location_info.return_value = mock_location
            mock_noaa.get_current_weather.return_value = None  # Simulate API failure
            mock_noaa.get_active_alerts.return_value = []
            
            await agent3.initialize()
            
            # The agent should fall back to simulation for the weather reading
            # but still maintain NOAA integration for alerts
            test.assert_true(agent3.use_real_weather, "NOAA integration maintained")
            test.assert_not_none(agent3.noaa_service, "NOAA service available")
            test.assert_equal(len(agent3.weather_data), 1, "Weather reading created (fallback)")
    
    return test.print_summary()

async def main():
    """Run all NOAA integration tests"""
    print("🧪 Starting NOAA Integration Tests\n")
    
    all_passed = True
    
    # Run all test suites
    all_passed &= await test_noaa_service_initialization()
    all_passed &= await test_geocoding_functionality()
    all_passed &= await test_noaa_data_structures()
    all_passed &= await test_noaa_api_requests()
    all_passed &= await test_noaa_error_handling()
    all_passed &= await test_weather_agent_noaa_integration()
    all_passed &= await test_noaa_message_handlers()
    all_passed &= await test_noaa_fallback_behavior()
    
    print("\n" + "="*50)
    if all_passed:
        print("🎉 ALL NOAA INTEGRATION TESTS PASSED!")
        print("✅ NOAA weather service integration is working correctly.")
        return 0
    else:
        print("💥 SOME NOAA INTEGRATION TESTS FAILED!")
        print("❌ Check the output above for details.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)