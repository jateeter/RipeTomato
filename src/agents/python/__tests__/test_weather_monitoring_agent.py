#!/usr/bin/env python3
"""
Unit Tests for Weather Monitoring Agent

Comprehensive test suite covering all aspects of the weather monitoring agent:
- Weather data simulation and generation
- Alert threshold monitoring and generation
- Message handling and cross-language communication
- Data analysis and statistical calculations
- Agent lifecycle and resource management

@license MIT
"""

import pytest
import asyncio
import json
import sys
import os
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any, List

# Add the parent directory to the path to import the agent modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from weather_monitoring_agent import (
    WeatherMonitoringAgent, 
    WeatherSimulator, 
    WeatherReading, 
    WeatherAlert
)
from base_agent import CrossLanguageMessage

class TestWeatherSimulator:
    """Test the weather simulation functionality"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.simulator = WeatherSimulator(base_temp=70.0, location="Test City")
    
    def test_simulator_initialization(self):
        """Test weather simulator initialization"""
        assert self.simulator.base_temp == 70.0
        assert self.simulator.location == "Test City"
        assert 'temperature_trend' in self.simulator.current_conditions
        assert 'pressure_trend' in self.simulator.current_conditions
        assert 'storm_probability' in self.simulator.current_conditions
    
    def test_generate_hourly_reading(self):
        """Test weather reading generation"""
        reading = self.simulator.generate_hourly_reading()
        
        # Verify all required fields are present
        assert hasattr(reading, 'timestamp')
        assert hasattr(reading, 'temperature_f')
        assert hasattr(reading, 'humidity_percent')
        assert hasattr(reading, 'precipitation_inches')
        assert hasattr(reading, 'wind_speed_mph')
        assert hasattr(reading, 'wind_direction')
        assert hasattr(reading, 'pressure_mb')
        assert hasattr(reading, 'visibility_miles')
        assert hasattr(reading, 'conditions')
        assert hasattr(reading, 'uv_index')
        
        # Verify realistic value ranges
        assert 0 <= reading.temperature_f <= 150
        assert 0 <= reading.humidity_percent <= 100
        assert 0 <= reading.precipitation_inches <= 5
        assert 0 <= reading.wind_speed_mph <= 100
        assert 900 <= reading.pressure_mb <= 1100
        assert 0 <= reading.visibility_miles <= 15
        assert 0 <= reading.uv_index <= 11
        
        # Verify wind direction is valid
        valid_directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                           'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
        assert reading.wind_direction in valid_directions
    
    def test_generate_multiple_readings(self):
        """Test generating multiple readings with time offsets"""
        readings = []
        for i in range(5):
            reading = self.simulator.generate_hourly_reading(hour_offset=i)
            readings.append(reading)
        
        assert len(readings) == 5
        
        # Verify timestamps are different
        timestamps = [r.timestamp for r in readings]
        assert len(set(timestamps)) == 5  # All unique
    
    def test_weather_reading_serialization(self):
        """Test weather reading serialization/deserialization"""
        original_reading = self.simulator.generate_hourly_reading()
        
        # Test to_dict
        reading_dict = original_reading.to_dict()
        assert isinstance(reading_dict, dict)
        assert 'timestamp' in reading_dict
        assert 'temperature_f' in reading_dict
        
        # Test from_dict
        reconstructed_reading = WeatherReading.from_dict(reading_dict)
        assert reconstructed_reading.timestamp == original_reading.timestamp
        assert reconstructed_reading.temperature_f == original_reading.temperature_f
        assert reconstructed_reading.conditions == original_reading.conditions

class TestWeatherAlert:
    """Test weather alert functionality"""
    
    def test_weather_alert_creation(self):
        """Test weather alert creation and serialization"""
        alert = WeatherAlert(
            alert_id="test_alert_001",
            timestamp=datetime.now(timezone.utc).isoformat(),
            alert_type="temperature",
            severity="high",
            message="Test alert message",
            recommendations=["Action 1", "Action 2"],
            affected_services=["shelter", "outreach"]
        )
        
        assert alert.alert_id == "test_alert_001"
        assert alert.alert_type == "temperature"
        assert alert.severity == "high"
        assert len(alert.recommendations) == 2
        assert len(alert.affected_services) == 2
        
        # Test serialization
        alert_dict = alert.to_dict()
        assert isinstance(alert_dict, dict)
        assert alert_dict['alert_id'] == "test_alert_001"
        assert alert_dict['severity'] == "high"

class TestWeatherMonitoringAgent:
    """Test the main weather monitoring agent"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.agent = WeatherMonitoringAgent("test_weather_agent", "Test City")
    
    def test_agent_initialization(self):
        """Test agent initialization"""
        assert self.agent.agent_id == "test_weather_agent"
        assert self.agent.name == "Weather Monitoring Agent"
        assert self.agent.version == "1.0.0"
        assert self.agent.location == "Test City"
        assert isinstance(self.agent.simulator, WeatherSimulator)
        assert isinstance(self.agent.weather_data, list)
        assert isinstance(self.agent.active_alerts, list)
        assert not self.agent.monitoring_active
        assert self.agent.monitoring_task is None
        
        # Test alert thresholds
        assert 'temperature_high' in self.agent.alert_thresholds
        assert 'precipitation_heavy' in self.agent.alert_thresholds
        assert 'wind_high' in self.agent.alert_thresholds
    
    @pytest.mark.asyncio
    async def test_agent_capabilities(self):
        """Test agent capabilities reporting"""
        capabilities = await self.agent.get_capabilities()
        
        expected_capabilities = [
            "ping", "status", "heartbeat",
            "start_monitoring", "stop_monitoring", 
            "get_current_weather", "get_weather_history",
            "get_weather_forecast", "get_weather_alerts",
            "weather_analysis_request"
        ]
        
        for capability in expected_capabilities:
            assert capability in capabilities
    
    @pytest.mark.asyncio
    async def test_agent_initialization_process(self):
        """Test agent initialization process"""
        await self.agent.initialize()
        
        # Should have one initial reading
        assert len(self.agent.weather_data) == 1
        assert isinstance(self.agent.weather_data[0], WeatherReading)
    
    @pytest.mark.asyncio
    async def test_start_stop_monitoring(self):
        """Test starting and stopping weather monitoring"""
        # Test starting monitoring
        success = await self.agent.start_weather_monitoring(duration_hours=1)
        assert success is True
        assert self.agent.monitoring_active is True
        assert self.agent.monitoring_task is not None
        
        # Test starting when already active
        success_again = await self.agent.start_weather_monitoring(duration_hours=1)
        assert success_again is False  # Should fail when already active
        
        # Test stopping monitoring
        success_stop = await self.agent.stop_weather_monitoring()
        assert success_stop is True
        assert self.agent.monitoring_active is False
        
        # Test stopping when not active
        success_stop_again = await self.agent.stop_weather_monitoring()
        assert success_stop_again is False
    
    def test_alert_threshold_checking(self):
        """Test weather alert threshold checking"""
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
        
        # Mock the send_message method to avoid actual message sending
        with patch.object(self.agent, 'send_message', new_callable=AsyncMock):
            # This would be called in the monitoring loop
            initial_alert_count = len(self.agent.active_alerts)
            
            # Manually test alert creation logic
            temp_alert = self.agent._create_temperature_alert(high_temp_reading, 'high')
            assert temp_alert.alert_type == 'temperature'
            assert temp_alert.severity in ['high', 'extreme']
            assert 'heat warning' in temp_alert.message.lower()
            assert len(temp_alert.recommendations) > 0
            assert 'shelter' in temp_alert.affected_services
    
    def test_weather_analysis(self):
        """Test weather analysis functionality"""
        # Add some test data
        test_readings = []
        base_time = datetime.now(timezone.utc)
        
        for i in range(24):  # 24 hours of data
            reading = WeatherReading(
                timestamp=(base_time - timedelta(hours=23-i)).isoformat(),
                temperature_f=70.0 + i,  # Rising temperature
                humidity_percent=60.0,
                precipitation_inches=0.1 if i % 6 == 0 else 0.0,  # Occasional rain
                wind_speed_mph=10.0 + i * 0.5,
                wind_direction="N",
                pressure_mb=1013.0,
                visibility_miles=10.0,
                conditions="Clear",
                uv_index=5
            )
            test_readings.append(reading)
        
        self.agent.weather_data = test_readings
        
        # Test analysis
        analysis = self.agent.get_weather_analysis(hours_back=24)
        
        assert 'temperature' in analysis
        assert 'humidity' in analysis
        assert 'precipitation' in analysis
        assert 'wind' in analysis
        assert 'conditions' in analysis
        
        # Check temperature analysis
        temp_analysis = analysis['temperature']
        assert temp_analysis['min'] == 70.0
        assert temp_analysis['max'] == 93.0  # 70 + 23
        assert temp_analysis['current'] == 93.0
        assert temp_analysis['trend'] == 'rising'
        
        # Check precipitation analysis
        precip_analysis = analysis['precipitation']
        assert precip_analysis['total'] == 0.4  # 4 rain events * 0.1 inches
        assert precip_analysis['hours_with_precip'] == 4
    
    def test_weather_analysis_no_data(self):
        """Test weather analysis with no data"""
        # Clear any existing data
        self.agent.weather_data = []
        
        analysis = self.agent.get_weather_analysis(hours_back=24)
        assert 'error' in analysis
        assert 'No weather data available' in analysis['error']
    
    def test_conditions_summary(self):
        """Test weather conditions summary"""
        test_readings = [
            WeatherReading(
                timestamp=datetime.now(timezone.utc).isoformat(),
                temperature_f=70.0, humidity_percent=60.0, precipitation_inches=0.0,
                wind_speed_mph=10.0, wind_direction="N", pressure_mb=1013.0,
                visibility_miles=10.0, conditions="Clear", uv_index=5
            ),
            WeatherReading(
                timestamp=datetime.now(timezone.utc).isoformat(),
                temperature_f=75.0, humidity_percent=65.0, precipitation_inches=0.2,
                wind_speed_mph=15.0, wind_direction="S", pressure_mb=1010.0,
                visibility_miles=8.0, conditions="Rain", uv_index=3
            ),
            WeatherReading(
                timestamp=datetime.now(timezone.utc).isoformat(),
                temperature_f=72.0, humidity_percent=62.0, precipitation_inches=0.0,
                wind_speed_mph=12.0, wind_direction="W", pressure_mb=1015.0,
                visibility_miles=10.0, conditions="Clear", uv_index=6
            )
        ]
        
        summary = self.agent._get_conditions_summary(test_readings)
        assert summary['Clear'] == 2
        assert summary['Rain'] == 1
    
    @pytest.mark.asyncio
    async def test_message_handlers(self):
        """Test message handling functionality"""
        # Mock the send_message method
        with patch.object(self.agent, 'send_message', new_callable=AsyncMock) as mock_send:
            # Test start monitoring message
            start_message = CrossLanguageMessage(
                msg_id="test_start_001",
                msg_type="start_monitoring",
                source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
                destination={"agentId": self.agent.agent_id},
                payload={"duration_hours": 48},
                metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
            )
            
            await self.agent.handle_start_monitoring(start_message)
            
            # Verify monitoring started
            assert self.agent.monitoring_active is True
            
            # Verify response was sent
            mock_send.assert_called_once()
            call_args = mock_send.call_args[0][0]
            assert call_args.msg_type == "monitoring_response"
            assert call_args.payload['success'] is True
            
            # Reset mock
            mock_send.reset_mock()
            
            # Test stop monitoring message
            stop_message = CrossLanguageMessage(
                msg_id="test_stop_001",
                msg_type="stop_monitoring",
                source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
                destination={"agentId": self.agent.agent_id},
                payload={},
                metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
            )
            
            await self.agent.handle_stop_monitoring(stop_message)
            
            # Verify monitoring stopped
            assert self.agent.monitoring_active is False
            
            # Verify response was sent
            mock_send.assert_called_once()
            call_args = mock_send.call_args[0][0]
            assert call_args.msg_type == "monitoring_response"
            assert call_args.payload['success'] is True
    
    @pytest.mark.asyncio
    async def test_current_weather_handler(self):
        """Test current weather request handler"""
        # Add some test data
        await self.agent.initialize()
        
        with patch.object(self.agent, 'send_message', new_callable=AsyncMock) as mock_send:
            current_weather_message = CrossLanguageMessage(
                msg_id="test_current_001",
                msg_type="get_current_weather",
                source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
                destination={"agentId": self.agent.agent_id},
                payload={},
                metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
            )
            
            await self.agent.handle_get_current_weather(current_weather_message)
            
            # Verify response was sent
            mock_send.assert_called_once()
            call_args = mock_send.call_args[0][0]
            assert call_args.msg_type == "weather_response"
            assert 'current_weather' in call_args.payload
            assert call_args.payload['current_weather'] is not None
            assert call_args.payload['location'] == "Test City"
    
    @pytest.mark.asyncio
    async def test_weather_history_handler(self):
        """Test weather history request handler"""
        # Add some test data
        await self.agent.initialize()
        
        with patch.object(self.agent, 'send_message', new_callable=AsyncMock) as mock_send:
            history_message = CrossLanguageMessage(
                msg_id="test_history_001",
                msg_type="get_weather_history",
                source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
                destination={"agentId": self.agent.agent_id},
                payload={"hours_back": 12},
                metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
            )
            
            await self.agent.handle_get_weather_history(history_message)
            
            # Verify response was sent
            mock_send.assert_called_once()
            call_args = mock_send.call_args[0][0]
            assert call_args.msg_type == "weather_history_response"
            assert 'weather_history' in call_args.payload
            assert call_args.payload['hours_requested'] == 12
    
    @pytest.mark.asyncio
    async def test_weather_forecast_handler(self):
        """Test weather forecast request handler"""
        with patch.object(self.agent, 'send_message', new_callable=AsyncMock) as mock_send:
            forecast_message = CrossLanguageMessage(
                msg_id="test_forecast_001",
                msg_type="get_weather_forecast",
                source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
                destination={"agentId": self.agent.agent_id},
                payload={"hours_ahead": 6},
                metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
            )
            
            await self.agent.handle_get_weather_forecast(forecast_message)
            
            # Verify response was sent
            mock_send.assert_called_once()
            call_args = mock_send.call_args[0][0]
            assert call_args.msg_type == "weather_forecast_response"
            assert 'forecast' in call_args.payload
            assert len(call_args.payload['forecast']) == 6
            assert call_args.payload['data_quality'] == "simulated"
    
    @pytest.mark.asyncio
    async def test_weather_alerts_handler(self):
        """Test weather alerts request handler"""
        # Add a test alert
        test_alert = WeatherAlert(
            alert_id="test_alert_001",
            timestamp=datetime.now(timezone.utc).isoformat(),
            alert_type="temperature",
            severity="high",
            message="Test alert",
            recommendations=["Test action"],
            affected_services=["shelter"]
        )
        self.agent.active_alerts.append(test_alert)
        
        with patch.object(self.agent, 'send_message', new_callable=AsyncMock) as mock_send:
            alerts_message = CrossLanguageMessage(
                msg_id="test_alerts_001",
                msg_type="get_weather_alerts",
                source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
                destination={"agentId": self.agent.agent_id},
                payload={},
                metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
            )
            
            await self.agent.handle_get_weather_alerts(alerts_message)
            
            # Verify response was sent
            mock_send.assert_called_once()
            call_args = mock_send.call_args[0][0]
            assert call_args.msg_type == "weather_alerts_response"
            assert 'active_alerts' in call_args.payload
            assert len(call_args.payload['active_alerts']) == 1
            assert call_args.payload['alert_count'] == 1
    
    @pytest.mark.asyncio
    async def test_update_alert_thresholds_handler(self):
        """Test alert threshold update handler"""
        original_temp_high = self.agent.alert_thresholds['temperature_high']
        
        with patch.object(self.agent, 'send_message', new_callable=AsyncMock) as mock_send:
            update_message = CrossLanguageMessage(
                msg_id="test_update_001",
                msg_type="update_alert_thresholds",
                source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
                destination={"agentId": self.agent.agent_id},
                payload={"thresholds": {"temperature_high": 100.0, "wind_high": 35.0}},
                metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
            )
            
            await self.agent.handle_update_alert_thresholds(update_message)
            
            # Verify thresholds were updated
            assert self.agent.alert_thresholds['temperature_high'] == 100.0
            assert self.agent.alert_thresholds['wind_high'] == 35.0
            
            # Verify response was sent
            mock_send.assert_called_once()
            call_args = mock_send.call_args[0][0]
            assert call_args.msg_type == "thresholds_update_response"
            assert call_args.payload['success'] is True
    
    @pytest.mark.asyncio
    async def test_weather_analysis_handler(self):
        """Test weather analysis request handler"""
        # Add some test data
        await self.agent.initialize()
        
        with patch.object(self.agent, 'send_message', new_callable=AsyncMock) as mock_send:
            analysis_message = CrossLanguageMessage(
                msg_id="test_analysis_001",
                msg_type="weather_analysis_request",
                source={"agentId": "test_sender", "language": "javascript", "runtime": "nodejs"},
                destination={"agentId": self.agent.agent_id},
                payload={"hours_back": 24},
                metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
            )
            
            await self.agent.handle_weather_analysis_request(analysis_message)
            
            # Verify response was sent
            mock_send.assert_called_once()
            call_args = mock_send.call_args[0][0]
            assert call_args.msg_type == "weather_analysis_response"
            assert 'analysis' in call_args.payload
            assert call_args.payload['location'] == "Test City"
    
    @pytest.mark.asyncio
    async def test_cleanup(self):
        """Test agent cleanup"""
        # Start monitoring first
        await self.agent.start_weather_monitoring(duration_hours=1)
        assert self.agent.monitoring_active is True
        
        # Test cleanup
        await self.agent.cleanup()
        assert self.agent.monitoring_active is False

