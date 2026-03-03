// Global variables
let courtMap;
let countyCourtsLayer, countyCourtsAtLawLayer, districtCourtsLayer, coaCourtsLayer, coa15CourtsLayer, ccaCourtsLayer, scotxCourtsLayer, municipalCourtsLayer;
let allCountyCourts = [];
let allCountyCourtsAtLaw = [];
let allDistrictCourts = [];
let allCoaCourts = [];
let allCoa15Courts = [];
let allCcaCourts = [];
let allScotxCourts = [];
let allMunicipalCourts = [];
let statewideBoundaries = null; // Shared boundary data for all statewide courts
let countyBoundaries = null; // County boundaries for municipal court lookup
let countyCourtCount = 0;
let countyCourtsAtLawCount = 0;
let districtCourtCount = 0;
let coaCourtCount = 0;
let coa15CourtCount = 0;
let ccaCourtCount = 0;
let scotxCourtCount = 0;
let municipalCourtCount = 0;
let coaJudgesData = {};
let countyJudgesData = {};
let municipalJudgesData = {};
let districtJudgesData = {};
let countyToCoaMapping = {};
let activeCourtType = 'coa';
let originalStatewideBoundaries = null;

// Function to update the right sidebar with court information
function updateCourtInfoSidebar(content) {
    const sidebar = document.getElementById('courtInfoContent');
    if (sidebar) {
        sidebar.innerHTML = content;
    }
}

// Color generation and assignment
const colorPalette = generateColorPalette(300); // Generate 300 distinct colors
let countyColorMap = {};
let coaColorMap = {
    1: '#FF6B35',   // First Court - Orange
    2: '#F7931E',   // Second Court - Dark Orange
    3: '#FFD23F',   // Third Court - Yellow
    4: '#06FFA5',   // Fourth Court - Mint
    5: '#4ECDC4',   // Fifth Court - Teal
    6: '#45B7D1',   // Sixth Court - Sky Blue
    7: '#96CEB4',   // Seventh Court - Sage
    8: '#FFEAA7',   // Eighth Court - Cream
    9: '#DDA0DD',   // Ninth Court - Plum
    10: '#98D8C8',  // Tenth Court - Seafoam
    11: '#F7DC6F',  // Eleventh Court - Pale Yellow
    12: '#BB8FCE',  // Twelfth Court - Lavender
    13: '#85C1E9',  // Thirteenth Court - Light Blue
    14: '#F8C471',  // Fourteenth Court - Sand
    15: '#FF4500'   // Fifteenth Court - Red Orange (Business Court)
};
let districtColorMap = {};

// Generate a diverse color palette
function generateColorPalette(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        // Use golden angle approximation for good color distribution
        const hue = (i * 137.508) % 360; // Golden angle
        const saturation = 65 + (i % 3) * 15; // Vary saturation
        const lightness = 45 + (i % 4) * 10; // Vary lightness
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
}

// Assign colors to counties to avoid adjacent counties having similar colors
function assignCountyColors() {
    // Simple assignment based on FIPS code for now
    // In a real implementation, you'd use geographic adjacency data
    allCountyCourts.forEach((court, index) => {
        const fips = parseInt(court.properties.fips);
        countyColorMap[court.properties.court_id] = colorPalette[fips % colorPalette.length];
    });
}

function assignDistrictColors() {
    // Assign colors based on district number for judicial districts
    allDistrictCourts.forEach((district, index) => {
        const districtNum = parseInt(district.properties.district_id) || 1;
        districtColorMap[districtNum] = colorPalette[districtNum % colorPalette.length];
    });
}

// Create striped pattern for overlapping areas
function createStripedPattern(color1, color2, width = 4) {
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = width * 2;
    const ctx = canvas.getContext('2d');

    // Create diagonal stripes
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, width * 2, width * 2);

    ctx.fillStyle = color2;
    // Diagonal stripes
    for (let i = -width * 2; i < width * 4; i += width) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + width * 2, width * 2);
        ctx.lineTo(i + width, width * 2);
        ctx.lineTo(i - width, 0);
        ctx.closePath();
        ctx.fill();
    }

    return ctx.createPattern(canvas, 'repeat');
}

// Style definitions
const courtStyle = {
    color: '#3388ff',
    weight: 2,
    opacity: 0.8,
    fillColor: '#3388ff',
    fillOpacity: 0.1
};

const highlightStyle = {
    color: '#0066cc',
    weight: 3,
    opacity: 1,
    fillColor: '#3388ff',
    fillOpacity: 0.3
};

const districtStyle = {
    color: '#ff0000',
    weight: 2,
    opacity: 0.8,
    fillColor: '#ff0000',
    fillOpacity: 0.1
};

const districtHighlightStyle = {
    color: '#cc0000',
    weight: 3,
    opacity: 1,
    fillColor: '#ff0000',
    fillOpacity: 0.3
};

// Initialize the single map
function initializeMaps() {
    console.log('Initializing map...');
    console.log('Leaflet available:', typeof L);
    console.log('Map container exists:', !!document.getElementById('court-map'));
    
    // Single Court Map
    courtMap = L.map('court-map', {maxZoom: 15}).setView([31.9686, -99.9018], 6);
    console.log('Map created:', !!courtMap);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(courtMap);
    console.log('Map tiles added');

    // Add scale control
    L.control.scale().addTo(courtMap);

    // Invalidate size
    setTimeout(() => {
        console.log('Invalidating map size');
        courtMap.invalidateSize();
    }, 500);
}

// Add legends for each map type
function addCountyLegend() {
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend card p-2');
        div.innerHTML = `
            <h6 class="mb-2">County Courts</h6>
            <div class="d-flex align-items-center">
                <div style="background: #3388ff; width: 20px; height: 20px; display: inline-block; margin-right: 5px; border: 1px solid #ccc;"></div>
                Constitutional County Courts
            </div>
        `;
        return div;
    };
    legend.addTo(courtMap);
}

