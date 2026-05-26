import React, { useState, useMemo } from 'react';
import { Student, Rombel, SchoolProfile, Teacher, CounselorProfileData, UserSession, TeachingSlot, StudentJournal, GuidanceSession, PrivateCounselingSession, HomeVisit, Advocacy, CaseConference, Referral, DCMSubmission, QuestionnaireSubmission, SociometrySession, StarPrestasi, Assignment, GuidanceMaterial } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';
import StudentBioReport from './StudentBioReport';
import * as XLSX from 'xlsx';

interface TimelineEvent {
  id: string;
  date: string;
  type: string;
  topic: string;
  notes: string;
  color: {
    bg: string;
    text: string;
    border: string;
    hover: string;
  };
}

interface StudentCareBookProps {
  students: Student[];
  rombels: Rombel[];
  schoolProfile: SchoolProfile;
  teachers: Teacher[];
  counselorProfile: CounselorProfileData;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  currentUser: UserSession | null;
  schedule: TeachingSlot[];
  studentJournals?: StudentJournal[];
  setStudentJournals?: React.Dispatch<React.SetStateAction<StudentJournal[]>>;
  sessions?: GuidanceSession[];
  setSessions?: React.Dispatch<React.SetStateAction<GuidanceSession[]>>;
  privateSessions?: PrivateCounselingSession[];
  setPrivateSessions?: React.Dispatch<React.SetStateAction<PrivateCounselingSession[]>>;
  homeVisits?: HomeVisit[];
  setHomeVisits?: React.Dispatch<React.SetStateAction<HomeVisit[]>>;
  advocacies?: Advocacy[];
  setAdvocacies?: React.Dispatch<React.SetStateAction<Advocacy[]>>;
  conferences?: CaseConference[];
  setConferences?: React.Dispatch<React.SetStateAction<CaseConference[]>>;
  referrals?: Referral[];
  setReferrals?: React.Dispatch<React.SetStateAction<Referral[]>>;
  dcmSubmissions?: DCMSubmission[];
  setDcmSubmissions?: React.Dispatch<React.SetStateAction<DCMSubmission[]>>;
  questionnaireSubmissions?: QuestionnaireSubmission[];
  setQuestionnaireSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  setEqSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  setAqSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  setSqSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  sociometrySessions?: SociometrySession[];
  setSociometrySessions?: React.Dispatch<React.SetStateAction<SociometrySession[]>>;
  starData?: StarPrestasi[];
  setStarData?: React.Dispatch<React.SetStateAction<StarPrestasi[]>>;
  assignments?: Assignment[];
  materials?: GuidanceMaterial[];
}

