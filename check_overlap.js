const fs = require('fs');
const turf = require('@turf/turf');

const data = JSON.parse(fs.readFileSync('courts_of_appeals_districts.geojson', 'utf8'));

const district1 = data.features.find(f => f.properties.district_number === 1);
const district14 = data.features.find(f => f.properties.district_number === 14);

if (!district1 || !district14) {
  console.log('Districts not found');
  process.exit(1);
}

const area1 = turf.area(district1);
const area14 = turf.area(district14);

console.log('Area of District 1:', area1);
console.log('Area of District 14:', area14);
console.log('Areas equal:', Math.abs(area1 - area14) < 1); // small tolerance

const overlaps = turf.booleanIntersects(district1, district14);
console.log('District 14 overlaps with District 1:', overlaps);