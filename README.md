# 🏏 Virat Kohli Daily Statistics Monitoring Agent

An automated, serverless Node.js monitoring agent that tracks Virat Kohli's career statistics daily from Cricbuzz, detects updates or milestones, and dispatches HTML summary reports via email.

## 🚀 Features
- **Data Scraping**: Fetches live Test, ODI, T20I, and IPL statistics directly from Cricbuzz.
- **Milestone & Change Engine**: Compares daily statistics against saved history to highlight updates, new runs, 100s, 50s, or average changes.
- **HTML Email Dispatch**: Delivers beautifully rendered status reports directly to your inbox.
- **GitHub Actions Integration**: Runs daily on a scheduled cron job using GitHub Secrets.

## 📂 Project Structure
```
virat-kohli-monitor/
├── data/
│   └── virat_kohli_stats.json  # Historical statistics data storage
├── src/
│   ├── config.js               # Application configuration & env loader
│   ├── scraper.js              # Cricbuzz stats scraper module
│   ├── storage.js              # Historical data reader/writer module
│   ├── comparator.js           # Change detection & milestone engine
│   ├── email.js                # Email builder and SMTP module
│   └── index.js                # Main orchestrator pipeline
├── .env.example                # Environment variables template
├── .gitignore                  # Git exclusion rules
└── package.json                # Project dependencies & scripts
```

## 🛠️ Local Setup
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd virat-kohli-monitor
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file based on `.env.example`:
   ```env
   GMAIL_USER=your_email@gmail.com
   GMAIL_PASS=your_gmail_app_password
   TO_EMAIL=recipient@gmail.com
   ```
4. Run locally:
   ```bash
   npm start
   ```
