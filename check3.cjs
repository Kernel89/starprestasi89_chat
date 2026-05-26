const fs = require('fs');
const content = fs.readFileSync('constants.tsx', 'utf8');

const match = content.match(/export const SNPMB_PROGRAMS.*?=\s*(\[[\s\S]*?\]);/);
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
  
  let duplicateCount = 0;
  let resultList = [];
  for (const [key, data] of Object.entries(counts)) {
    if (data.count > 1) {
      resultList.push(data.original + ' (ada di ' + data.count + ' Universitas)');
      duplicateCount++;
    }
  }
  console.log('Total prodi (baris data): ' + names.length);
  console.log('Ada ' + duplicateCount + ' nama prodi unik yang sama (duplikat di lebih dari 1 universitas).');
  console.log('\nDaftar Prodi yang kembar:');
  resultList.sort().forEach(r => console.log('- ' + r));
}
