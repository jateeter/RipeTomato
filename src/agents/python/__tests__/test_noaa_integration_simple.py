#!/usr/bin/env python3
"""
Simple NOAA Integration Tests

Simple end-to-end tests for the NOAA weather service integration that work
without external dependencies like aiohttp. These tests verify the weather
monitoring agent's NOAA integration capabilities using mocked HTTP responses.

Usage: python3 test_noaa_integration_simple.py
"""

import sys
import asyncio
import json
from datetime import datetime, timezone
from typing import List, Dict, Any
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the weather monitoring components
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
    
    def print_summary(self):
        print(f"\\n📊 Test Results:")
        print(f"   Tests run: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_failed}")
        if self.tests_failed == 0:
            print("🎉 All tests passed!")
            return True
        else:
            print("💥 Some tests failed!")
            return False


class MockSendMessage:
    """Mock for the send_message method to avoid actual message sending"""
    def __init__(self):
        self.messages_sent = []
    
    async def __call__(self, message):
        self.messages_sent.append(message)


async def test_weather_agent_noaa_fallback():
    """Test weather monitoring agent NOAA fallback behavior"""
    print("\\n🔄 Testing weather agent NOAA fallback behavior...")
    test = SimpleTestRunner()
    
    # Create agent with NOAA integration enabled (should fallback due to missing aiohttp)
    agent = WeatherMonitoringAgent(
        agent_id="test_noaa_fallback_agent",
        location="Boise, ID", 
        use_real_weather=True
    )
    
    # Mock the send_message method
    mock_send = MockSendMessage()
    agent.send_message = mock_send
    
    # Initialize agent (should fallback to simulation due to missing dependencies)
    await agent.initialize()
    
    # Agent should fallback to simulation mode
    test.assert_true(not agent.use_real_weather, "Agent should fallback to simulation when aiohttp unavailable")
    test.assert_true(agent.noaa_service is None, "Agent should not have NOAA service after fallback")
    test.assert_true(len(agent.weather_data) >= 1, "Agent should still have weather data from simulation")
    
    print(f"✅ Agent correctly fell back to simulation mode")
    
    # Test that agent still functions normally in simulation mode
    current_weather_message = CrossLanguageMessage(
        msg_id="test_fallback_weather_001",
        msg_type="get_current_weather",
        source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
        destination={"agentId": agent.agent_id},
        payload={},
        metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
    )
    
    await agent.handle_get_current_weather(current_weather_message)
    
    test.assert_true(len(mock_send.messages_sent) >= 1, "Should still provide weather data")
    response = mock_send.messages_sent[-1]
    test.assert_equal(response.type, "weather_response", "Should send weather response")
    test.assert_true("current_weather" in response.payload, "Should contain current weather")
    test.assert_equal(response.payload["location"], "Boise, ID", "Should preserve location")
    
    print("✅ Fallback agent still provides weather data via simulation")
    
    return test.print_summary()


async def test_weather_agent_noaa_message_handlers():
    """Test NOAA-specific message handlers in fallback mode"""
    print("\\n💬 Testing NOAA message handlers in fallback mode...")
    test = SimpleTestRunner()
    
    agent = WeatherMonitoringAgent(
        agent_id="test_noaa_messages_agent",
        location="Seattle, WA",
        use_real_weather=True
    )
    
    mock_send = MockSendMessage()
    agent.send_message = mock_send
    await agent.initialize()
    
    # Test NOAA alerts request (should work even in fallback mode)
    noaa_alerts_message = CrossLanguageMessage(
        msg_id="test_noaa_alerts_001",
        msg_type="get_noaa_alerts",
        source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
        destination={"agentId": agent.agent_id},
        payload={},
        metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 10000}
    )
    
    await agent.handle_get_noaa_alerts(noaa_alerts_message)
    
    test.assert_true(len(mock_send.messages_sent) >= 1, "Should send NOAA alerts response")
    alerts_response = mock_send.messages_sent[-1]
    test.assert_equal(alerts_response.type, "noaa_alerts_response", "Should send NOAA alerts response")
    test.assert_true("alerts" in alerts_response.payload, "Response should contain alerts")
    test.assert_true("fallback_mode" in alerts_response.payload, "Should indicate fallback mode")
    test.assert_true(alerts_response.payload["fallback_mode"], "Should be in fallback mode")
    
    # Test NOAA data refresh
    mock_send.messages_sent.clear()
    
    refresh_message = CrossLanguageMessage(
        msg_id="test_refresh_001", 
        msg_type="refresh_noaa_data",
        source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
        destination={"agentId": agent.agent_id},
        payload={},
        metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 10000}
    )
    
    await agent.handle_refresh_noaa_data(refresh_message)
    
    test.assert_true(len(mock_send.messages_sent) >= 1, "Should send refresh response")
    refresh_response = mock_send.messages_sent[-1]
    test.assert_equal(refresh_response.type, "noaa_data_refreshed", "Should send refresh confirmation")
    test.assert_true("fallback_mode" in refresh_response.payload, "Should indicate fallback mode")
    
    print("✅ NOAA message handlers work correctly in fallback mode")
    
    return test.print_summary()


