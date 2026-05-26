
import React, { useState } from 'react';
import { BKAdministration as BKAdminType, BKAdminDocument, SchoolProfile, CounselorProfileData } from '../types';
import { ICONS } from '../constants';
import { GradeConfig } from '../App';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';

interface BKAdministrationProps {
  data: BKAdminType;
  setData: React.Dispatch<React.SetStateAction<BKAdminType>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  schoolProfile: SchoolProfile;
  gradesConfig: GradeConfig[];
  counselorProfile: CounselorProfileData;
}

const RPL_FIELDS = [
  { id: 'A', label: 'Identitas' },
  { id: 'B', label: 'Topik' },
  { id: 'C', label: 'Alokasi Waktu' },
  { id: 'D', label: 'Bidang Bimbingan' },
  { id: 'E', label: 'Metode' },
  { id: 'F', label: 'Jenis Layanan' },
  { id: 'G', label: 'Fungsi Layanan' },
  { id: 'H', label: 'Nilai Karakter' },
  { id: 'I', label: 'Tujuan' },
  { id: 'J', label: 'Media' },
  { id: 'K', label: 'Kegiatan' },
  { id: 'L', label: 'Sumber' },
  { id: 'M', label: 'Evaluasi' }
];

const DEFAULT_KEGIATAN = [
  { tahap: '1. Pembukaan Awal', kegiatan: '', waktu: '' },
  { tahap: '2. Inti', kegiatan: '', waktu: '' },
  { tahap: '3. Penutup', kegiatan: '', waktu: '' }
];

