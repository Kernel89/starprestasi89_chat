
import React, { useMemo } from 'react';
import { Student, Rombel, TeachingSlot, Teacher, SchoolProfile, UserSession, UserRole, CounselorProfileData } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';

interface StudentBioReportProps {
  students: Student[];
  rombels: Rombel[];
  schedule: TeachingSlot[];
  teachers: Teacher[];
  schoolProfile: SchoolProfile;
  currentUser: UserSession | null;
  counselorProfile: CounselorProfileData;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const StudentBioReport: React.FC<StudentBioReportProps> = ({ 
  students, 
  rombels, 
  schedule, 
  teachers, 
  schoolProfile, 
  currentUser,
  counselorProfile,
  notify 
}) => {

  
  // 1. Identifikasi Guru BK yang sedang login
  const currentCounselor = useMemo(() => {
    if (!currentUser) return null;
    
    if (currentUser.role === 'counselor') {
        const exactMatch = teachers.find(t => t.name === currentUser.name);
        if (exactMatch) return exactMatch;
        const fallbackCounselor = teachers.find(t => t.role === 'Konselor');
        return fallbackCounselor || null;
    }
    return null;
  }, [currentUser, teachers]);

  // 2. Ambil Kelas (Rombel) berdasarkan Jadwal BK
  const myRombels = useMemo(() => {
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'principal' || currentUser?.role === 'supervisor') {
        return rombels;
    }
    if (!currentCounselor) return [];
    const scheduledRombelIds = schedule
      .filter(slot => slot.teacherId === currentCounselor.id)
      .map(slot => slot.rombelId);
    const uniqueIds = Array.from(new Set(scheduledRombelIds));
    return rombels.filter(r => uniqueIds.includes(r.id));
  }, [schedule, currentCounselor, rombels, currentUser]);

  /**
   * Helper: Normalisasi string untuk perbandingan kelas yang presisi.
   * - Mengubah ke uppercase & trim.
   * - Menghapus karakter pemisah non-standar (- atau _).
   * - Mengubah angka "09" menjadi "9" agar konsisten (integer parsing).
   */
  const normalizeForComparison = (str: string) => {
    if (!str) return '';
    // Ganti karakter pemisah non-standar dengan spasi, lalu trim & uppercase
    const cleaned = str.replace(/[-_]/g, ' ').trim().toUpperCase();
    
    return cleaned.split(/\s+/)
      .map(part => {
        // Normalisasi angka: "09" -> "9", "9" -> "9"
        const num = parseInt(part);
        return isNaN(num) ? part : num.toString();
      })
      .join(' ');
  };

