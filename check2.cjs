const fs = require('fs');
const content = fs.readFileSync('constants.tsx', 'utf8');

const match = content.match(/export const SNPMB_PROGRAMS.*?=\s*(\[[\s\S]*?\]);/);
if (match) {
  const arrStr = match[1];
  const nameRegex = /name:\s*['\"](.*?)['\"]/g;
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
  for (const [key, data] of Object.entries(counts)) {
    if (data.count > 1) {
      console.log(data.original + ' (' + data.count + ' PTN)');
      duplicateCount++;
    }
  }
}
