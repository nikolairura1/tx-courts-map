# Texas State Courts Map

An interactive web map displaying Texas state court jurisdictions, similar to federal courts maps.

## Features

- Interactive map showing Texas state court boundaries
- **Tabbed interface** for separate views of each court type
- **Separate statewide tab** for the 15th Court of Appeals (Business Court)
- **Distinct colors for each jurisdiction** to avoid visual confusion
- Hover effects and popups with court information
- Search functionality by county or court name (tab-aware)
- Court statistics sidebar that updates per tab
- Responsive design with Bootstrap styling
- Built with Leaflet.js mapping library

## Court Types Displayed

### Constitutional County Courts
- County-wide jurisdiction courts
- Handle civil and criminal matters under $20,000
- One court per county
- **Includes judge names and contact information**

### District Courts
- Handle felony criminal cases and civil cases over $20,000
- Multi-county jurisdictions (data not yet available)
- Judge information not available in current dataset

### Courts of Appeals
- Intermediate appellate courts that review trial court decisions
- **Geographic Districts**: 14 regional districts (1-14) with county-based jurisdictions
- Includes complete judge information with names and roles

### 15th Court of Appeals (Business Court)
- **Statewide jurisdiction** for business and commercial cases
- Specializes in complex business litigation
- Includes complete judge information with names and roles

## Visual Styling System

### Color Assignment
- **County Courts**: Each of the 254 counties has a unique color based on FIPS code
- **District Courts**: Colors assigned based on court number for visual distinction
- **Courts of Appeals**: Pre-assigned distinct colors for each of the 14 geographic districts
- **15th Court of Appeals**: Distinct red-orange color for statewide jurisdiction
- **Algorithm**: HSL color space with golden angle distribution for optimal color separation

### Interactive Features
- **Hover effects**: Increased opacity and border width on mouseover
- **Color consistency**: Same color maintained across normal/hover states
- **Smooth transitions**: CSS transitions for visual feedback

## Data Sources

- Court jurisdiction boundaries from GeoJSON files
- County polygons for geographic representation
- Court metadata including names, types, and FIPS codes
- Courts of Appeals judge information from official directories
- County-to-district mappings for appellate jurisdictions

## Technical Details

- **Frontend**: HTML, CSS, JavaScript with Bootstrap 5 tabs
- **Mapping**: Separate Leaflet.js maps for each court type tab
- **Color System**: HSL-based palette generation with 300+ distinct colors
- **Styling**: Bootstrap 5 with custom CSS and dynamic color assignment
- **Data Format**: GeoJSON for boundaries, JSON for metadata
- **Architecture**: Tab-based navigation with independent map instances

## File Structure

```
tx-judges-map/
├── index.html                              # Main HTML page
├── app.js                                 # JavaScript application logic
├── package.json                           # Project configuration
├── README.md                              # This file
├── constitutional_county_courts.geojson   # County court boundaries
├── constitutional_county_courts.json      # County court metadata
├── county_judges_updated.json             # County judge information
├── county_judges_updated.csv              # County judge data (CSV format)
├── district_courts_oct2025.geojson        # District court boundaries (empty)
├── district_courts_oct2025.json           # District court metadata (empty)
├── courts_of_appeals_districts.geojson    # Courts of Appeals boundaries
├── courts_of_appeals_districts.json       # Courts of Appeals district data
├── courts_of_appeals_2025.json            # Courts of Appeals judge information
├── county_to_coa_districts.json           # County-to-COA district mappings
├── tx_build_report.json                   # Build statistics for county courts
└── coa_build_report.json                  # Build statistics for COA districts
```

## Running the Application

1. Ensure you have the GeoJSON data files in the same directory
2. Open `index.html` in a web browser, or
3. Start a local HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
4. Navigate to `http://localhost:8000`

## Data Notes

- Currently displays 254 constitutional county courts **with judge names and addresses**
- District court data is not yet populated (judge data not available)
- **14 geographic Courts of Appeals districts** with complete judge information (names and roles)
- **1 statewide 15th Court of Appeals (Business Court)** with complete judge information
- All court boundaries are county-based polygons

## Future Enhancements

- Add district court jurisdiction data
- Add court case statistics and trends
- Include additional court metadata
- Add filtering and advanced search options