const BKAdministration: React.FC<BKAdministrationProps> = ({ 
  data, 
  setData, 
  notify, 
  schoolProfile, 
  gradesConfig,
  counselorProfile
}) => {
  const [activeTab, setActiveTab] = useState<'Vision' | 'Annual' | 'General' | 'RPL' | 'Collection'>('Vision');
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Annual' as BKAdminDocument['category'],
    rplFields: {} as Record<string, string>,
    rplIdentitas: {
      sekolah: schoolProfile.name,
      kelas: '',
      semester: '',
      tahunPelajaran: schoolProfile.activeAcademicYear || ''
    },
    rplTujuan: {
      umum: '',
      khusus: ''
    },
    rplKegiatan: JSON.parse(JSON.stringify(DEFAULT_KEGIATAN))
  });

  const handleSaveVisionMission = (val: string) => {
    setData(prev => ({ ...prev, visionMission: val }));
  };

  const handleSaveGeneralProgram = (val: string) => {
    setData(prev => ({ ...prev, generalProgram: val }));
  };

  const handleImportSpirit = () => {
    const spirit = `VISI SEKOLAH:\n${schoolProfile.vision}\n\nMISI SEKOLAH:\n${schoolProfile.mission.join('\n')}`;
    setData(prev => ({ ...prev, visionMission: spirit }));
    notify("Visi & Misi diimpor dari Profil Sekolah.");
  };

  const parseRPLContent = (content: string) => {
    let rplData = {} as Record<string, string>;
    let identitasData = {
      sekolah: schoolProfile.name,
      kelas: '',
      semester: '',
      tahunPelajaran: schoolProfile.activeAcademicYear || ''
    };
    let tujuanData = {
      umum: '',
      khusus: ''
    };
    let kegiatanData = JSON.parse(JSON.stringify(DEFAULT_KEGIATAN));

    try {
      const sections = content.split(/\n\n([A-M])\.\s/);
      if (sections.length > 1) {
        for (let i = 1; i < sections.length; i += 2) {
          const key = sections[i];
          const sectionContent = sections[i + 1];
          if (key && sectionContent) {
             const fieldId = key;
             const fieldObj = RPL_FIELDS.find(f => f.id === fieldId);
             const labelPrefix = fieldObj ? `${fieldObj.label}:\n` : '';
             const cleanContent = sectionContent.startsWith(labelPrefix) ? sectionContent.replace(labelPrefix, '') : sectionContent;
             rplData[fieldId] = cleanContent.trim();

             if (fieldId === 'A') {
               const lines = cleanContent.split('\n');
               lines.forEach(line => {
                 if (line.indexOf('Sekolah:') !== -1) identitasData.sekolah = line.replace('Sekolah:', '').trim();
                 if (line.indexOf('Kelas:') !== -1) identitasData.kelas = line.replace('Kelas:', '').trim();
                 if (line.indexOf('Semester:') !== -1) identitasData.semester = line.replace('Semester:', '').trim();
                 if (line.indexOf('Tahun Pelajaran:') !== -1) identitasData.tahunPelajaran = line.replace('Tahun Pelajaran:', '').trim();
               });
             }

             if (fieldId === 'I') {
               const tujuanParts = cleanContent.split(/\n\nTujuan Khusus:\n/);
               tujuanData.umum = tujuanParts[0]?.replace('Tujuan Umum:\n', '').trim() || '';
               tujuanData.khusus = tujuanParts[1]?.trim() || '';
             }

             if (fieldId === 'K') {
               const lines = cleanContent.split('\n');
               const parsedRows: any[] = [];
               let currentRow: any = null;
               lines.forEach(line => {
                  if (line.startsWith('Tahap: ')) {
                    const parts = line.split(' | ');
                    currentRow = { tahap: '', kegiatan: '', waktu: '' };
                    parts.forEach(p => {
                      if (p.startsWith('Tahap: ')) currentRow.tahap = p.replace('Tahap: ', '').trim();
                      if (p.startsWith('Kegiatan: ')) currentRow.kegiatan = p.replace('Kegiatan: ', '').trim();
                      if (p.startsWith('Waktu: ')) currentRow.waktu = p.replace('Waktu: ', '').trim();
                    });
                    if (currentRow.tahap) parsedRows.push(currentRow);
                  } else if (currentRow && line.trim()) {
                    // Handle multi-line activity details by appending non-prefixed lines
                    currentRow.kegiatan += '\n' + line.trim();
                  }
               });
               if (parsedRows.length > 0) kegiatanData = parsedRows;
             }
          }
        }
      } else {
        rplData = RPL_FIELDS.reduce((acc, f) => ({ ...acc, [f.id]: '' }), {});
      }
    } catch (e) {
      console.error("Failed to parse RPL:", e);
      rplData = RPL_FIELDS.reduce((acc, f) => ({ ...acc, [f.id]: '' }), {});
    }

    return { rplData, identitasData, tujuanData, kegiatanData };
  };

  const openAddDoc = (cat: BKAdminDocument['category']) => {
    setFormData({ 
      title: '', 
      content: '', 
      category: cat,
      rplFields: cat === 'RPL' ? RPL_FIELDS.reduce((acc, f) => ({ ...acc, [f.id]: '' }), {}) : {},
      rplIdentitas: {
        sekolah: schoolProfile.name,
        kelas: data.lastUsedKelas || '',
        semester: data.lastUsedSemester || '',
        tahunPelajaran: schoolProfile.activeAcademicYear || ''
      },
      rplTujuan: {
        umum: '',
        khusus: ''
      },
      rplKegiatan: JSON.parse(JSON.stringify(DEFAULT_KEGIATAN))
    });
    setEditingId(null);
    setIsAddMode(true);
    if (cat === 'RPL') setActiveTab('RPL');
  };

  const openEditDoc = (doc: BKAdminDocument) => {
    const { rplData, identitasData, tujuanData, kegiatanData } = parseRPLContent(doc.content);

    setFormData({ 
      title: doc.title, 
      content: doc.content, 
      category: doc.category,
      rplFields: rplData,
      rplIdentitas: identitasData,
      rplTujuan: tujuanData,
      rplKegiatan: kegiatanData
    });
    setEditingId(doc.id);
    setIsAddMode(true);
    if (doc.category === 'RPL') setActiveTab('RPL');
  };

  const handleSaveDoc = () => {
    if (!formData.title.trim()) {
      notify("Judul dokumen harus diisi.", "error");
      return;
    }

    let finalContent = formData.content;
    if (formData.category === 'RPL') {
      const identitasCombined = `Sekolah: ${formData.rplIdentitas.sekolah}\nKelas: ${formData.rplIdentitas.kelas}\nSemester: ${formData.rplIdentitas.semester}\nTahun Pelajaran: ${formData.rplIdentitas.tahunPelajaran}`;
      const tujuanCombined = `Tujuan Umum:\n${formData.rplTujuan.umum}\n\nTujuan Khusus:\n${formData.rplTujuan.khusus}`;
      const kegiatanCombined = formData.rplKegiatan.map((row: any) => `Tahap: ${row.tahap} | Kegiatan: ${row.kegiatan} | Waktu: ${row.waktu}`).join('\n');
      
      finalContent = RPL_FIELDS.map(f => {
        let val = '';
        if (f.id === 'A') val = identitasCombined;
        else if (f.id === 'I') val = tujuanCombined;
        else if (f.id === 'K') val = kegiatanCombined;
        else val = (formData.rplFields[f.id] || '');
        return `${f.id}. ${f.label}:\n${val}`;
      }).join('\n\n');
    }

    const now = new Date().toISOString();
    
    if (editingId) {
      const updateList = (list: BKAdminDocument[]) => 
        list.map(d => d.id === editingId ? { ...d, title: formData.title, content: finalContent, lastEdited: now } : d);

      setData(prev => ({
        ...prev,
        annualPrograms: formData.category === 'Annual' || formData.category === 'Semester' ? updateList(prev.annualPrograms) : prev.annualPrograms,
        rplDocuments: formData.category === 'RPL' ? updateList(prev.rplDocuments) : prev.rplDocuments,
        lastUsedKelas: formData.category === 'RPL' ? formData.rplIdentitas.kelas : prev.lastUsedKelas,
        lastUsedSemester: formData.category === 'RPL' ? formData.rplIdentitas.semester : prev.lastUsedSemester
      }));
      notify("Dokumen diperbarui.");
    } else {
      const newDoc: BKAdminDocument = {
        id: `doc-${Date.now()}`,
        title: formData.title,
        content: finalContent,
        category: formData.category,
        date: now.split('T')[0],
        lastEdited: now
      };

      setData(prev => ({
        ...prev,
        annualPrograms: formData.category === 'Annual' || formData.category === 'Semester' ? [newDoc, ...prev.annualPrograms] : prev.annualPrograms,
        rplDocuments: formData.category === 'RPL' ? [newDoc, ...prev.rplDocuments] : prev.rplDocuments,
        lastUsedKelas: formData.category === 'RPL' ? formData.rplIdentitas.kelas : prev.lastUsedKelas,
        lastUsedSemester: formData.category === 'RPL' ? formData.rplIdentitas.semester : prev.lastUsedSemester
      }));
      notify("Dokumen baru ditambahkan.");
    }

    setIsAddMode(false);
    if (formData.category === 'RPL') setActiveTab('Collection');
  };

  const handleDeleteDoc = (id: string, cat: BKAdminDocument['category']) => {
    if (!window.confirm("Hapus dokumen ini?")) return;
    
    setData(prev => ({
      ...prev,
      annualPrograms: cat === 'Annual' || cat === 'Semester' ? prev.annualPrograms.filter(d => d.id !== id) : prev.annualPrograms,
      rplDocuments: cat === 'RPL' ? prev.rplDocuments.filter(d => d.id !== id) : prev.rplDocuments
    }));
    notify("Dokumen dihapus.");
  };

  const handleExportRPLPDF = (doc: BKAdminDocument) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { rplData, identitasData, tujuanData, kegiatanData } = parseRPLContent(doc.content);
    
    const startY = drawLetterhead(pdf, schoolProfile, 'p');

    pdf.setFontSize(14); pdf.setFont("times", "bold");
    pdf.text("RENCANA PELAKSANAAN LAYANAN (RPL)", 105, startY + 5, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text("BIMBINGAN DAN KONSELING", 105, startY + 11, { align: 'center' });
    
    // Sub-header for Class and Semester
    pdf.setFontSize(10); pdf.setFont("times", "italic");
    const subHeaderText = `Jenjang (Kelas): ${identitasData.kelas || '-'} | Semester: ${identitasData.semester || '-'}`;
    pdf.text(subHeaderText, 105, startY + 17, { align: 'center' });

    let yPos = startY + 28;

    const addField = (label: string, value: string, showLabel: boolean = true) => {
      pdf.setFontSize(11); pdf.setFont("times", "bold");
      if (showLabel) {
        const splitLabel = pdf.splitTextToSize(label, 40);
        pdf.text(splitLabel, 15, yPos);
        pdf.text(":", 55, yPos);
      }
      
      pdf.setFont("times", "normal");
      const splitValue = pdf.splitTextToSize(value || '-', 135);
      pdf.text(splitValue, 60, yPos);
      
      const lines = Math.max(1, splitValue.length);
      yPos += (lines * 6) + 2;
      
      if (yPos > 270) { pdf.addPage(); yPos = 20; }
    };

    // A. Identitas
    pdf.setFontSize(11); pdf.setFont("times", "bold");
    pdf.text("A. Identitas", 15, yPos);
    yPos += 2;
    
    autoTable(pdf, {
      startY: yPos,
      body: [
        ['Sekolah', ':', identitasData.sekolah],
        ['Jenjang (Kelas)', ':', identitasData.kelas],
        ['Semester', ':', identitasData.semester],
        ['Tahun Pelajaran', ':', identitasData.tahunPelajaran],
      ],
      theme: 'plain',
      margin: { left: 20 },
      styles: { font: 'times', fontSize: 10, cellPadding: 1, minCellHeight: 6 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 5 },
        2: { cellWidth: 'auto' }
      }
    });
    yPos = (pdf as any).lastAutoTable.finalY + 8;

    // B-H
    const nextFields = [
      { id: 'B', l: 'B. Topik' },
      { id: 'C', l: 'C. Alokasi Waktu' },
      { id: 'D', l: 'D. Bidang Bimbingan' },
      { id: 'E', l: 'E. Metode' },
      { id: 'F', l: 'F. Jenis Layanan' },
      { id: 'G', l: 'G. Fungsi Layanan' },
      { id: 'H', l: 'H. Nilai Karakter' }
    ];

    nextFields.forEach(f => {
      addField(f.l, rplData[f.id]);
    });

    // I. Tujuan
    pdf.setFontSize(11); pdf.setFont("times", "bold");
    pdf.text("I. Tujuan", 15, yPos); yPos += 6;
    pdf.setFont("times", "italic");
    pdf.text("1. Tujuan Umum:", 20, yPos); yPos += 5;
    pdf.setFont("times", "normal");
    const splitUmum = pdf.splitTextToSize(tujuanData.umum || '-', 165);
    pdf.text(splitUmum, 25, yPos);
    yPos += (splitUmum.length * 5) + 3;
    
    if (yPos > 270) { pdf.addPage(); yPos = 20; }
    
    pdf.setFont("times", "italic");
    pdf.text("2. Tujuan Khusus:", 20, yPos); yPos += 5;
    pdf.setFont("times", "normal");
    const splitKhusus = pdf.splitTextToSize(tujuanData.khusus || '-', 165);
    pdf.text(splitKhusus, 25, yPos);
    yPos += (splitKhusus.length * 5) + 4;

    if (yPos > 270) { pdf.addPage(); yPos = 20; }

    // J. Media
    addField("J. Media", rplData['J']);
    yPos += 2;

    // K. Kegiatan
    pdf.setFontSize(11); pdf.setFont("times", "bold");
    pdf.text("K. Kegiatan", 15, yPos); yPos += 2;
    
    autoTable(pdf, {
      startY: yPos + 2,
      head: [['Tahap', 'Rincian Kegiatan', 'Waktu']],
      body: kegiatanData.map((k: any) => [
        k.tahap, 
        k.kegiatan.replace(/ \| Waktu:.*$/g, '').replace(/Waktu:.*$/g, '').trim(), 
        (k.waktu || '').replace(' ', '\n')
      ]),
      margin: { left: 15, right: 15 },
      styles: { font: 'times', fontSize: 10, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 'auto' }, // Rincian Kegiatan
        2: { cellWidth: 20, halign: 'center' }
      }
    });

    yPos = (pdf as any).lastAutoTable.finalY + 10;
    if (yPos > 250) { pdf.addPage(); yPos = 20; }

    // L & M
    addField("L. Sumber", rplData['L']);
    addField("M. Evaluasi", rplData['M']);

    // Signatures
    yPos += 15;
    if (yPos > 250) { pdf.addPage(); yPos = 20; }

    const dateStr = `${schoolProfile.city || 'Tempat'}, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`;
    pdf.setFontSize(10); pdf.setFont("times", "normal");
    
    // Left: Counselor
    pdf.text("Mengetahui,", 15, yPos);
    pdf.text("Kepala Sekolah,", 15, yPos + 5);
    pdf.setFont("times", "bold");
    pdf.text(schoolProfile.principalName || 'Nama Kepala Sekolah', 15, yPos + 30);
    pdf.setFont("times", "normal");
    pdf.text(`NIP. ${schoolProfile.principalNip || '-'}`, 15, yPos + 35);

    // Right: Principal
    pdf.text(dateStr, 130, yPos);
    pdf.text("Guru BK / Konselor,", 130, yPos + 5);
    pdf.setFont("times", "bold");
    pdf.text(counselorProfile.name || schoolProfile.counselorName, 130, yPos + 30);
    pdf.setFont("times", "normal");
    pdf.text(`NIP. ${counselorProfile.nip || schoolProfile.counselorNip || '-'}`, 130, yPos + 35);

    const safeTitle = doc.title.replace(/\s+/g, '_');
    const safeKelas = (identitasData.kelas || 'N-A').replace(/\s+/g, '_');
    const safeSemester = (identitasData.semester || 'N-A').replace(/[\s\/]+/g, '-');
    pdf.save(`RPL_${safeKelas}_Sem-${safeSemester}_${safeTitle}_${Date.now()}.pdf`);
    notify("RPL berhasil diunduh sebagai PDF.");
  };

  const updateKegiatanRow = (index: number, field: string, value: string) => {
    const newKegiatan = [...formData.rplKegiatan];
    newKegiatan[index] = { ...newKegiatan[index], [field]: value };
    
    // Auto-calculate Alokasi Waktu (Section C)
    const times = newKegiatan.map(k => parseInt(k.waktu) || 0);
    const total = times.reduce((a, b) => a + b, 0);
    const labels = ['Buka', 'Inti', 'Tutup'];
    const breakdown = newKegiatan.map((k, i) => `${labels[i]}: ${parseInt(k.waktu) || 0}`).join(', ');
    const autoAlokasi = total > 0 ? `${total} Menit (${breakdown})` : '';

    setFormData({ 
      ...formData, 
      rplKegiatan: newKegiatan,
      rplFields: {
        ...formData.rplFields,
        'C': autoAlokasi || formData.rplFields['C']
      }
    });
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const paginatedAnnualDocs = React.useMemo(() => {
    if (activeTab !== 'Annual') return [];
    const start = (currentPage - 1) * itemsPerPage;
    return (data.annualPrograms || []).slice(start, start + itemsPerPage);
  }, [data.annualPrograms, activeTab, currentPage]);

  const totalAnnualPages = Math.ceil((data.annualPrograms || []).length / itemsPerPage);

  const paginatedRPLDocs = React.useMemo(() => {
    if (activeTab !== 'Collection') return [];
    const start = (currentPage - 1) * itemsPerPage;
    return (data.rplDocuments || []).slice(start, start + itemsPerPage);
  }, [data.rplDocuments, activeTab, currentPage]);

  const totalRPLPages = Math.ceil((data.rplDocuments || []).length / itemsPerPage);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Administrasi BK</h2>
          <p className="text-slate-500 text-sm font-medium">Dokumentasi program dan rencana pelaksanaan layanan.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <ICONS.Administration />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahun Pelajaran</p>
              <p className="text-xs font-bold text-slate-800">{schoolProfile.activeAcademicYear || '2023/2024'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-[2rem] w-fit shadow-inner">
        {[
          { id: 'Vision', label: 'Visi & Misi', icon: <ICONS.Star /> },
          { id: 'Annual', label: 'Prota & Prosem', icon: <ICONS.Book /> },
          { id: 'General', label: 'Program Umum', icon: <ICONS.Materials /> },
          { id: 'RPL', label: 'RPL BK', icon: <ICONS.Individual /> },
          { id: 'Collection', label: 'Kumpulan RPL', icon: <ICONS.Administration /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); if(tab.id !== 'RPL' && tab.id !== 'Annual') setIsAddMode(false); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-md' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'Vision' && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ICONS.Star />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Visi & Misi Program BK</h3>
                <p className="text-sm text-slate-400 font-medium">Rumusan visi dan misi bagi layanan bimbingan konseling.</p>
              </div>
              <button 
                onClick={handleImportSpirit}
                className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
              >
                <ICONS.School /> Sinkronkan dengan Sekolah
              </button>
            </div>
            <textarea 
              className="w-full h-80 bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm font-medium leading-relaxed outline-none focus:ring-4 focus:ring-indigo-500/10 custom-scrollbar resize-none"
              placeholder="Tuliskan Visi dan Misi khusus Program BK..."
              value={data.visionMission}
              onChange={(e) => handleSaveVisionMission(e.target.value)}
            />
          </div>
        )}

        {activeTab === 'Annual' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-800">Program Tahunan & Semester</h3>
               {!isAddMode && (
                 <button 
                    onClick={() => openAddDoc('Annual')}
                    className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                 >
                    Tambah Dokumen
                 </button>
               )}
            </div>

            {isAddMode ? (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Judul Dokumen</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="Contoh: Program Semester Ganjil 2024"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Deskripsi Program</label>
                  <textarea 
                    className="w-full h-96 bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm font-medium leading-relaxed outline-none focus:ring-4 focus:ring-indigo-500/10 custom-scrollbar"
                    placeholder="Tuliskan rincian program di sini..."
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                  />
                </div>
                <div className="flex gap-4 pt-4 border-t border-slate-50">
                  <button onClick={() => setIsAddMode(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">Batal</button>
                  <button onClick={handleSaveDoc} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700">Simpan Dokumen</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedAnnualDocs.map(doc => (
                  <div key={doc.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <ICONS.Book />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditDoc(doc)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteDoc(doc.id, doc.category)} className="p-2 text-slate-300 hover:text-rose-600 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-2 truncate relative z-10">{doc.title}</h4>
                    <p className="text-xs text-slate-400 font-medium mb-6 line-clamp-3 leading-relaxed relative z-10">{doc.content}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 relative z-10">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{doc.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isAddMode && totalAnnualPages > 1 && (
              <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mt-6">
                <p className="text-xs text-slate-500 font-medium">Halaman {currentPage} dari {totalAnnualPages}</p>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalAnnualPages))} disabled={currentPage === totalAnnualPages} className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'General' && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden">
            <div>
              <h3 className="text-xl font-black text-slate-800">Program Umum BK</h3>
              <p className="text-sm text-slate-400 font-medium">Penjabaran rencana layanan secara komprehensif.</p>
            </div>
            <textarea 
              className="w-full h-80 bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm font-medium leading-relaxed outline-none focus:ring-4 focus:ring-indigo-500/10 custom-scrollbar resize-none"
              placeholder="Jelaskan Program Umum BK di sini..."
              value={data.generalProgram}
              onChange={(e) => handleSaveGeneralProgram(e.target.value)}
            />
          </div>
        )}

        {activeTab === 'RPL' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
               <div>
                  <h3 className="text-xl font-black text-slate-800">RPL BK</h3>
                  <p className="text-sm text-slate-400 font-medium">Buat rencana pelaksanaan layanan baru.</p>
               </div>
               {isAddMode && (
                 <button onClick={() => setIsAddMode(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">Batal</button>
               )}
            </div>

            {isAddMode ? (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <ICONS.Individual />
                     </div>
                     <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Topik Layanan / Judul RPL</label>
                        <input 
                          className="w-full bg-transparent border-b-2 border-slate-100 px-1 py-2 text-xl font-black text-slate-800 outline-none focus:border-emerald-500"
                          placeholder="Meningkatkan Motivasi Belajar"
                          value={formData.title}
                          onChange={e => setFormData({...formData, title: e.target.value})}
                        />
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {RPL_FIELDS.map(field => (
                    <div key={field.id} className={`space-y-2 group ${field.id === 'K' ? 'md:col-span-2' : ''}`}>
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 group-focus-within:text-emerald-500 transition-colors">
                        <span className="w-6 h-6 rounded-full bg-slate-100 inline-flex items-center justify-center text-[9px] group-focus-within:bg-emerald-100 transition-colors">{field.id}</span>
                        {field.label}
                      </label>
                      {field.id === 'A' ? (
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Sekolah</p>
                              <input 
                                readOnly
                                className="w-full bg-slate-100 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold outline-none cursor-not-allowed opacity-70"
                                value={formData.rplIdentitas.sekolah}
                              />
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Jenjang Pendidikan (Kelas)</p>
                              <select 
                                className="w-full bg-white border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10"
                                value={formData.rplIdentitas.kelas}
                                onChange={e => setFormData({...formData, rplIdentitas: {...formData.rplIdentitas, kelas: e.target.value}})}
                              >
                                <option value="">-- Pilih Jenjang --</option>
                                {gradesConfig.map(g => (
                                  <option key={g.id} value={g.name}>{g.name}</option>
                                ))}
                              </select>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Semester</p>
                              <select 
                                className="w-full bg-white border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10"
                                value={formData.rplIdentitas.semester}
                                onChange={e => setFormData({...formData, rplIdentitas: {...formData.rplIdentitas, semester: e.target.value}})}
                              >
                                <option value="">-- Pilih Semester --</option>
                                <option value="Ganjil / 1">Ganjil / 1</option>
                                <option value="Genap / 2">Genap / 2</option>
                              </select>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Tahun Pelajaran</p>
                              <input 
                                className="w-full bg-white border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10"
                                value={formData.rplIdentitas.tahunPelajaran}
                                onChange={e => setFormData({...formData, rplIdentitas: {...formData.rplIdentitas, tahunPelajaran: e.target.value}})}
                              />
                           </div>
                        </div>
                      ) : field.id === 'D' ? (
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10"
                          value={formData.rplFields[field.id] || ''}
                          onChange={e => setFormData({
                            ...formData, 
                            rplFields: { ...formData.rplFields, [field.id]: e.target.value }
                          })}
                        >
                          <option value="">-- Pilih Bidang Bimbingan --</option>
                          <option value="Pribadi">Pribadi</option>
                          <option value="Sosial">Sosial</option>
                          <option value="Belajar">Belajar</option>
                          <option value="Karir">Karir</option>
                        </select>
                      ) : field.id === 'I' ? (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight px-1 italic">I.1 Tujuan Umum</p>
                            <textarea 
                              className="w-full min-h-[120px] h-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium leading-relaxed outline-none focus:ring-4 focus:ring-emerald-500/10 custom-scrollbar resize-none overflow-hidden"
                              placeholder="Tujuan umum layanan..."
                              value={formData.rplTujuan.umum}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto';
                                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                              }}
                              onChange={e => setFormData({...formData, rplTujuan: {...formData.rplTujuan, umum: e.target.value}})}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight px-1 italic">I.2 Tujuan Khusus</p>
                            <textarea 
                              className="w-full min-h-[120px] h-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium leading-relaxed outline-none focus:ring-4 focus:ring-emerald-500/10 custom-scrollbar resize-none overflow-hidden"
                              placeholder="Tujuan khusus / operasional..."
                              value={formData.rplTujuan.khusus}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto';
                                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                              }}
                              onChange={e => setFormData({...formData, rplTujuan: {...formData.rplTujuan, khusus: e.target.value}})}
                            />
                          </div>
                        </div>
                      ) : field.id === 'K' ? (
                        <div className="overflow-hidden border border-slate-200 rounded-[2rem] bg-slate-50">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Tahap</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-2/4">Kegiatan</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-emerald-500 uppercase tracking-widest w-1/4">Waktu (Menit)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formData.rplKegiatan.map((row: any, idx: number) => (
                                <tr key={idx} className="border-b border-slate-100 last:border-0 group/row">
                                  <td className="px-6 py-4 text-xs font-black text-slate-800 align-top pt-6 bg-white/50">{row.tahap}</td>
                                  <td className="px-4 py-3">
                                    <textarea 
                                      className="w-full min-h-[96px] h-auto bg-white border border-slate-100 rounded-xl p-3 text-sm font-medium outline-none focus:ring-4 focus:ring-emerald-500/10 resize-none custom-scrollbar overflow-hidden"
                                      placeholder={`Rincian kegiatan ${row.tahap}...`}
                                      value={row.kegiatan}
                                      onInput={(e) => {
                                        e.currentTarget.style.height = 'auto';
                                        e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                      }}
                                      onChange={e => updateKegiatanRow(idx, 'kegiatan', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="relative flex items-center">
                                      <input 
                                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 pr-16"
                                        placeholder="0"
                                        value={row.waktu.replace(' Menit', '')}
                                        onChange={e => {
                                          const val = e.target.value.replace(/\D/g, '');
                                          updateKegiatanRow(idx, 'waktu', val ? `${val} Menit` : '');
                                        }}
                                      />
                                      <span className="absolute right-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter pointer-events-none">Menit</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <textarea 
                          className="w-full min-h-[120px] h-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium leading-relaxed outline-none focus:ring-4 focus:ring-emerald-500/10 custom-scrollbar resize-none overflow-hidden"
                          placeholder={`Isi ${field.label}...`}
                          value={formData.rplFields[field.id] || ''}
                          onInput={(e) => {
                            e.currentTarget.style.height = 'auto';
                            e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                          }}
                          onChange={e => setFormData({
                            ...formData, 
                            rplFields: { ...formData.rplFields, [field.id]: e.target.value }
                          })}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-8 border-t border-slate-100">
                  <button onClick={() => setIsAddMode(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Batal</button>
                  <button onClick={handleSaveDoc} className="flex-[3] py-5 bg-emerald-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-50 hover:bg-emerald-700 transition-all">Simpan Rencana Layanan</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 bg-emerald-50/30 rounded-[3rem] border-2 border-dashed border-emerald-100 space-y-6">
                 <div className="p-6 bg-white rounded-full shadow-lg text-emerald-600">
                    <ICONS.Individual />
                 </div>
                 <div className="text-center">
                    <h4 className="text-lg font-black text-slate-800">Siap Membuat RPL Baru?</h4>
                    <p className="text-sm text-slate-400 font-medium">Klik tombol di bawah untuk mulai menyusun rencana layanan.</p>
                 </div>
                 <button 
                    onClick={() => openAddDoc('RPL')}
                    className="bg-emerald-600 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center gap-2"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Mulai Buat RPL
                 </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Collection' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
               <div>
                  <h3 className="text-xl font-black text-slate-800">Kumpulan RPL</h3>
                  <p className="text-sm text-slate-400 font-medium">Daftar semua rencana pelaksanaan layanan yang tersimpan.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedRPLDocs.length > 0 ? (
                paginatedRPLDocs.map(doc => (
                  <div key={doc.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <ICONS.Individual />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleExportRPLPDF(doc)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors" title="Cetak PDF">
                          <ICONS.Book />
                        </button>
                        <button onClick={() => openEditDoc(doc)} className="p-2 text-slate-300 hover:text-emerald-600 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteDoc(doc.id, doc.category)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-xl font-black text-slate-800 mb-2 leading-tight">{doc.title}</h4>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{doc.date}</p>
                    </div>

                    <div className="space-y-3 mb-8">
                       <div className="flex items-center gap-3">
                          <span className="w-1 h-8 bg-emerald-500 rounded-full" />
                          <div>
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Jenjang (Kelas) / Semester</p>
                             <p className="text-[11px] font-bold text-slate-600">
                                {doc.content.includes('Kelas:') ? doc.content.split('Kelas:')[1]?.split('\n')[0] || '-' : '-'} / {doc.content.includes('Semester:') ? doc.content.split('Semester:')[1]?.split('\n')[0] || '-' : '-'}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="w-1 h-8 bg-indigo-500 rounded-full" />
                          <div>
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Bidang Bimbingan</p>
                             <p className="text-[11px] font-bold text-slate-600 line-clamp-1">
                                {doc.content.includes('Bidang Bimbingan:') ? doc.content.split('Bidang Bimbingan:')[1]?.split('\n')[0] || '-' : '-'}
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-2">
                       <button 
                        onClick={() => openEditDoc(doc)}
                        className="flex-1 py-4 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                      >
                        Buka Detail RPL
                      </button>
                      <button 
                        onClick={() => handleExportRPLPDF(doc)}
                        className="flex-1 py-4 bg-indigo-50 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        Cetak PDF
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                   <p className="text-slate-400 font-medium italic">Belum ada koleksi RPL tersimpan.</p>
                </div>
              )}
            </div>

            {totalRPLPages > 1 && (
              <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mt-6">
                <p className="text-xs text-slate-500 font-medium">Halaman {currentPage} dari {totalRPLPages}</p>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalRPLPages))} disabled={currentPage === totalRPLPages} className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BKAdministration;
