const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./public/cache-data.json', 'utf8'));
const locs = data.locations || [];
const coords = locs.filter(l => l.latitude !== 0 && l.longitude !== 0);

console.log('📊 Cache Statistics:');
console.log('Total Locations:', locs.length);
console.log('With Coordinates:', coords.length, `(${Math.round(coords.length/locs.length*100)}%)`);

const types = {};
locs.forEach(l => types[l.type] = (types[l.type] || 0) + 1);
console.log('By Type:', types);

console.log('\nSample locations with coords:');
coords.slice(0, 3).forEach(l => {
  console.log(`- ${l.name}`);
  console.log(`  ${l.address}`);
  console.log(`  (${l.latitude}, ${l.longitude})\n`);
});
