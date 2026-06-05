const fs = require('fs');
const path = 'd:/star prestasi/Evaluasi Stars Prestasi/stars-prestasi-k8.95-7 Backup data7 11 (28) ok/project/pages/GradeManagement.tsx';

let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const nameWithoutGrade = fullName.replace(new RegExp(^\\\\s*, 'i'), '');",
  "const nameWithoutGrade = fullName.replace(new RegExp(`^${normalizedGrade}\\\\s*`, 'i'), '');"
);

content = content.replace(
  "let record = classSubjects.find(r => r.id === ${rombel.major}_);",
  "let record = classSubjects.find(r => r.id === `${rombel.major}_${targetSem}`);"
);

content = content.replace(
  "record = classSubjects.find(r => r.id === Umum_);",
  "record = classSubjects.find(r => r.id === `Umum_${targetSem}`);"
);

content = content.replace(
  "const legacyRecord = classSubjects.find(r => r.id === ${rombelId}_);",
  "const legacyRecord = classSubjects.find(r => r.id === `${rombelId}_${targetSem}`);"
);

content = content.replace(
  "alert(Tidak ada siswa di jurusan .);",
  "alert(`Tidak ada siswa di jurusan ${importMajor}.`);"
);

content = content.replace(
  "XLSX.utils.book_append_sheet(wb, ws, Nilai Sem  - );",
  "XLSX.utils.book_append_sheet(wb, ws, `Nilai Sem ${importSemester} - ${importMajor}`);"
);

content = content.replace(
  "XLSX.writeFile(wb, Template_Nilai_Semester__.xlsx);",
  "XLSX.writeFile(wb, `Template_Nilai_Semester_${importSemester}_${importMajor}.xlsx`);"
);

content = content.replace(
  "id: _$,",
  "id: `${student.id}_${importSemester}`,"
);

content = content.replace(
  "alert(Berhasil mengimport nilai untuk  siswa.);",
  "alert(`Berhasil mengimport nilai untuk ${newGradeRecords.length} siswa.`);"
);

fs.writeFileSync(path, content, 'utf8');
console.log("FIX_APPLIED_NODE");
