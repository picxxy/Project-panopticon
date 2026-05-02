# 👁️ Project Panopticon
**The Ultimate Client-Side Tactical OSINT Dashboard**

Project Panopticon is a real-time, browser-based Open Source Intelligence (OSINT) and Threat Intelligence framework. It provides security analysts and investigators with a highly visual, terminal-style interface to track IP reputations, domain history, cryptocurrency traces, and dark web data breaches—all from a single, lightweight dashboard.

<div align="center">
  <img src="assets/logo.png" width="150" alt="Panopticon Logo">
</div>

---

## 🚀 Features
- **Global Threat Radar:** Aggregates data from VirusTotal, AbuseIPDB, and GeoJS to calculate an AI-weighted Threat Score for any IP or Domain.
- **3D Surveillance Globe:** Instantly maps target network infrastructure on an interactive, WebGL-rendered 3D globe.
- **Crypto Trace:** Instantly fetch live ledger data, total balances, and the 5 most recent transactions for any Bitcoin (BTC) address using the public blockchain integration.
- **Breach Intel (Dark Web Cache):** Checks target email addresses against known public data breaches using the XposedOrNot framework.
- **LRU Network Cache:** An intelligent built-in memory system prevents duplicate network API hits, ensuring lightning-fast subsequent OSINT queries while saving your API quotas.
- **Backend-Powered:** Uses a lightweight Python Flask backend to proxy requests securely and hide API keys.

## 🛠️ Installation

1. Python 3 installed on your system.
2. A Free **AbuseIPDB** API Key.
3. A Free **VirusTotal** API Key.

### API Key Configuration
1. Download or clone this repository.
2. Create a copy of `.env.example` and name it `.env`.
3. Open `.env` in a text editor and paste your free API keys:
```env
ABUSEIPDB_API_KEY=YOUR_KEY_HERE
VIRUSTOTAL_API_KEY=YOUR_KEY_HERE
```

### Running the Project

First, install the backend dependencies:
```bash
pip install -r requirements.txt
```

Start the backend API server:
```bash
python app.py
```

The backend will start on `http://localhost:5000`.

To view the dashboard, simply double-click `index.html` to launch it in your browser. Optionally, if you prefer running it securely via a local port, open a **new terminal** and run:
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000`.

---

## 🖥️ Usage Guide

1. **Dashboard:** Type any IP Address (e.g. `8.8.8.8`) or Domain (e.g. `tesla.com`) into the top search bar and click `Analyze` to get a threat score.
2. **Subdomain Recon:** Switch to this tab and search a domain (like `tesla.com`) to instantly map its sub-infrastructure using HackerTarget and crt.sh certificate transparency logs.
3. **Surveillance:** Provides a 2D Leaflet mapping variant for pinpointing ISP routing nodes.
4. **Globe Tracker:** Switch to the 3D globe tab after searching an IP to visualize the physical infrastructure on the planet.
5. **Breach Intel:** Search an email address to query dark web credential breach records via XposedOrNot.
6. **Crypto Trace:** Paste a Bitcoin wallet address (e.g., `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`) to pull forensic ledger data.

---

## 👤 Author
- **picxxy** - *Project Creator & Lead Developer* - [GitHub Profile](https://github.com/picxxy)

---

## 🛡️ Disclaimer
This tool is built for educational, defensive research, and authorized OSINT investigations. The developers assume no responsibility for malicious usage. All API queries are subject to the terms of service of their respective providers.
