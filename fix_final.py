import os

filepath = 'd:/star prestasi/Evaluasi Stars Prestasi/stars-prestasi-k8.95-7 Backup data7 11 (28) ok/project/pages/GradeManagement.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("fullName.replace(new RegExp(^\\s*, 'i'), '');", "fullName.replace(new RegExp(`^${normalizedGrade}\\\\s*`, 'i'), '');")
content = content.replace("classSubjects.find(r => r.id === ${rombel.major}_);", "classSubjects.find(r => r.id === `${rombel.major}_${targetSem}`);")
content = content.replace("classSubjects.find(r => r.id === Umum_);", "classSubjects.find(r => r.id === `Umum_${targetSem}`);")
content = content.replace("classSubjects.find(r => r.id === ${rombelId}_);", "classSubjects.find(r => r.id === `${rombelId}_${targetSem}`);")
content = content.replace("alert(Tidak ada siswa di jurusan .);", "alert(`Tidak ada siswa di jurusan ${importMajor}.`);")
content = content.replace("XLSX.utils.book_append_sheet(wb, ws, Nilai Sem  - );", "XLSX.utils.book_append_sheet(wb, ws, `Nilai Sem ${importSemester} - ${importMajor}`);")
content = content.replace("XLSX.writeFile(wb, Template_Nilai_Semester__.xlsx);", "XLSX.writeFile(wb, `Template_Nilai_Semester_${importSemester}_${importMajor}.xlsx`);")
content = content.replace("id: _$,", "id: `${student.id}_${importSemester}`,")
content = content.replace("alert(Berhasil mengimport nilai untuk  siswa.);", "alert(`Berhasil mengimport nilai untuk ${newGradeRecords.length} siswa.`);")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("FIX_APPLIED")