class TestIntegrationScenarios:
    """Test realistic integration scenarios"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.agent = WeatherMonitoringAgent("integration_test_agent", "Integration City")
    
    @pytest.mark.asyncio
    async def test_extreme_weather_scenario(self):
        """Test handling of extreme weather conditions"""
        await self.agent.initialize()
        
        # Create extreme weather reading
        extreme_reading = WeatherReading(
            timestamp=datetime.now(timezone.utc).isoformat(),
            temperature_f=105.0,  # Extreme heat
            humidity_percent=85.0,  # High humidity
            precipitation_inches=1.5,  # Heavy rain
            wind_speed_mph=55.0,  # Extreme wind
            wind_direction="W",
            pressure_mb=980.0,  # Low pressure
            visibility_miles=1.0,  # Poor visibility
            conditions="Severe Thunderstorm",
            uv_index=0  # Overcast
        )
        
        self.agent.weather_data.append(extreme_reading)
        
        with patch.object(self.agent, 'send_message', new_callable=AsyncMock):
            # Simulate alert checking
            await self.agent._check_weather_alerts(extreme_reading)
        
        # Should generate multiple alerts
        assert len(self.agent.active_alerts) > 0
        
        # Check for different types of alerts
        alert_types = {alert.alert_type for alert in self.agent.active_alerts}
        assert 'temperature' in alert_types
        assert 'precipitation' in alert_types
        assert 'wind' in alert_types
        assert 'visibility' in alert_types
    
    @pytest.mark.asyncio
    async def test_week_long_monitoring_simulation(self):
        """Test simulated week-long monitoring scenario"""
        await self.agent.initialize()
        
        # Simulate a week of data collection (accelerated)
        for day in range(7):
            for hour in range(24):
                reading = self.agent.simulator.generate_hourly_reading(hour_offset=day*24 + hour)
                self.agent.weather_data.append(reading)
        
        # Verify we have a week's worth of data
        assert len(self.agent.weather_data) > 168  # More than 7 days worth (initial + generated)
        
        # Test analysis over different periods
        daily_analysis = self.agent.get_weather_analysis(hours_back=24)
        weekly_analysis = self.agent.get_weather_analysis(hours_back=168)
        
        assert 'temperature' in daily_analysis
        assert 'temperature' in weekly_analysis
        
        # Weekly analysis should have more data points
        assert weekly_analysis['data_points'] > daily_analysis['data_points']
    
    @pytest.mark.asyncio
    async def test_cross_language_communication_flow(self):
        """Test complete cross-language communication flow"""
        await self.agent.initialize()
        
        with patch.object(self.agent, 'send_message', new_callable=AsyncMock) as mock_send:
            # Simulate receiving a request from a JavaScript agent
            js_request = CrossLanguageMessage(
                msg_id="js_weather_request_001",
                msg_type="get_current_weather",
                source={"agentId": "shelter_management_js", "language": "javascript", "runtime": "nodejs"},
                destination={"agentId": self.agent.agent_id},
                payload={},
                metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
            )
            
            # Process the request
            await self.agent.handle_get_current_weather(js_request)
            
            # Verify response
            mock_send.assert_called_once()
            response = mock_send.call_args[0][0]
            
            assert response.msg_type == "weather_response"
            assert response.destination == js_request.source
            assert response.metadata['correlationId'] == js_request.id
            assert 'current_weather' in response.payload
            
            # Simulate weather alert broadcast
            mock_send.reset_mock()
            
            alert_reading = WeatherReading(
                timestamp=datetime.now(timezone.utc).isoformat(),
                temperature_f=100.0, humidity_percent=50.0, precipitation_inches=0.0,
                wind_speed_mph=5.0, wind_direction="N", pressure_mb=1013.0,
                visibility_miles=10.0, conditions="Hot", uv_index=8
            )
            
            await self.agent._check_weather_alerts(alert_reading)
            
            # Should have sent alert broadcast
            assert mock_send.call_count > 0
            
            # Find the alert message
            alert_calls = [call for call in mock_send.call_args_list 
                          if call[0][0].msg_type == "weather_alert"]
            assert len(alert_calls) > 0
            
            alert_message = alert_calls[0][0][0]
            assert alert_message.destination == {"broadcast": True}
            assert alert_message.metadata['priority'] == "high"

# Performance and load testing
class TestPerformanceAndLoad:
    """Test performance characteristics and load handling"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.agent = WeatherMonitoringAgent("performance_test_agent", "Performance City")
    
    def test_large_dataset_analysis_performance(self):
        """Test analysis performance with large datasets"""
        import time
        
        # Generate large dataset (1 month of hourly data)
        large_dataset = []
        base_time = datetime.now(timezone.utc)
        
        for i in range(24 * 30):  # 30 days * 24 hours
            reading = WeatherReading(
                timestamp=(base_time - timedelta(hours=i)).isoformat(),
                temperature_f=70.0 + (i % 48) - 24,  # Temperature cycle
                humidity_percent=60.0 + (i % 20) - 10,
                precipitation_inches=0.1 if i % 12 == 0 else 0.0,
                wind_speed_mph=10.0 + (i % 16),
                wind_direction="N",
                pressure_mb=1013.0 + (i % 10) - 5,
                visibility_miles=10.0,
                conditions="Clear",
                uv_index=5
            )
            large_dataset.append(reading)
        
        self.agent.weather_data = large_dataset
        
        # Time the analysis
        start_time = time.time()
        analysis = self.agent.get_weather_analysis(hours_back=168)  # 1 week analysis
        end_time = time.time()
        
        execution_time = end_time - start_time
        
        # Analysis should complete quickly (less than 1 second for this dataset)
        assert execution_time < 1.0
        
        # Verify analysis results are correct
        assert analysis['data_points'] == 168
        assert 'temperature' in analysis
        assert 'precipitation' in analysis
    
    @pytest.mark.asyncio
    async def test_concurrent_message_handling(self):
        """Test handling multiple concurrent messages"""
        await self.agent.initialize()
        
        with patch.object(self.agent, 'send_message', new_callable=AsyncMock):
            # Create multiple concurrent requests
            concurrent_requests = []
            
            for i in range(10):
                request = self.agent.handle_get_current_weather(
                    CrossLanguageMessage(
                        msg_id=f"concurrent_request_{i}",
                        msg_type="get_current_weather",
                        source={"agentId": f"requester_{i}", "language": "javascript", "runtime": "nodejs"},
                        destination={"agentId": self.agent.agent_id},
                        payload={},
                        metadata={"priority": "normal", "retryCount": 0, "maxRetries": 0, "timeoutMs": 5000}
                    )
                )
                concurrent_requests.append(request)
            
            # Execute all requests concurrently
            await asyncio.gather(*concurrent_requests)
            
            # All requests should complete without error
            # (If we reach this point, no exceptions were raised)
            assert True

# Run the tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])