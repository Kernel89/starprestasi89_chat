import fs from 'fs';

const testData = [
  { id: '1', pt_name: 'UIN SALATIGA', nama_prodi: 'SAINS DATA', quota: 10 },
  { id: '2', pt_name: 'UIN SALATIGA', nama_prodi: 'SAINS DATA', quota: 30 }, // duplicate, newer
  { id: '3', pt_name: 'UIN SALATIGA', nama_prodi: 'INFORMATIKA', quota: 40 }, // different prodi
  { id: '4', pt_name: 'ITB', nama_prodi: 'SAINS DATA', quota: 50 }, // different PT
  { id: '5', name: 'Kampus A', type: 'Negeri' },
  { id: '6', name: 'Kampus A', type: 'Swasta' }, // duplicate Kampus A
  { id: '7', name: 'Kampus B', type: 'Negeri' }
];

console.log("=== ORIGINAL DATA ===");
console.log(testData.map(d => JSON.stringify(d)).join('\n'));

// Simulate Deduplication
const prodis = testData.filter(d => d.pt_name);
const seenProdi = new Map();
for (const item of prodis) {
  const ptName = (item.pt_name || '').trim().toLowerCase();
  const prodiName = (item.nama_prodi || '').trim().toLowerCase();
  const key = `${ptName}-${prodiName}`;
  seenProdi.set(key, item);
}
const cleanedProdi = Array.from(seenProdi.values());

const unis = testData.filter(d => d.name);
const seenUni = new Map();
for (const item of unis) {
  const key = (item.name || '').trim().toLowerCase();
  seenUni.set(key, item);
}
const cleanedUni = Array.from(seenUni.values());

console.log("\n=== CLEANED PRODI ===");
console.log(cleanedProdi.map(d => JSON.stringify(d)).join('\n'));

console.log("\n=== CLEANED KAMPUS ===");
console.log(cleanedUni.map(d => JSON.stringify(d)).join('\n'));
