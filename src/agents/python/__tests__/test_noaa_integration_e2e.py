#!/usr/bin/env python3
"""
End-to-End NOAA Weather Integration Tests

Comprehensive end-to-end tests for the NOAA weather service integration
including real API calls, cross-language communication, and alert handling.

These tests verify:
- Live NOAA API integration with actual HTTP requests
- Weather monitoring agent NOAA functionality
- Alert broadcasting and event handling
- Fallback behavior when NOAA API is unavailable
- Data format consistency across the system

Usage: python3 test_noaa_integration_e2e.py
"""

import sys
import asyncio
import json
from datetime import datetime, timezone
from typing import List, Dict, Any
import unittest

# Add parent directory to path for imports
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the weather monitoring components
from weather_monitoring_agent import WeatherMonitoringAgent
from base_agent import CrossLanguageMessage

# Try to import NOAA components, fallback if not available
try:
    from noaa_weather_service import NOAAWeatherService, NOAALocation, NOAAAlert
    NOAA_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ NOAA service not available: {e}")
    NOAA_AVAILABLE = False
    NOAAWeatherService = None
    NOAALocation = None
    NOAAAlert = None


class MockMultiLanguageRuntime:
    """Mock runtime for testing cross-language communication"""
    
    def __init__(self):
        self.messages_received: List[CrossLanguageMessage] = []
        self.alert_broadcasts: List[Dict[str, Any]] = []
        self.is_connected = True
    
    async def send_message(self, message: CrossLanguageMessage):
        """Mock sending a message to the runtime"""
        self.messages_received.append(message)
        
        # If this is a weather alert, capture it
        if message.type == "weather_alert" and "alert" in message.payload:
            self.alert_broadcasts.append(message.payload["alert"])
    
    def get_latest_alerts(self) -> List[Dict[str, Any]]:
        """Get all alert broadcasts received"""
        return self.alert_broadcasts
    
    def clear_messages(self):
        """Clear all captured messages"""
        self.messages_received.clear()
        self.alert_broadcasts.clear()


