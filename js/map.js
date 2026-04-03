/**
 * map.js
 * Handles the Surveillance Map feature using Leaflet.js and Overpass API
 */

class SurveillanceMap {
    constructor() {
        this.map = null;
        this.markers = L.layerGroup();
        this.isLoading = false;
        this.init();
    }

    init() {
        // Initialize the map centered on Europe, 
        // Prevent excessive zooming out and dragging off the world bounds
        // Light mode map tiles (CartoDB Positron) 
        const lightMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19,
            noWrap: true
        });

        // Ultra-High Detail View (Google Maps Streets)
        // Bypasses the "Referer Required" blocks while providing even better detail globally
        const detailedMap = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google Maps',
            maxZoom: 20,
            noWrap: true
        });

        // Ultra-High Detail View (Google Satellite Hybrid)
        const satelliteMap = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google Maps Satellite',
            maxZoom: 20,
            noWrap: true
        });

        // Dark Tactical mode
        const darkMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            noWrap: true
        });

        this.map = L.map('map', {
            center: [50.0, 15.0], // Centered roughly on Europe
            zoom: 4,              // Default zoom
            minZoom: 3,           // Limit zoom out so map has enough height to fill the container
            maxBounds: [[-90, -180], [90, 180]], // Solidify map edges
            maxBoundsViscosity: 1.0,
            layers: [detailedMap] // Default to the highly detailed map as requested
        });

        const baseMaps = {
            "Detailed Streets (Google)": detailedMap,
            "Satellite Hybrid (Google)": satelliteMap,
            "Tactical Dark (Carto)": darkMap,
            "Clean Light (Carto)": lightMap
        };

        L.control.layers(baseMaps).addTo(this.map);

        this.markers.addTo(this.map);

        // Fetch cameras whenever the map stops moving. 
        this.map.on('moveend', () => {
            this.fetchCameras();
        });
        
        // Fetch initially
        this.fetchCameras();
    }

    updateStatus(message, isError = false) {
        const badge = document.getElementById('mapStatus');
        if (!badge) return;
        badge.textContent = message;
        
        badge.className = 'status-badge';
        if (isError) badge.classList.add('danger');
        else if (message.includes('Loading')) badge.classList.add('pending');
        else if (message.includes('Cameras')) badge.classList.add('danger'); // Danger for CCTV
        else badge.classList.add('safe');
    }

    async fetchCameras() {
        if (this.isLoading) return;
        
        const bounds = this.map.getBounds();
        const size = this.map.getSize();
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
        const zoom = this.map.getZoom();

        this.isLoading = true;
        this.updateStatus('Loading live data...');

        try {
            // Use the same CORS proxy defined in api.js to securely bypass cross-origin restrictions
            const targetUrl = `https://sunders.uber.space/camera.php?bbox=${bbox}&zoom=${zoom}&width=${size.x}&height=${size.y}`;
            const url = CORS_PROXY + targetUrl;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error("API failed");
            
            const data = await res.json();
            this.renderCameras(data);
        } catch (error) {
            console.error("Failed to load CCTV data:", error);
            this.updateStatus('Data Fetch Failed', true);
        } finally {
            this.isLoading = false;
        }
    }

    renderCameras(elements) {
        this.markers.clearLayers();

        if (!elements || elements.length === 0) {
            this.updateStatus('No CCTV detected in this area');
            return;
        }

        // Loop through all found CCTV nodes and place them on the map
        elements.forEach(node => {
            const lat = node.lat;
            const lon = node.lon;

            if (node['multi'] === 'yes') {
                // Label with number of composite cameras
                const countTxt = `<span>${node.count}</span>`;
                const emptyIcon = L.icon({
                    iconUrl: 'https://sunders.uber.space/images/icon.png',
                    iconSize: [0, 0],
                    iconAnchor: [0, 0],
                    labelAnchor: [-6, 0]
                });
                const marker = L.marker([lat, lon], { icon: emptyIcon });
                marker.bindTooltip(countTxt, {
                    permanent: true,
                    interactive: true,
                    direction: 'center',
                    className: 'composite-cameras-label'
                });
                this.markers.addLayer(marker);
            } else {
                // Get plot type
                const plotType = node['surveillance'];
                
                // Get icon base name
                let iconName = 'cam';
                if (node['camera:type'] === 'fixed') iconName = 'fixed';
                else if (node['camera:type'] === 'panning') iconName = 'panning';
                else if (node['camera:type'] === 'dome') iconName = 'dome';
                else if (node['surveillance:type'] === 'guard') iconName = 'guard';

                // Add color postfix based on location
                if (plotType === 'public') iconName += 'Red';
                else if (plotType === 'indoor') iconName += 'Green';
                else if (plotType === 'outdoor') iconName += 'Blue';

                // Add specific prefixes/overrides
                if (node['surveillance:type'] === 'ALPR' || plotType === 'red_light' || plotType === 'level_crossing' || plotType === 'speed_camera') {
                    iconName = 'traffic';
                }
                if (node['fixme'] != null) {
                    iconName = 'todo_' + iconName;
                }

                const markerIcon = L.icon({
                    iconUrl: `https://sunders.uber.space/images/${iconName}.png`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                    popupAnchor : [0, -10]
                });

                // Build Table Popup
                let popupHtml = '<table class="popup-content">';
                popupHtml += `<tr><td>id</td><td><a href="https://www.openstreetmap.org/node/${node.id}" target="_blank">${node.id}</a></td></tr>`;
                popupHtml += `<tr><td>latitude</td><td>${node.lat}</td></tr>`;
                popupHtml += `<tr><td>longitude</td><td>${node.lon}</td></tr>`;

                for (let key in node) {
                    if (node[key] !== '' && key !== 'multi' && key !== 'id' && key !== 'userid' && key !== 'lat' && key !== 'lon') {
                        popupHtml += `<tr><td>${key}</td><td>`;
                        let val = String(node[key]);
                        if (val.startsWith('http')) {
                            let suffix = val.slice(-3).toLowerCase();
                            if (suffix === 'jpg' || suffix === 'gif' || suffix === 'png') {
                                popupHtml += `<a href="${val}" target="_blank"><img alt="Link" src="${val}" width="200"/></a>`;
                            } else {
                                popupHtml += `<a href="${val}" target="_blank">Link</a>`;
                            }
                        } else {
                            popupHtml += val;
                        }
                        popupHtml += `</td></tr>`;
                    }
                }
                popupHtml += '</table>';

                const marker = L.marker([lat, lon], { icon: markerIcon });
                marker.bindPopup(popupHtml, { className: 'cctv-popup', maxWidth: 400 });
                this.markers.addLayer(marker);

                // --- REAL TELEMETRY FOV CONE RENDERING ---
                // Only render geometries that we mathematically have actual node data for
                const focusColor = this.getFocusColor(plotType);
                const height = this.getCameraHeight(node);
                const radius = height * 7; // Physically derived sensing range
                
                if (iconName.includes('dome') || iconName.includes('panning')) {
                    // Dome & Panning cameras inherently rotate 360 degrees, render full circle
                    L.circle([lat, lon], {
                        radius: radius,
                        weight: 1,
                        color: focusColor,
                        fillOpacity: 0.15,
                        interactive: false // Let mouse click through to the icon
                    }).addTo(this.markers);
                } else {
                    // Fixed cameras require explicit compass direction to render truthfully
                    const direction = this.getCameraDirection(node);
                    if (direction !== null) {
                        // Extract actual width of the lens FOV if available, else standard 60-degree tactical slice
                        const fieldOfViewWidth = this.getCameraAngle(node);
                        
                        L.semiCircle([lat, lon], {
                            radius: radius,
                            weight: 1,
                            color: focusColor,
                            fillColor: focusColor,
                            fillOpacity: 0.25,
                            interactive: false
                        })
                        .setDirection(direction, fieldOfViewWidth)
                        .addTo(this.markers);
                    }
                }
            }
        });

        this.updateStatus(`${elements.length} Cameras Loaded`);
    }

    // --- TELEMETRY PARSERS ---
    getCameraDirection(plot) {
        let dir = plot['camera:direction'] || plot['direction'] || plot['surveillance:direction'];
        if (dir == null) return null;
        
        // Handle cardinal bearings
        const dirMap = { 'N': 0, 'NE': 45, 'E': 90, 'SE': 135, 'S': 180, 'SW': 225, 'W': 270, 'NW': 315 };
        if (dirMap[dir.toUpperCase()] !== undefined) return dirMap[dir.toUpperCase()];
        
        // Handle numerical degrees
        if (!isNaN(parseFloat(dir))) return parseFloat(dir);
        return null;
    }

    getCameraHeight(plot) {
        let height = parseFloat(plot['height']);
        if (isNaN(height)) height = 5; // Standard 5-meter pole mount fallback
        if (height < 3) height = 3;
        if (height > 12) height = 12;
        return height;
    }

    getFocusColor(plotType) {
        if (plotType === 'public') return '#d40055'; // High priority threat red
        if (plotType === 'indoor') return '#00d455'; // Safe green
        if (plotType === 'outdoor') return '#0055d4'; // Surveillance blue
        return '#6c5d53'; // Default shadow proxy
    }

    getCameraAngle(plot) {
        let angle = plot['camera:angle'];
        if (angle == null || isNaN(parseFloat(angle))) return 60; // Standard fixed lens
        let numAngle = Math.abs(parseFloat(angle));
        return numAngle > 0 ? numAngle : 60;
    }

    // Force resize calculation if the map was hidden during initialization
    invalidateSize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }

    // A helper method if the user searches an IP address: center the map there!
    flyTo(lat, lng, zoom = 14) {
        if (this.map) {
            this.map.flyTo([lat, lng], zoom);
        }
    }
}

// Global instance 
window.surveillanceMap = null;
document.addEventListener('DOMContentLoaded', () => {
    // We defer initialization until the map is visible to avoid render bugs
});