const StudentCareBook: React.FC<StudentCareBookProps> = ({ 
  students, rombels, schoolProfile, teachers, counselorProfile, notify, currentUser, schedule, 
  studentJournals = [], setStudentJournals, 
  sessions = [], setSessions,
  privateSessions = [], setPrivateSessions,
  homeVisits = [], setHomeVisits,
  advocacies = [], setAdvocacies,
  conferences = [], setConferences,
  referrals = [], setReferrals,
  dcmSubmissions = [], setDcmSubmissions,
  questionnaireSubmissions = [], setQuestionnaireSubmissions, setEqSubmissions, setAqSubmissions, setSqSubmissions,
  sociometrySessions = [], setSociometrySessions,
  starData = [], setStarData,
  assignments = [], materials = [] 
}) => {


  const [activeTab, setActiveTab] = useState<'Search' | 'Report'>('Search');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Semua');
  const [selectedClass, setSelectedClass] = useState('Semua');
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [viewingModalTab, setViewingModalTab] = useState<'Biodata' | 'Jurnal'>('Biodata');
  
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [journalTopic, setJournalTopic] = useState('');
  const [journalNotes, setJournalNotes] = useState('');

  const timelineEvents = useMemo(() => {
    if (!viewingStudent) return [];
    const sid = viewingStudent.id;
    const events: TimelineEvent[] = [];

    // 1. Jurnal Manual
    studentJournals.filter(j => j.studentId === sid).forEach(j => {
      events.push({ id: j.id, date: j.date, type: 'Jurnal Konseli', topic: j.topic, notes: j.notes, color: {bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', hover: 'hover:border-indigo-300'} });
    });

    // 2. BK Pribadi (GuidanceSession)
    sessions.filter(s => s.type === 'Pribadi' && s.studentIds.includes(sid)).forEach(s => {
      events.push({ id: s.id, date: s.date, type: 'Laporan BK Pribadi', topic: s.topic, notes: `Tujuan: ${s.objective}\nIsi: ${s.content}`, color: {bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:border-blue-300'} });
    });

    // 2b. Konseling Privat
    privateSessions.filter(s => s.studentId === sid).forEach(s => {
      events.push({ id: s.id, date: s.dateCreated, type: 'Konseling Privat', topic: s.category, notes: `Kronologi: ${s.chronology}\nHasil: ${s.outcome || '-'}`, color: {bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', hover: 'hover:border-sky-300'} });
    });

    // 3. BK Kelompok
    sessions.filter(s => s.type === 'Kelompok' && s.studentIds.includes(sid)).forEach(s => {
      events.push({ id: s.id, date: s.date, type: 'Laporan BK Kelompok', topic: s.topic, notes: `Tujuan: ${s.objective}\nIsi: ${s.content}`, color: {bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', hover: 'hover:border-cyan-300'} });
    });

    // 4. Home Visit
    homeVisits.filter(h => h.studentId === sid).forEach(h => {
      events.push({ id: h.id, date: h.date, type: 'Home Visit', topic: h.reason, notes: `Temuan: ${h.findings}\nSolusi: ${h.solutions}`, color: {bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', hover: 'hover:border-emerald-300'} });
    });

    // 5. Advokasi
    advocacies.filter(a => a.studentId === sid).forEach(a => {
      events.push({ id: a.id, date: a.date, type: 'Advokasi', topic: a.category, notes: `Insiden: ${a.incidentDescription}\nLangkah: ${a.stepsTaken}`, color: {bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', hover: 'hover:border-orange-300'} });
    });

    // 6. Konferensi Kasus
    conferences.filter(c => c.studentId === sid).forEach(c => {
      events.push({ id: c.id, date: c.date, type: 'Konferensi Kasus', topic: c.agenda, notes: `Diskusi: ${c.discussionNotes}\nKeputusan: ${c.decisions}`, color: {bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', hover: 'hover:border-rose-300'} });
    });

    // 7. Alih Tangan Kasus
    referrals.filter(r => r.studentId === sid).forEach(r => {
      events.push({ id: r.id, date: r.date, type: 'Alih Tangan Kasus', topic: r.reason, notes: `Instansi: ${r.targetAgency}\nRingkasan: ${r.summary}`, color: {bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', hover: 'hover:border-red-300'} });
    });

    // 8. DCM
    dcmSubmissions.filter(d => d.studentId === sid).forEach(d => {
      events.push({ id: d.id, date: d.date, type: 'Asesmen DCM', topic: 'Pengisian DCM', notes: `Jumlah Masalah Dipilih: ${d.selectedIssues?.length || 0}`, color: {bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', hover: 'hover:border-violet-300'} });
    });

    // 9. Angket / Tugas
    questionnaireSubmissions.filter(q => q.studentId === sid).forEach(q => {
      const assignment = assignments.find(a => a.id === q.assignmentId);
      events.push({ id: q.id, date: q.date, type: 'Laporan Tugas/Angket', topic: assignment?.title || 'Pengisian Angket', notes: `Total Skor: ${q.totalScore || '-'}`, color: {bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', hover: 'hover:border-purple-300'} });
    });

    // 10. Sosiometri
    sociometrySessions.forEach(s => {
      let isVoter = s.choices && s.choices[sid];
      let isChosen = s.choices && Object.values(s.choices).some(arr => arr.includes(sid));
      if (isVoter || isChosen) {
        events.push({ id: s.id + sid, date: s.date || s.startDate, type: 'Analisis Sosiometri', topic: s.criterion, notes: `Status: ${isVoter ? 'Memilih' : ''} ${isChosen ? 'Dipilih' : ''}`, color: {bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-200', hover: 'hover:border-fuchsia-300'} });
      }
    });

    // 11. Star Prestasi
    starData.filter(s => s.studentId === sid).forEach(s => {
      events.push({ id: s.id, date: s.dateCreated, type: 'Laporan Star Prestasi', topic: `Cita-cita: ${s.dream}`, notes: `Status: ${s.status}\nEvaluasi: ${s.evaluation || '-'}`, color: {bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', hover: 'hover:border-amber-300'} });
    });

    return events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [viewingStudent, studentJournals, sessions, privateSessions, homeVisits, advocacies, conferences, referrals, dcmSubmissions, questionnaireSubmissions, sociometrySessions, starData, assignments]);

  const handleDeleteTimelineEvent = (event: TimelineEvent) => {
    if (!window.confirm(`Yakin ingin menghapus ${event.type} ini? Data aslinya juga akan ikut terhapus permanen.`)) return;
    
    if (event.type === 'Jurnal Konseli' && setStudentJournals) setStudentJournals(p => p.filter(x => x.id !== event.id));
    else if ((event.type === 'Laporan BK Pribadi' || event.type === 'Laporan BK Kelompok') && setSessions) setSessions(p => p.filter(x => x.id !== event.id));
    else if (event.type === 'Konseling Privat' && setPrivateSessions) setPrivateSessions(p => p.filter(x => x.id !== event.id));
    else if (event.type === 'Home Visit' && setHomeVisits) setHomeVisits(p => p.filter(x => x.id !== event.id));
    else if (event.type === 'Advokasi' && setAdvocacies) setAdvocacies(p => p.filter(x => x.id !== event.id));
    else if (event.type === 'Konferensi Kasus' && setConferences) setConferences(p => p.filter(x => x.id !== event.id));
    else if (event.type === 'Alih Tangan Kasus' && setReferrals) setReferrals(p => p.filter(x => x.id !== event.id));
    else if (event.type === 'Asesmen DCM' && setDcmSubmissions) setDcmSubmissions(p => p.filter(x => x.id !== event.id));
    else if (event.type === 'Laporan Star Prestasi' && setStarData) setStarData(p => p.filter(x => x.id !== event.id));
    else if (event.type === 'Laporan Tugas/Angket') {
      const q = questionnaireSubmissions.find(x => x.id === event.id);
      if (!q) return;
      const assign = assignments.find(a => a.id === q.assignmentId);
      if (!assign) return;
      if (assign.type === 'SQ' && setSqSubmissions) setSqSubmissions(p => p.filter(x => x.id !== event.id));
      else if (assign.type === 'EQ' && setEqSubmissions) setEqSubmissions(p => p.filter(x => x.id !== event.id));
      else if (assign.type === 'AQ' && setAqSubmissions) setAqSubmissions(p => p.filter(x => x.id !== event.id));
      else if (setQuestionnaireSubmissions) setQuestionnaireSubmissions(p => p.filter(x => x.id !== event.id));
    }
    else if (event.type === 'Analisis Sosiometri' && setSociometrySessions) {
      const actualId = event.id.replace(viewingStudent?.id || '', ''); 
      setSociometrySessions(p => p.map(sess => {
          if (sess.id === actualId && viewingStudent) {
              const newChoices = {...sess.choices};
              const newReasons = {...sess.reasons};
              delete newChoices[viewingStudent.id];
              delete newReasons[viewingStudent.id];
              return {...sess, choices: newChoices, reasons: newReasons};
          }
          return sess;
      }));
    }
    notify(`${event.type} berhasil dihapus`, 'info');
  };

  const activeStudents = useMemo(() => students.filter(s => s.status === 'Aktif'), [students]);
  const grades = useMemo(() => ['Semua', ...Array.from(new Set(activeStudents.map(s => s.grade))).sort()], [activeStudents]);
  
  const classes = useMemo(() => {
    if (selectedGrade === 'Semua') return ['Semua'];
    const classNames = activeStudents
      .filter(s => s.grade === selectedGrade)
      .map(s => s.class);
    return ['Semua', ...Array.from(new Set(classNames)).sort()];
  }, [activeStudents, selectedGrade]);

  const filteredStudents = useMemo(() => {
    return activeStudents
      .filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (s.nis || '').includes(searchTerm);
        const matchesGrade = selectedGrade === 'Semua' || s.grade === selectedGrade;
        const matchesClass = selectedClass === 'Semua' || s.class === selectedClass;
        return matchesSearch && matchesGrade && matchesClass;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeStudents, searchTerm, selectedGrade, selectedClass]);

  const handlePrintBiodata = (student: Student) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    // Judul Dokumen
    doc.setFontSize(14); doc.setFont("times", "bold");
    doc.text("BUKU SISWA ASUH (BIODATA SISWA)", 105, startY + 5, { align: 'center' });

    let yPos = startY + 18;
    const addSection = (title: string) => {
        doc.setFontSize(11); doc.setFont("times", "bold");
        doc.setFillColor(240, 240, 240);
        doc.rect(15, yPos, 180, 7, 'F');
        doc.text(title, 20, yPos + 5);
        yPos += 12;
    };

    // A. KETERANGAN PRIBADI
    addSection("A. KETERANGAN PRIBADI");

    const photoY = yPos - 4; 
    const photoH = 40;
    const photoBottomY = photoY + photoH;

    if (student.photo) {
        try {
            doc.addImage(student.photo, 'JPEG', 160, photoY, 30, photoH);
        } catch (e) {
            doc.rect(160, photoY, 30, photoH);
            doc.setFontSize(8); doc.text("Foto", 175, photoY + 20, { align: 'center' });
        }
    } else {
        doc.rect(160, photoY, 30, photoH);
        doc.setFontSize(8); doc.text("3x4", 175, photoY + 20, { align: 'center' });
    }

    const addField = (label: string, value: string) => {
        doc.setFontSize(10); doc.setFont("times", "normal");
        doc.text(label, 20, yPos);
        doc.text(":", 60, yPos);
        
        const isBesidePhoto = (yPos >= photoY) && (yPos <= photoBottomY);
        const maxWidth = isBesidePhoto ? 90 : 130; 
        
        const splitText = doc.splitTextToSize(value || '-', maxWidth);
        doc.text(splitText, 65, yPos);
        yPos += (splitText.length * 5) + 2;
    };

    addField("1. Nama Lengkap", student.name);
    addField("2. Nama Panggilan", student.nickname || '-');
    addField("3. Jenis Kelamin", student.gender || '-');
    addField("4. Tempat, Tgl Lahir", `${student.birthPlace || '-'}, ${student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID') : '-'}`);
    addField("5. Agama", student.religion || '-');
    addField("6. Anak ke-", student.birthOrder ? `${student.birthOrder}` : '-');
    addField("7. Status Keluarga", student.familyStatus || '-');
    addField("8. Sekolah Asal", student.juniorHighOrigin || '-');
    addField("9. Diterima Kelas X", student.acceptedClassX || '-');
    addField("10. No. Telepon / WA", student.phone || '-');
    addField("11. Email / Akun", student.email || '-');

    yPos += 3;
    addSection("B. TEMPAT TINGGAL SISWA");
    addField("1. Alamat Lengkap", student.address || '-');
    
    yPos += 3;
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    addSection("C. DATA ORANG TUA / WALI");
    
    doc.setFont("times", "bold"); doc.text("Ayah Kandung", 20, yPos); yPos += 6;
    addField("   Nama", student.fatherName || '-');
    addField("   Pekerjaan", student.fatherJob || '-');
    addField("   No. Telepon", student.fatherPhone || '-');
    addField("   Alamat", student.fatherAddress || 'Sama dengan siswa');

    yPos += 3;
    doc.setFont("times", "bold"); doc.text("Ibu Kandung", 20, yPos); yPos += 6;
    addField("   Nama", student.motherName || '-');
    addField("   Pekerjaan", student.motherJob || '-');
    addField("   No. Telepon", student.motherPhone || '-');
    addField("   Alamat", student.motherAddress || 'Sama dengan siswa');

    if (student.hasGuardian) {
        yPos += 3;
        doc.setFont("times", "bold"); doc.text("Wali", 20, yPos); yPos += 6;
        addField("   Nama", student.guardianName || '-');
        addField("   Pekerjaan", student.guardianJob || '-');
        addField("   No. Telepon", student.guardianPhone || '-');
        addField("   Alamat", student.guardianAddress || '-');
    }

    if (yPos > 240) { doc.addPage(); yPos = 30; } else { yPos += 20; }
    
    const dateStr = `${schoolProfile.city || 'Tempat'}, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`;
    doc.text(dateStr, 140, yPos);
    doc.text("Guru BK / Konselor,", 140, yPos + 5);
    doc.setFont("times", "bold");
    doc.text(counselorProfile.name || schoolProfile.counselorName, 140, yPos + 30);
    doc.setFont("times", "normal");
    doc.text(`NIP. ${counselorProfile.nip || schoolProfile.counselorNip}`, 140, yPos + 35);

    doc.save(`Biodata_${Date.now()}.pdf`);
    notify("Lembar buku siswa berhasil diunduh.", "success");
  };

  const handlePrintJurnal = (student: Student) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFontSize(14); doc.setFont("times", "bold");
    doc.text("LAPORAN JURNAL KONSELI", 105, startY + 5, { align: 'center' });

    doc.setFontSize(11); doc.setFont("times", "normal");
    doc.text(`Nama Siswa : ${student.name}`, 15, startY + 15);
    doc.text(`Kelas / NIS  : ${student.grade} - ${student.class} / ${student.nis || '-'}`, 15, startY + 20);

    if (timelineEvents.length === 0) {
        doc.setFont("times", "italic");
        doc.text('Belum ada catatan aktivitas untuk siswa ini.', 15, startY + 35);
    } else {
        const tableData = timelineEvents.map((j, index) => [
            index + 1,
            new Date(j.date).toLocaleDateString('id-ID'),
            j.type,
            j.topic,
            j.notes
        ]);
        
        autoTable(doc, {
            startY: startY + 30,
            head: [['No', 'Tanggal', 'Jenis Kegiatan', 'Topik/Kegiatan', 'Keterangan']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], font: 'times', fontStyle: 'bold' },
            bodyStyles: { font: 'times', valign: 'top' },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 25 },
                2: { cellWidth: 35 },
                3: { cellWidth: 45 },
                4: { cellWidth: 'auto' }
            },
            margin: { left: 15, right: 15 }
        });
    }

    let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : startY + 40;
    if (finalY > 240) { doc.addPage(); finalY = 30; } else { finalY += 20; }
    
    const dateStr = `${schoolProfile.city || 'Tempat'}, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`;
    doc.text(dateStr, 140, finalY);
    doc.text("Guru BK / Konselor,", 140, finalY + 5);
    doc.setFont("times", "bold");
    doc.text(counselorProfile.name || schoolProfile.counselorName, 140, finalY + 30);
    doc.setFont("times", "normal");
    doc.text(`NIP. ${counselorProfile.nip || schoolProfile.counselorNip}`, 140, finalY + 35);

    doc.save(`Jurnal_${student.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  };

  const downloadAllExcel = () => {
    if (activeStudents.length === 0) {
      notify("Tidak ada data siswa aktif untuk diunduh.", "error");
      return;
    }

    const exportData = activeStudents.sort((a, b) => {
      const gradesOrder = ['X', 'XI', 'XII'];
      const gradeDiff = gradesOrder.indexOf(a.grade) - gradesOrder.indexOf(b.grade);
      if (gradeDiff !== 0) return gradeDiff;
      const classDiff = (a.class || '').localeCompare(b.class || '');
      if (classDiff !== 0) return classDiff;
      return a.name.localeCompare(b.name);
    }).map((s, idx) => ({
      "No": idx + 1,
      "Nama Lengkap": s.name,
      "NIS": s.nis,
      "NISN": s.nisn || '-',
      "Tingkat": s.grade,
      "Kelas": s.class,
      "L/P": s.gender === 'Laki-laki' ? 'L' : 'P',
      "Tempat Lahir": s.birthPlace || '-',
      "Tanggal Lahir": s.birthDate || '-',
      "Agama": s.religion || '-',
      "Anak Ke": s.birthOrder || '-',
      "Status Keluarga": s.familyStatus || '-',
      "Asal Sekolah": s.juniorHighOrigin || '-',
      "Diterima di Kelas": s.acceptedClassX || '-',
      "No. HP": s.phone || '-',
      "Email": s.email || '-',
      "Instagram": s.instagram || '-',
      "Alamat": s.address || '-',
      "Nama Ayah": s.fatherName || s.parentName || '-',
      "Pekerjaan Ayah": s.fatherJob || '-',
      "HP Ayah": s.fatherPhone || s.parentPhone || '-',
      "Alamat Ayah": s.fatherAddress || '-',
      "Nama Ibu": s.motherName || '-',
      "Pekerjaan Ibu": s.motherJob || '-',
      "HP Ibu": s.motherPhone || '-',
      "Alamat Ibu": s.motherAddress || '-',
      "Nama Wali": s.guardianName || '-',
      "Pekerjaan Wali": s.guardianJob || '-',
      "HP Wali": s.guardianPhone || '-',
      "Alamat Wali": s.guardianAddress || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    XLSX.writeFile(wb, `Laporan_Siswa_Asuh_Lengkap_${new Date().getFullYear()}.xlsx`);
    notify("Berhasil mengunduh seluruh data siswa ke Excel.", "success");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Siswa Asuh</h2>
          <p className="text-slate-500 text-sm font-medium">Rekapitulasi biodata lengkap peserta didik aktif.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {currentUser?.role === 'super_admin' && (
            <button 
              onClick={downloadAllExcel}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Unduh Semua (Excel)
            </button>
          )}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            <button 
                onClick={() => setActiveTab('Search')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'Search' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
                Cari Siswa
            </button>
            <button 
                onClick={() => setActiveTab('Report')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'Report' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
                Laporan Kelas
            </button>
        </div>
      </div>
    </header>

      {activeTab === 'Search' ? (
        <>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 no-print">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2 w-full md:w-auto">
                    <select 
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100"
                        value={selectedGrade}
                        onChange={(e) => { setSelectedGrade(e.target.value); setSelectedClass('Semua'); }}
                    >
                        {grades.map(g => <option key={g} value={g}>{g === 'Semua' ? 'Semua Tingkat' : `Kelas ${g}`}</option>)}
                    </select>
                    <select 
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        disabled={selectedGrade === 'Semua'}
                    >
                        <option value="Semua">Semua Kelas</option>
                        {classes.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    </div>
                    <div className="relative w-full md:w-80">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <input 
                        type="text" 
                        placeholder="Cari nama atau NIS..." 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
                {filteredStudents.map(student => (
                <div key={student.id} onClick={() => setViewingStudent(student)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                        {student.photo ? (
                            <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl font-black text-slate-300">{student.name.charAt(0)}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{student.name}</h4>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">{student.grade} - {student.class}</p>
                        <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-indigo-600 uppercase">
                        <span>Lihat Biodata</span>
                        <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </div>
                    </div>
                </div>
                ))}
                {filteredStudents.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 text-slate-400 italic">
                        Tidak ada data siswa yang sesuai.
                    </div>
                )}
            </div>
        </>
      ) : (
        <StudentBioReport 
            students={students}
            rombels={rombels}
            schedule={schedule} 
            teachers={teachers}
            schoolProfile={schoolProfile}
            currentUser={currentUser}
            counselorProfile={counselorProfile}
            notify={notify}
        />
      )}

      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto no-print">
           <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden border border-white/20 my-8 flex flex-col max-h-[90vh]">
              <div className="bg-slate-900 p-8 text-white shrink-0">
                 <div className="flex justify-between items-start mb-6">
                     <div>
                        <h3 className="text-2xl font-black">Lembar Buku Siswa</h3>
                        <p className="text-slate-400 text-xs mt-1">Data dan Catatan Peserta Didik</p>
                     </div>
                     <div className="flex gap-2">
                        {viewingModalTab === 'Biodata' && (
                            <button onClick={() => handlePrintBiodata(viewingStudent)} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                Unduh Biodata PDF
                            </button>
                        )}
                        {viewingModalTab === 'Jurnal' && (
                            <button onClick={() => handlePrintJurnal(viewingStudent)} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                Unduh Jurnal PDF
                            </button>
                        )}
                        <button onClick={() => { setViewingStudent(null); setViewingModalTab('Biodata'); }} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                     </div>
                 </div>
                 <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
                     <button onClick={() => setViewingModalTab('Biodata')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${viewingModalTab === 'Biodata' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Biodata Siswa</button>
                     <button onClick={() => setViewingModalTab('Jurnal')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${viewingModalTab === 'Jurnal' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Laporan Jurnal Konseli</button>
                 </div>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
                 <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-start gap-6 pb-6 border-b border-slate-100">
                        <div className="w-24 h-32 bg-slate-200 rounded-2xl overflow-hidden shadow-inner shrink-0">
                            {viewingStudent.photo ? (
                                <img src={viewingStudent.photo} alt={viewingStudent.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">No Photo</div>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <h2 className="text-2xl font-black text-slate-800">{viewingStudent.name}</h2>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">NIS / NISN</p>
                                    <p className="font-mono text-slate-700">{viewingStudent.nis} / {viewingStudent.nisn || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Kelas Saat Ini</p>
                                    <p className="font-bold text-indigo-600">{viewingStudent.grade} - {viewingStudent.class}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tempat, Tgl Lahir</p>
                                    <p className="text-slate-700">{viewingStudent.birthPlace || '-'}, {viewingStudent.birthDate ? new Date(viewingStudent.birthDate).toLocaleDateString('id-ID') : '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Jenis Kelamin</p>
                                    <p className="text-slate-700">{viewingStudent.gender || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {viewingModalTab === 'Biodata' ? (
                        <div className="space-y-6">
                        <section>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-8 h-1 bg-indigo-500 rounded-full"></span> Data Pribadi
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Agama</p>
                                    <p className="font-bold text-slate-700">{viewingStudent.religion || '-'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Status dalam Keluarga</p>
                                    <p className="font-bold text-slate-700">{viewingStudent.familyStatus || '-'} (Anak ke-{viewingStudent.birthOrder || '-'})</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Asal Sekolah (SMP)</p>
                                    <p className="font-bold text-slate-700">{viewingStudent.juniorHighOrigin || '-'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Kontak Siswa</p>
                                    <p className="font-bold text-slate-700">{viewingStudent.phone || '-'}</p>
                                </div>
                                <div className="md:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Alamat Lengkap</p>
                                    <p className="font-medium text-slate-700 leading-relaxed">{viewingStudent.address || '-'}</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-8 h-1 bg-emerald-500 rounded-full"></span> Data Orang Tua / Wali
                            </h4>
                            <div className="space-y-4 text-sm">
                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Ayah Kandung</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <p><span className="text-slate-400 text-xs">Nama:</span> <span className="font-bold">{viewingStudent.fatherName || '-'}</span></p>
                                        <p><span className="text-slate-400 text-xs">Pekerjaan:</span> <span className="font-bold">{viewingStudent.fatherJob || '-'}</span></p>
                                        <p className="col-span-2"><span className="text-slate-400 text-xs">Alamat:</span> <span className="italic">{viewingStudent.fatherAddress || 'Sama dengan siswa'}</span></p>
                                    </div>
                                </div>
                                <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100">
                                    <p className="text-[10px] font-black text-pink-600 uppercase mb-2">Ibu Kandung</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <p><span className="text-slate-400 text-xs">Nama:</span> <span className="font-bold">{viewingStudent.motherName || '-'}</span></p>
                                        <p><span className="text-slate-400 text-xs">Pekerjaan:</span> <span className="font-bold">{viewingStudent.motherJob || '-'}</span></p>
                                        <p className="col-span-2"><span className="text-slate-400 text-xs">Alamat:</span> <span className="italic">{viewingStudent.motherAddress || 'Sama dengan siswa'}</span></p>
                                    </div>
                                </div>
                                {viewingStudent.hasGuardian && (
                                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                        <p className="text-[10px] font-black text-amber-600 uppercase mb-2">Wali Murid</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <p><span className="text-slate-400 text-xs">Nama:</span> <span className="font-bold">{viewingStudent.guardianName || '-'}</span></p>
                                            <p><span className="text-slate-400 text-xs">Pekerjaan:</span> <span className="font-bold">{viewingStudent.guardianJob || '-'}</span></p>
                                            <p className="col-span-2"><span className="text-slate-400 text-xs">Alamat:</span> <span className="italic">{viewingStudent.guardianAddress || '-'}</span></p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                    ) : (
                        <div className="space-y-6">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!journalTopic || !journalNotes) {
                                    notify('Topik dan catatan jurnal harus diisi', 'error');
                                    return;
                                }
                                const newJournal: StudentJournal = {
                                    id: Date.now().toString(),
                                    studentId: viewingStudent.id,
                                    date: journalDate,
                                    topic: journalTopic,
                                    notes: journalNotes,
                                    counselorId: currentUser?.id || '',
                                    createdAt: new Date().toISOString()
                                };
                                if (setStudentJournals) {
                                    setStudentJournals(prev => [...prev, newJournal]);
                                }
                                notify('Jurnal berhasil ditambahkan', 'success');
                                setJournalTopic('');
                                setJournalNotes('');
                                setJournalDate(new Date().toISOString().split('T')[0]);
                            }} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                                <h4 className="text-sm font-bold text-slate-800">Tambah Catatan Jurnal Baru</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal</label>
                                        <input type="date" value={journalDate} onChange={e => setJournalDate(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Topik / Masalah</label>
                                        <input type="text" value={journalTopic} onChange={e => setJournalTopic(e.target.value)} placeholder="Contoh: Kesulitan belajar matematika" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Catatan Konselor</label>
                                        <textarea value={journalNotes} onChange={e => setJournalNotes(e.target.value)} placeholder="Tulis catatan lengkap di sini..." className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 resize-none h-24" required></textarea>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200">Simpan Jurnal</button>
                                </div>
                            </form>

                            <div className="space-y-4 mt-8">
                                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Riwayat Jurnal Konseli</h4>
                                {timelineEvents.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400 italic text-sm border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">Belum ada catatan aktivitas untuk siswa ini.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {timelineEvents.map(event => (
                                            <div key={event.id} className={`p-4 border ${event.color.border} rounded-2xl ${event.color.hover} hover:shadow-md transition-all group bg-white`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`inline-block px-2.5 py-1 ${event.color.bg} ${event.color.text} text-[10px] font-bold rounded-lg`}>{new Date(event.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                                                            <span className={`inline-block px-2.5 py-1 border ${event.color.border} ${event.color.text} text-[10px] font-bold rounded-lg uppercase tracking-wider`}>{event.type}</span>
                                                        </div>
                                                        <h5 className="font-bold text-slate-800 text-sm">{event.topic}</h5>
                                                    </div>
                                                    <button onClick={() => handleDeleteTimelineEvent(event)} className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-all" title="Hapus Aktivitas">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                </div>
                                                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{event.notes}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentCareBook;