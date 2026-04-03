/**
 * api.js
 * Fetches data from Threat Intelligence APIs in real-time.
 */

// ==========================================
// 🔴 ADD YOUR REAL API KEYS HERE 🔴
// ==========================================
const API_KEYS = {
    ABUSEIPDB: "", // Get yours at https://www.abuseipdb.com/ (e.g. "2a9910ca4a...")
    VIRUSTOTAL: "" // Get yours at https://www.virustotal.com/ (e.g. "a27f4e1579...")
};

// We use cors-anywhere to bypass browser CORS restrictions for local testing.
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";

class ThreatAPI {
    // Intelligent Cache to prevent duplicate network calls
    static cache = new Map();

    // Helper to check if string is an IPv4 address
    static isIP(target) {
        const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(target);
    }

    static async fetchAbuseIPDB(ip) {
        if (this.cache.has(`abuse_${ip}`)) return this.cache.get(`abuse_${ip}`);
        if (!API_KEYS.ABUSEIPDB) throw new Error("API Key Missing: Please add your AbuseIPDB key in api.js");

        const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`;
        const proxyUrl = CORS_PROXY + url;

        try {
            const res = await fetch(proxyUrl, {
                headers: {
                    'Key': API_KEYS.ABUSEIPDB,
                    'Accept': 'application/json'
                }
            });
            if (!res.ok) throw new Error("AbuseIPDB request failed");
            const json = await res.json();
            const result = {
                confidenceScore: json.data.abuseConfidenceScore,
                totalReports: json.data.totalReports
            };
            this.cache.set(`abuse_${ip}`, result);
            return result;
        } catch (e) {
            console.error("AbuseIPDB Error:", e);
            return { confidenceScore: "Error", totalReports: "Error" };
        }
    }

    static async fetchVirusTotal(target, isIP) {
        if (this.cache.has(`vt_${target}`)) return this.cache.get(`vt_${target}`);
        if (!API_KEYS.VIRUSTOTAL) throw new Error("API Key Missing: Please add your VirusTotal key in api.js");

        const endpoint = isIP ? `ip_addresses/${target}` : `domains/${target}`;
        const url = `https://www.virustotal.com/api/v3/${endpoint}`;
        const proxyUrl = CORS_PROXY + url;

        try {
            const res = await fetch(proxyUrl, {
                headers: {
                    'x-apikey': API_KEYS.VIRUSTOTAL
                }
            });
            if (!res.ok) throw new Error("VirusTotal request failed");
            const json = await res.json();
            const stats = json.data.attributes.last_analysis_stats;
            const totalEngines = stats.malicious + stats.suspicious + stats.undetected + stats.harmless;

            const result = {
                malicious: stats.malicious,
                totalEngineCount: totalEngines || 94,
                lastAnalysis: new Date(json.data.attributes.last_analysis_date * 1000).toISOString().split('T')[0]
            };
            this.cache.set(`vt_${target}`, result);
            return result;
        } catch (e) {
            console.error("VirusTotal Error:", e);
            return { malicious: "Error", totalEngineCount: "Error", lastAnalysis: "Error" };
        }
    }