async def test_weather_agent_monitoring_with_noaa_enabled():
    """Test weather monitoring with NOAA initially enabled but falling back"""
    print("\\n🔍 Testing weather monitoring with NOAA configuration...")
    test = SimpleTestRunner()
    
    agent = WeatherMonitoringAgent(
        agent_id="test_monitoring_agent",
        location="Denver, CO",
        use_real_weather=True
    )
    
    mock_send = MockSendMessage()
    agent.send_message = mock_send
    await agent.initialize()
    
    # Start monitoring
    start_message = CrossLanguageMessage(
        msg_id="test_start_monitoring_001",
        msg_type="start_monitoring", 
        source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
        destination={"agentId": agent.agent_id},
        payload={"duration_hours": 1},
        metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
    )
    
    await agent.handle_start_monitoring(start_message)
    
    test.assert_true(agent.monitoring_active, "Monitoring should be active")
    test.assert_true(len(mock_send.messages_sent) >= 1, "Should send monitoring started response")
    
    # Let monitoring run briefly
    await asyncio.sleep(1)
    
    # Check weather history
    mock_send.messages_sent.clear()
    history_message = CrossLanguageMessage(
        msg_id="test_history_001",
        msg_type="get_weather_history",
        source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
        destination={"agentId": agent.agent_id},
        payload={"hours_back": 1},
        metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
    )
    
    await agent.handle_get_weather_history(history_message)
    
    test.assert_true(len(mock_send.messages_sent) >= 1, "Should send history response")
    history_response = mock_send.messages_sent[-1]
    test.assert_equal(history_response.type, "weather_history_response", "Should send history response")
    test.assert_true("weather_history" in history_response.payload, "Should contain weather history")
    
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
    
    test.assert_true(not agent.monitoring_active, "Monitoring should be stopped")
    
    print("✅ Weather monitoring works correctly with NOAA configuration")
    
    return test.print_summary()


async def test_weather_agent_capabilities_with_noaa():
    """Test agent capabilities include NOAA features"""
    print("\\n🛠️ Testing agent capabilities with NOAA configuration...")
    test = SimpleTestRunner()
    
    agent = WeatherMonitoringAgent(
        agent_id="test_capabilities_agent",
        location="Portland, OR",
        use_real_weather=True
    )
    
    await agent.initialize()
    
    capabilities = await agent.get_capabilities()
    
    # Check for standard capabilities
    standard_capabilities = ['start_monitoring', 'get_current_weather', 'get_weather_alerts']
    for capability in standard_capabilities:
        test.assert_true(capability in capabilities, f"Has standard capability: {capability}")
    
    # Check for NOAA-specific capabilities
    noaa_capabilities = ['get_noaa_alerts', 'refresh_noaa_data']
    for capability in noaa_capabilities:
        test.assert_true(capability in capabilities, f"Has NOAA capability: {capability}")
    
    print(f"✅ Agent has {len(capabilities)} capabilities including NOAA features")
    
    return test.print_summary()


async def test_weather_data_format_consistency():
    """Test weather data format consistency in fallback mode"""
    print("\\n📊 Testing weather data format consistency...")
    test = SimpleTestRunner()
    
    agent = WeatherMonitoringAgent(
        agent_id="test_format_agent",
        location="Boise, ID",
        use_real_weather=True
    )
    
    await agent.initialize()
    
    # Get current weather data
    test.assert_true(len(agent.weather_data) >= 1, "Should have at least one weather reading")
    
    weather_reading = agent.weather_data[-1]
    weather_dict = weather_reading.to_dict()
    
    # Check required fields
    required_fields = [
        'timestamp', 'temperature_f', 'humidity_percent', 
        'conditions', 'pressure_mb', 'wind_speed_mph',
        'wind_direction', 'precipitation_inches', 'visibility_miles', 'uv_index'
    ]
    
    for field in required_fields:
        test.assert_true(field in weather_dict, f"Weather data should have {field}")
    
    # Check value ranges
    test.assert_true(isinstance(weather_dict['temperature_f'], (int, float)), "Temperature should be numeric")
    test.assert_true(0 <= weather_dict['humidity_percent'] <= 100, "Humidity should be 0-100%")
    test.assert_true(weather_dict['precipitation_inches'] >= 0, "Precipitation should be non-negative")
    test.assert_true(weather_dict['wind_speed_mph'] >= 0, "Wind speed should be non-negative")
    test.assert_true(0 <= weather_dict['uv_index'] <= 11, "UV index should be 0-11")
    
    print("✅ Weather data format validation passed")
    
    return test.print_summary()


async def main():
    """Run all end-to-end tests"""
    print("🧪 Starting Simple NOAA Integration End-to-End Tests\\n")
    
    all_passed = True
    
    # Run all test suites
    all_passed &= await test_weather_agent_noaa_fallback()
    all_passed &= await test_weather_agent_noaa_message_handlers()
    all_passed &= await test_weather_agent_monitoring_with_noaa_enabled()
    all_passed &= await test_weather_agent_capabilities_with_noaa()
    all_passed &= await test_weather_data_format_consistency()
    
    print("\\n" + "="*60)
    if all_passed:
        print("🎉 ALL SIMPLE E2E TESTS PASSED!")
        print("NOAA weather integration fallback behavior is working correctly.")
        print("\\nNote: These tests verify fallback behavior when aiohttp is not available.")
        print("For full NOAA API testing, install aiohttp: pip install aiohttp")
        return 0
    else:
        print("💥 SOME SIMPLE E2E TESTS FAILED!")
        print("Check the output above for details.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)