  const handlePrintClassBio = (rombel: Rombel) => {
    const doc = new jsPDF('landscape');
    
    // Normalisasi Nama Rombel Target (misal: "X MIPA 01" -> "X MIPA 1")
    const targetSignature = normalizeForComparison(rombel.name);

    const classStudents = students.filter(s => {
      if (s.status !== 'Aktif') return false;

      // Konstruksi nama kelas siswa dari data Grade + Class
      // Contoh: Grade "X" + Class "MIPA 01" = "X MIPA 01" -> Normalized: "X MIPA 1"
      const studentRombelName = `${s.grade} ${s.class}`;
      const studentSignature = normalizeForComparison(studentRombelName);
      
      return studentSignature === targetSignature;
    }).sort((a, b) => a.name.localeCompare(b.name));

    if (classStudents.length === 0) {
        notify(`Tidak ada data siswa aktif di kelas ${rombel.name}. Pastikan data Tingkat dan Nama Kelas di menu Siswa sesuai dengan nama Rombel.`, "error");
        return;
    }

    const startY = drawLetterhead(doc, schoolProfile, 'l');

    // --- JUDUL ---
    doc.setFontSize(14); doc.setFont("times", "bold");
    doc.text(`LAPORAN BIODATA SISWA ASUH`, 148.5, startY + 5, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Jumlah: ${classStudents.length} Siswa`, 148.5, startY + 11, { align: 'center' });

    // --- TABEL ---
    const tableHead = [[
      'No', 
      'Identitas Siswa', 
      'Latar Belakang', 
      'Kontak Siswa', 
      'Data Ayah', 
      'Data Ibu', 
      'Data Wali'
    ]];

    const tableBody = classStudents.map((s, index) => {
        // Helper untuk format data kosong
        const v = (val: any) => val || '-';
        
        // 1. Identitas Siswa
        const identity = [
          `${s.name} (${v(s.nickname)})`,
          `NIS: ${v(s.nis)} / NISN: ${v(s.nisn)}`,
          `${s.gender === 'Laki-laki' ? 'L' : 'P'} / ${v(s.religion)}`,
          `${v(s.birthPlace)}, ${s.birthDate ? new Date(s.birthDate).toLocaleDateString('id-ID') : '-'}`
        ].join('\n');

        // 2. Latar Belakang
        const background = [
          `Status: ${v(s.familyStatus)}`,
          `Anak ke-${v(s.birthOrder)}`,
          `Asal: ${v(s.juniorHighOrigin)}`,
          `Diterima: ${v(s.acceptedClassX)}`
        ].join('\n');

        // 3. Kontak Siswa
        const contact = [
          `HP: ${v(s.phone)}`,
          `IG: ${v(s.instagram)}`,
          `Alamat: ${v(s.address)}`
        ].join('\n');

        // 4. Data Ayah
        const father = [
          `Nama: ${v(s.fatherName || s.parentName)}`,
          `Pek: ${v(s.fatherJob)}`,
          `HP: ${v(s.fatherPhone || s.parentPhone)}`,
          `Alamat: ${v(s.fatherAddress)}`
        ].join('\n');

        // 5. Data Ibu
        const mother = [
          `Nama: ${v(s.motherName)}`,
          `Pek: ${v(s.motherJob)}`,
          `HP: ${v(s.motherPhone)}`,
          `Alamat: ${v(s.motherAddress)}`
        ].join('\n');

        // 6. Data Wali
        const guardian = s.hasGuardian ? [
          `Nama: ${v(s.guardianName)}`,
          `Pek: ${v(s.guardianJob)}`,
          `Alamat: ${v(s.guardianAddress)}`
        ].join('\n') : '-';

        return [
            index + 1,
            identity,
            background,
            contact,
            father,
            mother,
            guardian
        ];
    });

    autoTable(doc, {
      startY: startY + 20,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: 'times', valign: 'top', overflow: 'linebreak' },
      headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },   // No
        1: { cellWidth: 50 },                    // Identitas
        2: { cellWidth: 35 },                    // Latar Belakang
        3: { cellWidth: 45 },                    // Kontak
        4: { cellWidth: 40 },                    // Ayah
        5: { cellWidth: 40 },                    // Ibu
        6: { cellWidth: 'auto' }                 // Wali
      }
    });

    // --- TANDA TANGAN ---
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const signY = finalY > 170 ? 30 : finalY;
    if (finalY > 170) doc.addPage();

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Mengetahui,", 30, signY);
    doc.text("Kepala Sekolah,", 30, signY + 5);
    doc.setFont("times", "bold");
    doc.text(schoolProfile.principalName, 30, signY + 30);
    doc.setFont("times", "normal");
    doc.text(`NIP. ${schoolProfile.principalNip}`, 30, signY + 35);

    const dateStr = `${schoolProfile.city || 'Tempat'}, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`;
    doc.text(dateStr, 220, signY);
    doc.text("Guru BK / Konselor,", 220, signY + 5);
    doc.setFont("times", "bold");
    const counselorNameToPrint = currentUser?.role === 'counselor' ? (counselorProfile.name || currentUser.name) : (currentCounselor?.name || schoolProfile.counselorName);
    const counselorNipToPrint = currentUser?.role === 'counselor' ? (counselorProfile.nip || "-") : (currentCounselor?.nip || schoolProfile.counselorNip);
    doc.text(counselorNameToPrint, 220, signY + 30);
    doc.setFont("times", "normal");
    doc.text(`NIP. ${counselorNipToPrint}`, 220, signY + 35);

    doc.save(`Biodata_Siswa_Asuh_${Date.now()}.pdf`);
    notify(`Laporan biodata siswa berhasil diunduh.`, "success");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Biodata Siswa Asuh</h2>
          <p className="text-slate-500 text-sm">Laporan lengkap profil siswa berdasarkan jadwal bimbingan kelas.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Kelas Asuh</p>
                <p className="text-xl font-black text-slate-800 leading-none">{myRombels.length} Rombel</p>
            </div>
        </div>
      </header>

      {currentUser?.role === 'counselor' && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3 text-indigo-700 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <span className="text-xs font-medium">
               Menampilkan kelas yang diampu oleh: <strong>{currentCounselor?.name || currentUser.name}</strong>.
            </span>
        </div>
      )}

      {myRombels.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700">Belum Ada Jadwal Kelas</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                Silakan atur <b>Jadwal Mengajar BK</b> terlebih dahulu agar sistem dapat memetakan siswa asuh Anda.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myRombels.map(rombel => {
                const targetSignature = normalizeForComparison(rombel.name);
                
                const studentCount = students.filter(s => {
                    if (s.status !== 'Aktif') return false;
                    const studentSignature = normalizeForComparison(`${s.grade} ${s.class}`);
                    return studentSignature === targetSignature;
                }).length;

                return (
                    <div key={rombel.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black border border-indigo-100 text-xl shadow-sm">
                                {rombel.grade}
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${studentCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                    {studentCount} Siswa
                                </span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-black text-slate-800 mb-1">{rombel.name}</h4>
                            <p className="text-xs text-slate-500 font-medium truncate w-full">Konselor: {teachers.find(t => t.id === rombel.homeroomTeacherId)?.name || 'Belum diatur'}</p>
                        </div>
                        <button 
                            onClick={() => handlePrintClassBio(rombel)}
                            disabled={studentCount === 0}
                            className={`w-full mt-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${studentCount > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                            Cetak Laporan
                        </button>
                    </div>
                )
            })}
        </div>
      )}
    </div>
  );
};

export default StudentBioReport;
