from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import base64
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes (to allow frontend on port 8000 to talk to backend on 5000)
CORS(app)

ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY")
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")

@app.route('/api/abuseipdb', methods=['GET'])
def get_abuseipdb():
    ip = request.args.get('ip')
    if not ip:
        return jsonify({"error": "IP parameter is required"}), 400
    
    if not ABUSEIPDB_API_KEY:
        return jsonify({"error": "AbuseIPDB API key is missing on server"}), 500

    url = f"https://api.abuseipdb.com/api/v2/check?ipAddress={ip}&maxAgeInDays=90"
    headers = {
        'Key': ABUSEIPDB_API_KEY,
        'Accept': 'application/json'
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        print(f"AbuseIPDB Error: {e}")
        return jsonify({"error": "Failed to fetch from AbuseIPDB"}), 502

@app.route('/api/virustotal/ip', methods=['GET'])
def get_virustotal_ip():
    ip = request.args.get('ip')
    if not ip:
        return jsonify({"error": "IP parameter is required"}), 400
    return fetch_virustotal(f"ip_addresses/{ip}")

@app.route('/api/virustotal/url', methods=['GET'])
def get_virustotal_url():
    target_url = request.args.get('url')
    if not target_url:
        return jsonify({"error": "URL parameter is required"}), 400
    
    # VirusTotal expects a base64 encoded URL without padding
    encoded_url = base64.urlsafe_b64encode(target_url.encode()).decode().rstrip('=')
    return fetch_virustotal(f"urls/{encoded_url}")

@app.route('/api/virustotal/file', methods=['GET'])
def get_virustotal_file():
    hash_val = request.args.get('hash')
    if not hash_val:
        return jsonify({"error": "Hash parameter is required"}), 400
    return fetch_virustotal(f"files/{hash_val}")

def fetch_virustotal(endpoint):
    if not VIRUSTOTAL_API_KEY:
        return jsonify({"error": "VirusTotal API key is missing on server"}), 500

    url = f"https://www.virustotal.com/api/v3/{endpoint}"
    headers = {
        'x-apikey': VIRUSTOTAL_API_KEY
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        print(f"VirusTotal Error: {e}")
        return jsonify({"error": "Failed to fetch from VirusTotal"}), 502

@app.route('/api/hackertarget', methods=['GET'])
def get_hackertarget():
    domain = request.args.get('domain')
    if not domain:
        return jsonify({"error": "Domain parameter is required"}), 400
    
    url = f"https://api.hackertarget.com/hostsearch/?q={domain}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        # Return plain text as HackerTarget returns text/csv
        return response.text, 200, {'Content-Type': 'text/plain'}
    except requests.exceptions.RequestException as e:
        print(f"HackerTarget Error: {e}")
        return jsonify({"error": "Failed to fetch from HackerTarget"}), 502

@app.route('/api/crtsh', methods=['GET'])
def get_crtsh():
    domain = request.args.get('domain')
    if not domain:
        return jsonify({"error": "Domain parameter is required"}), 400
    
    url = f"https://crt.sh/?q=%25.{domain}&output=json"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        print(f"crt.sh Error: {e}")
        return jsonify({"error": "Failed to fetch from crt.sh"}), 502

@app.route('/api/virustotal/domain', methods=['GET'])
def get_virustotal_domain():
    domain = request.args.get('domain')
    if not domain:
        return jsonify({"error": "Domain parameter is required"}), 400
    return fetch_virustotal(f"domains/{domain}")

@app.route('/api/map/cameras', methods=['GET'])
def get_map_cameras():
    bbox = request.args.get('bbox')
    zoom = request.args.get('zoom')
    width = request.args.get('width')
    height = request.args.get('height')
    
    if not all([bbox, zoom, width, height]):
        return jsonify({"error": "Missing parameters"}), 400
        
    url = f"https://sunders.uber.space/camera.php?bbox={bbox}&zoom={zoom}&width={width}&height={height}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        print(f"Map Cameras Error: {e}")
        return jsonify({"error": "Failed to fetch map cameras"}), 502

@app.route('/api/locate', methods=['GET'])
def get_locate():
    ip = request.args.get('ip')
    if not ip:
        return jsonify({"error": "IP parameter is required"}), 400
    
    url = f"http://ip-api.com/json/{ip}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        print(f"LocateIP Error: {e}")
        return jsonify({"error": "Failed to fetch from ip-api"}), 502

if __name__ == '__main__':
    print("Starting Project Panopticon Backend on port 5000...")
    app.run(port=5000)