function addCountyAtLawLegend() {
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend card p-2');
        div.innerHTML = `
            <h6 class="mb-2">County Courts at Law</h6>
            <div class="d-flex align-items-center">
                <div style="background: #ff6600; width: 20px; height: 20px; display: inline-block; margin-right: 5px; border: 1px solid #ccc;"></div>
                Counties with County Courts at Law
            </div>
        `;
        return div;
    };
    legend.addTo(courtMap);
}

function addDistrictLegend() {
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend card p-2');
        div.innerHTML = `
            <h6 class="mb-2">District Courts</h6>
            <div class="d-flex align-items-center">
                <div style="background: #ff0000; width: 20px; height: 20px; display: inline-block; margin-right: 5px; border: 1px solid #ccc;"></div>
                District Courts
            </div>
        `;
        return div;
    };
    legend.addTo(courtMap);
}

function addCoaLegend() {
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend card p-2');
        div.innerHTML = `
            <h6 class="mb-2">Courts of Appeals</h6>
            <div class="d-flex align-items-center">
                <div style="background: #ff6b35; width: 20px; height: 20px; display: inline-block; margin-right: 5px; border: 1px solid #ccc;"></div>
                Geographic Districts (1-14)
            </div>
        `;
        return div;
    };
    legend.addTo(courtMap);
}

function addCoa15Legend() {
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend card p-2');
        div.innerHTML = `
            <h6 class="mb-2">15th Court of Appeals</h6>
            <div class="d-flex align-items-center">
                <div style="background: #ff4500; width: 20px; height: 20px; display: inline-block; margin-right: 5px; border: 1px solid #ccc;"></div>
                Statewide Business Court
            </div>
        `;
        return div;
    };
    legend.addTo(courtMap);
}

function addCcaLegend() {
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend card p-2');
        div.innerHTML = `
            <h6 class="mb-2">Court of Criminal Appeals</h6>
            <div class="d-flex align-items-center">
                <div style="background: #8b0000; width: 20px; height: 20px; display: inline-block; margin-right: 5px; border: 1px solid #ccc;"></div>
                Statewide Criminal Appeals
            </div>
        `;
        return div;
    };
    legend.addTo(courtMap);
}

function addScotxLegend() {
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend card p-2');
        div.innerHTML = `
            <h6 class="mb-2">Supreme Court of Texas</h6>
            <div class="d-flex align-items-center">
                <div style="background: #000080; width: 20px; height: 20px; display: inline-block; margin-right: 5px; border: 1px solid #ccc;"></div>
                Statewide Civil Appeals
            </div>
        `;
        return div;
    };
    legend.addTo(courtMap);
}

function addMunicipalLegend() {
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend card p-2');
        div.innerHTML = `
            <h6 class="mb-2">Municipal Courts</h6>
            <div class="d-flex align-items-center">
                <span style="font-size: 16px; margin-right: 5px;">🏛️</span>
                City and Town Courts
            </div>
        `;
        return div;
    };
    legend.addTo(courtMap);
}


// Initialize maps when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired');
    console.log('Leaflet loaded:', typeof L);
    // Delay initialization slightly to ensure Bootstrap is ready
    setTimeout(() => {
        initializeMaps();
        loadAllData().then(() => {
            setupTabListeners();
        }).catch(error => {
            console.error('Error loading data:', error);
            // Set up listeners anyway
            setupTabListeners();
        });
    }, 100);
});

