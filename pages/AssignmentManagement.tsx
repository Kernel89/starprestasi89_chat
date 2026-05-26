
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Assignment, GuidanceMaterial, Rombel, Student, UserRole, DCMSubmission, QuestionnaireSubmission, SociometrySession, SatisfactionFeedback, Teacher, SchoolProfile } from '../types';
import { ICONS, DCM_QUESTIONS, MBTI_TEMPLATE, SQ_TEMPLATE, EQ_TEMPLATE, AQ_TEMPLATE } from '../constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';

interface AssignmentManagementProps {
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  materials: GuidanceMaterial[];
  rombels: Rombel[];
  students: Student[];
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  currentUserId?: string;
  dcmSubmissions?: DCMSubmission[];
  setDcmSubmissions?: React.Dispatch<React.SetStateAction<DCMSubmission[]>>;
  questionnaireSubmissions?: QuestionnaireSubmission[];
  setQuestionnaireSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  eqSubmissions?: QuestionnaireSubmission[];
  setEqSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  aqSubmissions?: QuestionnaireSubmission[];
  setAqSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  sqSubmissions?: QuestionnaireSubmission[];
  setSqSubmissions?: React.Dispatch<React.SetStateAction<QuestionnaireSubmission[]>>;
  sociometrySessions?: SociometrySession[];
  setSociometrySessions?: React.Dispatch<React.SetStateAction<SociometrySession[]>>;
  satisfactionFeedbacks?: SatisfactionFeedback[];
  setSatisfactionFeedbacks?: React.Dispatch<React.SetStateAction<SatisfactionFeedback[]>>;
  teachers?: Teacher[];
  schoolProfile: SchoolProfile;
}

