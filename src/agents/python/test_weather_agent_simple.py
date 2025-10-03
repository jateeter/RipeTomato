#!/usr/bin/env python3
"""
Simple Weather Agent Test Script

A basic test script that verifies the weather monitoring agent functionality
without requiring external testing frameworks like pytest.

This script tests:
- Weather simulation functionality
- Agent initialization
- Message handling
- Data analysis capabilities

Usage: python3 test_weather_agent_simple.py
"""

import sys
import asyncio
import json
from datetime import datetime, timezone
from weather_monitoring_agent import (
    WeatherMonitoringAgent,
    WeatherSimulator,
    WeatherReading,
    WeatherAlert
)
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

class MockSendMessage:
    """Mock for the send_message method to avoid actual message sending"""
    def __init__(self):
        self.messages_sent = []
    
    async def __call__(self, message):
        self.messages_sent.append(message)

async def test_weather_simulator():
    """Test weather simulation functionality"""
    print("\n🌤️ Testing Weather Simulator...")
    test = SimpleTestRunner()
    
    # Test simulator initialization
    simulator = WeatherSimulator(base_temp=70.0, location="Test City")
    test.assert_equal(simulator.base_temp, 70.0, "Simulator base temperature")
    test.assert_equal(simulator.location, "Test City", "Simulator location")
    test.assert_true('temperature_trend' in simulator.current_conditions, "Temperature trend initialized")
    
    # Test weather reading generation
    reading = simulator.generate_hourly_reading()
    test.assert_not_none(reading.timestamp, "Reading has timestamp")
    test.assert_true(0 <= reading.temperature_f <= 150, "Temperature in valid range")
    test.assert_true(0 <= reading.humidity_percent <= 100, "Humidity in valid range")
    test.assert_true(0 <= reading.precipitation_inches <= 5, "Precipitation in valid range")
    test.assert_true(0 <= reading.wind_speed_mph <= 100, "Wind speed in valid range")
    test.assert_true(900 <= reading.pressure_mb <= 1100, "Pressure in valid range")
    test.assert_true(0 <= reading.visibility_miles <= 15, "Visibility in valid range")
    test.assert_true(0 <= reading.uv_index <= 11, "UV index in valid range")
    
    # Test reading serialization
    reading_dict = reading.to_dict()
    test.assert_true(isinstance(reading_dict, dict), "Reading serializes to dict")
    test.assert_true('timestamp' in reading_dict, "Serialized reading has timestamp")
    
    # Test reading deserialization
    reconstructed = WeatherReading.from_dict(reading_dict)
    test.assert_equal(reconstructed.timestamp, reading.timestamp, "Timestamp preserved in round-trip")
    test.assert_equal(reconstructed.temperature_f, reading.temperature_f, "Temperature preserved in round-trip")
    
    return test.print_summary()

async def test_weather_agent_initialization():
    """Test weather agent initialization"""
    print("\n🤖 Testing Weather Agent Initialization...")
    test = SimpleTestRunner()
    
    # Test agent creation
    agent = WeatherMonitoringAgent("test_agent", "Test Location")
    test.assert_equal(agent.agent_id, "test_agent", "Agent ID set correctly")
    test.assert_equal(agent.name, "Weather Monitoring Agent", "Agent name set correctly")
    test.assert_equal(agent.location, "Test Location", "Agent location set correctly")
    test.assert_true(isinstance(agent.weather_data, list), "Weather data is list")
    test.assert_true(isinstance(agent.active_alerts, list), "Active alerts is list")
    test.assert_true(not agent.monitoring_active, "Monitoring not active initially")
    
    # Test alert thresholds
    test.assert_true('temperature_high' in agent.alert_thresholds, "Temperature high threshold exists")
    test.assert_true('precipitation_heavy' in agent.alert_thresholds, "Precipitation threshold exists")
    test.assert_true('wind_high' in agent.alert_thresholds, "Wind threshold exists")
    
    # Test agent initialization
    await agent.initialize()
    test.assert_true(len(agent.weather_data) >= 1, "Initial weather reading created")
    
    # Test capabilities
    capabilities = await agent.get_capabilities()
    expected_capabilities = ['start_monitoring', 'get_current_weather', 'get_weather_alerts']
    for capability in expected_capabilities:
        test.assert_true(capability in capabilities, f"Has capability: {capability}")
    
    return test.print_summary()

