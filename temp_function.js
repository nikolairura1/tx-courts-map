function loadMunicipalCourts() {
    console.log('Loading municipal courts...');
    return fetch('courts_unified_2025_with_cities_fuzzy.json')
        .then(response => {
            console.log('Fetch response:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Municipal courts data loaded:', data.count, 'total courts');
            // Filter for municipal courts
            const municipalCourts = data.courts.filter(court => court.type === 'municipal_court');
            console.log('Filtered municipal courts:', municipalCourts.length);
            allMunicipalCourts = municipalCourts; // Store for search functionality
            
            // Create markers for municipal courts
            municipalCourtsLayer = L.layerGroup();
            const markerBounds = [];
            console.log('Created municipalCourtsLayer:', municipalCourtsLayer);
            
            municipalCourts.forEach(court => {
                if (court.point && court.point.coordinates) {
                    const [lng, lat] = court.point.coordinates;
                    
                    const marker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            html: '🏛️',
                            className: 'municipal-court-icon',
                            iconSize: [24, 24],
                            iconAnchor: [12, 24]
                        })
                    });
            console.log('Municipal courts data loaded:', data.count, 'total courts');
            // Filter for municipal courts
            const municipalCourts = data.courts.filter(court => court.type === 'municipal_court');
            console.log('Filtered municipal courts:', municipalCourts.length);
            allMunicipalCourts = municipalCourts; // Store for search functionality
            
            // Create markers for municipal courts
            municipalCourtsLayer = L.layerGroup();
            const markerBounds = [];
            console.log('Created municipalCourtsLayer:', municipalCourtsLayer);
            
            municipalCourts.forEach(court => {
                if (court.point && court.point.coordinates) {
                    const [lng, lat] = court.point.coordinates;
                    
                    const marker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            html: '🏛️',
                            className: 'municipal-court-icon',
                            iconSize: [24, 24],
                            iconAnchor: [12, 24]
                        })
                    });
                    
                    // Store court reference on marker for search functionality
                    marker.court = court;
                    
                    // Create popup content
                    let popupContent = `
                        <div class="court-info">
                            <h6>Municipal Court - ${court.municipality}</h6>
                            <p><strong>Type:</strong> Municipal Court</p>
                            <p><strong>Municipality:</strong> ${court.municipality}</p>
                            <p><strong>Population:</strong> ${court.population_2022 ? court.population_2022.toLocaleString() : 'N/A'}</p>
                            <p><strong>County Seat:</strong> ${court.county_seat_flag === 'Y' ? 'Yes' : 'No'}</p>
                    `;
                    
                    // Add judge information
                    const judges = municipalJudgesData[court.court_id];
                    if (judges && judges.length > 0) {
                        popupContent += `<p><strong>Judges (${judges.length}):</strong></p>`;
                        popupContent += '<div style="max-height: 200px; overflow-y: auto;"><table class="table table-sm table-borderless small mb-0"><tbody>';
                        judges.forEach(judge => {
                            popupContent += `<tr><td><strong>${judge.name}</strong></td><td>Municipal Judge</td></tr>`;
                            if (judge.phone) {
                                popupContent += `<tr><td colspan="2"><small>Phone: ${judge.phone}</small></td></tr>`;
                            }
                        });
                        popupContent += '</tbody></table></div>';
                    } else {
                        popupContent += `<p><em>Judge information not available</em></p>`;
                    }
                    
                    popupContent += '</div>';
                    marker.bindPopup(popupContent);
                    
                    // Add hover effects
                    marker.on('mouseover', function() {
                        marker.setIcon(L.divIcon({
                            html: '🏛️',
                            className: 'municipal-court-icon municipal-court-icon-hover',
                            iconSize: [28, 28],
                            iconAnchor: [14, 28]
                        }));
                    });
                    marker.on('mouseout', function() {
                        marker.setIcon(L.divIcon({
                            html: '🏛️',
                            className: 'municipal-court-icon',
                            iconSize: [24, 24],
                            iconAnchor: [12, 24]
                        }));
                    });
                    
                    municipalCourtsLayer.addLayer(marker);
                    markerBounds.push([lat, lng]);
                }
            });
            
            // Add to map if this is the active court type
            if (activeCourtType === 'municipal') {
                municipalCourtsLayer.addTo(courtMap);
            }
            console.log('Created municipalCourtsLayer with', municipalCourtsLayer.getLayers().length, 'markers');
            
            municipalCourtCount = municipalCourts.length;
            document.getElementById('municipalCourtCount').textContent = municipalCourtCount;
            
            console.log('Loaded municipal courts:', municipalCourts.length);
        })
        .catch(error => {
            console.error('Error loading municipal courts:', error);
        });
}

// Load statewide boundaries (15th COA district) for CCA/SCOTX
