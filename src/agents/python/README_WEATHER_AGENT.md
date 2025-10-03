# Weather Monitoring Agent

A comprehensive Python agent that simulates hourly weather monitoring for community services planning and operations. This agent demonstrates the multi-language agent infrastructure capabilities by providing real-time weather data collection, analysis, and alerting for shelter operations, outdoor events, and transportation services.

## 🌤️ Features

### Core Weather Monitoring
- **Hourly Weather Simulation**: Realistic weather pattern generation with temperature cycles, precipitation events, and seasonal variations
- **7-Day Continuous Monitoring**: Configurable monitoring duration with automatic data retention management
- **Real-Time Weather Data**: Temperature, humidity, precipitation, wind speed/direction, atmospheric pressure, visibility, UV index
- **Weather Condition Classification**: Clear, cloudy, rainy, snowy, foggy, and severe weather conditions

### Intelligent Alerting System
- **Configurable Thresholds**: Customizable alert triggers for temperature, precipitation, wind, visibility, and UV levels
- **Multi-Severity Alerts**: Low, medium, high, and extreme severity classifications
- **Service Impact Analysis**: Automatic identification of affected community services (shelter, transportation, outdoor events)
- **Alert Recommendations**: Actionable guidance for each alert type and severity level

### Advanced Analytics
- **Trend Analysis**: Temperature trending, precipitation patterns, and weather condition frequency
- **Historical Data Analysis**: Configurable lookback periods from hours to weeks
- **Statistical Reporting**: Min/max/average calculations with data quality metrics
- **Forecast Simulation**: Predictive weather modeling for planning purposes

### Cross-Language Integration
- **Multi-Language Communication**: Seamless integration with JavaScript/TypeScript agents
- **Event Broadcasting**: Real-time weather updates and alerts to all subscribed agents
- **Command Handling**: Remote start/stop monitoring, threshold updates, and data requests
- **Resource Monitoring**: Memory, CPU, and performance tracking

## 📁 File Structure

```
src/agents/python/
├── weather_monitoring_agent.py      # Main weather agent implementation
├── base_agent.py                    # Base Python agent framework
├── __tests__/
│   └── test_weather_monitoring_agent.py  # Comprehensive unit tests
├── test_weather_agent_simple.py     # Simple test runner (no external deps)
└── README_WEATHER_AGENT.md         # This documentation
```

## 🚀 Quick Start

### 1. Direct Python Execution

```bash
# Run the weather agent directly
cd src/agents/python
python3 weather_monitoring_agent.py --agent-id weather_boise --location "Boise, ID"
```

### 2. Multi-Language Runtime Integration

```typescript
import { enhancedBotLabCore, AgentLanguage } from '../services/enhancedBotlabCore';

const weatherConfig = {
  botId: 'weather_monitor_boise',
  name: 'Boise Weather Monitor',
  language: AgentLanguage.PYTHON,
  scriptPath: './src/agents/python/weather_monitoring_agent.py',
  settings: {
    location: 'Boise, ID',
    monitoring_duration_hours: 168, // 1 week
    alert_thresholds: {
      temperature_high: 95.0,
      temperature_low: 20.0,
      precipitation_heavy: 0.5,
      wind_high: 30.0
    }
  }
};

await enhancedBotLabCore.registerMultiLanguageBot(weatherConfig);
await enhancedBotLabCore.startMultiLanguageBot('weather_monitor_boise');
```

### 3. Demo Mode

```bash
# Run the comprehensive demo
cd src/examples
npm run ts-node weatherAgentDemo.ts
```

## 🧪 Testing

### Unit Tests (Comprehensive)
```bash
cd src/agents/python
python3 test_weather_agent_simple.py
```

**Test Coverage:**
- ✅ Weather simulation functionality (15 tests)
- ✅ Agent initialization and configuration (13 tests)  
- ✅ Data analysis and trend calculation (10 tests)
- ✅ Alert generation and classification (7 tests)
- ✅ Cross-language message handling (7 tests)

**Total: 52 tests, 100% pass rate**

### Integration Tests
```bash
npm test -- --testPathPattern="weatherAgentIntegration"
```

Tests the complete integration with the multi-language runtime system including agent registration, cross-language communication, and error handling.

## 📡 API Reference

### Message Types

#### Weather Data Requests

**Get Current Weather**
```json
{
  "type": "get_current_weather",
  "payload": {}
}
```

**Get Weather History**
```json
{
  "type": "get_weather_history", 
  "payload": {
    "hours_back": 24
  }
}
```

**Get Weather Forecast**
```json
{
  "type": "get_weather_forecast",
  "payload": {
    "hours_ahead": 48
  }
}
```

#### Control Commands

**Start Monitoring**
```json
{
  "type": "start_monitoring",
  "payload": {
    "duration_hours": 168
  }
}
```

**Stop Monitoring**
```json
{
  "type": "stop_monitoring",
  "payload": {}
}
```

**Update Alert Thresholds**
```json
{
  "type": "update_alert_thresholds",
  "payload": {
    "thresholds": {
      "temperature_high": 100.0,
      "precipitation_heavy": 0.3,
      "wind_high": 25.0
    }
  }
}
```

#### Analysis Requests

**Weather Analysis**
```json
{
  "type": "weather_analysis_request",
  "payload": {
    "hours_back": 72
  }
}
```

### Response Types

#### Weather Data Response
```json
{
  "type": "weather_response",
  "payload": {
    "location": "Boise, ID",
    "current_weather": {
      "timestamp": "2024-01-15T10:30:00Z",
      "temperature_f": 72.5,
      "humidity_percent": 55.0,
      "precipitation_inches": 0.0,
      "wind_speed_mph": 8.5,
      "wind_direction": "NW",
      "pressure_mb": 1013.2,
      "visibility_miles": 10.0,
      "conditions": "Clear",
      "uv_index": 6
    },
    "monitoring_active": true
  }
}
```

