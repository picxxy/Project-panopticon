class IpGlobeTracker {
    constructor() {
        this.container = document.getElementById('globeViz');
        this.globe = null;
        this.isInitialized = false;
        
        // Setup HUD elements securely
        this.setupHud();
    }

    setupHud() {
        // Build the  HUD overlay specifically for the 3D globe tab
        this.hud = document.createElement('div');
        this.hud.className = 'card globe-hud';
        this.hud.style.position = 'absolute';
        this.hud.style.top = '20px';
        this.hud.style.right = '20px';
        this.hud.style.width = '300px';
        this.hud.style.zIndex = '1000';
        this.hud.style.backgroundColor = 'var(--card-bg)';
        this.hud.style.border = '1px solid var(--primary-color)';
        this.hud.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.2)';
        this.hud.style.display = 'none';

        this.hud.innerHTML = `
            <h3 style="color: var(--primary-color); margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">TARGET GEOLOCATED</h3>
            <div style="margin-bottom: 10px;"><strong style="color: var(--text-secondary);">IP Address:</strong> <span id="hud-ip" style="float: right;">--</span></div>
            <div style="margin-bottom: 10px;"><strong style="color: var(--text-secondary);">City:</strong> <span id="hud-city" style="float: right;">--</span></div>
            <div style="margin-bottom: 10px;"><strong style="color: var(--text-secondary);">Country:</strong> <span id="hud-country" style="float: right;">--</span></div>
            <div style="margin-bottom: 10px;"><strong style="color: var(--text-secondary);">ISP:</strong> <span id="hud-isp" style="float: right; text-align: right; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">--</span></div>
            <div id="hud-minimap"></div>
        `;
        
        // Append HUD to relative container
        document.getElementById('globeView').style.position = 'relative';
        document.getElementById('globeView').appendChild(this.hud);
    }

    init() {
        if (this.isInitialized) return;

        // Initialize Globe.gl
        this.globe = Globe()
            (this.container)
            .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg') // Dark SOC mode
            .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
            .showAtmosphere(true)
            .atmosphereColor('#4338ca')
            .atmosphereAltitude(0.25)
            .pointOfView({ altitude: 2.5 });

        // Auto-spin logic
        this.globe.controls().autoRotate = true;
        this.globe.controls().autoRotateSpeed = 0.5;

        // Ensure it fits the container
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.isInitialized = true;
    }

    resize() {
        if (!this.globe) return;
        const width = this.container.clientWidth || window.innerWidth - 250;
        const height = this.container.clientHeight || window.innerHeight - 80;
        this.globe.width(width).height(height);
    }

    trackIP(geoData) {
        if (!this.isInitialized) this.init();

        // Update HUD
        this.hud.style.display = 'block';
        document.getElementById('hud-ip').textContent = geoData.query || '--';
        document.getElementById('hud-city').textContent = geoData.city || '--';
        document.getElementById('hud-country').textContent = geoData.country || '--';
        document.getElementById('hud-isp').textContent = geoData.isp || '--';

        // Add a rippling ring at the exact location
        const targetPoint = {
            lat: geoData.lat,
            lng: geoData.lon,
            maxR: 5,
            propagationSpeed: 2,
            repeatPeriod: 1000
        };

        this.globe
            .ringsData([targetPoint])
            .ringColor(() => '#ef4444')
            .ringMaxRadius('maxR')
            .ringPropagationSpeed('propagationSpeed')
            .ringRepeatPeriod('repeatPeriod');

        // Stop auto-rotate, grab camera and smooth-fly directly to the target
        this.globe.controls().autoRotate = false;
        
        // Fly animation (lat, lng, altitude, durationMs)
        this.globe.pointOfView({ lat: geoData.lat, lng: geoData.lon, altitude: 1.5 }, 2000);
        
        // Resume slow rotation after a brief pause
        setTimeout(() => {
            this.globe.controls().autoRotate = true;
            this.globe.controls().autoRotateSpeed = 0.1;
        }, 4000);

        // Update 2D Tactical Minimap
        this.updateMinimap(geoData.lat, geoData.lon);
    }

    updateMinimap(lat, lng) {
        if (!this.minimap) {
            // Wait for display:block to calculate size properly
            setTimeout(() => {
                this.minimap = L.map('hud-minimap', {
                    zoomControl: false,
                    attributionControl: false
                }).setView([lat, lng], 13);
                
                L.control.zoom({ position: 'bottomright' }).addTo(this.minimap);

                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19
                }).addTo(this.minimap);

                this.minimapMarker = L.circleMarker([lat, lng], {
                    radius: 8,
                    fillColor: "#ef4444",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(this.minimap);
            }, 100);
        } else {
            this.minimap.setView([lat, lng], 13);
            this.minimapMarker.setLatLng([lat, lng]);
            
            // Fix map size issues due to DOM visibility changes
            setTimeout(() => {
                this.minimap.invalidateSize();
            }, 100);
        }
    }
}

// Instantiate globally so it can be called seamlessly
window.globeTracker = new IpGlobeTracker();
