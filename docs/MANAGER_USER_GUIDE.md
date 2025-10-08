# Manager User Guide

**Welcome! This guide will help managers and administrators use the Idaho Community Services Platform to monitor operations, analyze data, manage integrations, and optimize service delivery.**

---

## Table of Contents

- [Getting Started](#getting-started)
- [Dashboard Analytics](#dashboard-analytics)
- [Data Integration Control](#data-integration-control)
- [Report Generation](#report-generation)
- [System Configuration](#system-configuration)
- [HMIS Facilities Management](#hmis-facilities-management)
- [User & Permission Management](#user--permission-management)
- [Performance Monitoring](#performance-monitoring)
- [Strategic Planning](#strategic-planning)
- [Advanced Features](#advanced-features)

---

## Getting Started

### Manager Access Levels

**What you can access:**
- All staff features plus:
- Dashboard analytics
- Data integration controls
- System configuration
- Report generation
- User management
- Performance metrics
- Strategic insights

### First Time Setup

**Step 1: Access Services Manager Dashboard**
- Log in with your administrator credentials
- Navigate to Services Manager Dashboard
- You'll see additional "System" tab (manager-only)

**Step 2: Review System Tab**
The System section includes:
- **Data Integration** - Control external data sources
- **Configuration** - System settings and alerts
- **Users** - Staff permissions and access
- **Reports** - Custom report generation
- **Analytics** - Performance metrics

**Step 3: Customize Your View**
- Set default date ranges
- Choose key metrics to display
- Configure alert thresholds
- Personalize dashboard widgets

---

## Dashboard Analytics

### Overview Metrics

**Key Performance Indicators (KPIs):**

**Service Utilization:**
- Total enrollments (daily/weekly/monthly)
- Capacity utilization rate
- Peak usage times
- Trending programs
- Underutilized services

**Engagement Metrics:**
- Unique clients served
- Repeat engagement rate
- No-show percentage
- Enrollment-to-completion ratio
- Client satisfaction (if collected)

**Capacity Analytics:**
- Average bed occupancy
- Shelter utilization by type
- Emergency vs. planned capacity
- Seasonal variations
- Weather impact correlation

**Network Health:**
- Partner facility status
- Cross-referral rates
- Coordination effectiveness
- Response times

### Viewing Dashboard

**Access Analytics:**
1. Go to Services Manager Dashboard
2. Click **"System"** tab
3. Select **"Analytics"** section

**Date Range Selection:**
- Today
- Last 7 days
- Last 30 days
- This month
- Last month
- Custom range

**Visualization Types:**
- Line charts (trends over time)
- Bar charts (comparisons)
- Pie charts (distribution)
- Heat maps (usage patterns)
- Tables (detailed data)

### Daily Summary Report

**Generated automatically each morning:**
- Yesterday's total enrollments
- Bed occupancy rate
- Weather alerts issued
- Staff activities logged
- System performance metrics

**Delivered via:**
- Email notification
- Dashboard widget
- Mobile app alert
- SMS (if configured)

### Weekly Trends

**Every Monday, review:**
- Week-over-week changes
- Program popularity shifts
- Capacity pattern analysis
- Client engagement trends
- Weather impact assessment

**Actionable insights:**
- Identify growing programs
- Spot declining engagement
- Plan capacity adjustments
- Optimize resource allocation

### Monthly Analytics

**Comprehensive monthly report:**
- Service utilization summary
- Client demographics (aggregated, privacy-protected)
- Program effectiveness ratings
- Staff productivity metrics
- Budget vs. actual analysis
- Grant reporting data

**Export formats:**
- PDF for stakeholders
- Excel for data analysis
- CSV for import to other systems
- JSON for API integration

---

## Data Integration Control

### Understanding the Data Store

**The platform caches data locally for:**
- Improved performance
- Offline capability
- Reduced API load
- Predictable behavior

**You control when data updates.**

### Data Integration Dashboard

**Access:**
1. Services Manager Dashboard → **System** → **Data Integration**

**What you'll see:**

**Cache Status Overview:**
- Total data sources (8 categories)
- Total records cached
- Last global update timestamp
- Overall system health

**Per-Category Status:**
- **Shelters** - Bed availability
- **Services** - Community programs
- **Weather** - NOAA alerts and forecasts
- **Clients** - Client information (privacy-protected)
- **Staff** - Staff schedules and assignments
- **Engagements** - Program enrollments
- **Authorizations** - Privacy permissions
- **HMIS** - External facility data

**For each category:**
- Record count
- Last update timestamp
- Age indicator
- Stale warning (if >1 hour)
- Refresh button

### Refreshing Data

**Individual Category Refresh:**
1. Find the category card
2. Click **"Refresh"** button
3. Wait for update (usually 2-10 seconds)
4. Verify new timestamp

**Refresh All Data:**
1. Click **"Refresh All Data"** button at top
2. All categories update simultaneously
3. Progress indicator shows status
4. Confirmation when complete

**When to refresh:**
- ✅ Start of business day
- ✅ Before generating reports
- ✅ After major weather events
- ✅ When planning capacity
- ✅ Before stakeholder meetings
- ✅ When data looks stale

### Exporting Cache

**Backup your data:**
1. Click **"Export Cache"** button
2. JSON file downloads
3. Contains all cached data
4. Includes metadata and timestamps

**Use cases:**
- Regular backups
- Data migration
- Analysis in other tools
- Compliance archiving
- Disaster recovery

**Security note:** Exported data contains sensitive information. Handle securely.

### Clearing Cache

**When to clear:**
- Major system upgrade
- Data corruption suspected
- Fresh start needed
- Troubleshooting issues

**How to clear:**
1. Click **"Clear Cache"** button
2. Confirmation dialog appears
3. Confirm the action
4. All local data removed
5. System fetches fresh data on next use

**Warning:** Cannot be undone. Export first if needed.

### Monitoring Staleness

**Visual indicators:**
- 🟢 Green - Fresh (< 1 hour)
- 🟡 Yellow - Stale (1+ hours)
- 🔴 Red - Very stale (6+ hours)

**Auto-refresh recommendations:**
- System suggests when to refresh
- Based on data volatility
- Weather: every 30 minutes
- Shelters: every hour
- Services: daily
- HMIS: weekly

---

## Report Generation

### Standard Reports

**Available Report Types:**

**1. Service Usage Report**
- Enrollments by program type
- Daily/weekly/monthly breakdowns
- Peak usage analysis
- Capacity utilization
- No-show rates

**2. Client Engagement Metrics**
- Unique clients served
- Repeat engagement rate
- Services per client
- Engagement duration
- Outcome tracking

**3. Facility Capacity Analysis**
- Bed occupancy rates
- Turnover frequency
- Average stay duration
- Seasonal patterns
- Emergency capacity usage

**4. Authorization Audits**
- Privacy permission grants
- Access log review
- Revocation tracking
- Compliance verification
- Staff access patterns

**5. Weather Impact Reports**
- Alert frequency
- Service disruptions
- Emergency activations
- Capacity correlation
- Seasonal planning

### Creating Custom Reports

**Step 1: Define Parameters**
1. Go to System → **Reports**
2. Click **"New Custom Report"**
3. Choose metrics to include
4. Select date range
5. Set filters (if any)

**Step 2: Preview**
- Review sample data
- Verify calculations
- Check formatting
- Adjust as needed

**Step 3: Generate**
- Choose export format
- PDF - For presentations
- Excel/CSV - For analysis
- JSON - For APIs

**Step 4: Save Template**
- Name your report
- Save for future use
- Schedule recurring generation
- Share with stakeholders

### Scheduled Reports

**Automate reporting:**
1. Create custom report
2. Set schedule:
   - Daily at 6 AM
   - Weekly on Monday
   - Monthly on 1st
   - Quarterly
3. Configure recipients
4. Choose delivery method (email, download)

**Benefits:**
- Consistent data delivery
- Time savings
- Stakeholder updates
- Grant reporting automation
- Trend tracking

### Grant Reporting

**For funding compliance:**
- Service delivery metrics
- Client outcomes
- Demographic data (aggregated)
- Program effectiveness
- Budget utilization
- Impact measurements

**Export includes:**
- Executive summary
- Detailed metrics
- Comparison to goals
- Trend analysis
- Recommendations

---

## System Configuration

### Alert Thresholds

**Configure when alerts trigger:**

**Capacity Alerts:**
- Shelter >90% full
- Program enrollment >85%
- Emergency beds activated
- Network-wide capacity <X beds

**Weather Alerts:**
- Temperature thresholds
- Precipitation levels
- Air quality index
- Wind speed warnings

**System Alerts:**
- Data not refreshed in X hours
- API connection failures
- Cache size limits
- Performance degradation

**How to configure:**
1. System → **Configuration** → **Alerts**
2. Select alert type
3. Set threshold values
4. Choose notification method
5. Assign recipients
6. Save changes

### Notification Settings

**Who gets notified:**
- Managers (email, SMS, dashboard)
- Staff (dashboard notifications)
- Specific roles (case managers, intake staff)
- External partners (optional)

**Notification types:**
- Immediate (emergency)
- Hourly digest
- Daily summary
- Weekly report

**Channels:**
- Email
- SMS
- Dashboard badge
- Mobile app push
- Webhook (for integrations)

### User Permissions

**Role-based access control:**

**Client Role:**
- View services
- Enroll in programs
- Manage own privacy
- View own schedule

**Staff Role:**
- Update bed availability
- Check-in participants
- View authorized client data
- Access network map

**Manager Role:**
- All staff permissions plus:
- Analytics dashboard
- Data integration control
- Report generation
- System configuration
- User management

**How to manage:**
1. System → **Users**
2. Select user
3. Assign role
4. Set specific permissions
5. Define data access scope
6. Save changes

### Facility Information

**Update your facility details:**
- Organization name
- Physical address
- Contact information
- Services offered
- Capacity limits
- Hours of operation
- Special programs
- Accessibility features

**Why it matters:**
- Accurate network map
- Proper client referrals
- Emergency coordination
- Public information

### Service Categories

**Manage the 8 service types:**
- Add new subcategories
- Customize descriptions
- Set capacity limits
- Define enrollment rules
- Configure requirements

**Example customizations:**
- Meals: Breakfast, Lunch, Dinner
- Counseling: Individual, Group, Crisis
- Health: Medical, Dental, Mental Health

---

## HMIS Facilities Management

### HMIS Integration

**What is HMIS:**
- Homeless Management Information System
- Regional data sharing platform
- HUD-required for CoC programs
- Real-time facility coordination

**Integration features:**
- Automatic data sync
- Bi-directional updates
- Conflict resolution
- Compliance reporting

### Viewing HMIS Facilities

**Access:**
1. System → **HMIS Facilities**
2. View all integrated facilities
3. Filter by service type
4. Search by location

**Information displayed:**
- Facility name and ID
- Organization
- Services offered
- Contact details
- Current capacity
- Operating hours
- Last data sync

### Managing Sync Settings

**Sync frequency:**
- Real-time (for critical data)
- Hourly (for capacity)
- Daily (for services)
- Weekly (for static info)

**Data categories:**
- Bed availability ✅
- Client services ✅
- Staff assignments ⚠️ (check privacy)
- Outcome data ✅

**Conflict resolution:**
- Newest timestamp wins
- Manual review required
- Merge strategies
- Override options

### HMIS Reports

**Generate for HUD compliance:**
- Annual Performance Report (APR)
- System Performance Measures (SPM)
- Point-in-Time (PIT) count
- Housing Inventory Count (HIC)
- CoC-specific metrics

**Export directly from platform** to HMIS format.

---

## User & Permission Management

### Adding New Users

**Step 1: Create Account**
1. System → **Users** → **Add New User**
2. Enter user details:
   - Name
   - Email
   - Phone
   - Organization
   - Role

**Step 2: Assign Role**
- Client
- Staff
- Manager
- Administrator (super user)

**Step 3: Set Permissions**
- Specific facility access
- Data categories
- Features available
- Report access

**Step 4: Send Invitation**
- Email with login link
- Temporary password
- Setup instructions

### Managing Existing Users

**Edit user:**
- Update contact info
- Change role
- Modify permissions
- Suspend account
- Reset password

**User activity:**
- View login history
- Check data access
- Review actions taken
- Audit trail

### Staff Training Tracking

**Monitor staff readiness:**
- Training completion status
- Certification dates
- Quiz results
- Access level progression

**Schedule training:**
- New user onboarding
- Feature updates
- Compliance refreshers
- Advanced features

---

## Performance Monitoring

### System Performance

**Monitor:**
- Page load times
- API response times
- Cache hit rates
- Error rates
- User activity levels

**Thresholds:**
- 🟢 <2 seconds load time
- 🟡 2-5 seconds
- 🔴 >5 seconds (investigate)

**Optimization:**
- Refresh cache strategically
- Monitor peak usage times
- Plan maintenance windows
- Scale resources as needed

### Service Effectiveness

**Track program outcomes:**
- Enrollment → completion rate
- Client satisfaction scores
- Goal achievement
- Return engagement
- Long-term outcomes

**Benchmark against:**
- Your historical data
- Regional averages
- National standards
- Best practices

### Staff Productivity

**Metrics to monitor:**
- Check-ins per shift
- Update frequency
- Response times
- Communication logged
- Referrals made

**Use for:**
- Performance reviews
- Training needs
- Scheduling optimization
- Recognition programs

### Client Outcomes

**Privacy-protected aggregates:**
- Housing placement rate
- Job placement rate
- Health improvement
- Benefit enrollment
- Service completion

**Trend analysis:**
- Month-over-month changes
- Seasonal patterns
- Program effectiveness
- Intervention impact

---

## Strategic Planning

### Capacity Planning

**Analyze trends to plan:**
- Seasonal capacity needs
- Program expansion opportunities
- Staff scheduling
- Budget allocation
- Partnership development

**Forecast based on:**
- Historical data
- Weather patterns
- Economic indicators
- Community growth
- Policy changes

### Program Development

**Data-driven decisions:**
- Identify service gaps
- Measure demand
- Test new programs
- Evaluate effectiveness
- Scale successful initiatives

**Pilot program process:**
1. Identify need from data
2. Design intervention
3. Set success metrics
4. Launch pilot
5. Measure results
6. Refine or scale

### Budget Optimization

**Use analytics for:**
- Cost per service delivered
- ROI by program type
- Efficiency opportunities
- Resource reallocation
- Grant proposal data

**Budget reports:**
- Actual vs. projected
- Cost trends
- Utilization rates
- Outcome cost-effectiveness

### Stakeholder Reporting

**For board meetings:**
- Executive dashboard
- Key metrics summary
- Success stories
- Challenges and solutions
- Strategic recommendations

**For funders:**
- Grant compliance reports
- Outcome measurements
- Impact analysis
- Budget utilization
- Future planning

**For community:**
- Public-facing statistics
- Privacy-protected insights
- Impact stories
- Transparency reports

---

## Advanced Features

### API Access

**For custom integrations:**
- RESTful API endpoints
- Authentication via API keys
- Rate limiting
- Documentation available
- Webhook support

**Use cases:**
- Custom dashboards
- External analytics tools
- Mobile app integration
- Partner systems

### Data Export & Analysis

**Export entire datasets:**
- SQL database dumps
- CSV for Excel/R/Python
- JSON for web apps
- XML for legacy systems

**Analysis tools:**
- Built-in Excel export
- Power BI integration
- Tableau connectivity
- Custom SQL queries

### Multi-Facility Management

**For organizations with multiple sites:**
- Consolidated dashboard
- Cross-facility reports
- Shared resources
- Coordinated referrals
- Network optimization

**Facility comparison:**
- Performance benchmarking
- Best practice sharing
- Resource balancing
- Standardization

### Predictive Analytics

**Coming soon:**
- Demand forecasting
- Capacity predictions
- Weather impact modeling
- Client outcome prediction
- Resource optimization

---

## Compliance & Security

### Data Protection

**Your responsibilities:**
- Ensure HIPAA compliance
- Manage user access
- Audit data access
- Report breaches
- Train staff

**System features:**
- Encrypted storage
- Secure transmission
- Access logging
- Automatic backups
- Disaster recovery

### Privacy Compliance

**Client rights:**
- Right to access
- Right to deletion
- Right to export
- Right to revoke

**Manager oversight:**
- Monitor authorization requests
- Audit access logs
- Investigate complaints
- Enforce policies
- Train staff on privacy

### Audit Trail

**Complete logging of:**
- User actions
- Data access
- Changes made
- System events
- Security incidents

**Retention:**
- Configurable (default 7 years)
- Tamper-proof
- Exportable
- Searchable

### Grant Compliance

**Ensure reporting for:**
- HUD CoC requirements
- State/local mandates
- Funder-specific metrics
- Outcome measurements
- Budget accountability

**Automated compliance:**
- Scheduled reports
- Data validation
- Missing data alerts
- Deadline reminders

---

## Troubleshooting

### Common Manager Issues

**1. Reports Not Generating**
- Check date range validity
- Verify data exists for period
- Ensure proper permissions
- Try smaller date range
- Contact support if persists

**2. Data Integration Failing**
- Check API credentials
- Verify internet connection
- Review error messages
- Try manual refresh
- Check with external service

**3. Permissions Not Working**
- Clear browser cache
- Re-login
- Verify role assignment
- Check specific permission settings
- Contact administrator

**4. Performance Degradation**
- Clear old cache data
- Reduce dashboard widget count
- Optimize date ranges
- Schedule off-peak refreshes
- Monitor system resources

### Getting Support

**Technical Issues:**
- Review this guide
- Check system status page
- Contact IT support
- Submit detailed error reports

**Feature Requests:**
- Document use case
- Gather staff feedback
- Submit through proper channels
- Participate in stakeholder meetings

**Training Needs:**
- Schedule manager training
- Request specific topics
- Share with your team
- Build internal expertise

---

## Best Practices

### Daily Management

**Every morning (15-20 min):**
- Review daily summary
- Check overnight alerts
- Verify data freshness
- Spot-check key metrics
- Plan day's priorities

**Throughout the day:**
- Monitor live dashboards
- Respond to alerts
- Support staff questions
- Track unusual patterns

**End of day (10 min):**
- Review daily performance
- Note any issues
- Plan tomorrow
- Brief next shift

### Weekly Management

**Monday:**
- Review weekend activity
- Analyze weekly trends
- Plan week ahead
- Team coordination

**Wednesday:**
- Mid-week check-in
- Adjust as needed
- Address issues
- Staff support

**Friday:**
- Week-end summary
- Weekend planning
- Staff recognition
- Strategic review

### Monthly Management

**First week:**
- Monthly reports generation
- Budget review
- Goal progress check
- Stakeholder updates

**Mid-month:**
- Course corrections
- Staff training
- System optimization
- Planning refinement

**Month-end:**
- Final metrics
- Lessons learned
- Next month planning
- Board preparation

### Strategic Management

**Quarterly:**
- Comprehensive analysis
- Strategic planning
- Budget forecasting
- Program evaluation
- Stakeholder presentations

**Annually:**
- Year-in-review
- Long-term planning
- Major initiatives
- System upgrades
- Contract renewals

---

## Resources

### Quick Reference

**Daily Tasks:**
- Review dashboard
- Check alerts
- Verify data freshness
- Monitor operations

**Weekly Tasks:**
- Trend analysis
- Staff coordination
- Report generation
- Strategic adjustments

**Monthly Tasks:**
- Comprehensive reports
- Budget review
- Goal tracking
- Planning updates

### Contact Information

**Technical Support:**
- Email: support@platform.org
- Phone: (503) XXX-XXXX
- Hours: 8 AM - 6 PM Pacific
- Emergency: 24/7 hotline

**Training:**
- Online tutorials
- Scheduled webinars
- On-site training
- Documentation library

### Additional Documentation

- [Technical README](../TECHNICAL_README.md) - Developer documentation
- [Architecture Guide](ARCHITECTURE.md) - System design
- [Data Store Architecture](DATA_STORE_ARCHITECTURE.md) - Data management
- [Features Overview](FEATURES_OVERVIEW.md) - Complete features
- [Staff User Guide](STAFF_USER_GUIDE.md) - Staff operations
- [Client User Guide](CLIENT_USER_GUIDE.md) - Client perspective

---

## Continuous Improvement

### Feedback Collection

**Gather input from:**
- Staff surveys
- Client feedback
- Partner organizations
- Data analysis
- Industry trends

**Act on feedback:**
- Prioritize improvements
- Implement changes
- Communicate updates
- Measure impact

### System Evolution

**Stay current with:**
- Feature updates
- Security patches
- Best practices
- Regulatory changes
- Technology advances

**Plan upgrades:**
- Schedule maintenance
- Test in staging
- Train staff
- Communicate changes
- Monitor rollout

---

## Remember

**You're leading a network** that serves the most vulnerable in our community.

**This platform empowers you to:**
- Make data-driven decisions
- Optimize service delivery
- Coordinate care effectively
- Demonstrate impact
- Plan strategically
- Ensure accountability

**Your leadership matters.** Thank you for your dedication to ending homelessness.

---

**Questions? Contact technical support or your system administrator.**

---

**Last Updated:** 2025-01-XX
**Version:** 1.0.0
