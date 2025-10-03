#!/usr/bin/env python3
"""
Example Python Analytics Agent

Demonstrates how to create a Python agent that integrates with the
multi-language agent runtime. This agent provides data analytics
capabilities for shelter and client management.

Features:
- Client data analytics and reporting
- Shelter occupancy trend analysis
- Resource allocation optimization
- Predictive analytics for demand forecasting
- Integration with JavaScript/TypeScript agent ecosystem

Usage:
    python3 example_analytics_agent.py --agent-id analytics_001

@license MIT
"""

import asyncio
import json
import sys
import os
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import statistics
import math

# Add the base agent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from base_agent import BaseAgent, CrossLanguageMessage, parse_args, logger

class AnalyticsAgent(BaseAgent):
    """Python agent for data analytics and reporting"""
    
    def __init__(self, agent_id: str):
        super().__init__(agent_id, "Analytics Agent", "1.0.0")
        
        # Analytics-specific state
        self.client_data: List[Dict[str, Any]] = []
        self.shelter_data: List[Dict[str, Any]] = []
        self.occupancy_history: List[Dict[str, Any]] = []
        self.analytics_cache: Dict[str, Any] = {}
        self.last_analysis_time = datetime.now(timezone.utc)
        
        # Register analytics-specific message handlers
        self.register_analytics_handlers()
    
    def register_analytics_handlers(self):
        """Register analytics-specific message handlers"""
        self.register_handler('analyze_client_data', self.handle_analyze_client_data)
        self.register_handler('analyze_shelter_occupancy', self.handle_analyze_shelter_occupancy)
        self.register_handler('predict_demand', self.handle_predict_demand)
        self.register_handler('generate_report', self.handle_generate_report)
        self.register_handler('update_data', self.handle_update_data)
        self.register_handler('get_analytics_summary', self.handle_get_analytics_summary)
        
        logger.info("📊 Registered analytics message handlers")
    
    async def initialize(self):
        """Initialize analytics agent resources"""
        logger.info("🔬 Initializing Analytics Agent...")
        
        # Load cached data if available
        await self.load_cached_data()
        
        # Initialize analytics modules
        await self.initialize_analytics_modules()
        
        logger.info("✅ Analytics Agent initialized successfully")
    
    async def cleanup(self):
        """Cleanup analytics agent resources"""
        logger.info("🧹 Cleaning up Analytics Agent...")
        
        # Save current data to cache
        await self.save_cached_data()
        
        logger.info("✅ Analytics Agent cleanup completed")
    
    async def get_capabilities(self) -> List[str]:
        """Get analytics agent capabilities"""
        return [
            "ping", "status", "heartbeat",
            "analyze_client_data", "analyze_shelter_occupancy",
            "predict_demand", "generate_report", "update_data",
            "get_analytics_summary"
        ]
    
    async def initialize_analytics_modules(self):
        """Initialize analytics computation modules"""
        # Simulate initialization of various analytics modules
        modules = [
            "client_behavior_analyzer",
            "occupancy_trend_analyzer", 
            "demand_predictor",
            "resource_optimizer",
            "report_generator"
        ]
        
        for module in modules:
            # Simulate module initialization
            await asyncio.sleep(0.1)
            logger.debug(f"📈 Initialized analytics module: {module}")
    
    async def load_cached_data(self):
        """Load cached analytics data"""
        try:
            # In a real implementation, this would load from persistent storage
            logger.debug("💾 Loading cached analytics data...")
            # Simulate loading cached data
            await asyncio.sleep(0.1)
        except Exception as e:
            logger.warning(f"⚠️ Could not load cached data: {e}")
    
    async def save_cached_data(self):
        """Save current analytics data to cache"""
        try:
            # In a real implementation, this would save to persistent storage
            logger.debug("💾 Saving analytics data to cache...")
            # Simulate saving data
            await asyncio.sleep(0.1)
        except Exception as e:
            logger.warning(f"⚠️ Could not save cached data: {e}")
    
    # Analytics Message Handlers
    
    async def handle_analyze_client_data(self, message: CrossLanguageMessage):
        """Analyze client data and generate insights"""
        try:
            logger.info("📊 Analyzing client data...")
            
            payload = message.payload
            client_data = payload.get('client_data', [])
            analysis_type = payload.get('analysis_type', 'comprehensive')
            
            # Perform client data analysis
            analysis_result = await self.analyze_client_patterns(client_data, analysis_type)
            
            # Send response
            response = CrossLanguageMessage(
                msg_id=f"client_analysis_{int(time.time() * 1000)}",
                msg_type="client_analysis_result",
                source={
                    "agentId": self.agent_id,
                    "language": "python",
                    "runtime": "python3"
                },
                destination=message.source,
                payload={
                    "analysis_result": analysis_result,
                    "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
                    "data_points_analyzed": len(client_data)
                },
                metadata={
                    "priority": "normal",
                    "correlationId": message.id,
                    "retryCount": 0,
                    "maxRetries": 0,
                    "timeoutMs": 10000
                }
            )
            await self.send_message(response)
            
        except Exception as e:
            logger.error(f"❌ Error analyzing client data: {e}")
            await self.send_error_message(str(e), message.id)
    
    async def handle_analyze_shelter_occupancy(self, message: CrossLanguageMessage):
        """Analyze shelter occupancy patterns"""
        try:
            logger.info("🏠 Analyzing shelter occupancy...")
            
            payload = message.payload
            occupancy_data = payload.get('occupancy_data', [])
            time_period = payload.get('time_period', '30d')
            
            # Perform occupancy analysis
            analysis_result = await self.analyze_occupancy_trends(occupancy_data, time_period)
            
            # Send response
            response = CrossLanguageMessage(
                msg_id=f"occupancy_analysis_{int(time.time() * 1000)}",
                msg_type="occupancy_analysis_result",
                source={
                    "agentId": self.agent_id,
                    "language": "python",
                    "runtime": "python3"
                },
                destination=message.source,
                payload={
                    "analysis_result": analysis_result,
                    "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
                    "time_period": time_period
                },
                metadata={
                    "priority": "normal",
                    "correlationId": message.id,
                    "retryCount": 0,
                    "maxRetries": 0,
                    "timeoutMs": 10000
                }
            )
            await self.send_message(response)
            
        except Exception as e:
            logger.error(f"❌ Error analyzing occupancy: {e}")
            await self.send_error_message(str(e), message.id)
    
    async def handle_predict_demand(self, message: CrossLanguageMessage):
        """Predict future demand for shelter services"""
        try:
            logger.info("🔮 Predicting demand...")
            
            payload = message.payload
            historical_data = payload.get('historical_data', [])
            prediction_period = payload.get('prediction_period', '7d')
            
            # Perform demand prediction
            prediction_result = await self.predict_service_demand(historical_data, prediction_period)
            
            # Send response
            response = CrossLanguageMessage(
                msg_id=f"demand_prediction_{int(time.time() * 1000)}",
                msg_type="demand_prediction_result",
                source={
                    "agentId": self.agent_id,
                    "language": "python",
                    "runtime": "python3"
                },
                destination=message.source,
                payload={
                    "prediction_result": prediction_result,
                    "prediction_timestamp": datetime.now(timezone.utc).isoformat(),
                    "prediction_period": prediction_period
                },
                metadata={
                    "priority": "normal",
                    "correlationId": message.id,
                    "retryCount": 0,
                    "maxRetries": 0,
                    "timeoutMs": 15000
                }
            )
            await self.send_message(response)
            
        except Exception as e:
            logger.error(f"❌ Error predicting demand: {e}")
            await self.send_error_message(str(e), message.id)
    
    async def handle_generate_report(self, message: CrossLanguageMessage):
        """Generate analytics report"""
        try:
            logger.info("📋 Generating analytics report...")
            
            payload = message.payload
            report_type = payload.get('report_type', 'summary')
            include_charts = payload.get('include_charts', False)
            
            # Generate report
            report = await self.generate_analytics_report(report_type, include_charts)
            
            # Send response
            response = CrossLanguageMessage(
                msg_id=f"report_{int(time.time() * 1000)}",
                msg_type="analytics_report",
                source={
                    "agentId": self.agent_id,
                    "language": "python",
                    "runtime": "python3"
                },
                destination=message.source,
                payload={
                    "report": report,
                    "report_timestamp": datetime.now(timezone.utc).isoformat(),
                    "report_type": report_type
                },
                metadata={
                    "priority": "normal",
                    "correlationId": message.id,
                    "retryCount": 0,
                    "maxRetries": 0,
                    "timeoutMs": 20000
                }
            )
            await self.send_message(response)
            
        except Exception as e:
            logger.error(f"❌ Error generating report: {e}")
            await self.send_error_message(str(e), message.id)
    
    async def handle_update_data(self, message: CrossLanguageMessage):
        """Update analytics data"""
        try:
            payload = message.payload
            data_type = payload.get('data_type')
            data = payload.get('data', [])
            
            if data_type == 'client_data':
                self.client_data.extend(data)
                logger.info(f"📊 Updated client data ({len(data)} new records)")
            elif data_type == 'shelter_data':
                self.shelter_data.extend(data)
                logger.info(f"🏠 Updated shelter data ({len(data)} new records)")
            elif data_type == 'occupancy_data':
                self.occupancy_history.extend(data)
                logger.info(f"📈 Updated occupancy data ({len(data)} new records)")
            
            # Send acknowledgment
            response = CrossLanguageMessage(
                msg_id=f"data_updated_{int(time.time() * 1000)}",
                msg_type="data_update_ack",
                source={
                    "agentId": self.agent_id,
                    "language": "python",
                    "runtime": "python3"
                },
                destination=message.source,
                payload={
                    "status": "success",
                    "data_type": data_type,
                    "records_added": len(data),
                    "total_records": len(getattr(self, f"{data_type}", []))
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
            
        except Exception as e:
            logger.error(f"❌ Error updating data: {e}")
            await self.send_error_message(str(e), message.id)
    
    async def handle_get_analytics_summary(self, message: CrossLanguageMessage):
        """Get analytics summary"""
        try:
            summary = await self.get_analytics_summary()
            
            response = CrossLanguageMessage(
                msg_id=f"analytics_summary_{int(time.time() * 1000)}",
                msg_type="analytics_summary",
                source={
                    "agentId": self.agent_id,
                    "language": "python",
                    "runtime": "python3"
                },
                destination=message.source,
                payload=summary,
                metadata={
                    "priority": "normal",
                    "correlationId": message.id,
                    "retryCount": 0,
                    "maxRetries": 0,
                    "timeoutMs": 5000
                }
            )
            await self.send_message(response)
            
        except Exception as e:
            logger.error(f"❌ Error getting analytics summary: {e}")
            await self.send_error_message(str(e), message.id)
    
    # Analytics Implementation Methods
    
    async def analyze_client_patterns(self, client_data: List[Dict[str, Any]], analysis_type: str) -> Dict[str, Any]:
        """Analyze client behavior patterns"""
        # Simulate complex analytics processing
        await asyncio.sleep(0.5)  # Simulate computation time
        
        if not client_data:
            return {"error": "No client data provided"}
        
        # Basic statistical analysis
        total_clients = len(client_data)
        demographics = self.analyze_demographics(client_data)
        service_usage = self.analyze_service_usage(client_data)
        trends = self.analyze_client_trends(client_data)
        
        return {
            "total_clients": total_clients,
            "demographics": demographics,
            "service_usage": service_usage,
            "trends": trends,
            "analysis_type": analysis_type,
            "confidence_score": 0.85  # Simulated confidence
        }
    
    async def analyze_occupancy_trends(self, occupancy_data: List[Dict[str, Any]], time_period: str) -> Dict[str, Any]:
        """Analyze shelter occupancy trends"""
        await asyncio.sleep(0.3)  # Simulate computation time
        
        if not occupancy_data:
            return {"error": "No occupancy data provided"}
        
        # Calculate occupancy statistics
        occupancy_rates = [entry.get('occupancy_rate', 0) for entry in occupancy_data]
        
        return {
            "average_occupancy": statistics.mean(occupancy_rates) if occupancy_rates else 0,
            "max_occupancy": max(occupancy_rates) if occupancy_rates else 0,
            "min_occupancy": min(occupancy_rates) if occupancy_rates else 0,
            "occupancy_volatility": statistics.stdev(occupancy_rates) if len(occupancy_rates) > 1 else 0,
            "trend_direction": self.calculate_trend_direction(occupancy_rates),
            "time_period": time_period,
            "data_points": len(occupancy_data)
        }
    
    async def predict_service_demand(self, historical_data: List[Dict[str, Any]], prediction_period: str) -> Dict[str, Any]:
        """Predict future service demand"""
        await asyncio.sleep(0.7)  # Simulate ML computation time
        
        if not historical_data:
            return {"error": "No historical data provided"}
        
        # Simple linear trend prediction (in real implementation, use ML models)
        demand_values = [entry.get('demand', 0) for entry in historical_data[-30:]]  # Last 30 data points
        
        if len(demand_values) < 2:
            return {"error": "Insufficient data for prediction"}
        
        # Calculate trend
        trend = self.calculate_linear_trend(demand_values)
        
        # Project forward
        periods = self.parse_prediction_period(prediction_period)
        predictions = []
        
        for i in range(1, periods + 1):
            predicted_value = demand_values[-1] + (trend * i)
            predictions.append({
                "period": i,
                "predicted_demand": max(0, predicted_value),  # Ensure non-negative
                "confidence": max(0.1, 0.9 - (i * 0.1))  # Decreasing confidence over time
            })
        
        return {
            "predictions": predictions,
            "trend_slope": trend,
            "base_demand": demand_values[-1],
            "prediction_period": prediction_period,
            "model_accuracy": 0.78  # Simulated accuracy
        }
    
    async def generate_analytics_report(self, report_type: str, include_charts: bool) -> Dict[str, Any]:
        """Generate comprehensive analytics report"""
        await asyncio.sleep(1.0)  # Simulate report generation time
        
        report = {
            "report_id": f"report_{int(time.time() * 1000)}",
            "report_type": report_type,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "agent_info": {
                "name": self.name,
                "version": self.version,
                "agent_id": self.agent_id
            }
        }
        
        if report_type == "summary":
            report["summary"] = await self.get_analytics_summary()
        elif report_type == "detailed":
            report["detailed_analysis"] = {
                "client_analysis": await self.analyze_client_patterns(self.client_data, "comprehensive"),
                "occupancy_analysis": await self.analyze_occupancy_trends(self.occupancy_history, "30d"),
                "demand_forecast": await self.predict_service_demand(self.occupancy_history, "7d")
            }
        
        if include_charts:
            report["charts"] = {
                "occupancy_trend": "base64_encoded_chart_data",
                "client_demographics": "base64_encoded_chart_data"
            }
        
        return report
    
    async def get_analytics_summary(self) -> Dict[str, Any]:
        """Get current analytics summary"""
        return {
            "data_status": {
                "client_records": len(self.client_data),
                "shelter_records": len(self.shelter_data),
                "occupancy_records": len(self.occupancy_history),
                "last_analysis": self.last_analysis_time.isoformat()
            },
            "key_metrics": {
                "average_occupancy": 0.75,  # Simulated
                "client_satisfaction": 0.82,  # Simulated
                "resource_utilization": 0.68,  # Simulated
                "trend_direction": "stable"
            },
            "alerts": [
                {"type": "info", "message": "Analytics data is up to date"},
                {"type": "warning", "message": "Occupancy trending upward, consider capacity planning"}
            ]
        }
    
    # Helper Methods
    
    def analyze_demographics(self, client_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze client demographics"""
        # Simplified demographic analysis
        age_groups = {"18-25": 0, "26-35": 0, "36-50": 0, "51+": 0}
        genders = {"male": 0, "female": 0, "other": 0}
        
        for client in client_data:
            age = client.get('age', 0)
            if 18 <= age <= 25:
                age_groups["18-25"] += 1
            elif 26 <= age <= 35:
                age_groups["26-35"] += 1
            elif 36 <= age <= 50:
                age_groups["36-50"] += 1
            else:
                age_groups["51+"] += 1
            
            gender = client.get('gender', 'other').lower()
            if gender in genders:
                genders[gender] += 1
            else:
                genders["other"] += 1
        
        return {"age_groups": age_groups, "genders": genders}
    
    def analyze_service_usage(self, client_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze service usage patterns"""
        services = {}
        for client in client_data:
            client_services = client.get('services_used', [])
            for service in client_services:
                services[service] = services.get(service, 0) + 1
        
        return {"service_counts": services}
    
    def analyze_client_trends(self, client_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze client behavior trends"""
        # Simplified trend analysis
        return {
            "new_registrations_trend": "increasing",
            "service_adoption_rate": 0.65,
            "retention_rate": 0.78
        }
    
    def calculate_trend_direction(self, values: List[float]) -> str:
        """Calculate trend direction from values"""
        if len(values) < 2:
            return "insufficient_data"
        
        trend = self.calculate_linear_trend(values)
        
        if trend > 0.01:
            return "increasing"
        elif trend < -0.01:
            return "decreasing"
        else:
            return "stable"
    
    def calculate_linear_trend(self, values: List[float]) -> float:
        """Calculate linear trend slope"""
        if len(values) < 2:
            return 0.0
        
        n = len(values)
        x_values = list(range(n))
        
        # Calculate linear regression slope
        sum_x = sum(x_values)
        sum_y = sum(values)
        sum_xy = sum(x * y for x, y in zip(x_values, values))
        sum_x2 = sum(x * x for x in x_values)
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
        return slope
    
    def parse_prediction_period(self, period: str) -> int:
        """Parse prediction period string to number of periods"""
        if period.endswith('d'):
            return int(period[:-1])
        elif period.endswith('w'):
            return int(period[:-1]) * 7
        elif period.endswith('m'):
            return int(period[:-1]) * 30
        else:
            return 7  # Default to 7 days

async def main():
    """Main entry point for Analytics Agent"""
    args = parse_args()
    
    agent = AnalyticsAgent(args.agent_id)
    
    try:
        await agent.start()
    except KeyboardInterrupt:
        logger.info("🛑 Received keyboard interrupt")
    except Exception as e:
        logger.error(f"❌ Fatal error in Analytics Agent: {e}")
        sys.exit(1)
    finally:
        await agent.stop()

if __name__ == "__main__":
    asyncio.run(main())