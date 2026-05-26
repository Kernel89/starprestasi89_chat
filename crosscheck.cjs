const fs = require('fs');

// 1. Dapatkan daftar 159 prodi duplikat
const content = fs.readFileSync('constants.tsx', 'utf8');
const match = content.match(/export const SNPMB_PROGRAMS.*?=\s*(\[[\s\S]*?\]);/);
let duplicateNames = new Set();

if (match) {
  const arrStr = match[1];
  const nameRegex = /nama_prodi:\s*['\"](.*?)['\"]/g;
  let names = [];
  let nameMatch;
  while ((nameMatch = nameRegex.exec(arrStr)) !== null) {
    names.push(nameMatch[1].trim());
  }
  
  const counts = {};
  names.forEach(n => {
    const key = n.toLowerCase();
    counts[key] = counts[key] || { count: 0, original: n };
    counts[key].count++;
  });
  
  for (const [key, data] of Object.entries(counts)) {
    if (data.count > 1) {
      duplicateNames.add(key);
    }
  }
}

// 2. Baca Mengenal Prodi dari file json
let mengenalProdiData = [];
try {
  mengenalProdiData = JSON.parse(fs.readFileSync('mengenal_prodi_data.json', 'utf8'));
} catch(e) {
  console.log("Gagal membaca mengenal_prodi_data.json");
}

let mengenalProdiNames = new Set();
mengenalProdiData.forEach(item => {
  if (item.programName) {
    mengenalProdiNames.add(item.programName.toLowerCase().trim());
  }
});

// 3. Bandingkan
let missing = [];
duplicateNames.forEach(dupKey => {
  if (!mengenalProdiNames.has(dupKey)) {
    // cari original name
    missing.push(dupKey.toUpperCase());
  }
});

console.log('Total prodi kembar:', duplicateNames.size);
console.log('Total prodi di Mengenal Prodi:', mengenalProdiNames.size);
console.log('Jumlah prodi kembar yang BELUM ada di Mengenal Prodi:', missing.length);
if (missing.length > 0) {
    console.log('\nDaftar:');
    missing.sort().forEach(m => console.log('- ' + m));
}