function setupTabListeners() {
    // Add event listeners for button clicks to switch court types
    document.querySelectorAll('button[id^="btn-"]').forEach(btn => {
        btn.addEventListener('click', function (event) {
            const courtType = event.target.id.replace('btn-', '');
            console.log('Button clicked:', courtType);
            
            // Hide all stats
            document.querySelectorAll('.court-stats').forEach(stat => {
                stat.style.display = 'none';
            });
            
            // Show relevant description
            switch(courtType) {
                case 'municipal':
                    document.getElementById('courtDescription').innerHTML = '<p class="mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Municipal Courts:</strong> The Texas State Legislature has established municipal courts in each incorporated city in the state. Municipal courts are lower courts that have "original and exclusive jurisdiction over violations of city ordinances and, within the city limits, have concurrent jurisdiction with justice of the peace courts over Class C misdemeanor criminal cases where the punishment upon conviction is by small fine only. When city ordinances relating to fire safety, zoning, and public health are violated, fines of up to $2,000 may be charged, when authorized by the governing body of the city. Fines of up to $4,000 may be charged for dumping of refuse. Municipal judges may issue search or arrest warrants. These courts do not have jurisdiction in most civil cases but do have limited civil jurisdiction in cases which involve owners of dangerous dogs." There were 954 municipal courts operating in Texas as of January 2025.</p>';
                    switchToCourtType('municipal');
                    break;
                case 'county':
                    document.getElementById('courtDescription').innerHTML = '<p class="mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Constitutional County Courts:</strong> Texas Constitutional County Courts are trial courts established by the state constitution with one in each county. They have original jurisdiction over Class A and Class B misdemeanors and appellate jurisdiction from justice of the peace and municipal courts.</p>';
                    switchToCourtType('county');
                    break;
                case 'county-at-law':
                    document.getElementById('courtDescription').innerHTML = '<p class="mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>County Courts at Law:</strong> County Courts at Law are additional courts created by statute in some counties to help handle caseload. They have concurrent jurisdiction with constitutional county courts and district courts in their respective counties.</p>';
                    switchToCourtType('county-at-law');
                    break;
                case 'district':
                    document.getElementById('courtDescription').innerHTML = '<p class="mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>District Courts:</strong> Texas District Courts are the state trial courts of general jurisdiction in Texas. "District courts have original jurisdiction in felony criminal cases, divorce cases, cases involving title to land, election contest cases, civil matters in which the amount of money or damages involved is $200 or more, and any matters in which jurisdiction is not placed in another trial court. While most district courts try both criminal and civil cases, in the more densely populated counties the courts may specialize in civil, criminal, juvenile, or family law matters." The district courts often have concurrent jurisdiction with the Texas county courts.</p>';
                    switchToCourtType('district');
                    break;
                case 'coa':
                    document.getElementById('courtDescription').innerHTML = '<p class="mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Courts of Appeals:</strong> The Texas Courts of Appeals are a set of 15 appellate courts in the Texas judicial system with intermediate jurisdiction in civil and criminal cases that are appealed from the lower district or county courts. "The first intermediate appellate court in Texas was created by the Constitution of 1876, which created a Court of Appeals with appellate jurisdiction in all criminal cases and in all civil cases originating in the county courts. In 1891, an amendment was added to the Constitution authorizing the Legislature to establish intermediate courts of civil appeals located at various places throughout the State. The purpose of this amendment was to preclude the large quantity of civil litigation from further congesting the docket of the Supreme Court while providing for a more convenient and less expensive system of intermediate appellate courts for civil cases. In 1980, a constitutional amendment extended the appellate jurisdiction of the courts of civil appeals to include criminal cases and changed the name of the courts to the courts of appeals."</p>';
                    switchToCourtType('coa');
                    break;
                case 'coa15':
                    document.getElementById('courtDescription').innerHTML = '<p class="mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>15th Court of Appeals:</strong>The Texas Fifteenth District Court of Appeals has statewide jurisdiction over civil matters brought against the state. The court also has jurisdiction over appeals brought by Texas business courts over more than $10 million.</p>';
                    switchToCourtType('coa15');
                    break;
                case 'cca':
                    document.getElementById('courtDescription').innerHTML = '<p class="mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Court of Criminal Appeals:</strong>Founded in 1876, the Texas Court of Criminal Appeals is the states court of last resort for criminal matters and has nine judgeships. The Texas Supreme Court has jurisdiction over all civil cases, while the Court of Criminal Appeals exercises discretionary review over criminal cases. This means the court may choose whether or not to review a case. The only cases that the court must hear are those that involve sentencing decisions in capital punishment cases and other cases involving liberty issues, such capital punishment cases, cases where bail has been denied and habeas cases where a prisoner or person being detained attempts to prove some constitutional right has been violated as a result of their detention. The court is based in the state capital, Austin, and includes nine judges. Article V of the Texas Constitution vests the judicial power of the state in the court, describes the courts jurisdiction. It also details the rules for judicial eligibility, elections and filling vacancies on the court between elections.</p>';
                    switchToCourtType('cca');
                    break;
                case 'scotx':
                    document.getElementById('courtDescription').innerHTML = '<p class="mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Supreme Court of Texas:</strong> Founded in 1836, the Texas Supreme Court is the states court of last resort for civil matters and has nine judgeships. The caseload of the Texas Supreme Court is determined by whether the court decides to grant a review of a judgment. The court has mandatory jurisdiction over writs of mandamus and habeas corpus. The Supreme Court also has jurisdiction to answer questions of state law certified from a federal appellate court; has original jurisdiction to issue writs and to conduct proceedings for the involuntary retirement or removal of judges; and reviews cases involving attorney discipline upon appeal from the Board of Disciplinary Appeals of the State Bar of Texas."</p>';
                    switchToCourtType('scotx');
                    break;
            }
        });
    });
}

function switchToCourtType(courtType) {
    // Reset the court info sidebar to default message
    updateCourtInfoSidebar('<p class="mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;">Click on a jurisdiction to learn more about that court.</p>');
    
    activeCourtType = courtType;
    
    // Clear existing layers
    if (municipalCourtsLayer) courtMap.removeLayer(municipalCourtsLayer);
    if (countyCourtsLayer) courtMap.removeLayer(countyCourtsLayer);
    if (countyCourtsAtLawLayer) courtMap.removeLayer(countyCourtsAtLawLayer);
    if (districtCourtsLayer) courtMap.removeLayer(districtCourtsLayer);
    if (coaCourtsLayer) courtMap.removeLayer(coaCourtsLayer);
    if (coa15CourtsLayer) courtMap.removeLayer(coa15CourtsLayer);
    if (ccaCourtsLayer) courtMap.removeLayer(ccaCourtsLayer);
    if (scotxCourtsLayer) courtMap.removeLayer(scotxCourtsLayer);
    

    // Add new layer and legend
    switch(courtType) {
        case 'municipal':
            if (municipalCourtsLayer) {
                courtMap.addLayer(municipalCourtsLayer);
            } else {
                loadMunicipalCourts();
            }
            break;
        case 'county':
            if (countyCourtsLayer) {
                courtMap.addLayer(countyCourtsLayer);
            }
            break;
        case 'county-at-law':
            if (countyCourtsAtLawLayer) {
                courtMap.addLayer(countyCourtsAtLawLayer);
            }
            break;
        case 'district':
            if (districtCourtsLayer) {
                courtMap.addLayer(districtCourtsLayer);
            }
            break;
        case 'coa':
            if (coaCourtsLayer) {
                courtMap.addLayer(coaCourtsLayer);
            }
            break;
        case 'coa15':
            if (coa15CourtsLayer) {
                courtMap.addLayer(coa15CourtsLayer);
            } else {
                loadCoaData();
            }
            break;
        case 'cca':
            if (ccaCourtsLayer) {
                courtMap.addLayer(ccaCourtsLayer);
            } else {
                loadCcaData();
            }
            break;
        case 'scotx':
            if (scotxCourtsLayer) {
                courtMap.addLayer(scotxCourtsLayer);
            } else {
                loadScotxData();
            }
            break;
    }
}

function loadAllData() {
    // Load statewide boundaries first for fast CCA/SCOTX loading
    const promises = [
        loadCountyJudges(),
        loadDistrictJudges(),
        // Load COA judges data for popups
        loadCoaJudges(),
        // Load COA mapping data for popups
        loadCoaMapping(),
        // Load COA districts for instant loading
        loadCoaData(),
        // Load county courts for instant loading
        loadCountyCourts(),
        // Load county courts at law for instant loading
        loadCountyCourtsAtLaw(),
        // Load district courts for instant loading
        loadDistrictCourts()
    ];

    // Load municipal data (judges first, then courts)
    promises.push(
        loadMunicipalJudges().then(() => {
            return loadMunicipalCourts();
        })
    );

    return Promise.all(promises).then(() => {
        console.log('All initial data loaded successfully');
        // CCA and SCOTX are loaded on demand when tabs are clicked
    });
}