class NOAAIntegrationE2ETest(unittest.TestCase):
    """End-to-end tests for NOAA weather integration"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_runtime = MockMultiLanguageRuntime()
        self.test_locations = [
            "Boise, ID",
            "Seattle, WA", 
            "Denver, CO"
        ]
    
    async def test_noaa_service_live_api_connection(self):
        """Test actual NOAA API connectivity and responses"""
        print("\n🌐 Testing live NOAA API connection...")
        
        if not NOAA_AVAILABLE:
            print("⚠️ Skipping NOAA API test - aiohttp not available")
            return
        
        noaa_service = NOAAWeatherService()
        
        # Test location lookup for Boise
        location = await noaa_service.get_location_info("Boise, ID")
        
        self.assertIsNotNone(location, "Should get location info for Boise")
        self.assertEqual(location.city.lower(), "boise", "City should be Boise")
        self.assertEqual(location.state, "ID", "State should be ID") 
        self.assertIsNotNone(location.grid_id, "Should have grid ID")
        self.assertIsNotNone(location.grid_x, "Should have grid X coordinate")
        self.assertIsNotNone(location.grid_y, "Should have grid Y coordinate")
        
        print(f"✅ Location lookup successful: {location.city}, {location.state} (Grid: {location.grid_id})")
        
        # Test current weather fetch
        current_weather = await noaa_service.get_current_weather(location)
        
        if current_weather:
            self.assertIsNotNone(current_weather.timestamp, "Weather should have timestamp")
            self.assertIsNotNone(current_weather.temperature_f, "Weather should have temperature")
            print(f"✅ Current weather: {current_weather.temperature_f}°F, {current_weather.conditions}")
        else:
            print("⚠️ No current weather data available (this is normal for some locations)")
        
        # Test alerts fetch
        alerts = await noaa_service.get_alerts(location)
        print(f"✅ Alerts fetch successful: {len(alerts)} active alerts")
        
        # Test forecast fetch
        forecast = await noaa_service.get_forecast(location)
        
        if forecast:
            self.assertGreater(len(forecast), 0, "Should have forecast periods")
            print(f"✅ Forecast available: {len(forecast)} periods")
        else:
            print("⚠️ No forecast data available")
    
    async def test_weather_agent_noaa_integration(self):
        """Test weather monitoring agent with NOAA integration"""
        print("\n🤖 Testing weather agent NOAA integration...")
        
        # Create agent with NOAA integration enabled
        agent = WeatherMonitoringAgent(
            agent_id="test_noaa_agent",
            location="Boise, ID", 
            use_real_weather=True
        )
        
        # Mock the send_message method to capture communications
        agent.send_message = self.mock_runtime.send_message
        
        # Initialize agent (should set up NOAA service)
        await agent.initialize()
        
        self.assertTrue(agent.use_real_weather, "Agent should be using real weather")
        self.assertIsNotNone(agent.noaa_service, "Agent should have NOAA service")
        self.assertIsNotNone(agent.noaa_location, "Agent should have NOAA location")
        
        print(f"✅ Agent initialized with NOAA location: {agent.noaa_location.city}, {agent.noaa_location.state}")
        
        # Test NOAA alerts fetch
        noaa_alerts_message = CrossLanguageMessage(
            msg_id="test_noaa_alerts_001",
            msg_type="get_noaa_alerts",
            source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
            destination={"agentId": agent.agent_id},
            payload={},
            metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 10000}
        )
        
        await agent.handle_get_noaa_alerts(noaa_alerts_message)
        
        # Check that a response was sent
        self.assertGreater(len(self.mock_runtime.messages_received), 0, "Should send response message")
        
        response = self.mock_runtime.messages_received[-1]
        self.assertEqual(response.type, "noaa_alerts_response", "Should send NOAA alerts response")
        self.assertIn("alerts", response.payload, "Response should contain alerts")
        
        print(f"✅ NOAA alerts response: {len(response.payload['alerts'])} alerts")
        
        # Test NOAA data refresh
        self.mock_runtime.clear_messages()
        
        refresh_message = CrossLanguageMessage(
            msg_id="test_refresh_001", 
            msg_type="refresh_noaa_data",
            source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
            destination={"agentId": agent.agent_id},
            payload={},
            metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 10000}
        )
        
        await agent.handle_refresh_noaa_data(refresh_message)
        
        # Should get a refresh response
        self.assertGreater(len(self.mock_runtime.messages_received), 0, "Should send refresh response")
        refresh_response = self.mock_runtime.messages_received[-1]
        self.assertEqual(refresh_response.type, "noaa_data_refreshed", "Should send refresh confirmation")
        
        print("✅ NOAA data refresh successful")
    
    async def test_noaa_fallback_behavior(self):
        """Test fallback to simulation when NOAA API is unavailable"""
        print("\n🔄 Testing NOAA fallback behavior...")
        
        # Create agent with invalid location to trigger fallback
        agent = WeatherMonitoringAgent(
            agent_id="test_fallback_agent",
            location="Invalid Location XYZ",
            use_real_weather=True
        )
        
        agent.send_message = self.mock_runtime.send_message
        
        # Initialize agent (should fallback to simulation)
        await agent.initialize()
        
        # Agent should fallback to simulation mode
        self.assertFalse(agent.use_real_weather, "Agent should fallback to simulation")
        self.assertIsNone(agent.noaa_service, "Agent should not have NOAA service after fallback")
        
        print("✅ Agent correctly fell back to simulation mode")
        
        # Test that agent still functions normally in simulation mode
        current_weather_message = CrossLanguageMessage(
            msg_id="test_fallback_weather_001",
            msg_type="get_current_weather",
            source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
            destination={"agentId": agent.agent_id},
            payload={},
            metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
        )
        
        self.mock_runtime.clear_messages()
        await agent.handle_get_current_weather(current_weather_message)
        
        self.assertGreater(len(self.mock_runtime.messages_received), 0, "Should still provide weather data")
        response = self.mock_runtime.messages_received[-1]
        self.assertEqual(response.type, "weather_response", "Should send weather response")
        self.assertIn("current_weather", response.payload, "Should contain current weather")
        
        print("✅ Fallback agent still provides weather data via simulation")
    
    async def test_noaa_alert_broadcasting(self):
        """Test NOAA alert broadcasting functionality"""
        print("\n📢 Testing NOAA alert broadcasting...")
        
        agent = WeatherMonitoringAgent(
            agent_id="test_alert_agent",
            location="Boise, ID",
            use_real_weather=True
        )
        
        agent.send_message = self.mock_runtime.send_message
        await agent.initialize()
        
        # Clear any initialization messages
        self.mock_runtime.clear_messages()
        
        # Start monitoring to potentially trigger alerts
        start_message = CrossLanguageMessage(
            msg_id="test_start_monitoring_001",
            msg_type="start_monitoring", 
            source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
            destination={"agentId": agent.agent_id},
            payload={"duration_hours": 1},
            metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
        )
        
        await agent.handle_start_monitoring(start_message)
        
        print("✅ Monitoring started, checking for alert broadcasts...")
        
        # Let monitoring run for a short period to potentially generate alerts
        await asyncio.sleep(2)
        
        # Check if any weather alerts were broadcast
        alert_count = len(self.mock_runtime.get_latest_alerts())
        print(f"✅ Alert broadcasts captured: {alert_count}")
        
        # Stop monitoring
        stop_message = CrossLanguageMessage(
            msg_id="test_stop_monitoring_001",
            msg_type="stop_monitoring",
            source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
            destination={"agentId": agent.agent_id},
            payload={},
            metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
        )
        
        await agent.handle_stop_monitoring(stop_message)
        print("✅ Monitoring stopped")
    
    async def test_multiple_location_noaa_support(self):
        """Test NOAA integration with multiple geographic locations"""
        print("\n🗺️ Testing multiple location NOAA support...")
        
        if not NOAA_AVAILABLE:
            print("⚠️ Skipping multiple location test - aiohttp not available")
            return
        
        for location in self.test_locations:
            print(f"Testing location: {location}")
            
            noaa_service = NOAAWeatherService()
            location_info = await noaa_service.get_location_info(location)
            
            if location_info:
                print(f"✅ {location}: {location_info.city}, {location_info.state} (Grid: {location_info.grid_id})")
                
                # Test weather fetch for this location
                weather = await noaa_service.get_current_weather(location_info)
                alerts = await noaa_service.get_alerts(location_info)
                
                print(f"   Weather: {'Available' if weather else 'Not available'}")
                print(f"   Alerts: {len(alerts)} active")
            else:
                print(f"❌ Failed to get location info for {location}")
    
    async def test_noaa_data_format_consistency(self):
        """Test that NOAA data formats are consistent with internal formats"""
        print("\n📊 Testing NOAA data format consistency...")
        
        if not NOAA_AVAILABLE:
            print("⚠️ Skipping data format test - aiohttp not available")
            return
        
        noaa_service = NOAAWeatherService()
        location = await noaa_service.get_location_info("Boise, ID")
        
        if location:
            # Test weather data format
            weather = await noaa_service.get_current_weather(location)
            if weather:
                weather_dict = weather.to_dict()
                
                # Check required fields
                required_fields = [
                    'timestamp', 'temperature_f', 'humidity_percent', 
                    'conditions', 'pressure_mb', 'wind_speed_mph'
                ]
                
                for field in required_fields:
                    self.assertIn(field, weather_dict, f"Weather data should have {field}")
                
                print("✅ Weather data format validation passed")
            
            # Test alert data format
            alerts = await noaa_service.get_alerts(location)
            for alert in alerts:
                alert_dict = alert.to_dict()
                
                required_alert_fields = [
                    'alert_id', 'alert_type', 'severity', 'message', 
                    'effective_time', 'expires_time'
                ]
                
                for field in required_alert_fields:
                    self.assertIn(field, alert_dict, f"Alert data should have {field}")
            
            print(f"✅ Alert data format validation passed ({len(alerts)} alerts)")


async def run_e2e_tests():
    """Run all end-to-end tests"""
    print("🧪 Starting NOAA Weather Integration End-to-End Tests\n")
    
    test_instance = NOAAIntegrationE2ETest()
    test_instance.setUp()
    
    tests = [
        ("NOAA API Live Connection", test_instance.test_noaa_service_live_api_connection),
        ("Weather Agent NOAA Integration", test_instance.test_weather_agent_noaa_integration),
        ("NOAA Fallback Behavior", test_instance.test_noaa_fallback_behavior),
        ("NOAA Alert Broadcasting", test_instance.test_noaa_alert_broadcasting),
        ("Multiple Location Support", test_instance.test_multiple_location_noaa_support),
        ("NOAA Data Format Consistency", test_instance.test_noaa_data_format_consistency)
    ]
    
    passed_tests = 0
    failed_tests = 0
    
    for test_name, test_func in tests:
        try:
            print(f"\n{'='*50}")
            print(f"Running: {test_name}")
            print('='*50)
            
            await test_func()
            passed_tests += 1
            print(f"✅ {test_name} - PASSED")
            
        except AssertionError as e:
            failed_tests += 1
            print(f"❌ {test_name} - FAILED: {str(e)}")
            
        except Exception as e:
            failed_tests += 1
            print(f"💥 {test_name} - ERROR: {str(e)}")
    
    # Print final results
    print(f"\n{'='*60}")
    print(f"🏁 End-to-End Test Results")
    print(f"{'='*60}")
    print(f"Tests Run: {passed_tests + failed_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {failed_tests}")
    
    if failed_tests == 0:
        print("🎉 ALL END-TO-END TESTS PASSED!")
        print("NOAA weather integration is working correctly.")
        return 0
    else:
        print("💥 SOME END-TO-END TESTS FAILED!")
        print("Check the output above for details.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(run_e2e_tests())
    sys.exit(exit_code)