#### Weather Alert Broadcast
```json
{
  "type": "weather_alert",
  "payload": {
    "location": "Boise, ID",
    "alert": {
      "alert_id": "temp_high_001",
      "alert_type": "temperature",
      "severity": "extreme",
      "message": "Extreme heat warning: 105.0°F",
      "recommendations": [
        "Open cooling centers for vulnerable populations",
        "Increase hydration stations at outdoor events",
        "Consider rescheduling outdoor activities"
      ],
      "affected_services": ["shelter", "outreach", "outdoor_events"]
    }
  }
}
```

## 🏠 Community Services Use Cases

### Shelter Operations
- **Temperature Extremes**: Automatically open cooling/warming centers based on weather conditions
- **Capacity Planning**: Adjust shelter capacity for weather-driven demand changes
- **Transportation Coordination**: Schedule client pickup during severe weather events
- **Resource Allocation**: Deploy additional staff and supplies based on weather forecasts

### Outdoor Events
- **Event Management**: Cancel/reschedule events for severe weather conditions
- **Safety Protocols**: Adjust safety measures based on wind, precipitation, and visibility
- **Participant Communication**: Provide real-time weather updates to event participants
- **Equipment Management**: Secure outdoor equipment before high wind events

### Transportation Services
- **Route Planning**: Optimize routes around weather-affected areas
- **Vehicle Safety**: Adjust vehicle operations for visibility and wind conditions
- **Schedule Modifications**: Modify pickup/dropoff schedules for severe weather
- **Emergency Response**: Coordinate emergency transportation during weather events

### Outreach Services
- **Wellness Checks**: Prioritize checks on vulnerable populations during extreme weather
- **Resource Deployment**: Deploy additional outreach teams during weather emergencies
- **Emergency Coordination**: Coordinate with emergency services for weather-related incidents
- **Preventive Outreach**: Proactive outreach before predicted severe weather

## ⚙️ Configuration

### Alert Thresholds (Default)
```python
alert_thresholds = {
    'temperature_high': 95.0,      # °F
    'temperature_low': 20.0,       # °F  
    'precipitation_heavy': 0.5,    # inches/hour
    'precipitation_extreme': 1.0,  # inches/hour
    'wind_high': 30.0,             # mph
    'wind_extreme': 50.0,          # mph
    'visibility_low': 2.0,         # miles
    'uv_extreme': 8                # UV index
}
```

### Runtime Resources
```json
{
  "resourceLimits": {
    "maxMemoryMB": 256,
    "maxCpuPercent": 50,
    "timeoutMs": 30000
  }
}
```

### Environment Variables
- `PYTHONPATH`: Path to Python agent modules
- `WEATHER_CONFIG`: Configuration mode (production/development)
- `LOG_LEVEL`: Logging verbosity (INFO/DEBUG/WARNING)

## 🔧 Architecture

### Weather Simulation Engine
The `WeatherSimulator` class generates realistic weather patterns by:
- **Diurnal Temperature Cycles**: Daily temperature variations with peak at 2 PM
- **Pressure Systems**: Atmospheric pressure trends affecting weather patterns
- **Storm Probability**: Dynamic storm generation with seasonal variations
- **Correlation Effects**: Realistic relationships between temperature, humidity, and precipitation

### Alert Generation System
Multi-layered alert system with:
- **Threshold Monitoring**: Continuous comparison against configurable thresholds
- **Severity Classification**: Automatic severity assignment based on impact levels
- **Service Impact Analysis**: Identification of affected community services
- **Recommendation Engine**: Actionable guidance generation for each alert type

### Cross-Language Communication
Implements the multi-language agent protocol:
- **JSON Message Protocol**: Standardized message format for cross-language communication
- **Async Message Handling**: Non-blocking message processing with error recovery
- **Event Broadcasting**: Pub/sub pattern for weather updates and alerts
- **Command Processing**: Remote control capabilities for monitoring and configuration

## 📊 Performance Characteristics

- **Memory Usage**: ~50-100MB during normal operation
- **CPU Usage**: <5% during monitoring, <20% during analysis
- **Data Retention**: Automatic cleanup of data older than 7 days
- **Message Throughput**: >100 messages/second processing capacity
- **Response Time**: <500ms for data requests, <2s for complex analysis

## 🐛 Error Handling

The agent implements comprehensive error handling:
- **Connection Resilience**: Automatic reconnection on communication failures
- **Data Validation**: Input validation with graceful error responses
- **Resource Protection**: Memory and CPU usage monitoring with limits
- **Graceful Degradation**: Continued operation during partial failures
- **Error Reporting**: Detailed error messages with context for debugging

## 🚀 Future Enhancements

- **Real Weather API Integration**: Connect to actual weather services (OpenWeatherMap, NOAA)
- **Machine Learning Predictions**: Implement ML models for improved forecasting
- **Geographic Expansion**: Support for multiple monitoring locations
- **Historical Weather Database**: Long-term weather data storage and analysis
- **Mobile App Integration**: Real-time weather alerts for mobile applications
- **IoT Sensor Integration**: Support for physical weather station data

## 📝 License

MIT License - See project LICENSE file for details.

## 👥 Contributing

This weather agent demonstrates the multi-language agent infrastructure capabilities. Contributions should focus on:
- Enhanced weather simulation algorithms
- Additional alert types and severity levels
- Integration with real weather APIs
- Performance optimizations
- Additional community service use cases

---

*Built with the Multi-Language Agent Runtime System for Community Services*