// Load County Judges data
function loadCountyJudges() {
    // Load constitutional county court judges
    const constitutionalPromise = fetch('county_judges_updated.json')
        .then(response => response.json())
        .then(data => {
            // Store judge data by court_id
            data.records.forEach(record => {
                countyJudgesData[record.court_id] = record;
            });
            console.log('Loaded constitutional county judge data for', data.records.length, 'courts');
        });

    // Load county courts at law judges from unified data
    const countyAtLawPromise = fetch('judges_unified_2025.json')
        .then(response => response.json())
        .then(data => {
            // Filter for county courts at law and store by court_id
            const countyAtLawJudges = data.judges.filter(judge => judge.court_type === 'county_court_at_law');
            countyAtLawJudges.forEach(judge => {
                if (!countyJudgesData[judge.court_id]) {
                    countyJudgesData[judge.court_id] = {
                        court_id: judge.court_id,
                        court_type: 'county_court_at_law',
                        court_label: judge.court_label,
                        county: judge.county,
                        fips: judge.fips,
                        judges: []
                    };
                }
                // Add this judge to the court's judges array
                countyJudgesData[judge.court_id].judges.push({
                    judge_name: judge.name,
                    phone: judge.phone
                });
            });
            console.log('Loaded county courts at law judge data for', countyAtLawJudges.length, 'judges');
        });

    return Promise.all([constitutionalPromise, countyAtLawPromise])
        .catch(error => {
            console.error('Error loading county judge data:', error);
        });
}

// Load Municipal Judges data
function loadMunicipalJudges() {
    return fetch('judges_unified_2025.json')
        .then(response => response.json())
        .then(data => {
            // Store judge data by court_id
            data.judges.forEach(judge => {
                if (judge.court_type === 'municipal_court') {
                    if (!municipalJudgesData[judge.court_id]) {
                        municipalJudgesData[judge.court_id] = [];
                    }
                    municipalJudgesData[judge.court_id].push(judge);
                }
            });
            console.log('Loaded municipal judge data for', Object.keys(municipalJudgesData).length, 'courts');
        })
        .catch(error => {
            console.error('Error loading municipal judge data:', error);
        });
}

// Load District Judges data
// Load District Judges data
function loadDistrictJudges() {
    return fetch('judges_unified_2025.json')
        .then(response => response.json())
        .then(data => {
            // Store judge data by district_id
            data.judges.forEach(judge => {
                if (judge.court_type === 'district_court') {
                    // Extract district number from court_id (e.g., 'tx_dc_045' -> 45)
                    const districtMatch = judge.court_id.match(/tx_dc_(\d+)/);
                    if (districtMatch) {
                        const districtId = parseInt(districtMatch[1]);
                        if (!districtJudgesData[districtId]) {
                            districtJudgesData[districtId] = [];
                        }
                        districtJudgesData[districtId].push(judge);
                    }
                }
            });
            console.log('Loaded district judge data for', Object.keys(districtJudgesData).length, 'districts');
        })
        .catch(error => {
            console.error('Error loading district judge data:', error);
        });
}

