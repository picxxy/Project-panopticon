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
- **100% Client-Side:** No backend setup required. The dashboard runs entirely in the browser using raw Javascript, HTML, and CSS (with a sleek Glassmorphism design).

---

## 🛠️ Requirements & Installation

Because Project Panopticon runs natively in the browser, installation is incredibly simple.

### Prerequisites
1. A modern web browser (Edge, Chrome, Firefox, or Safari).
2. A Free **AbuseIPDB** API Key.
3. A Free **VirusTotal** API Key.

### Setup Instructions
1. Download or clone this repository to your local machine.
2. Navigate to the `js/` folder and open `api.js` in your favorite text editor.
3. Locate the `API_KEYS` object at the very top of `api.js`:
```javascript
const API_KEYS = {
    ABUSEIPDB: "YOUR_KEY_HERE", // Get yours at https://www.abuseipdb.com/
    VIRUSTOTAL: "YOUR_KEY_HERE" // Get yours at https://www.virustotal.com/
};
```
4. Paste your free API keys into the empty string slots and save the file.

### Running the Dashboard
Since the dashboard relies on authenticated API connections that standard browsers block when opening files directly off the hard drive, you must run it through a local server, **OR** utilize the built-in CORS Proxy system.

**Method 1 (Easiest - Double Click):**
1. Simply double-click `index.html` to open it in your browser.
2. Because of browser security (CORS) against `file:///` URLs, you **must temporarily authorize the proxy**.
3. Visit [https://cors-anywhere.herokuapp.com/corsdemo](https://cors-anywhere.herokuapp.com/corsdemo) and click **"Request temporary access to the demo server"**.
4. Return to your dashboard, and your API keys will now work perfectly!

**Method 2 (Recommended - Local Host):**
Run a lightweight HTTP server in the root directory. If you have Python installed:
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

---

## 🖥️ Usage Guide

1. **Dashboard:** Type any IP Address (e.g. `8.8.8.8`) or Domain (e.g. `tesla.com`) into the top search bar and click `Analyze`.
2. **Surveillance:** Provides a 2D Leaflet mapping variant for pinpointing ISP routing nodes.
3. **Globe Tracker:** Switch to the 3D globe tab after searching an IP to visualize the physical infrastructure on the planet.
4. **Breach Intel:** Search an email address to query dark web credential breach records.
5. **Crypto Trace:** Paste a Bitcoin wallet address (e.g., `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`) into the search bar while in the Crypto tab to pull forensic ledger data.

---

## 🛡️ Disclaimer
This tool is built for educational, defensive research, and authorized OSINT investigations. The developers assume no responsibility for malicious usage. All API queries are subject to the terms of service of their respective providers.