    static async fetchWhois(target) {
        if (this.cache.has(`whois_${target}`)) return this.cache.get(`whois_${target}`);
        if (!target) throw new Error("Invalid target for Whois fetch");

        const url = `https://get.geojs.io/v1/ip/geo/${target}.json`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("GeoJS request failed");
            const json = await res.json();

            const result = {
                asn: json.asn ? `AS${json.asn}` : "None",
                org: json.organization_name || json.organization || "Unknown Org",
                isp: json.organization_name || json.organization || "Unknown ISP",
                location: `${json.city ? json.city + ', ' : ''}${json.country || 'Unknown'}`,
                lat: json.latitude || null,
                lon: json.longitude || null
            };
            this.cache.set(`whois_${target}`, result);
            return result;
        } catch (e) {
            console.error("WHOIS Error:", e);
            return { asn: "Error", org: "Error", location: "Error", isp: "Error", lat: null, lon: null };
        }
    }

    static async resolveDomain(domain) {
        if (this.cache.has(`dns_${domain}`)) return this.cache.get(`dns_${domain}`);
        try {
            const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
            const json = await res.json();
            if (json.Answer && json.Answer.length > 0) {
                const ipRecord = json.Answer.find(a => a.type === 1);
                if (ipRecord) {
                    this.cache.set(`dns_${domain}`, ipRecord.data);
                    return ipRecord.data;
                }
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    static async analyzeTarget(target) {
        const isIP = this.isIP(target);
        const resolvedIP = isIP ? target : await this.resolveDomain(target);

        const [abuseIPDB, virusTotal, whois] = await Promise.all([
            resolvedIP ? this.fetchAbuseIPDB(resolvedIP) : Promise.resolve({ confidenceScore: 0, totalReports: 0 }),
            this.fetchVirusTotal(target, isIP),
            resolvedIP ? this.fetchWhois(resolvedIP) : Promise.resolve({ asn: "Unknown", org: "Unknown", isp: "Unknown", location: "Unknown" })
        ]);

        const abuseScore = typeof abuseIPDB.confidenceScore === 'number' ? abuseIPDB.confidenceScore : 0;
        const vtMalicious = typeof virusTotal.malicious === 'number' ? virusTotal.malicious : 0;
        const vtTotal = typeof virusTotal.totalEngineCount === 'number' ? virusTotal.totalEngineCount : 0;
        const vtRatio = vtTotal > 0 ? (vtMalicious / vtTotal) * 100 : 0;

        let rawScore = (abuseScore * 0.5) + (vtRatio * 0.5);
        const finalScore = Math.floor(Math.min(100, Math.max(0, rawScore)));

        let threatLevel = 'Safe';
        if (finalScore > 75) threatLevel = 'Critical';
        else if (finalScore > 40) threatLevel = 'Suspicious';
        else if (abuseIPDB.confidenceScore === 'Error' && virusTotal.malicious === 'Error') threatLevel = 'Unknown (API Error)';

        const mockTimeSeries = Array.from({ length: 30 }, () => {
            let val = Math.floor(Math.random() * ((finalScore === 0 ? 5 : finalScore) / 2));
            if (finalScore > 20 && Math.random() > 0.8) val += Math.floor(Math.random() * (finalScore * 0.8));
            return val;
        });

        return {
            target: target,
            type: isIP ? 'IP Address' : 'Domain',
            overallScore: finalScore,
            threatLevel: threatLevel,
            abuseIPDB,
            virusTotal,
            whois,
            visualGraphData: mockTimeSeries
        };
    }

    static async fetchBreachData(target) {
        if (this.cache.has(`breach_${target}`)) return this.cache.get(`breach_${target}`);
        await new Promise(resolve => setTimeout(resolve, 800));
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target);

        if (isEmail) {
            try {
                const response = await fetch(`https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(target)}`);
                if (response.status === 404) return [];
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.ExposedBreaches && data.ExposedBreaches.breaches_details) {
                        const result = data.ExposedBreaches.breaches_details.map(b => ({
                            name: b.breach,
                            date: b.xposed_date ? b.xposed_date + "-01-01" : "Unknown",
                            types: b.xposed_data ? b.xposed_data.split(';') : ["Unknown Data"],
                            logo: b.logo ? `<img src="${b.logo}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: contain; background: #fff; padding: 2px;" onerror="this.outerHTML='⚠️'"/>` : "⚠️"
                        }));
                        this.cache.set(`breach_${target}`, result);
                        return result;
                    }
                }
            } catch (error) {
                console.warn("Real API failed", error);
            }
        }
        return [];
    }

    static async locateIP(ip) {
        if (this.cache.has(`geo_${ip}`)) return this.cache.get(`geo_${ip}`);
        try {
            const response = await fetch(`http://ip-api.com/json/${ip}`);
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    this.cache.set(`geo_${ip}`, data);
                    return data;
                }
            }
            throw new Error('Geolocation failed');
        } catch (error) {
            console.error("Globe GeoIP API failed:", error);
            return { lat: 38.8977, lon: -77.0365, city: "Washington D.C.", country: "United States", isp: "Unknown ISP", query: ip };
        }
    }

    static async fetchCryptoWallet(address) {
        if (this.cache.has(`crypto_${address}`)) return this.cache.get(`crypto_${address}`);
        try {
            const response = await fetch(`https://blockchain.info/rawaddr/${address}?cors=true`);
            if (response.status === 404) return { error: 'Address not found on the blockchain.' };
            if (!response.ok) throw new Error('Failed to fetch from Blockchain.info');
            const data = await response.json();
            this.cache.set(`crypto_${address}`, data);
            return data;
        } catch (error) {
            console.error("Crypto API failed:", error);
            return { error: 'Network error or invalid address format.' };
        }
    }
}
