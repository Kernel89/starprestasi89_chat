const fs = require('fs');
const path = 'd:/star prestasi/Evaluasi Stars Prestasi/stars-prestasi-k8.95-7 Backup data7 11 (28) ok/project/pages/GradeManagement.tsx';

let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "id: ${student.id}_,",
  "id: `${student.id}_${importSemester}`,"
);

fs.writeFileSync(path, content, 'utf8');
console.log("FINAL_FIX_APPLIED");