async def test_weather_analysis():
    """Test weather analysis functionality"""
    print("\n📊 Testing Weather Analysis...")
    test = SimpleTestRunner()
    
    agent = WeatherMonitoringAgent("analysis_test_agent", "Analysis City")
    
    # Add test weather data
    test_readings = []
    base_time = datetime.now(timezone.utc)
    
    for i in range(24):  # 24 hours of data
        reading = WeatherReading(
            timestamp=base_time.isoformat(),
            temperature_f=70.0 + i,  # Rising temperature
            humidity_percent=60.0,
            precipitation_inches=0.1 if i % 6 == 0 else 0.0,  # Occasional rain
            wind_speed_mph=10.0,
            wind_direction="N",
            pressure_mb=1013.0,
            visibility_miles=10.0,
            conditions="Clear",
            uv_index=5
        )
        test_readings.append(reading)
    
    agent.weather_data = test_readings
    
    # Test analysis
    analysis = agent.get_weather_analysis(hours_back=24)
    test.assert_true('temperature' in analysis, "Analysis contains temperature data")
    test.assert_true('humidity' in analysis, "Analysis contains humidity data")
    test.assert_true('precipitation' in analysis, "Analysis contains precipitation data")
    test.assert_true('wind' in analysis, "Analysis contains wind data")
    
    # Check temperature analysis
    temp_analysis = analysis['temperature']
    test.assert_equal(temp_analysis['min'], 70.0, "Minimum temperature correct")
    test.assert_equal(temp_analysis['max'], 93.0, "Maximum temperature correct")
    test.assert_equal(temp_analysis['trend'], 'rising', "Temperature trend correct")
    
    # Check precipitation analysis
    precip_analysis = analysis['precipitation']
    test.assert_equal(precip_analysis['total'], 0.4, "Total precipitation correct")
    test.assert_equal(precip_analysis['hours_with_precip'], 4, "Hours with precipitation correct")
    
    # Test analysis with no data
    empty_agent = WeatherMonitoringAgent("empty_agent", "Empty City")
    empty_analysis = empty_agent.get_weather_analysis(hours_back=24)
    test.assert_true('error' in empty_analysis, "Analysis returns error for no data")
    
    return test.print_summary()

async def test_alert_generation():
    """Test weather alert generation"""
    print("\n⚠️ Testing Alert Generation...")
    test = SimpleTestRunner()
    
    agent = WeatherMonitoringAgent("alert_test_agent", "Alert City")
    
    # Create a reading that should trigger temperature alert
    high_temp_reading = WeatherReading(
        timestamp=datetime.now(timezone.utc).isoformat(),
        temperature_f=100.0,  # Above threshold
        humidity_percent=50.0,
        precipitation_inches=0.0,
        wind_speed_mph=5.0,
        wind_direction="N",
        pressure_mb=1013.0,
        visibility_miles=10.0,
        conditions="Hot",
        uv_index=8
    )
    
    # Test alert creation
    temp_alert = agent._create_temperature_alert(high_temp_reading, 'high')
    test.assert_equal(temp_alert.alert_type, 'temperature', "Temperature alert type correct")
    test.assert_true(temp_alert.severity in ['high', 'extreme'], "Alert severity valid")
    test.assert_true('heat warning' in temp_alert.message.lower(), "Alert message contains heat warning")
    test.assert_true(len(temp_alert.recommendations) > 0, "Alert has recommendations")
    test.assert_true('shelter' in temp_alert.affected_services, "Alert affects shelter services")
    
    # Test precipitation alert
    heavy_rain_reading = WeatherReading(
        timestamp=datetime.now(timezone.utc).isoformat(),
        temperature_f=70.0,
        humidity_percent=90.0,
        precipitation_inches=1.0,  # Heavy rain
        wind_speed_mph=15.0,
        wind_direction="S",
        pressure_mb=1000.0,
        visibility_miles=2.0,
        conditions="Heavy Rain",
        uv_index=0
    )
    
    precip_alert = agent._create_precipitation_alert(heavy_rain_reading, 'heavy')
    test.assert_equal(precip_alert.alert_type, 'precipitation', "Precipitation alert type correct")
    test.assert_true('precipitation' in precip_alert.message.lower(), "Precipitation alert message correct")
    
    return test.print_summary()

async def test_message_handling():
    """Test message handling functionality"""
    print("\n💬 Testing Message Handling...")
    test = SimpleTestRunner()
    
    agent = WeatherMonitoringAgent("message_test_agent", "Message City")
    await agent.initialize()
    
    # Mock the send_message method
    mock_send = MockSendMessage()
    agent.send_message = mock_send
    
    # Test current weather request
    current_weather_message = CrossLanguageMessage(
        msg_id="test_current_001",
        msg_type="get_current_weather",
        source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
        destination={"agentId": agent.agent_id},
        payload={},
        metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
    )
    
    await agent.handle_get_current_weather(current_weather_message)
    
    test.assert_equal(len(mock_send.messages_sent), 1, "One message sent in response")
    response = mock_send.messages_sent[0]
    test.assert_equal(response.type, "weather_response", "Response type correct")
    test.assert_true('current_weather' in response.payload, "Response contains current weather")
    test.assert_equal(response.payload['location'], "Message City", "Response location correct")
    
    # Test weather history request
    mock_send.messages_sent.clear()
    history_message = CrossLanguageMessage(
        msg_id="test_history_001",
        msg_type="get_weather_history",
        source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
        destination={"agentId": agent.agent_id},
        payload={"hours_back": 12},
        metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
    )
    
    await agent.handle_get_weather_history(history_message)
    
    test.assert_equal(len(mock_send.messages_sent), 1, "History response sent")
    history_response = mock_send.messages_sent[0]
    test.assert_equal(history_response.type, "weather_history_response", "History response type correct")
    test.assert_equal(history_response.payload['hours_requested'], 12, "Hours requested preserved")
    
    return test.print_summary()

async def main():
    """Run all tests"""
    print("🧪 Starting Weather Agent Simple Tests\n")
    
    all_passed = True
    
    # Run all test suites
    all_passed &= await test_weather_simulator()
    all_passed &= await test_weather_agent_initialization()
    all_passed &= await test_weather_analysis()
    all_passed &= await test_alert_generation()
    all_passed &= await test_message_handling()
    
    print("\n" + "="*50)
    if all_passed:
        print("🎉 ALL TESTS PASSED! Weather agent is working correctly.")
        return 0
    else:
        print("💥 SOME TESTS FAILED! Check the output above.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)