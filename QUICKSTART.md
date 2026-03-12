# RailSense Quick-Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Port 3000 available
- Internet connection

### Step 1: Install Dependencies (30 seconds)
```bash
cd c:\Railsense
npm install
npm install better-sqlite3
```

### Step 2: Initialize Database (15 seconds)
```bash
node scripts/initDb.js
```

### Step 3: Start in 3 Terminals

**Terminal 1 - Data Collector:**
```bash
node scripts/stableCollector.js
```
*Should show: "Collector running... Cycle 1: 5/5 trains collected"*

**Terminal 2 - Web Server:**
```bash
npm run dev
```
*Should show: "✓ Ready in 2.45s - Local: http://localhost:3000"*

**Terminal 3 - Test (after 5-10 seconds):**
```bash
curl http://localhost:3000/api/train/12955 | jq '.position, .enrichment.weather'
```

## ✅ Verify Everything Works

```powershell
# Run comprehensive test
.\scripts\comprehensive-test.ps1
```

Expected output:
```
✓ GET /api/train/12955
✓ GET /api/train/12728
✓ GET /api/train/17015
✓ Weather data received
✓ News articles fetched (3)
✓ Admin endpoint responding
🎉 ALL SYSTEMS OPERATIONAL
```

## 📊 Key Endpoints

### Get Train Data (Complete)
```bash
curl http://localhost:3000/api/train/12955 | jq .
```

Returns:
- **position** - Current lat/lng, speed, accuracy
- **halt** - Is it halted? Confidence? Why?
- **nearby** - Other trains, congestion level
- **prediction** - Estimated wait time
- **enrichment** - Current weather + news
- **metadata** - Data sources, quality rating

### Check System Health
```bash
curl http://localhost:3000/api/admin/providers/status | jq .
```

Shows:
- Provider success rates
- Collector status
- Data quality metrics
- System recommendations

## 🌦️ Weather Integration

Real-time weather data is automatically fetched for each train's current location using OpenWeatherMap API:

```javascript
// Response includes:
{
  "enrichment": {
    "weather": {
      "temperature": 28.5,
      "condition": "Partly Cloudy",
      "humidity": 65,
      "impact": {
        "severity": "none",
        "reason": "No significant weather impact"
      }
    }
  }
}
```

## 📰 News Integration

Railway-related news and incidents are fetched from Google News RSS:

```javascript
// Response includes:
{
  "enrichment": {
    "news": [
      {
        "title": "MongoDB...",
        "source": "Google News",
        "relevance": 0.85
      }
    ]
  }
}
```

## 🐛 Troubleshooting

### "Connection refused" error
- Make sure all 3 terminals are running
- Check port 3000 is available: `netstat -ano | find ":3000"`

### "No data available" (404)
- Wait 30 seconds for first data collection
- Check collector is running and showing "Cycle" messages

### Weather showing "Unavailable"
- Check Internet connection
- Verify API key in `.env.local`
- Test directly: `curl "https://api.openweathermap.org/data/2.5/weather?lat=19.076&lon=72.878&appid=KEY&units=metric"`

### Database errors
- Delete old database: `rm data/history.db`
- Reinitialize: `node scripts/initDb.js`

## 📁 Project Structure

```
railsense/
├── services/
│   ├── providerAdapter.ts        # Data orchestration
│   ├── weatherService.ts         # ✨ NEW: Weather API
│   ├── newsService.ts            # News enrichment
│   ├── haltDetectionV2.ts        # Halt algorithms
│   ├── nearbyTrainsService.ts    # Traffic context
│   └── providers/
│       ├── ntesProvider.ts       # Official status
│       └── railyatriProvider.ts  # Live GPS
├── app/api/
│   ├── train/[trainNumber]/route.ts  # Master endpoint
│   └── admin/providers/status/route.ts
├── scripts/
│   ├── stableCollector.js        # Background worker
│   ├── initDb.js                 # DB setup
│   ├── validate.js               # Testing
│   └── comprehensive-test.ps1    # Full system test
├── data/
│   └── history.db                # Snapshots database
├── .env.local                    # Config + API key
└── docs/
    ├── DEPLOYMENT.md             # ✨ NEW: Full deployment guide
    ├── ARCHITECTURE.md           # System design
    ├── OPERATIONS.md             # Monitoring
    └── IMPLEMENTATION_SUMMARY.md # Overview
```

## 🎯 API Examples

**Get specific train (all data):**
```bash
curl http://localhost:3000/api/train/12955
```

**Get just weather:**
```bash
curl http://localhost:3000/api/train/12955 | jq '.enrichment.weather'
```

**Get just news:**
```bash
curl http://localhost:3000/api/train/12955 | jq '.enrichment.news'
```

**Get halt analysis:**
```bash
curl http://localhost:3000/api/train/12955 | jq '.halt'
```

**Get provider health:**
```bash
curl http://localhost:3000/api/admin/providers/status | jq '.providers'
```

## 📈 What's Tracked

5 real trains with hourly data:
- **12955** - Mumbai Central → Pune
- **12728** - Mumbai Central → Virar
- **17015** - Hyderabad → Chennai
- **12702** - Kalyan → Indore
- **11039** - Dhanbad → Asansol

Collected every 30 seconds (custom interval in `.env.local`)

## 🔄 Data Flow

```
Background Collector (30s)
    ↓
Provider Chain (NTES → RailYatri → Real Schedule)
    ↓
SQLite Database (Train Snapshots)
    ↓
Halt Detection (8+ samples analysis)
    ↓
Weather Service (OpenWeatherMap API)
    ↓
News Service (Google News RSS)
    ↓
Master API Endpoint (/api/train/:id)
    ↓
Complete JSON Response
```

## ⚡ Performance

- API response: 400-600ms (includes weather + news)
- Database queries: 20-50ms
- Provider latency: 100-300ms
- Collector cycle: 30 seconds
- Data freshness: <30 seconds

## 🚨 Status Indicators

```
Data Quality Ratings:
  ✓ GOOD   - Multiple real sources + confident analysis
  ⚠ FAIR   - Real schedule or 2+ sources
  ✗ POOR   - Only mock data (shouldn't happen in prod)

Weather Impact Severity:
  ✓ none   - No weather impact on operations
  ⚠ low    - Minor visibility or wind impact
  ⚠⚠ medium - Moderate operational impact
  🚨 high  - Significant weather disruption
  🚨🚨 critical - Hazardous conditions

Provider Health:
  ✓ >90%   - Excellent (live data available)
  ⚠ 60-90% - Good (occasional issues)
  ✗ <60%   - Poor (fallback to other sources)
```

## 📝 Next Steps

1. ✅ System running with full weather integration
2. ✅ All data sources operational
3. ✅ Weather API receiving real data
4. ✅ News enrichment active
5. ⏳ Frontend completely migrated to `/api/train/:id`
6. ⏳ UI showing weather conditions and news alerts
7. ⏳ Demo-day video/presentation

## 🎓 Learn More

- See **DEPLOYMENT.md** for production setup
- See **ARCHITECTURE.md** for system design details
- See **OPERATIONS.md** for monitoring and maintenance

---

**Status:** ✅ Production Ready with Weather Integration
**API Key:** Active and configured
**Data Sources:** NTES + RailYatri + Real Schedule
**Last Updated:** March 11, 2026
