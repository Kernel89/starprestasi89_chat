import os

filepath = 'd:/star prestasi/Evaluasi Stars Prestasi/stars-prestasi-k8.95-7 Backup data7 11 (28) ok/project/pages/GradeManagement.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

part1 = content.split('  // Effect to manage import major\n')[0]

part2 = '      } catch (err) {\n' + content.split('      } catch (err) {\n')[2]

inserted_code = '''  // Effect to manage import major
  React.useEffect(() => {
    if ((importSemester === '1' || importSemester === '2') && curriculum === 'Merdeka') {
      setImportMajor('Umum');
    } else if (importMajor === 'Umum' && classXIIMajors.length > 0) {
      setImportMajor(classXIIMajors[0]);
    }
  }, [importSemester, curriculum, classXIIMajors]);

  const handleToggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
      // Auto-remove from eligible if unchecked from main list
      if (selectedEligibleSubjects.includes(subject)) {
        setSelectedEligibleSubjects(selectedEligibleSubjects.filter(s => s !== subject));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleToggleEligibleSubject = (subject: string) => {
    if (selectedEligibleSubjects.includes(subject)) {
      setSelectedEligibleSubjects(selectedEligibleSubjects.filter(s => s !== subject));
    } else {
      setSelectedEligibleSubjects([...selectedEligibleSubjects, subject]);
    }
  };

  const handleAddCustomSubject = () => {
    if (customSubject.trim() && !selectedSubjects.includes(customSubject.trim())) {
      setSelectedSubjects([...selectedSubjects, customSubject.trim()]);
      setCustomSubject('');
    }
  };

  const handleSaveSubjects = () => {
    if (!subjectMajor) {
      alert("Pilih jurusan terlebih dahulu.");
      return;
    }
    const newRecord: ClassSubjectRecord = {
      id: currentSubjectRecordId,
      rombelId: subjectMajor, // Storing major in the rombelId field to reuse DB schema
      semester: subjectSemester,
      subjects: selectedSubjects,
      eligibleSubjects: selectedEligibleSubjects
    };
    const newRecords = classSubjects.filter(r => r.id !== currentSubjectRecordId);
    newRecords.push(newRecord);
    setClassSubjects(newRecords);
    alert('Mata pelajaran berhasil disimpan untuk jurusan ini.');
  };

  const normalizeClassSuffix = (str: string) => {
    if (!str) return '';
    let cleaned = str.trim().replace(/\s+/g, ' ').toUpperCase();
    const parts = cleaned.split(' ');
    const lastPart = parts[parts.length - 1];
    if (!isNaN(Number(lastPart)) && /^\d+$/.test(lastPart)) {
      parts[parts.length - 1] = lastPart;
    }
    return parts.join(' ');
  };

  const extractShortName = (fullName: string, grade: string) => {
    const normalizedGrade = grade.trim().toUpperCase();
    const nameWithoutGrade = fullName.replace(new RegExp(`^${normalizedGrade}\\s*`, 'i'), '');
    return normalizeClassSuffix(nameWithoutGrade);
  };

  const isStudentInRombel = (student: Student, rombel: Rombel) => {
    if (!student || !rombel) return false;
    // Cek ID class (legacy / fallback)
    if (student.class === rombel.id || rombel.name === student.class || student.class === rombel.name) return true;
    
    // Cek menggunakan logika short name (sama seperti Manajemen Kelas)
    const targetGrade = rombel.grade.trim().toUpperCase();
    const targetSuffix = extractShortName(rombel.name, rombel.grade);
    const sGrade = (student.grade || '').trim().toUpperCase();
    const sSuffix = normalizeClassSuffix(student.class || '');
    
    return sGrade === targetGrade && sSuffix === targetSuffix;
  };

  // Helper to get subjects for a class and semester
  const getSubjectsForClassAndSemester = (rombelId: string, sem: string): string[] => {
    let targetSem: '1' | '3' | '5' = '1';
    if (sem === '1' || sem === '2') targetSem = '1';
    if (sem === '3' || sem === '4') targetSem = '3';
    if (sem === '5' || sem === '6' || sem === 'PSAJ') targetSem = '5';

    const rombel = rombels.find(r => r.id === rombelId);
    if (!rombel) return STANDARD_SUBJECTS;

    // Try specific major first (for K13 or Sem 3/5)
    let record = classSubjects.find(r => r.id === `${rombel.major}_${targetSem}`);
    
    // If not found and it's semester 1, try 'Umum' (Merdeka style)
    if (!record && targetSem === '1') {
      record = classSubjects.find(r => r.id === `Umum_${targetSem}`);
    }
    
    // Fallback: if not found by major, try to find by rombelId (for legacy records)
    if (!record) {
      const legacyRecord = classSubjects.find(r => r.id === `${rombelId}_${targetSem}`);
      return legacyRecord ? legacyRecord.subjects : STANDARD_SUBJECTS;
    }
    
    return record.subjects;
  };

  // Generate Excel Template
  const generateTemplate = () => {
    const isClassX = importSemester === '1' || importSemester === '2';
    const majorStudents = allStudents.filter(s => {
      const rombel = rombels.find(r => isStudentInRombel(s, r));
      if (!rombel || !(rombel.grade === 'XII' || rombel.grade === '12')) return false;
      
      if (isClassX && curriculum === 'Merdeka') return true; // Class X: All Class XII students
      return rombel.major === importMajor;
    });

    if (majorStudents.length === 0) {
      alert(`Tidak ada siswa di jurusan ${importMajor}.`);
      return;
    }

    // Determine all subjects that apply to this major for this semester
    const uniqueSubjects = new Set<string>();
    majorStudents.forEach(s => {
      const subjects = getSubjectsForClassAndSemester(s.class, importSemester);
      subjects.forEach(sub => uniqueSubjects.add(sub));
    });

    const subjectColumns = Array.from(uniqueSubjects);

    const data = majorStudents.map(s => {
      const rombel = rombels.find(r => isStudentInRombel(s, r));
      const baseObj: any = {
        'NISN': s.nisn,
        'Nama': s.name,
        'Kelas': rombel ? rombel.name : ''
      };
      
      // Initialize subject columns with existing grades if any
      const studentGradeRecord = studentGrades.find(g => g.studentId === s.id && g.semester === importSemester);
      subjectColumns.forEach(sub => {
        const existingGrade = studentGradeRecord?.grades[sub];
        baseObj[sub] = existingGrade !== undefined ? existingGrade : '';
      });

      return baseObj;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Nilai Sem ${importSemester} - ${importMajor}`);
    XLSX.writeFile(wb, `Template_Nilai_Semester_${importSemester}_${importMajor}.xlsx`);
  };

  // Handle Excel Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isClassX = importSemester === '1' || importSemester === '2';
    const majorStudents = allStudents.filter(s => {
      const rombel = rombels.find(r => isStudentInRombel(s, r));
      if (!rombel || !(rombel.grade === 'XII' || rombel.grade === '12')) return false;
      
      if (isClassX && curriculum === 'Merdeka') return true; // Class X: All Class XII students
      return rombel.major === importMajor;
    });

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        
        const newGradeRecords: StudentGradeRecord[] = [];

        data.forEach((row: any) => {
          const nisn = String(row['NISN'] || '');
          const student = majorStudents.find(s => s.nisn === nisn);
          if (student) {
            const grades: Record<string, number> = {};
            Object.keys(row).forEach(key => {
              if (key !== "NISN" && key !== "Nama" && key !== "Kelas") {
                const value = parseFloat(row[key]);
                if (!isNaN(value)) {
                  grades[key] = value;
                }
              }
            });
            newGradeRecords.push({
              id: `${student.id}_${importSemester}`,
              studentId: student.id,
              semester: importSemester,
              grades: grades
            });
          }
        });

        if (newGradeRecords.length > 0) {
          setStudentGrades(prev => {
            const filtered = prev.filter(g => 
              !(g.semester === importSemester && newGradeRecords.some(ng => ng.studentId === g.studentId))
            );
            return [...filtered, ...newGradeRecords];
          });
          alert(`Berhasil mengimport nilai untuk ${newGradeRecords.length} siswa.`);
        } else {
          alert('Tidak ada data nilai yang valid untuk diimport.');
        }

'''

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(part1 + inserted_code + part2)

print("SUCCESS")