// Load Constitutional County Courts data
function loadCountyCourts() {
    return fetch('constitutional_county_courts.geojson')
        .then(response => response.json())
        .then(data => {
            allCountyCourts = data.features;
            assignCountyColors(); // Assign colors after loading data

            countyCourtsLayer = L.geoJSON(data, {
                style: function(feature) {
                    return {
                        color: countyColorMap[feature.properties.court_id] || '#3388ff',
                        weight: 1,
                        opacity: 0.8,
                        fillColor: countyColorMap[feature.properties.court_id] || '#3388ff',
                        fillOpacity: 0.7
                    };
                },
                onEachFeature: function (feature, layer) {
                    const courtId = feature.properties.court_id;
                    const judgeData = countyJudgesData[courtId];

                    // Add popup with court information
                    let popupContent = `
                        <div class="court-info">
                            <h6 style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black; display: inline-block;">${feature.properties.name}</h6>
                            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>County:</strong> ${feature.properties.county}</p>
                    `;

                    if (judgeData && judgeData.judge_name) {
                        popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>County Judge:</strong> ${judgeData.judge_name}</p>`;
                        if (judgeData.address) {
                            popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Address:</strong> ${judgeData.address}</p>`;
                        }
                    } else {
                        popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><em>Judge information not available</em></p>`;
                    }

                    popupContent += `</div>`;
                    
                    // Replace popup with sidebar click handler
                    layer.on('click', function() {
                        updateCourtInfoSidebar(popupContent);
                    });

                    // Add hover effects
                    layer.on('mouseover', function() {
                        layer.setStyle({
                            color: countyColorMap[feature.properties.court_id] || '#3388ff',
                            weight: 3,
                            opacity: 1,
                            fillColor: countyColorMap[feature.properties.court_id] || '#3388ff',
                            fillOpacity: 0.9
                        });
                    });
                    layer.on('mouseout', function() {
                        layer.setStyle({
                            color: countyColorMap[feature.properties.court_id] || '#3388ff',
                            weight: 1,
                            opacity: 0.8,
                            fillColor: countyColorMap[feature.properties.court_id] || '#3388ff',
                            fillOpacity: 0.7
                        });
                    });
                }
            });

            // Add to map and legend if this is the active court type
            if (activeCourtType === 'county') {
                countyCourtsLayer.addTo(courtMap);
            }

            countyCourtCount = data.features.length;
            const countyCountElement = document.getElementById('countyCourtCount');
            if (countyCountElement) countyCountElement.textContent = countyCourtCount;

            console.log('Loaded constitutional county courts:', data.features.length);
        })
        .catch(error => {
            console.error('Error loading constitutional county courts:', error);
        });
}

// Load County Courts at Law data
function loadCountyCourtsAtLaw() {
    return fetch('constitutional_county_courts.geojson')
        .then(response => response.json())
        .then(data => {
            // Get list of counties that have county courts at law
            const countiesWithAtLaw = new Set();
            Object.values(countyJudgesData).forEach(judge => {
                if (judge.court_type === 'county_court_at_law') {
                    countiesWithAtLaw.add(judge.county);
                }
            });

            // Filter county features to only those with county courts at law
            // Handle county name mismatch (judges have "El Paso", geojson has "El Paso County")
            const filteredFeatures = data.features.filter(feature => {
                const geoCountyName = feature.properties.county;
                // Check if any judge county name is contained in the geo county name
                return Array.from(countiesWithAtLaw).some(judgeCounty => 
                    geoCountyName.includes(judgeCounty)
                );
            });

            countyCourtsAtLawLayer = L.geoJSON({type: 'FeatureCollection', features: filteredFeatures}, {
                style: function(feature) {
                    return {
                        color: '#ff6600', // Orange color for county courts at law
                        weight: 2,
                        opacity: 0.8,
                        fillColor: '#ff6600',
                        fillOpacity: 0.6
                    };
                },
                onEachFeature: function (feature, layer) {
                    const countyName = feature.properties.county;
                    
                    // Find all county courts at law for this county
                    const countyAtLawCourts = Object.values(countyJudgesData).filter(court => 
                        court.court_type === 'county_court_at_law' && countyName.includes(court.county)
                    );

                    // Count total judges across all courts
                    const totalJudges = countyAtLawCourts.reduce((sum, court) => sum + court.judges.length, 0);

                    // Add popup with court information
                    let popupContent = `
                        <div class="court-info">
                            <h6 style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black; display: inline-block;">County Courts at Law</h6>
                            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>County:</strong> ${countyName}</p>
                            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Judges:</strong> ${totalJudges}</p>
                    `;

                    if (countyAtLawCourts.length > 0) {
                        popupContent += '<div style="max-height: 600px; overflow-y: auto;"><table class="table table-sm table-borderless small mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><tbody>';
                        countyAtLawCourts.forEach(court => {
                            court.judges.forEach(judge => {
                                popupContent += `<tr><td><strong>${judge.judge_name}</strong></td><td>${court.court_label || 'County Court at Law'}</td></tr>`;
                                if (judge.phone) {
                                    popupContent += `<tr><td colspan="2"><small>Phone: ${judge.phone}</small></td></tr>`;
                                }
                            });
                        });
                        popupContent += '</tbody></table></div>';
                    }

                    popupContent += `</div>`;
                    
                    // Replace popup with sidebar click handler
                    layer.on('click', function() {
                        updateCourtInfoSidebar(popupContent);
                    });

                    // Add hover effects
                    layer.on('mouseover', function() {
                        layer.setStyle({
                            color: '#ff6600',
                            weight: 4,
                            opacity: 1,
                            fillColor: '#ff6600',
                            fillOpacity: 0.8
                        });
                    });
                    layer.on('mouseout', function() {
                        layer.setStyle({
                            color: '#ff6600',
                            weight: 2,
                            opacity: 0.8,
                            fillColor: '#ff6600',
                            fillOpacity: 0.6
                        });
                    });
                }
            });

            // Add to map and legend if this is the active court type
            if (activeCourtType === 'county-at-law') {
                countyCourtsAtLawLayer.addTo(courtMap);
            }

            allCountyCourtsAtLaw = filteredFeatures;
            countyCourtsAtLawCount = filteredFeatures.length;
            // document.getElementById('countyCourtsAtLawCount').textContent = countyCourtsAtLawCount;

            console.log('Loaded county courts at law:', filteredFeatures.length, 'counties');
        })
        .catch(error => {
            console.error('Error loading county courts at law:', error);
        });
}

// Load District Courts data
function loadDistrictCourts() {
    return fetch('district_courts_sept2018.geojson')
        .then(response => response.json())
        .then(data => {
            // Filter out invalid districts (those with '-' in district_id)
            data.features = data.features.filter(feature => !feature.properties.district_id.includes('-'));

            // Compute county to districts map for overlaps
            let countyToDistricts = {};
            data.features.forEach(feature => {
                const counties = feature.properties.counties || [];
                const districtNum = feature.properties.district_id;
                counties.forEach(county => {
                    if (!countyToDistricts[county]) countyToDistricts[county] = [];
                    countyToDistricts[county].push(districtNum);
                });
            });

            districtCourtsLayer = L.geoJSON(data, {
                style: function(feature) {
                    const districtNum = parseInt(feature.properties.district_id) || 1;
                    const districtColor = colorPalette[districtNum % colorPalette.length];
                    return {
                        color: districtColor,
                        weight: 2,
                        opacity: 0.8,
                        fillColor: districtColor,
                        fillOpacity: 0.6
                    };
                },
                onEachFeature: function (feature, layer) {
                    const districtId = feature.properties.district_id;
                    const counties = feature.properties.counties || [];
                    const countyCount = feature.properties.county_count || counties.length;

                    // Create popup content
                    let popupContent = `
                        <div class="court-info">
                            <h6 style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black; display: inline-block;">Judicial District ${districtId}</h6>
                            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Counties:</strong> ${countyCount}</p>
                    `;

                    // Add county list if not too many
                    if (counties.length > 0 && counties.length <= 10) {
                        popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Serves:</strong> ${counties.join(', ')}</p>`;
                    } else if (counties.length > 10) {
                        popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Serves:</strong> ${counties.slice(0, 5).join(', ')} and ${counties.length - 5} more counties</p>`;
                    }

                    // Add judge information
                    const districtJudges = districtJudgesData[districtId] || [];

                    if (districtJudges.length > 0) {
                        popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Judges (${districtJudges.length}):</strong></p>`;
                        popupContent += '<div style="max-height: 200px; overflow-y: auto;"><table class="table table-sm table-borderless small mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><tbody>';
                        districtJudges.forEach(judge => {
                            popupContent += `<tr><td><strong>${judge.name}</strong></td><td>${judge.court_label || 'Judge'}</td></tr>`;
                        });
                        popupContent += '</tbody></table></div>';
                    } else {
                        popupContent += '<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><em>Judge information not available</em></p>';
                    }

                    // Add overlap information
                    let overlappingCounties = [];
                    counties.forEach(county => {
                        if (countyToDistricts[county] && countyToDistricts[county].length > 1) {
                            overlappingCounties.push(county);
                        }
                    });
                    if (overlappingCounties.length > 0) {
                        const overlappingDistricts = [...new Set(overlappingCounties.flatMap(county => countyToDistricts[county]).filter(d => d !== districtId))];
                        popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Overlaps:</strong> Shares jurisdiction with District${overlappingDistricts.length > 1 ? 's' : ''} ${overlappingDistricts.join(', ')} in ${overlappingCounties.join(', ')}.</p>`;
                    }

                    popupContent += '</div>';
                    
                    // Replace popup with sidebar click handler
                    layer.on('click', function() {
                        updateCourtInfoSidebar(popupContent);
                    });

                    // Add hover effects
                    layer.on('mouseover', function() {
                        const districtNum = parseInt(feature.properties.district_id) || 1;
                        const districtColor = colorPalette[districtNum % colorPalette.length];
                        layer.setStyle({
                            color: districtColor,
                            weight: 4,
                            opacity: 1,
                            fillColor: districtColor,
                            fillOpacity: 0.8
                        });
                    });
                    layer.on('mouseout', function() {
                        const districtNum = parseInt(feature.properties.district_id) || 1;
                        const districtColor = colorPalette[districtNum % colorPalette.length];
                        layer.setStyle({
                            color: districtColor,
                            weight: 2,
                            opacity: 0.8,
                            fillColor: districtColor,
                            fillOpacity: 0.6
                        });
                    });
                }
            });

            // Add to map and legend if this is the active court type
            if (activeCourtType === 'district') {
                districtCourtsLayer.addTo(courtMap);
            }

            allDistrictCourts = data.features;
            districtCourtCount = data.features.length;
            const districtCountElement = document.getElementById('districtCourtCount');
            if (districtCountElement) districtCountElement.textContent = districtCourtCount;

            console.log('Loaded judicial districts:', data.features.length);
        })
        .catch(error => {
            console.error('Error loading district courts:', error);
        });
}

// Load Courts of Appeals data
function loadCoaData() {
    // Load the districts (judges and mapping already loaded at startup)
    return fetch('courts_of_appeals_districts.geojson')
        .then(response => response.json())
        .then(data => {
            // Separate 15th Court from other COA districts
            const coaFeatures = data.features.filter(feature => feature.properties.district_number !== 15);
            const coa15Features = data.features.filter(feature => feature.properties.district_number == 15);
            
            // Store statewide boundaries for all statewide courts
            statewideBoundaries = coa15Features;

            // Load geographic COA districts (1-14)
            coaCourtsLayer = L.geoJSON(coaFeatures, {
                style: function(feature) {
                    const districtNum = feature.properties.district_number;
                    return {
                        color: coaColorMap[districtNum] || '#ff6b35',
                        weight: 2,
                        opacity: 0.8,
                        fillColor: coaColorMap[districtNum] || '#ff6b35',
                        fillOpacity: 0.6
                    };
                },
                onEachFeature: function (feature, layer) {
                    const courtId = feature.properties.court_id;
                    const judgeData = coaJudgesData[courtId];

                    // Create popup content
                    let popupContent = `
                        <div class="court-info">
                            <h6 style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black; display: inline-block;">${feature.properties.district_name || `Court of Appeals District ${feature.properties.district_number}`}</h6>
                            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>District:</strong> ${feature.properties.district_number}</p>
                            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Counties:</strong> ${feature.properties.counties ? feature.properties.counties.join(', ') : 'N/A'}</p>
                    `;

                    if (judgeData && judgeData.judges) {
                        popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Judges (${judgeData.judges.length}):</strong></p>`;
                        popupContent += '<div style="max-height: 200px; overflow-y: auto;"><table class="table table-sm table-borderless small mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><tbody>';
                        judgeData.judges.forEach(judge => {
                            popupContent += `<tr><td><strong>${judge.name}</strong></td><td>${judge.role}</td></tr>`;
                        });
                        popupContent += '</tbody></table></div>';
                    } else {
                        popupContent += '<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><em>Judge information not available</em></p>';
                    }

                    popupContent += '</div>';
                    
                    // Replace popup with sidebar click handler
                    layer.on('click', function() {
                        updateCourtInfoSidebar(popupContent);
                    });

                    // Add hover effects
                    layer.on('mouseover', function() {
                        const districtNum = feature.properties.district_number;
                        layer.setStyle({
                            color: coaColorMap[districtNum] || '#ff6b35',
                            weight: 4,
                            opacity: 1,
                            fillColor: coaColorMap[districtNum] || '#ff6b35',
                            fillOpacity: 0.8
                        });
                    });
                    layer.on('mouseout', function() {
                        const districtNum = feature.properties.district_number;
                        layer.setStyle({
                            color: coaColorMap[districtNum] || '#ff6b35',
                            weight: 2,
                            opacity: 0.8,
                            fillColor: coaColorMap[districtNum] || '#ff6b35',
                            fillOpacity: 0.6
                        });
                    });
                }
            });

            // Add to map and legend if this is the active court type
            if (activeCourtType === 'coa') {
                coaCourtsLayer.addTo(courtMap);
            }

            allCoaCourts = coaFeatures;
            coaCourtCount = coaFeatures.length;
            const coaCountElement = document.getElementById('coaCourtCount');
            if (coaCountElement) coaCountElement.textContent = coaCourtCount;

            // Load 15th Court (Business Court) - optimized for performance
            const courtId = 'tx_coa_15'; // 15th Court of Appeals
            const judgeData = coaJudgesData[courtId];

            // Pre-generate popup content to avoid doing it in onEachFeature
            let popupContent = `
                <div class="court-info">
                    <h6 style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black; display: inline-block;">15th Court of Appeals (Business Court)</h6>
                    <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>District:</strong> 15 - Statewide</p>
                    <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Jurisdiction:</strong> Business and commercial cases statewide</p>
            `;

            if (judgeData && judgeData.judges) {
                popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Judges (${judgeData.judges.length}):</strong></p>`;
                popupContent += '<div style="max-height: 200px; overflow-y: auto;"><table class="table table-sm table-borderless small mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><tbody>';
                judgeData.judges.forEach(judge => {
                    popupContent += `<tr><td><strong>${judge.name}</strong></td><td>${judge.role}</td></tr>`;
                });
                popupContent += '</tbody></table></div>';
            } else {
                popupContent += '<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><em>Judge information not available</em></p>';
            }

            popupContent += '</div>';

            let interactivityAdded = false;
            coa15CourtsLayer = L.geoJSON(statewideBoundaries, {
                style: {
                    color: '#FF4500',
                    weight: 3,
                    opacity: 0.9,
                    fillColor: '#FF4500',
                    fillOpacity: 0.6
                },
                onEachFeature: function (feature, layer) {
                    // Only add interactivity to the first feature to avoid processing multiple polygons
                    if (interactivityAdded) return;
                    interactivityAdded = true;

                    layer.on("click", function() { updateCourtInfoSidebar(popupContent); });

                    // Add hover effects
                    layer.on('mouseover', function() {
                        layer.setStyle({
                            color: '#cc3300',
                            weight: 5,
                            opacity: 1,
                            fillColor: '#FF4500',
                            fillOpacity: 0.8
                        });
                    });
                    layer.on('mouseout', function() {
                        layer.setStyle({
                            color: '#FF4500',
                            weight: 3,
                            opacity: 0.9,
                            fillColor: '#FF4500',
                            fillOpacity: 0.6
                        });
                    });
                }
            });

            // Add to map and legend if this is the active court type
            if (activeCourtType === 'coa15') {
                coa15CourtsLayer.addTo(courtMap);
            }

            allCoa15Courts = coa15Features;
            coa15CourtCount = coa15Features.length;
            const coa15CountElement = document.getElementById('coa15CourtCount');
            if (coa15CountElement) coa15CountElement.textContent = coa15CourtCount;

            console.log('Loaded Courts of Appeals districts:', coaFeatures.length);
            console.log('Loaded 15th Court (Business):', coa15Features.length);
        })
        .catch(error => {
            console.error('Error loading Courts of Appeals data:', error);
        });
}

// Load Municipal Courts data
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
                    
                    // Store court reference on marker for search functionality
                    marker.court = court;
                    
                    // Create popup content
                    let popupContent = `
                        <div class="court-info">
                            <h6 style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black; display: inline-block;">${court.municipality || court.city || 'Municipal Court'}</h6>
                            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Type:</strong> Municipal Court</p>
                    `;
                    
                    // Add judge information if available
                    const judges = municipalJudgesData[court.court_id];
                    if (judges && judges.length > 0) {
                        popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Judges (${judges.length}):</strong></p>`;
                        popupContent += '<div style="max-height: 200px; overflow-y: auto;"><table class="table table-sm table-borderless small mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><tbody>';
                        judges.forEach(judge => {
                            popupContent += `<tr><td><strong>${judge.name}</strong></td><td>Municipal Judge</td></tr>`;
                            if (judge.phone) {
                                popupContent += `<tr><td colspan="2"><small>Phone: ${judge.phone}</small></td></tr>`;
                            }
                        });
                        popupContent += '</tbody></table></div>';
                    } else {
                        popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><em>Judge information not available</em></p>`;
                    }
                    
                    popupContent += '</div>';
                    marker.on('click', function() { updateCourtInfoSidebar(popupContent); });
                    
                    // Add hover effects
                    marker.on('mouseover', function() {
                        marker.setIcon(L.divIcon({
                            html: '🏛️',
                            className: 'municipal-court-icon',
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
            const municipalCountElement = document.getElementById('municipalCourtCount');
            if (municipalCountElement) municipalCountElement.textContent = municipalCourtCount;
            
            console.log('Loaded municipal courts:', municipalCourts.length);
        })
        .catch(error => {
            console.error('Error loading municipal courts:', error);
        });
}
// Load COA judges data
function loadCoaJudges() {
    if (Object.keys(coaJudgesData).length > 0) {
        return Promise.resolve(); // Already loaded
    }
    
    return fetch('courts_of_appeals_2025.json')
        .then(response => response.json())
        .then(data => {
            // Store judge data by court_id
            data.courts.forEach(court => {
                coaJudgesData[court.court_id] = court;
            });
            console.log('Loaded Courts of Appeals judge data for', data.courts.length, 'courts');
        });
}

// Load COA mapping data
function loadCoaMapping() {
    if (Object.keys(countyToCoaMapping).length > 0) {
        return Promise.resolve(); // Already loaded
    }
    
    return fetch('county_to_coa_districts.json')
        .then(response => response.json())
        .then(mappingData => {
            // Store mapping data by county
            mappingData.counties.forEach(county => {
                countyToCoaMapping[county.county] = county;
            });
            console.log('Loaded COA mapping data for', mappingData.counties.length, 'counties');
        });
}

// Load county boundaries for municipal court county lookup
function loadCountyBoundaries() {
    return fetch('constitutional_county_courts.geojson')
        .then(response => response.json())
        .then(data => {
            countyBoundaries = data.features;
            console.log('Loaded county boundaries for', countyBoundaries.length, 'counties');
        });
}

// Load Court of Criminal Appeals data
function loadCcaData() {
    if (!ccaCourtsLayer) {
        createCcaLayer();
    }

    // Add to map if this is the active court type
    if (activeCourtType === 'cca' && ccaCourtsLayer) {
        ccaCourtsLayer.addTo(courtMap);
    }
}

function createCcaLayer() {
    if (!statewideBoundaries) {
        console.log('Statewide boundaries not loaded yet');
        return;
    }

    // Pre-generate popup content to avoid doing it in onEachFeature
    const courtId = 'tx_cca';
    const judgeData = coaJudgesData[courtId];
    let popupContent = `
        <div class="court-info">
            <h6 style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black; display: inline-block;">Court of Criminal Appeals</h6>
            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Type:</strong> Criminal Appeals</p>
            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Jurisdiction:</strong> Statewide</p>
            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;">The Court of Criminal Appeals of Texas is the court of last resort for criminal cases in Texas.</p>
    `;

    if (judgeData && judgeData.judges) {
        popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Judges (${judgeData.judges.length}):</strong></p>`;
        popupContent += '<div style="max-height: 200px; overflow-y: auto;"><table class="table table-sm table-borderless small mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><tbody>';
        judgeData.judges.forEach(judge => {
            popupContent += `<tr><td><strong>${judge.name}</strong></td><td>${judge.role}</td></tr>`;
        });
        popupContent += '</tbody></table></div>';
    } else {
        popupContent += '<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><em>Judge information not available</em></p>';
    }

    popupContent += '</div>';

    let interactivityAdded = false;
    ccaCourtsLayer = L.geoJSON(statewideBoundaries, {
        style: {
            color: '#8b0000',
            weight: 3,
            opacity: 0.8,
            fillColor: '#8b0000',
            fillOpacity: 0.3
        },
        onEachFeature: function (feature, layer) {
            // Only add interactivity to the first feature to avoid processing multiple polygons
            if (interactivityAdded) return;
            interactivityAdded = true;

            layer.on('click', function() { updateCourtInfoSidebar(popupContent); });

            // Add hover effects
            layer.on('mouseover', function() {
                layer.setStyle({
                    color: '#660000',
                    weight: 5,
                    opacity: 1,
                    fillColor: '#8b0000',
                    fillOpacity: 0.5
                });
            });
            layer.on('mouseout', function() {
                layer.setStyle({
                    color: '#8b0000',
                    weight: 3,
                    opacity: 0.8,
                    fillColor: '#8b0000',
                    fillOpacity: 0.3
                });
            });
        }
    });

    allCcaCourts = [{
        properties: {
            name: 'Court of Criminal Appeals',
            type: 'statewide_court'
        }
    }];

    ccaCourtCount = 1;
    const ccaCountElement = document.getElementById('ccaCourtCount');
    if (ccaCountElement) ccaCountElement.textContent = ccaCourtCount;

    console.log('Loaded Court of Criminal Appeals');
}
// Load Supreme Court of Texas data
function loadScotxData() {
    if (!scotxCourtsLayer) {
        createScotxLayer();
    }

    // Add to map if this is the active court type
    if (activeCourtType === 'scotx' && scotxCourtsLayer) {
        scotxCourtsLayer.addTo(courtMap);
    }
}

function createScotxLayer() {
    const courtId = 'tx_scotx';
    const judgeData = coaJudgesData[courtId];
    let popupContent = `
        <div class="court-info">
            <h6 style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black; display: inline-block;">Supreme Court of Texas</h6>
            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Type:</strong> Civil Appeals</p>
            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Jurisdiction:</strong> Statewide</p>
            <p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;">The Supreme Court of Texas is the court of last resort for civil cases in Texas.</p>
    `;

    if (judgeData && judgeData.judges) {
        popupContent += `<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><strong>Judges (${judgeData.judges.length}):</strong></p>`;
        popupContent += '<div style="max-height: 200px; overflow-y: auto;"><table class="table table-sm table-borderless small mb-0" style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><tbody>';
        judgeData.judges.forEach(judge => {
            const portrait = judge.portrait ? `<img src="${judge.portrait}" alt="${judge.name}" style="width: 50px; height: 60px; object-fit: cover; border-radius: 3px;">` : '';
            popupContent += `<tr><td>${portrait}</td><td><strong>${judge.name}</strong></td><td>${judge.role}</td></tr>`;
        });
        popupContent += '</tbody></table></div>';
    } else {
        popupContent += '<p style="background: rgba(244,228,188,0.9); padding: 5px; border-radius: 3px; color: black;"><em>Judge information not available</em></p>';
    }

    popupContent += '</div>';

    let interactivityAdded = false;
    scotxCourtsLayer = L.geoJSON(statewideBoundaries, {
        style: {
            color: '#000080',
            weight: 3,
            opacity: 0.8,
            fillColor: '#000080',
            fillOpacity: 0.3
        },
        onEachFeature: function (feature, layer) {
            // Only add interactivity to the first feature to avoid processing multiple polygons
            if (interactivityAdded) return;
            interactivityAdded = true;

            layer.on('click', function() { updateCourtInfoSidebar(popupContent); });

            // Add hover effects
            layer.on('mouseover', function() {
                layer.setStyle({
                    color: '#000066',
                    weight: 5,
                    opacity: 1,
                    fillColor: '#000080',
                    fillOpacity: 0.5
                });
            });
            layer.on('mouseout', function() {
                layer.setStyle({
                    color: '#000080',
                    weight: 3,
                    opacity: 0.8,
                    fillColor: '#000080',
                    fillOpacity: 0.3
                });
            });
        }
    });

    allScotxCourts = [{
        properties: {
            name: 'Supreme Court of Texas',
            type: 'statewide_court'
        }
    }];

    scotxCourtCount = 1;
    const scotxCountElement = document.getElementById('scotxCourtCount');
    if (scotxCountElement) scotxCountElement.textContent = scotxCourtCount;

    console.log('Loaded Supreme Court of Texas');
}