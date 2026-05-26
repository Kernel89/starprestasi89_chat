const fs = require('fs');
const content = fs.readFileSync('constants.tsx', 'utf8');

// The array looks like: export const SNPMB_PROGRAMS: StudyProgram[] = [ { id: '...', name: '...', universityId: '...' }, ... ];
const match = content.match(/export const SNPMB_PROGRAMS.*?=\s*(\[[\s\S]*?\]);/);
if (match) {
  const arrStr = match[1];
  const nameRegex = /name:\s*['\"](.*?)['\"]/g;
  let names = [];
  let nameMatch;
  while ((nameMatch = nameRegex.exec(arrStr)) !== null) {
    names.push(nameMatch[1].toLowerCase().trim());
  }
  console.log('Total baris prodi:', names.length);
  
  const counts = {};
  names.forEach(n => counts[n] = (counts[n] || 0) + 1);
  
  let duplicateCount = 0;
  for (const [name, count] of Object.entries(counts)) {
    if (count > 1) {
      duplicateCount++;
    }
  }
  
  console.log('Jumlah nama prodi unik yang muncul lebih dari 1 kali:', duplicateCount);
} else {
  console.log('SNPMB_PROGRAMS not found');
}
