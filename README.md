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

## ⚠️ CRITICAL SETUP: CORS Proxy Authorization

Because Project Panopticon runs 100% in the browser and accesses many external intelligence APIs (VirusTotal, HackerTarget, etc.), modern browsers will block these requests due to **CORS (Cross-Origin Resource Sharing) restrictions**. 

To bypass this without needing a backend server, this application uses the `cors-anywhere` proxy infrastructure. **You must authorize your machine to use this proxy every time you start a new session or your APIs will return errors.**

### How to Authorize (Mandatory Step):
1. Before using the dashboard, navigate directly to: **[https://cors-anywhere.herokuapp.com/corsdemo](https://cors-anywhere.herokuapp.com/corsdemo)**
2. Click the button that says **"Request temporary access to the demo server"**.
3. You will see a success message. Return to the Panopticon dashboard. The tools are now fully unlocked for your session.
*(Note: You will need to click this button again if your session expires or if you restart your browser).*

---

## 🛠️ Installation

1. A modern web browser (Edge, Chrome, Firefox, or Safari).
2. A Free **AbuseIPDB** API Key.
3. A Free **VirusTotal** API Key.

### API Key Configuration
1. Download or clone this repository.
2. Open `js/api.js` in a text editor.
3. Locate the `API_KEYS` object at the very top:
```javascript
const API_KEYS = {
    ABUSEIPDB: "YOUR_KEY_HERE", 
    VIRUSTOTAL: "YOUR_KEY_HERE" 
};
```
4. Paste your free API keys into the empty strings.

### Running the Dashboard
Since the system is client-side, simply double-click `index.html` to launch it. Optionally, if you prefer running it securely via a local port:
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
