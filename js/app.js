/**
 * app.js
 * Main application logic for the Threat Intelligence Dashboard.
 * Handles DOM manipulation, chart visualization, and fetching mocked data.
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const searchContainer = document.getElementById('searchContainer');
    const appContainer = document.getElementById('app');

    // Navigation and Views
    const btnDashboard = document.getElementById('btnDashboard');
    const btnSurveillance = document.getElementById('btnSurveillance');
    const btnGlobe = document.getElementById('btnGlobe');
    const btnOSINT = document.getElementById('btnOSINT');
    
    const dashboardView = document.getElementById('dashboardView');
    const surveillanceView = document.getElementById('surveillanceView');
    const globeView = document.getElementById('globeView');
    const osintView = document.getElementById('osintView');
    
    // New Crypto View Reference
    const btnCrypto = document.getElementById('btnCrypto');
    const cryptoView = document.getElementById('cryptoView');
    
    // Track current view state
    let currentView = 'dashboard';

    const userAvatar = document.getElementById('userAvatar');
    const userRole = document.getElementById('userRole');

    // Chart Instance
    let trendChartInstance = null;

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Toast Notification System
    function showToast(message, type = 'error') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'error' ? '⚠️' : 'ℹ️';
        const title = type === 'error' ? 'System Error' : 'Notification';

        toast.innerHTML = `
            <div class="toast-header">
                <span>${icon}</span>
                <span>${title}</span>
            </div>
            <div class="toast-message">${message}</div>
        `;

        toast.addEventListener('click', () => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        });

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('fade-out');
                setTimeout(() => {
                    if (toast.parentElement) toast.remove();
                }, 400);
            }
        }, 5000);
    }

    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        // Set loading state
        appContainer.classList.add('loading');
        searchBtn.textContent = 'Analyzing...';
        
        try {
            if (currentView === 'osint') {
                // OSINT specific search
                const data = await ThreatAPI.fetchBreachData(query);
                renderOSINT(data);
            } else if (currentView === 'crypto') {
                // Crypto Wallet tracking
                const data = await ThreatAPI.fetchCryptoWallet(query);
                renderCrypto(data);
            } else if (currentView === 'globe') {
                // Globe Tracker Search
                if (window.globeTracker) {
                    const geoData = await ThreatAPI.locateIP(query);
                    window.globeTracker.trackIP(geoData);
                }
            } else {
                // Standard Threat Intelligence search
                const data = await ThreatAPI.analyzeTarget(query);
                updateDashboard(data);
            }
        } catch (error) {
            console.error("Error analyzing target:", error);
            showToast(error.message || "Failed to analyze target. Internal Server Error.", "error");
        } finally {
            // Remove loading state
            appContainer.classList.remove('loading');
            searchBtn.textContent = 'Analyze';
        }
    }

    function updateDashboard(data) {
        // --- 1. Target Information ---
        document.getElementById('infoTarget').textContent = data.target;
        document.getElementById('infoType').textContent = data.type;
        document.getElementById('infoLocation').textContent = data.whois.location;
        document.getElementById('infoISP').textContent = data.whois.isp;

        // --- 2. Threat Score Indicator ---
        const scoreDisplay = document.getElementById('threatScoreDisplay');
        const scoreValue = scoreDisplay.querySelector('.score-value');
        const threatStatus = document.getElementById('threatStatus');

        scoreValue.textContent = data.overallScore;
        threatStatus.textContent = `Threat Level: ${data.threatLevel}`;

        let colorHex = '#10b981'; // safe
        if (data.overallScore > 75) {
            colorHex = '#ef4444'; // danger
            threatStatus.style.color = 'var(--danger)';
        } else if (data.overallScore > 40) {
            colorHex = '#f59e0b'; // warning
            threatStatus.style.color = 'var(--warning)';
        } else {
            threatStatus.style.color = 'var(--safe)';
        }

        // Setup the circular progress bar (conic gradient)
        scoreDisplay.style.background = `conic-gradient(${colorHex} ${data.overallScore * 3.6}deg, var(--card-border) 0deg)`;
        scoreValue.style.color = colorHex;

        // --- 3. Intelligence Feeds ---
        // AbuseIPDB
        const abuseBadge = document.querySelector('#cardAbuseIPDB .status-badge');
        if (data.abuseIPDB.confidenceScore === 'Error') {
            abuseBadge.textContent = 'API Error';
            abuseBadge.className = 'status-badge danger';
        } else {
            abuseBadge.textContent = data.abuseIPDB.confidenceScore > 50 ? 'Malicious' : 'Clean';
            abuseBadge.className = `status-badge ${data.abuseIPDB.confidenceScore > 50 ? 'danger' : 'safe'}`;
        }
        
        const abuseMetrics = document.querySelectorAll('#cardAbuseIPDB .metric');
        abuseMetrics[0].textContent = data.abuseIPDB.confidenceScore === 'Error' ? 'Error' : `${data.abuseIPDB.confidenceScore}%`;
        abuseMetrics[1].textContent = data.abuseIPDB.totalReports;

        // VirusTotal
        const vtBadge = document.querySelector('#cardVirusTotal .status-badge');
        if (data.virusTotal.malicious === 'Error') {
            vtBadge.textContent = 'API Error';
            vtBadge.className = 'status-badge danger';
        } else {
            vtBadge.textContent = data.virusTotal.malicious > 0 ? 'Suspicious' : 'Clean';
            vtBadge.className = `status-badge ${data.virusTotal.malicious > 0 ? 'warning' : 'safe'}`;
        }

        const vtMetrics = document.querySelectorAll('#cardVirusTotal .metric');
        vtMetrics[0].textContent = data.virusTotal.malicious === 'Error' ? 'Error' : `${data.virusTotal.malicious} / ${data.virusTotal.totalEngineCount}`;
        vtMetrics[1].textContent = data.virusTotal.lastAnalysis;

        // WHOIS
        const whoisBadge = document.querySelector('#cardWhois .status-badge');
        if (data.whois.asn === 'Error') {
            whoisBadge.textContent = 'API Error';
            whoisBadge.className = 'status-badge danger';
        } else {
            whoisBadge.textContent = 'Info';
            whoisBadge.className = 'status-badge safe';
        }

        const whoisMetrics = document.querySelectorAll('#cardWhois .metric');
        whoisMetrics[0].textContent = data.whois.asn;
        whoisMetrics[1].textContent = data.whois.org;

        // --- 4. Visual Graph (Chart.js) ---
        renderChart(data.visualGraphData, colorHex);

        // --- 5. Map Sync ---
        // If the map is initialized and we have lat/lon, fly to the target
        if (data.whois.lat && data.whois.lon) {
            if (window.surveillanceMap) {
                window.surveillanceMap.flyTo(data.whois.lat, data.whois.lon, 14);
            } else {
                // If map isn't initialized yet, we can wait until they click the tab
                // But let's build a small queue or just store it globally
                window.lastSearchedCoords = [data.whois.lat, data.whois.lon];
            }
        }
    }

    function renderChart(chartData, themeColor) {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        // Destroy existing chart to prevent overlap
        if (trendChartInstance) {
            trendChartInstance.destroy();
        }

        const labels = Array.from({length: 30}, (_, i) => `Day -${30 - i}`);

        trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Threat Activity Events',
                    data: chartData,
                    borderColor: themeColor,
                    backgroundColor: `${themeColor}33`, // Append 33 for 20% opacity alpha
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4, // Smooth curved lines
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(20, 27, 45, 0.9)',
                        titleColor: '#f8fafc',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            display: false
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        },
                        beginAtZero: true
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    // --- Breach Intel Render Logic ---
    function renderOSINT(breaches) {
        const resultsContainer = document.getElementById('breachResults');
        const osintStatus = document.getElementById('osintStatus');
        
        resultsContainer.innerHTML = ''; // Clear placeholder
        osintStatus.style.visibility = 'visible';

        if (!breaches || breaches.length === 0) {
            osintStatus.textContent = 'No Breaches Found';
            osintStatus.className = 'status-badge safe';
            resultsContainer.innerHTML = '<div style="text-align: center; color: var(--safe); width: 100%; padding: 3rem 0;">Target is clean! No dark web or public database breaches identified.</div>';
            return;
        }

        osintStatus.textContent = `${breaches.length} Breaches Found`;
        osintStatus.className = 'status-badge danger';

        breaches.forEach(breach => {
            const card = document.createElement('div');
            card.className = 'breach-card';
            
            // Generate Pills
            const pills = breach.types.map(t => `<span class="compromised-pill">${t}</span>`).join('');

            card.innerHTML = `
                <div class="breach-header">
                    <div class="breach-logo">${breach.logo}</div>
                    <div class="breach-title">
                        <h4>${breach.name}</h4>
                        <span>Breach Date: ${breach.date}</span>
                    </div>
                </div>
                <div class="breach-body">
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">Compromised Data:</p>
                    <div class="breach-compromised-types">
                        ${pills}
                    </div>
                </div>
            `;
            resultsContainer.appendChild(card);
        });
    }

    // --- Crypto Render Logic ---
    function renderCrypto(data) {
        const cryptoPlaceholder = document.getElementById('cryptoPlaceholder');
        const cryptoResults = document.getElementById('cryptoResults');
        const cryptoStatus = document.getElementById('cryptoStatus');
        
        cryptoStatus.style.visibility = 'visible';

        if (data.error) {
            cryptoStatus.textContent = 'Error';
            cryptoStatus.className = 'status-badge danger';
            cryptoResults.style.display = 'none';
            cryptoPlaceholder.style.display = 'block';
            cryptoPlaceholder.innerHTML = `<div style="color: var(--danger);">Error: ${data.error}</div>`;
            return;
        }

        cryptoStatus.textContent = 'Active Wallet';
        cryptoStatus.className = 'status-badge warning';
        cryptoPlaceholder.style.display = 'none';
        cryptoResults.style.display = 'block';

        // 1 BTC = 100,000,000 Satoshis
        const satoshisToBtc = (sats) => (sats / 100000000).toFixed(8);

        document.getElementById('cryptoBalance').textContent = satoshisToBtc(data.final_balance) + ' BTC';
        document.getElementById('cryptoReceived').textContent = satoshisToBtc(data.total_received) + ' BTC';
        document.getElementById('cryptoSent').textContent = satoshisToBtc(data.total_sent) + ' BTC';
        document.getElementById('cryptoTxs').textContent = data.n_tx;

        // Render Ledger
        const ledger = document.getElementById('cryptoLedger');
        ledger.innerHTML = '';

        if (!data.txs || data.txs.length === 0) {
            ledger.innerHTML = '<div style="color: var(--text-secondary);">No transactions found.</div>';
            return;
        }

        // Show up to 5 most recent transactions
        const recentTxs = data.txs.slice(0, 5);
        
        recentTxs.forEach(tx => {
            const date = new Date(tx.time * 1000).toLocaleString();
            
            // Determine if net flow for THIS address was inward or outward
            // Let's calculate total value out vs total value in. 
            // In a real explorer you trace inputs/outputs against the address. 
            // For a simple view, we just show the transaction hash and total value exchanged.
            let totalValue = 0;
            tx.out.forEach(out => { totalValue += out.value; });
            
            // To simplify, we will just show it as a transaction node without complex in/out logic
            const btcVal = satoshisToBtc(totalValue);
            
            ledger.innerHTML += `
                <div class="tx-row">
                    <div class="tx-info">
                        <span class="tx-hash">${tx.hash}</span>
                        <span class="tx-date">${date}</span>
                    </div>
                    <div class="tx-amount" style="color: #cbd5e1;">
                        ${btcVal} BTC
                    </div>
                </div>
            `;
        });
    }

    // --- Tab Switching Logic ---
    function switchView(view) {
        currentView = view;
        
        // Reset specific states
        btnDashboard.classList.remove('active');
        btnSurveillance.classList.remove('active');
        if (btnGlobe) btnGlobe.classList.remove('active');
        if (btnOSINT) btnOSINT.classList.remove('active');
        if (btnCrypto) btnCrypto.classList.remove('active');
        
        dashboardView.classList.add('hidden');
        surveillanceView.classList.add('hidden');
        if (globeView) globeView.classList.add('hidden');
        if (osintView) osintView.classList.add('hidden');
        if (cryptoView) cryptoView.classList.add('hidden');

        if (view === 'dashboard') {
            btnDashboard.classList.add('active');
            dashboardView.classList.remove('hidden');
            searchContainer.classList.remove('hidden');
            userAvatar.classList.remove('hidden');
            userRole.textContent = 'Analyst';
            searchInput.placeholder = "Search IP Address or Domain...";
        } else if (view === 'surveillance') {
            btnSurveillance.classList.add('active');
            surveillanceView.classList.remove('hidden');
            searchContainer.classList.add('hidden');
            userAvatar.classList.add('hidden');
            userRole.textContent = 'Global Operations';

            // Lazy initialize map
            if (!window.surveillanceMap) {
                window.surveillanceMap = new SurveillanceMap();
                if (window.lastSearchedCoords) {
                    window.surveillanceMap.flyTo(window.lastSearchedCoords[0], window.lastSearchedCoords[1], 14);
                }
            }
            // Invalidate size to prevent grey bounds load
            setTimeout(() => {
                window.surveillanceMap.invalidateSize();
            }, 100);
        } else if (view === 'globe') {
            if (btnGlobe) btnGlobe.classList.add('active');
            if (globeView) globeView.classList.remove('hidden');
            searchContainer.classList.remove('hidden');
            userAvatar.classList.remove('hidden');
            userRole.textContent = 'Global Operations';
            searchInput.placeholder = "Geolocate IP Address on Globe...";
            
            // Initialization
            if (window.globeTracker) {
                window.globeTracker.init();
            }
        } else if (view === 'osint') {
            if (btnOSINT) btnOSINT.classList.add('active');
            if (osintView) osintView.classList.remove('hidden');
            searchContainer.classList.remove('hidden');
            userAvatar.classList.remove('hidden');
            userRole.textContent = 'OSINT Investigator';
            searchInput.placeholder = "Search Email Address...";
        } else if (view === 'crypto') {
            if (btnCrypto) btnCrypto.classList.add('active');
            if (cryptoView) cryptoView.classList.remove('hidden');
            searchContainer.classList.remove('hidden');
            userAvatar.classList.remove('hidden');
            userRole.textContent = 'Financial Investigator';
            searchInput.placeholder = "Search Bitcoin Address (e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)...";
        }
    }

    btnDashboard.addEventListener('click', () => switchView('dashboard'));
    btnSurveillance.addEventListener('click', () => switchView('surveillance'));
    if (btnGlobe) btnGlobe.addEventListener('click', () => switchView('globe'));
    if (btnOSINT) btnOSINT.addEventListener('click', () => switchView('osint'));
    if (btnCrypto) btnCrypto.addEventListener('click', () => switchView('crypto'));
});