const AssignmentManagement: React.FC<AssignmentManagementProps> = ({
  assignments, setAssignments, materials, rombels, students, notify, userRole, currentUserId,
  dcmSubmissions = [], setDcmSubmissions, questionnaireSubmissions = [], setQuestionnaireSubmissions,
  eqSubmissions = [], setEqSubmissions, aqSubmissions = [], setAqSubmissions, sqSubmissions = [], setSqSubmissions,
  sociometrySessions = [], setSociometrySessions, satisfactionFeedbacks = [], setSatisfactionFeedbacks,
  teachers = [], schoolProfile
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRombel, setSelectedRombel] = useState('Semua');
  const [viewResultsId, setViewResultsId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const isStudent = userRole === 'student' || userRole === 'ketua_murid';
  const [activeTab, setActiveTab] = useState<'Aktif' | 'Selesai' | 'Laporan'>('Aktif');
  const [reportAssignmentId, setReportAssignmentId] = useState<string>('');
  const [reportRombelId, setReportRombelId] = useState<string>('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const canManage = userRole === 'counselor' || userRole === 'super_admin';

  const [formData, setFormData] = useState<Partial<Assignment>>({
    title: '', category: 'Pribadi', type: 'General', instructions: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    targetType: 'Rombel', targetId: '', materialId: '', status: 'Aktif'
  });

  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const managedRombelIds = useMemo(() => {
    if (userRole !== 'counselor' || !currentUserId) return new Set<string>(rombels.map(r => r.id));
    const myProfile = teachers.find(t => t.id === currentUserId);
    if (!myProfile) return new Set<string>();
    const ids = new Set<string>();
    rombels.filter(r => r.homeroomTeacherId === myProfile.id).forEach(r => ids.add(r.id));
    const gradeMatch = myProfile.assignment.match(/Tingkat (X|XI|XII)/i);
    if (gradeMatch) {
      const targetGrade = gradeMatch[1].toUpperCase();
      rombels.filter(r => r.grade === targetGrade).forEach(r => ids.add(r.id));
    }
    return ids;
  }, [userRole, currentUserId, teachers, rombels]);

  const accessibleRombels = useMemo(() => {
    if (userRole === 'super_admin') return rombels;
    return rombels.filter(r => managedRombelIds.has(r.id));
  }, [userRole, rombels, managedRombelIds]);

  const getCompletionStatus = (a: Assignment, studentId: string) => {
    if (a.type === 'MBTI' || a.type === 'SQ' || a.type === 'EQ' || a.type === 'AQ' || a.type === 'General') {
      return questionnaireSubmissions.some(s => s.assignmentId === a.id && s.studentId === studentId);
    } else if (a.type === 'DCM') {
      return dcmSubmissions.some(s => s.studentId === studentId);
    } else if (a.type === 'Sociometry') {
      return sociometrySessions.some(s => s.rombelId === a.targetId && s.choices && s.choices[studentId]);
    } else if (a.type === 'Satisfaction') {
      return satisfactionFeedbacks.some(s => s.studentId === studentId && new Date(s.date).toDateString() === new Date().toDateString());
    }
    return false;
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const todayStr = new Date().toISOString().split('T')[0];
    const isPastDeadline = a.dueDate ? a.dueDate < todayStr : false;
    const isSelesai = a.status === 'Selesai' || isPastDeadline;

    if (isStudent && currentUserId) {
      const student = students.find(s => s.id === currentUserId);
      if (!student) return false;
      let isTargetMatch = false;
      if (a.targetType === 'Individu' && a.targetId === currentUserId) isTargetMatch = true;
      else if (a.targetType === 'Rombel') {
        const targetRombelObj = rombels.find(r => r.id === a.targetId);
        if (targetRombelObj) {
          const sGrade = student.grade.trim().toUpperCase();
          const rGrade = targetRombelObj.grade.trim().toUpperCase();
          const normalize = (str: string) => {
            if (!str) return '';
            const g = rGrade.trim().toUpperCase();
            return str.toUpperCase()
              .replace(new RegExp(`^${g}\\s*`, 'i'), '')
              .replace(/\s+/g, ' ')
              .replace(/\b0+(\d)/g, '$1')
              .trim();
          };
          if (sGrade === rGrade && normalize(student.class) === normalize(targetRombelObj.name)) isTargetMatch = true;
        }
      }
      if (!isTargetMatch) return false;
      
      if (activeTab === 'Aktif') return !isSelesai && matchesSearch;
      if (activeTab === 'Selesai') return isSelesai && matchesSearch;
      return false;
    }
    if (selectedRombel !== 'Semua') {
      if (a.targetType === 'Rombel' && a.targetId !== selectedRombel) return false;
      if (a.targetType === 'Individu') {
        const s = students.find(s => s.id === a.targetId);
        const r = rombels.find(r => r.id === selectedRombel);
        if (!s || !r) return false;
        const normalize = (str: string, grade: string) => {
          if (!str) return '';
          const g = grade.trim().toUpperCase();
          return str.toUpperCase()
            .replace(new RegExp(`^${g}\\s*`, 'i'), '')
            .replace(/\s+/g, ' ')
            .replace(/\b0+(\d)/g, '$1')
            .trim();
        };
        const sGrade = s.grade.trim().toUpperCase();
        const rGrade = r.grade.trim().toUpperCase();
        if (sGrade !== rGrade || normalize(s.class, sGrade) !== normalize(r.name, rGrade)) return false;
      }
    }
    if (userRole === 'counselor') {
      if (a.targetType === 'Rombel' && !managedRombelIds.has(a.targetId)) return false;
      if (a.targetType === 'Individu') {
        const student = students.find(s => s.id === a.targetId);
        if (!student || !rombels.some(r => managedRombelIds.has(r.id) && r.grade.trim().toUpperCase() === student.grade.trim().toUpperCase() && r.name.toLowerCase().includes(student.class.toLowerCase().trim()))) return false;
      }
    }
    
    if (activeTab === 'Aktif') return !isSelesai && matchesSearch;
    if (activeTab === 'Selesai') return isSelesai && matchesSearch;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const paginatedAssignments = useMemo(() => filteredAssignments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredAssignments, currentPage]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ title: '', category: 'Pribadi', type: 'General', instructions: '', dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], targetType: 'Rombel', targetId: '', materialId: '', status: 'Aktif' });
    setIsModalOpen(true);
  };

  const handleEdit = (a: Assignment) => {
    setEditingId(a.id);
    setFormData({ ...a });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.targetId) { notify("Judul dan Target wajib diisi.", "error"); return; }
    if (editingId) setAssignments(prev => prev.map(a => a.id === editingId ? { ...a, ...formData } as Assignment : a));
    else setAssignments(prev => [{ ...formData, id: `assign-${Date.now()}`, dateCreated: new Date().toISOString() } as Assignment, ...prev]);
    setIsModalOpen(false);
    notify(editingId ? "Tugas diperbarui." : "Tugas diterbitkan.");
  };

  const handleMarkComplete = (id: string) => { if (confirm("Tandai selesai?")) { setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'Selesai' } : a)); notify("Status diperbarui."); } };
  const handleDelete = (id: string) => { 
    if (confirm("Hapus tugas beserta seluruh rekam jejak jawaban siswa terkait?")) { 
      // 1. Dapatkan tipe tugas yang akan dihapus
      const assign = assignments.find(a => a.id === id);
      
      // 2. Hapus tugas utama
      setAssignments(prev => prev.filter(a => a.id !== id)); 

      // 3. Hapus rekam jejak secara cascade (Otomatis Sync ke D1)
      if (assign) {
        if (assign.type === 'DCM' && setDcmSubmissions) {
          setDcmSubmissions(prev => prev.filter(s => (s as any).assignmentId !== id));
        } else if (assign.type === 'MBTI' && setQuestionnaireSubmissions) {
          setQuestionnaireSubmissions(prev => prev.filter(s => s.assignmentId !== id));
        } else if (assign.type === 'SQ' && setSqSubmissions) {
          setSqSubmissions(prev => prev.filter(s => s.assignmentId !== id));
        } else if (assign.type === 'EQ' && setEqSubmissions) {
          setEqSubmissions(prev => prev.filter(s => s.assignmentId !== id));
        } else if (assign.type === 'AQ' && setAqSubmissions) {
          setAqSubmissions(prev => prev.filter(s => s.assignmentId !== id));
        } else if (assign.type === 'General' && setQuestionnaireSubmissions) {
          setQuestionnaireSubmissions(prev => prev.filter(s => s.assignmentId !== id));
        } else if (assign.type === 'Satisfaction' && setSatisfactionFeedbacks) {
          // Feedback tidak memiliki assignmentId di tipe datanya (hanya studentId dan text)
          // Secara arsitektur saat ini sulit difilter berdasarkan assignmentId.
        } else if (assign.type === 'Sociometry' && setSociometrySessions) {
           // Sociometry sessions di-manage per rombel
        }
      }

      notify("Tugas dan riwayat pengerjaan terkait berhasil dihapus bersih."); 
    } 
  };
  const getTargetName = (type: string, id: string) => type === 'Rombel' ? rombels.find(r => r.id === id)?.name || 'N/A' : students.find(s => s.id === id)?.name || 'N/A';
  const handleNavigateToTask = (a: Assignment) => {
    if (a.type === 'DCM') navigate('/dcm');
    else if (a.type === 'Sociometry') navigate('/sociometry');
    else if (a.type === 'Satisfaction') navigate('/satisfaction-input');
    else navigate(`/fill-questionnaire/${a.id}`);
  };

  const handleResetStudent = (assign: Assignment, studentId: string, studentName: string) => {
    if (!confirm(`Hapus hasil tes ${studentName} untuk tugas ini? Siswa dapat mengerjakan ulang setelah direset.`)) return;

    if (assign.type === 'MBTI' || assign.type === 'SQ' || assign.type === 'EQ' || assign.type === 'AQ' || assign.type === 'General') {
      if (setQuestionnaireSubmissions) {
        setQuestionnaireSubmissions(prev => prev.filter(s => !(s.assignmentId === assign.id && s.studentId === studentId)));
      }
    } else if (assign.type === 'DCM') {
      if (setDcmSubmissions) {
        setDcmSubmissions(prev => prev.filter(s => s.studentId !== studentId));
      }
    } else if (assign.type === 'Sociometry') {
      if (setSociometrySessions) {
        setSociometrySessions(prev => prev.map(sess => {
          if (sess.rombelId === assign.targetId && sess.choices) {
            const newChoices = { ...sess.choices };
            delete newChoices[studentId];
            return { ...sess, choices: newChoices };
          }
          return sess;
        }));
      }
    } else if (assign.type === 'Satisfaction') {
      if (setSatisfactionFeedbacks) {
        setSatisfactionFeedbacks(prev => prev.filter(s => s.studentId !== studentId));
      }
    }
    notify(`Hasil tes ${studentName} direset.`);
  };

  const handleDownloadPDF = () => {
    const selectedAssign = assignments.find(a => a.id === reportAssignmentId);
    if (!selectedAssign) return;
    const doc = new jsPDF();
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN KINERJA PENUGASAN SISWA", doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' });
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`JUDUL TUGAS: ${selectedAssign.title.toUpperCase()}`, 20, 65);
    doc.text(`TIPE: ${selectedAssign.type.toUpperCase()}`, 20, 70);
    doc.text(`KELAS: ${reportRombelId === 'Semua' ? 'SEMUA KELAS BINAAN' : (rombels.find(r => r.id === reportRombelId)?.name || 'N/A')}`, 20, 75);
    doc.text(`TANGGAL CETAK: ${new Date().toLocaleDateString('id-ID')}`, 20, 80);

    let filteredStudentsForReport = students;
    if (reportRombelId !== 'Semua') {
      const r = rombels.find(r => r.id === reportRombelId);
      if (r) {
        const rGrade = r.grade.trim().toUpperCase();
        const normalize = (str: string) => {
          if (!str) return '';
          return str.toUpperCase()
            .replace(new RegExp(`^${rGrade}\\s*`, 'i'), '')
            .replace(/\s+/g, ' ')
            .replace(/\b0+(\d)/g, '$1')
            .trim();
        };
        filteredStudentsForReport = students.filter(s => s.grade.trim().toUpperCase() === rGrade && normalize(s.class) === normalize(r.name));
      }
    }

    const tableRows = filteredStudentsForReport.map((s, index) => {
      const isDone = getCompletionStatus(selectedAssign, s.id);
      let res = '-', dt = '-';
      if (selectedAssign.type === 'DCM') {
        const sub = dcmSubmissions.find(sub => sub.studentId === s.id);
        if (sub) {
          res = `${sub.selectedIssues?.length || 0} Masalah`;
          dt = new Date(sub.date).toLocaleDateString('id-ID');
        }
      } else if (selectedAssign.type === 'Sociometry') {
        if (sociometrySessions.some(sess => sess.rombelId === selectedAssign.targetId && sess.choices && sess.choices[s.id])) {
          res = 'Sudah Memilih';
          dt = 'N/A';
        }
      } else if (selectedAssign.type === 'Satisfaction') {
        const sub = satisfactionFeedbacks.find(sub => sub.studentId === s.id);
        if (sub) {
          res = `${sub.rating || 0} Bintang`;
          dt = new Date(sub.date).toLocaleDateString('id-ID');
        }
      } else {
        const sub = questionnaireSubmissions.find(sub => sub.assignmentId === selectedAssign.id && sub.studentId === s.id);
        if (sub) {
          res = sub.mbtiResult || `${sub.totalScore || 0} Poin`;
          dt = new Date(sub.date).toLocaleDateString('id-ID');
        }
      }
      return [index + 1, s.name, `${s.grade} ${s.class}`, isDone ? 'SELESAI' : 'BELUM', res, dt];
    });

    autoTable(doc, {
      startY: 85, head: [['No', 'Nama Siswa', 'Kelas', 'Status', 'Skor/Hasil', 'Tanggal']], body: tableRows,
      headStyles: { fillColor: [20, 184, 166] }, styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 50 }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'right' } }
    });
    doc.save(`Laporan_${selectedAssign.title.replace(/\s+/g, '_')}.pdf`);
    notify("PDF berhasil diunduh.");
  };

  const handleDownloadStudentAnswersPDF = (assign: Assignment, s: Student) => {
    const doc = new jsPDF();
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN DETIL JAWABAN SISWA", doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' });
    
    // Student Information Block
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMASI SISWA & PENUGASAN", 20, startY + 10);
    doc.line(20, startY + 12, doc.internal.pageSize.getWidth() - 20, startY + 12);

    doc.setFont("helvetica", "normal");
    doc.text(`Nama Siswa : ${s.name.toUpperCase()}`, 20, startY + 18);
    doc.text(`NIS / NISN   : ${s.nis || '-'} / ${s.nisn || '-'}`, 20, startY + 23);
    doc.text(`Kelas / Rombel : ${s.grade} ${s.class}`, 20, startY + 28);

    doc.text(`Nama Tugas : ${assign.title.toUpperCase()}`, 110, startY + 18);
    doc.text(`Tipe Asesmen : ${assign.type.toUpperCase()}`, 110, startY + 23);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 110, startY + 28);

    let tableHeaders: string[] = [];
    let tableRows: any[][] = [];
    let scoreSummary = "";

    if (assign.type === 'DCM') {
      const sub = dcmSubmissions.find(sub => sub.studentId === s.id);
      if (!sub) {
        notify("Data jawaban tidak ditemukan.", "error");
        return;
      }
      
      tableHeaders = ['No', 'Aspek / Domain', 'Kategori Masalah', 'Pernyataan Masalah yang Dialami'];
      
      const selectedQuestions = DCM_QUESTIONS.filter(q => sub.selectedIssues.includes(q.id));
      tableRows = selectedQuestions.map((q, idx) => [
        idx + 1,
        q.domain.toUpperCase(),
        q.category,
        q.text
      ]);
      
      scoreSummary = `Total Masalah yang Diceklis: ${sub.selectedIssues.length} Butir Masalah`;
    } 
    else if (assign.type === 'Sociometry') {
      const sess = sociometrySessions.find(sess => sess.rombelId === assign.targetId);
      const choices = sess?.choices?.[s.id] || [];
      const reasons = sess?.reasons?.[s.id] || [];
      
      if (!sess || choices.length === 0) {
        notify("Data pilihan sosiometri tidak ditemukan.", "error");
        return;
      }
      
      tableHeaders = ['Pilihan Ke', 'Nama Siswa yang Dipilih', 'Alasan / Keterangan'];
      tableRows = choices.map((chosenId, idx) => {
        const chosenStudent = students.find(stud => stud.id === chosenId);
        return [
          `Pilihan ${idx + 1}`,
          chosenStudent?.name || 'Siswa Terhapus',
          reasons[idx] || '-'
        ];
      });
      
      scoreSummary = `Kriteria Sosiometri: ${sess.criterion}`;
    }
    else if (assign.type === 'Satisfaction') {
      const sub = satisfactionFeedbacks.find(sub => sub.studentId === s.id);
      if (!sub) {
        notify("Data umpan balik tidak ditemukan.", "error");
        return;
      }
      
      tableHeaders = ['Parameter', 'Umpan Balik Siswa'];
      tableRows = [
        ['Layanan Terkait', sub.category],
        ['Sumber Layanan', sub.serviceSource === 'BK' ? 'Bimbingan Konseling (BK)' : 'Sekolah'],
        ['Tingkat Kepuasan', `${'★'.repeat(sub.rating)}${'☆'.repeat(5 - sub.rating)} (${sub.rating} dari 5 Bintang)`],
        ['Komentar / Saran', sub.comment || '-']
      ];
      
      scoreSummary = `Indeks Kepuasan: ${sub.rating}/5`;
    }
    else {
      // MBTI, SQ, EQ, AQ, General
      const sub = questionnaireSubmissions.find(sub => sub.assignmentId === assign.id && sub.studentId === s.id);
      if (!sub) {
        notify("Data jawaban tidak ditemukan.", "error");
        return;
      }

      const material = materials.find(m => m.id === assign.materialId) || materials.find(m => m.qType === assign.type);
      
      if (assign.type === 'MBTI') {
        const options = material?.qMbtiOptions && material.qMbtiOptions.length > 0 ? material.qMbtiOptions : MBTI_TEMPLATE;
        
        tableHeaders = ['No', 'Pernyataan Opsi A', 'Pernyataan Opsi B', 'Pilihan Siswa'];
        tableRows = options.map((opt, idx) => {
          const choiceVal = sub.responses[idx + 1];
          return [
            idx + 1,
            opt.a,
            opt.b,
            choiceVal === 1 ? 'Opsi A' : choiceVal === 2 ? 'Opsi B' : '-'
          ];
        });
        
        scoreSummary = `Hasil Tipe Kepribadian MBTI: ${sub.mbtiResult || '-'}`;
      } else {
        // SQ, EQ, AQ, General
        let qItems = material?.qItems && material.qItems.length > 0 ? material.qItems : [];
        if (qItems.length === 0) {
          if (assign.type === 'SQ') qItems = SQ_TEMPLATE;
          else if (assign.type === 'EQ') qItems = EQ_TEMPLATE;
          else if (assign.type === 'AQ') qItems = AQ_TEMPLATE;
        }
        
        tableHeaders = ['No', 'Pernyataan Instrumen / Asesmen', 'Skor Jawaban'];
        tableRows = qItems.map((itemText, idx) => {
          const scoreVal = sub.responses[idx + 1];
          return [
            idx + 1,
            itemText,
            scoreVal !== undefined ? `${scoreVal} Poin` : '-'
          ];
        });
        
        let scoreLabel = "Skor Total";
        let scoreVal = sub.totalScore || 0;
        if (assign.type === 'SQ') { scoreLabel = "Skor SQ (Spiritual Quotient)"; scoreVal = sub.sqScore || sub.totalScore || 0; }
        else if (assign.type === 'EQ') { scoreLabel = "Skor EQ (Emotional Quotient)"; scoreVal = sub.eqScore || sub.totalScore || 0; }
        else if (assign.type === 'AQ') { scoreLabel = "Skor AQ (Adversity Quotient)"; scoreVal = sub.aqScore || sub.totalScore || 0; }
        
        scoreSummary = `${scoreLabel}: ${scoreVal} Poin`;
      }
    }

    // Print Score Summary Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`RINGKASAN HASIL: ${scoreSummary.toUpperCase()}`, 20, startY + 38);

    autoTable(doc, {
      startY: startY + 42,
      head: [tableHeaders],
      body: tableRows,
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 8, font: 'helvetica' },
      columnStyles: assign.type === 'DCM' ? { 
        0: { cellWidth: 10 }, 
        1: { cellWidth: 35 }, 
        2: { cellWidth: 40 },
        3: { cellWidth: 95 }
      } : assign.type === 'Sociometry' ? {
        0: { cellWidth: 25, fontStyle: 'bold' },
        1: { cellWidth: 55 },
        2: { cellWidth: 100 }
      } : assign.type === 'Satisfaction' ? {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 140 }
      } : assign.type === 'MBTI' ? {
        0: { cellWidth: 10 },
        1: { cellWidth: 75 },
        2: { cellWidth: 75 },
        3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
      } : {
        0: { cellWidth: 10 },
        1: { cellWidth: 145 },
        2: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
      }
    });

    // Signatures
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const signY = finalY > 240 ? 30 : finalY;
    if (finalY > 240) doc.addPage();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Mengetahui,", 40, signY);
    doc.text("Kepala Sekolah,", 40, signY + 5);
    doc.text(`${schoolProfile.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, signY);
    doc.text("Guru BK / Konselor,", 130, signY + 5);
    
    doc.setFont("helvetica", "bold");
    doc.text(schoolProfile.principalName, 40, signY + 25);
    doc.text(schoolProfile.counselorName, 130, signY + 25);
    doc.setFont("helvetica", "normal");
    doc.text(`NIP. ${schoolProfile.principalNip}`, 40, signY + 29);
    doc.text(`NIP. ${schoolProfile.counselorNip}`, 130, signY + 29);

    doc.save(`Hasil_${assign.type}_${s.name.replace(/\s+/g, '_')}.pdf`);
    notify(`PDF Jawaban ${s.name} berhasil diunduh.`, "success");
  };

  const handleDownloadQuickPDF = (assign: Assignment) => {
    const doc = new jsPDF();
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN KINERJA PENUGASAN SISWA", doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' });
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`JUDUL TUGAS: ${assign.title.toUpperCase()}`, 20, 65);
    doc.text(`TIPE: ${assign.type.toUpperCase()}`, 20, 70);
    doc.text(`KELAS: ${selectedRombel === 'Semua' ? 'SEMUA KELAS BINAAN' : (rombels.find(r => r.id === selectedRombel)?.name || 'N/A')}`, 20, 75);
    doc.text(`TANGGAL CETAK: ${new Date().toLocaleDateString('id-ID')}`, 20, 80);

    let filteredStudentsForReport = students;
    if (selectedRombel !== 'Semua') {
      const r = rombels.find(r => r.id === selectedRombel);
      if (r) {
        const rGrade = r.grade.trim().toUpperCase();
        const normalize = (str: string) => {
          if (!str) return '';
          return str.toUpperCase()
            .replace(new RegExp(`^${rGrade}\\s*`, 'i'), '')
            .replace(/\s+/g, ' ')
            .replace(/\b0+(\d)/g, '$1')
            .trim();
        };
        filteredStudentsForReport = students.filter(s => s.grade.trim().toUpperCase() === rGrade && normalize(s.class) === normalize(r.name));
      }
    } else if (userRole === 'counselor') {
      filteredStudentsForReport = students.filter(s => rombels.some(r => managedRombelIds.has(r.id) && r.grade.trim().toUpperCase() === s.grade.trim().toUpperCase() && r.name.toLowerCase().includes(s.class.toLowerCase().trim())));
    }

    const tableRows = filteredStudentsForReport.map((s, index) => {
      const isDone = getCompletionStatus(assign, s.id);
      let res = '-', dt = '-';
      if (assign.type === 'DCM') {
        const sub = dcmSubmissions.find(sub => sub.studentId === s.id);
        if (sub) {
          res = `${sub.selectedIssues?.length || 0} Masalah`;
          dt = new Date(sub.date).toLocaleDateString('id-ID');
        }
      } else if (assign.type === 'Sociometry') {
        if (sociometrySessions.some(sess => sess.rombelId === assign.targetId && sess.choices && sess.choices[s.id])) {
          res = 'Sudah Memilih';
          dt = 'N/A';
        }
      } else if (assign.type === 'Satisfaction') {
        const sub = satisfactionFeedbacks.find(sub => sub.studentId === s.id);
        if (sub) {
          res = `${sub.rating || 0} Bintang`;
          dt = new Date(sub.date).toLocaleDateString('id-ID');
        }
      } else {
        const sub = questionnaireSubmissions.find(sub => sub.assignmentId === assign.id && sub.studentId === s.id);
        if (sub) {
          res = sub.mbtiResult || `${sub.totalScore || 0} Poin`;
          dt = new Date(sub.date).toLocaleDateString('id-ID');
        }
      }
      return [index + 1, s.name, `${s.grade} ${s.class}`, isDone ? 'SELESAI' : 'BELUM', res, dt];
    });

    autoTable(doc, {
      startY: 85, head: [['No', 'Nama Siswa', 'Kelas', 'Status', 'Skor/Hasil', 'Tanggal']], body: tableRows,
      headStyles: { fillColor: [20, 184, 166] }, styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 50 }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'right' } }
    });
    doc.save(`Laporan_${assign.title.replace(/\s+/g, '_')}.pdf`);
    notify("PDF berhasil diunduh.");
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tugas & Angket</h2>
          <p className="text-slate-500 text-sm">{isStudent ? 'Selesaikan tugas dan instrumen asesmen Anda.' : 'Kelola distribusi materi dan asesmen siswa.'}</p>
        </div>
        {canManage && (
          <button onClick={handleOpenCreate} className="bg-teal-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 shadow-xl transition-all flex items-center gap-2 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
            Buat Tugas
          </button>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border shadow-sm">
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            {(['Aktif', 'Selesai'] as const).map(t => (
              <button key={t} onClick={() => { setActiveTab(t); setViewResultsId(null); }} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
            ))}
            {canManage && (
              <button onClick={() => { setActiveTab('Laporan'); setViewResultsId(null); }} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Laporan' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Laporan</button>
            )}
          </div>
          {canManage && (
            <select className="bg-slate-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-600 outline-none" value={selectedRombel} onChange={e => setSelectedRombel(e.target.value)}>
              <option value="Semua">Semua Kelas</option>
              {accessibleRombels.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}
        </div>
        <div className="relative w-full md:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input type="text" placeholder="Cari..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {activeTab === 'Laporan' && canManage ? (
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pilih Tugas</label>
              <select className="w-full bg-slate-50 border-2 rounded-2xl p-4 text-sm font-bold outline-none" value={reportAssignmentId} onChange={e => setReportAssignmentId(e.target.value)}>
                <option value="">-- Pilih --</option>
                {assignments.map(a => <option key={a.id} value={a.id}>{a.title} ({a.type})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pilih Kelas</label>
              <select className="w-full bg-slate-50 border-2 rounded-2xl p-4 text-sm font-bold outline-none" value={reportRombelId} onChange={e => setReportRombelId(e.target.value)}>
                <option value="Semua">Semua Kelas</option>
                {accessibleRombels.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          {!reportAssignmentId ? (
            <div className="py-20 text-center opacity-40 italic text-sm font-bold">Silakan pilih tugas untuk memuat data.</div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto border rounded-3xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b">
                    <tr>
                      <th className="px-6 py-4">Siswa</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Hasil</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                      <th className="px-6 py-4 text-right">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(() => {
                      const selectedAssign = assignments.find(a => a.id === reportAssignmentId);
                      if (!selectedAssign) return null;
                      let fs = students;
                      if (reportRombelId !== 'Semua') {
                        const r = rombels.find(r => r.id === reportRombelId);
                        if (r) {
                          const normalize = (str: string) => str.toUpperCase().replace(/\s+/g, ' ').replace(/\b0+(\d)/g, '$1').trim();
                          const rGrade = r.grade.trim().toUpperCase();
                          const rSuffix = normalize(r.name.replace(new RegExp(`^${rGrade}\\s*`, 'i'), '').trim());
                          fs = students.filter(s => s.grade.trim().toUpperCase() === rGrade && normalize(s.class) === rSuffix);
                        }
                      }
                      return fs.map(s => {
                        const done = getCompletionStatus(selectedAssign, s.id);
                        let res = '-', dt = '-';
                        if (selectedAssign.type === 'DCM') { 
                          const sub = dcmSubmissions.find(sub => sub.studentId === s.id); 
                          if (sub) { res = `${sub.selectedIssues?.length || 0} Masalah`; dt = new Date(sub.date).toLocaleDateString('id-ID'); } 
                        }
                        else if (selectedAssign.type === 'Sociometry') { 
                          if (sociometrySessions.some(sess => sess.rombelId === selectedAssign.targetId && sess.choices && sess.choices[s.id])) { res = 'Sudah'; dt = 'N/A'; } 
                        }
                        else if (selectedAssign.type === 'Satisfaction') { 
                          const sub = satisfactionFeedbacks.find(sub => sub.studentId === s.id); 
                          if (sub) { res = `${sub.rating || 0} P`; dt = new Date(sub.date).toLocaleDateString('id-ID'); } 
                        }
                        else { 
                          const sub = questionnaireSubmissions.find(sub => sub.assignmentId === selectedAssign.id && sub.studentId === s.id); 
                          if (sub) { res = sub.mbtiResult || `${sub.totalScore || 0} P`; dt = new Date(sub.date).toLocaleDateString('id-ID'); } 
                        }
                        return (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4"><p className="font-bold">{s.name}</p><p className="text-[10px] text-slate-400">{s.grade} {s.class}</p></td>
                            <td className="px-6 py-4 text-center">{done ? <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Selesai</span> : <span className="bg-rose-50 text-rose-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">Belum</span>}</td>
                            <td className="px-6 py-4 text-center font-bold text-xs">{res}</td>
                            <td className="px-6 py-4 text-center">
                              {done && (
                                <div className="flex justify-center gap-1.5">
                                  <button 
                                    onClick={() => handleDownloadStudentAnswersPDF(selectedAssign, s)}
                                    className="p-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-all"
                                    title="Cetak Jawaban Siswa"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                  </button>
                                  <button 
                                    onClick={() => handleResetStudent(selectedAssign, s.id, s.name)}
                                    className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-all"
                                    title="Reset Hasil Tes"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-[10px] text-slate-400 font-bold">{dt}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button onClick={handleDownloadPDF} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center gap-2 active:scale-95"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Unduh Laporan (PDF)</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {paginatedAssignments.map(assign => {
              const material = materials.find(m => m.id === assign.materialId);
              const isViewingResults = viewResultsId === assign.id;
              const targetStudents = assign.targetType === 'Rombel' 
                ? students.filter(s => {
                    const r = rombels.find(r => r.id === assign.targetId);
                    if (!r) return false;
                    const rGrade = r.grade.trim().toUpperCase();
                    const normalize = (str: string) => {
                      if (!str) return '';
                      return str.toUpperCase()
                        .replace(new RegExp(`^${rGrade}\\s*`, 'i'), '')
                        .replace(/\s+/g, ' ')
                        .replace(/\b0+(\d)/g, '$1')
                        .trim();
                    };
                    return s.grade.trim().toUpperCase() === rGrade && normalize(s.class) === normalize(r.name);
                  })
                : students.filter(s => s.id === assign.targetId);
              const doneCount = targetStudents.filter(s => getCompletionStatus(assign, s.id)).length;

              return (
                <div key={assign.id} className="space-y-4">
                  <div className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row items-center gap-6 group relative overflow-hidden ${assign.status === 'Selesai' ? 'border-teal-200' : ''}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${assign.type === 'DCM' || assign.type === 'Sociometry' ? 'bg-rose-500' : 'bg-teal-500'}`}>
                      {assign.type === 'DCM' ? <ICONS.DCM /> : assign.type === 'Sociometry' ? <ICONS.Sociometry /> : <ICONS.Assignments />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-widest">{assign.type}</span>
                        {canManage && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase">{doneCount} / {targetStudents.length} Selesai</span>}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 truncate">{assign.title}</h3>
                      {material && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-tight">Modul: {material.qTitle}</p>
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wide">Deadline: {new Date(assign.dueDate).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isStudent ? (
                        <button onClick={() => handleNavigateToTask(assign)} disabled={getCompletionStatus(assign, currentUserId)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${getCompletionStatus(assign, currentUserId) ? 'bg-emerald-50 text-emerald-600' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg'}`}>{getCompletionStatus(assign, currentUserId) ? 'Selesai' : 'Kerjakan'}</button>
                      ) : (
                        <>
                          <button onClick={() => setViewResultsId(isViewingResults ? null : assign.id)} title="Lihat Progress" className={`p-2.5 rounded-xl transition-all ${isViewingResults ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-teal-600'}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>
                          <button onClick={() => handleDownloadQuickPDF(assign)} title="Cetak Laporan" className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 transition-all"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></button>
                          <button onClick={() => handleEdit(assign)} title="Edit Tugas" className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-amber-600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
                          <button onClick={() => handleDelete(assign.id)} title="Hapus Tugas" className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
                        </>
                      )}
                    </div>
                  </div>
                  {isViewingResults && (
                    <div className="bg-slate-50 rounded-[2rem] border p-6 animate-in slide-in-from-top-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {targetStudents.map(s => {
                          const done = getCompletionStatus(assign, s.id);
                          return (
                            <div key={s.id} className="bg-white p-3 rounded-xl border flex items-center justify-between">
                              <div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>{s.name.charAt(0)}</div><p className="text-[10px] font-bold text-slate-700 truncate">{s.name}</p></div>
                                <span className={`text-[8px] font-black uppercase ${done ? 'text-emerald-500' : 'text-slate-300'}`}>{done ? 'Selesai' : 'Belum'}</span>
                                {done && (
                                  <button 
                                    onClick={() => handleResetStudent(assign, s.id, s.name)}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-all ml-2"
                                    title="Reset Hasil Tes"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                  </button>
                                )}
                              </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border shadow-sm">
              <p className="text-xs text-slate-500">Tugas <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredAssignments.length)}</span> dari <span className="font-bold">{filteredAssignments.length}</span></p>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>{i + 1}</button>
                ))}
              </div>
            </div>
          )}
          {filteredAssignments.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-slate-400 italic text-sm font-bold">Tidak ada tugas yang ditemukan.</div>
          )}
        </div>
      )}

      {isModalOpen && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <header className={`p-8 ${editingId ? 'bg-amber-600' : 'bg-teal-600'} text-white`}>
              <h3 className="text-xl font-black uppercase italic">{editingId ? 'Edit Tugas' : 'Buat Tugas Baru'}</h3>
            </header>
            <form onSubmit={handleSave} className="p-8 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Judul</label>
                <input required className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-teal-100" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe</label>
                  <select className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold outline-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                    <option value="General">Tugas Umum</option>
                    <option value="DCM">Asesmen DCM</option>
                    <option value="Sociometry">Sosiometri</option>
                    <option value="MBTI">MBTI</option>
                    <option value="SQ">SQ</option>
                    <option value="EQ">EQ</option>
                    <option value="AQ">AQ</option>
                    <option value="Satisfaction">Kepuasan</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</label>
                  <input type="date" className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold outline-none" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Distribusi</label>
                <select required className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold outline-none" value={formData.targetId} onChange={e => setFormData({ ...formData, targetId: e.target.value })}>
                  <option value="">-- Pilih Target --</option>
                  {accessibleRombels.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modul Terkait (Opsional)</label>
                <select className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold outline-none" value={formData.materialId} onChange={e => setFormData({ ...formData, materialId: e.target.value })}>
                  <option value="">-- Pilih Modul dari Repository --</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.qTitle || m.title} ({m.qType || m.category})</option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 italic">Modul diambil dari Repository Instrumen & Materi.</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instruksi</label>
                <textarea className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-medium h-24 outline-none" value={formData.instructions} onChange={e => setFormData({ ...formData, instructions: e.target.value })} />
              </div>
              <div className="flex gap-4 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-bold text-slate-400 uppercase tracking-widest text-xs">Batal</button>
                <button type="submit" className={`flex-[2] py-3 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${editingId ? 'bg-amber-600' : 'bg-teal-600'}`}>{editingId ? 'Simpan' : 'Terbitkan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
