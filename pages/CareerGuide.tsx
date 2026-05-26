
import React, { useState, useMemo, useRef } from 'react';
import { University, StudyProgram, Scholarship, TrackGuidanceData, CareerVisibility, UserRole, MengenalProdi } from '../types';
import { ICONS } from '../constants';
import * as XLSX from 'xlsx';
import { syncTableToCloud } from '../syncService';

interface CareerGuideProps {
  universities: University[];
  setUniversities: React.Dispatch<React.SetStateAction<University[]>>;
  studyPrograms: StudyProgram[];
  setStudyPrograms: React.Dispatch<React.SetStateAction<StudyProgram[]>>;
  scholarships: Scholarship[];
  setScholarships: React.Dispatch<React.SetStateAction<Scholarship[]>>;
  trackGuidance: TrackGuidanceData;
  setTrackGuidance: React.Dispatch<React.SetStateAction<TrackGuidanceData>>;
  careerVisibility: CareerVisibility;
  setCareerVisibility: React.Dispatch<React.SetStateAction<CareerVisibility>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  mengenalProdiList: MengenalProdi[];
  setMengenalProdiList: React.Dispatch<React.SetStateAction<MengenalProdi[]>>;
}

const CareerGuide: React.FC<CareerGuideProps> = ({
  universities, setUniversities,
  studyPrograms, setStudyPrograms,
  scholarships, setScholarships,
  trackGuidance, setTrackGuidance,
  careerVisibility, setCareerVisibility,
  notify, userRole,
  mengenalProdiList, setMengenalProdiList
}) => {
  const [activeTab, setActiveTab] = useState('Panduan');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [viewingUni, setViewingUni] = useState<University | null>(null);
  const [editingUni, setEditingUni] = useState<University | null>(null);
  const [showImportFormat, setShowImportFormat] = useState(false);
  const [showProdiImportFormat, setShowProdiImportFormat] = useState(false);
  const [showKedinasanImportFormat, setShowKedinasanImportFormat] = useState(false);
  const [showAddScholarship, setShowAddScholarship] = useState(false);
  const [newScholarship, setNewScholarship] = useState<Partial<Scholarship>>({});
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);
  const [showAddProdi, setShowAddProdi] = useState(false);
  const [newProdi, setNewProdi] = useState<Partial<StudyProgram>>({});
  const [editingProdi, setEditingProdi] = useState<StudyProgram | null>(null);

  const [showAddMengenalProdi, setShowAddMengenalProdi] = useState(false);
  const [newMengenalProdi, setNewMengenalProdi] = useState<Partial<MengenalProdi>>({
    programName: '',
    overview: '',
    courses: [],
    careers: [],
    campuses: []
  });
  const [editingMengenalProdi, setEditingMengenalProdi] = useState<MengenalProdi | null>(null);
  const [viewingMengenalProdi, setViewingMengenalProdi] = useState<MengenalProdi | null>(null);
  const [selectedMengenalProdiId, setSelectedMengenalProdiId] = useState<string | null>(null);

  const [coursesInput, setCoursesInput] = useState('');
  const [careersInput, setCareersInput] = useState('');
  const [campusesInput, setCampusesInput] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [currentMengenalPage, setCurrentMengenalPage] = useState(1);
  const itemsPerPage = 50;
  const prodiItemsPerPage = 15;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputProdiRef = useRef<HTMLInputElement>(null);
  const fileInputKedinasanRef = useRef<HTMLInputElement>(null);
  const fileInputMengenalProdiRef = useRef<HTMLInputElement>(null);

  // Logika Admin (super_admin = Super Konselor)
  const canManage = userRole === 'super_admin';
  const canManageMengenalProdi = userRole === 'super_admin' || userRole === 'counselor';



  // Filter
  const uniqueProvinces = useMemo(() => {
    let relevant = universities;
    if (activeTab === 'Kedinasan') {
      relevant = relevant.filter(u => u.status_pt === 'Kedinasan');
    } else if (activeTab === 'PT') {
      relevant = relevant.filter(u => u.status_pt !== 'Kedinasan');
    } else {
      return [];
    }
    const provinces = relevant.map(u => u.provinsi).filter(Boolean);
    return Array.from(new Set(provinces)).sort();
  }, [universities, activeTab]);

  const filteredUniversities = useMemo(() => {
    let filtered = universities;

    if (activeTab === 'Kedinasan') {
      filtered = filtered.filter(u => u.status_pt === 'Kedinasan');
    } else if (activeTab === 'PT') {
      filtered = filtered.filter(u => u.status_pt !== 'Kedinasan');
    }

    if (selectedProvince) {
      filtered = filtered.filter(u => u.provinsi === selectedProvince);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(u => u.nama_pt.toLowerCase().includes(lower) || u.kota.toLowerCase().includes(lower));
    }

    return filtered;
  }, [universities, activeTab, searchTerm, selectedProvince]);

  const filteredPrograms = useMemo(() => {
    if (activeTab !== 'Rasio') return [];
    let filtered = studyPrograms;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.nama_prodi.toLowerCase().includes(lower) ||
        p.pt_name.toLowerCase().includes(lower) ||
        p.kode_prodi.includes(lower)
      );
    }
    return filtered;
  }, [studyPrograms, activeTab, searchTerm]);

  const filteredMengenalProdi = useMemo(() => {
    const list = mengenalProdiList || [];
    if (!searchTerm) return list;
    const lower = searchTerm.toLowerCase();
    return list.filter(p =>
      p.programName.toLowerCase().includes(lower) ||
      p.overview.toLowerCase().includes(lower) ||
      (p.courses || []).some(c => c.toLowerCase().includes(lower)) ||
      (p.careers || []).some(c => c.toLowerCase().includes(lower)) ||
      (p.campuses || []).some(c => c.toLowerCase().includes(lower))
    );
  }, [mengenalProdiList, searchTerm]);

  // Pagination Logic
  const paginatedUniversities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUniversities.slice(start, start + itemsPerPage);
  }, [filteredUniversities, currentPage]);

  const totalUniPages = Math.ceil(filteredUniversities.length / itemsPerPage);

  const paginatedPrograms = useMemo(() => {
    const start = (currentPage - 1) * prodiItemsPerPage;
    return filteredPrograms.slice(start, start + prodiItemsPerPage);
  }, [filteredPrograms, currentPage]);

  const totalProdiPages = Math.ceil(filteredPrograms.length / prodiItemsPerPage);

  const mengenalItemsPerPage = 4;

  const paginatedMengenalProdi = useMemo(() => {
    const start = (currentMengenalPage - 1) * mengenalItemsPerPage;
    return filteredMengenalProdi.slice(start, start + mengenalItemsPerPage);
  }, [filteredMengenalProdi, currentMengenalPage]);

  const totalMengenalPages = Math.ceil(filteredMengenalProdi.length / mengenalItemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
    setCurrentMengenalPage(1);
  }, [activeTab, searchTerm, selectedProvince]);

  // Penanganan (Handlers)
  const handleOpenEditPT = (e: React.MouseEvent, uni: University) => {
    e.stopPropagation();
    setEditingUni({ ...uni });
  };

  const handleSaveEditPT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUni) return;

    setUniversities(prev => prev.map(u => u.id === editingUni.id ? editingUni : u));
    setEditingUni(null);
    notify("Data kampus berhasil diperbarui.", "success");
  };

  const handleDeletePT = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Hapus ${name}?`)) {
      setUniversities(prev => prev.filter(u => u.id !== id));
      
      // Delete from cloud database
      fetch(`/api/sync?table=star_universities&id=${id}`, { method: 'DELETE' })
        .then(res => { if (!res.ok) console.error("Failed to delete from cloud"); })
        .catch(err => console.error("Error deleting from cloud:", err));

      notify(`${name} dihapus.`);
    }
  };

  const getAccColor = (acc: string) => {
    if (acc === 'Unggul' || acc === 'A') return 'emerald';
    if (acc === 'Baik Sekali' || acc === 'B') return 'blue';
    return 'slate';
  };

  const handleOpenWebsite = (uni: University) => {
    if (uni.website) window.open(uni.website.startsWith('http') ? uni.website : `https://${uni.website}`, '_blank');
  };

  const handleImportUniversities = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const validStatusPT = ['Negeri', 'Swasta', 'Kedinasan'];
        const validAccreditation = ['Unggul', 'A', 'Baik Sekali', 'B', 'Baik', 'C'];

        const newUnis: University[] = data.map((row, index) => {
          const rawStatus = row.status_pt || row['Status PT'] || 'Negeri';
          const rawAcc = row.akreditasi || row['Akreditasi'] || 'B';

          return {
            id: `uni-imp-${Date.now()}-${index}`,
            kode_pt: String(row.kode_pt || row['Kode PT'] || ''),
            nama_pt: (() => {
              const name = String(row.nama_pt || row['Nama PT'] || '');
              const status = (validStatusPT.includes(rawStatus) ? rawStatus : 'Negeri');
              if (status === 'Negeri' && !name.includes('(Negeri)')) return `${name} (Negeri)`;
              if (status === 'Swasta' && !name.includes('(Swasta)')) return `${name} (Swasta)`;
              if (status === 'Kedinasan' && !name.includes('(Kedinasan)')) return `${name} (Kedinasan)`;
              return name;
            })(),
            status_pt: (validStatusPT.includes(rawStatus) ? rawStatus : 'Negeri') as any,
            provinsi: String(row.provinsi || row['Provinsi'] || ''),
            kota: String(row.kota || row['Kota'] || ''),
            akreditasi: validAccreditation.includes(rawAcc) ? rawAcc : 'B',
            website: String(row.website || row['Website'] || ''),
            pddikti_url: String(row.pddikti_url || row['PDDIKTI URL'] || ''),
            logo: String(row.logo || row['Logo'] || ''),
            description: String(row.description || row['Deskripsi'] || '')
          };
        }).filter(u => u.nama_pt);

        if (newUnis.length === 0) {
          notify("Tidak ada data kampus yang valid ditemukan.", "error");
          return;
        }

        setUniversities(prev => {
          // Hindari duplikasi berdasarkan nama
          const existingNames = new Set(prev.map(u => u.nama_pt.toLowerCase()));
          const uniqueNew = newUnis.filter(u => !existingNames.has(u.nama_pt.toLowerCase()));
          return [...prev, ...uniqueNew];
        });

        notify(`Berhasil mengimpor ${newUnis.length} data kampus.`, "success");
      } catch (err) {
        console.error(err);
        notify("Gagal membaca file Excel.", "error");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportUniversities = () => {
    try {
      const exportData = universities.filter(u => u.status_pt !== 'Kedinasan').map(u => ({
        'Kode PT': u.kode_pt,
        'Nama PT': u.nama_pt,
        'Status PT': u.status_pt,
        'Provinsi': u.provinsi,
        'Kota': u.kota,
        'Akreditasi': u.akreditasi,
        'Website': u.website,
        'PDDIKTI URL': u.pddikti_url,
        'Logo': u.logo,
        'Deskripsi': u.description
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Kampus");
      XLSX.writeFile(wb, `Data_Kampus_Umum_${Date.now()}.xlsx`);
      notify("Data kampus berhasil diekspor.", "success");
    } catch (err) {
      console.error(err);
      notify("Gagal mengekspor data.", "error");
    }
  };

  const handleExportKedinasan = () => {
    try {
      const exportData = universities.filter(u => u.status_pt === 'Kedinasan').map(u => ({
        'Kode PT': u.kode_pt,
        'Nama PT': u.nama_pt,
        'Status PT': u.status_pt,
        'Provinsi': u.provinsi,
        'Kota': u.kota,
        'Akreditasi': u.akreditasi,
        'Website': u.website,
        'PDDIKTI URL': u.pddikti_url,
        'Logo': u.logo,
        'Deskripsi': u.description
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Kedinasan");
      XLSX.writeFile(wb, `Data_Kedinasan_${Date.now()}.xlsx`);
      notify("Data kedinasan berhasil diekspor.", "success");
    } catch (err) {
      console.error(err);
      notify("Gagal mengekspor data.", "error");
    }
  };

  const handleExportRasioProdi = () => {
    try {
      const exportData = studyPrograms.map(p => ({
        'Kode Prodi': p.kode_prodi,
        'Nama Prodi': p.nama_prodi,
        'Jenjang': p.jenjang,
        'PT Name': p.pt_name,
        'Akreditasi': p.akreditasi,
        'Status': p.status,
        'Peminat': p.peminat,
        'Daya Tampung': p.quota,
        'Rasio': p.quota > 0 ? (p.peminat / p.quota).toFixed(2) : 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rasio Prodi");
      XLSX.writeFile(wb, `Data_Rasio_Prodi_${Date.now()}.xlsx`);
      notify("Data rasio prodi berhasil diekspor.", "success");
    } catch (err) {
      console.error(err);
      notify("Gagal mengekspor data.", "error");
    }
  };

  const handleImportKedinasan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const validAccreditation = ['Unggul', 'A', 'Baik Sekali', 'B', 'Baik', 'C'];

        const newUnis: University[] = data.map((row, index) => {
          const rawAcc = row.akreditasi || row['Akreditasi'] || 'B';

          return {
            id: `uni-imp-ked-${Date.now()}-${index}`,
            kode_pt: String(row.kode_pt || row['Kode PT'] || ''),
            nama_pt: (() => {
              const name = String(row.nama_pt || row['Nama PT'] || '');
              if (!name.includes('(Kedinasan)')) return `${name} (Kedinasan)`;
              return name;
            })(),
            status_pt: 'Kedinasan' as any,
            provinsi: String(row.provinsi || row['Provinsi'] || ''),
            kota: String(row.kota || row['Kota'] || ''),
            akreditasi: validAccreditation.includes(rawAcc) ? rawAcc : 'B',
            website: String(row.website || row['Website'] || ''),
            pddikti_url: String(row.pddikti_url || row['PDDIKTI URL'] || ''),
            logo: String(row.logo || row['Logo'] || ''),
            description: String(row.description || row['Deskripsi'] || '')
          };
        }).filter(u => u.nama_pt);

        if (newUnis.length === 0) {
          notify("Tidak ada data kedinasan yang valid ditemukan.", "error");
          return;
        }

        setUniversities(prev => {
          // Hindari duplikasi berdasarkan nama
          const existingNames = new Set(prev.map(u => u.nama_pt.toLowerCase()));
          const uniqueNew = newUnis.filter(u => !existingNames.has(u.nama_pt.toLowerCase()));
          return [...prev, ...uniqueNew];
        });

        notify(`Berhasil mengimpor ${newUnis.length} data sekolah kedinasan.`, "success");
      } catch (err) {
        console.error(err);
        notify("Gagal membaca file Excel.", "error");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputKedinasanRef.current) fileInputKedinasanRef.current.value = '';
  };

  const handleImportStudyPrograms = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const validStatus = ['Aktif', 'Non-Aktif'];
        const validAccreditation = ['Unggul', 'A', 'Baik Sekali', 'B', 'Baik', 'C'];

        const newProdis: StudyProgram[] = data.map((row, index) => {
          const rawStatus = row.status || row['Status'] || 'Aktif';
          const rawAcc = row.akreditasi || row['Akreditasi'] || 'B';
          const rawPeminat = Number(row.peminat || row['Peminat']);
          const rawQuota = Number(row.quota || row['Daya Tampung']);

          return {
            id: `prodi-imp-${Date.now()}-${index}`,
            kode_prodi: String(row.kode_prodi || row['Kode Prodi'] || ''),
            nama_prodi: String(row.nama_prodi || row['Nama Prodi'] || ''),
            jenjang: String(row.jenjang || row['Jenjang'] || 'S1'),
            akreditasi: validAccreditation.includes(rawAcc) ? rawAcc : 'B',
            pt_name: String(row.pt_name || row['Nama PT'] || ''),
            status: (validStatus.includes(rawStatus) ? rawStatus : 'Aktif') as any,
            peminat: isNaN(rawPeminat) ? 0 : rawPeminat,
            quota: isNaN(rawQuota) ? 0 : rawQuota,
            description: String(row.description || row['Deskripsi'] || '')
          };
        }).filter(p => p.nama_prodi && p.pt_name);

        if (newProdis.length === 0) {
          notify("Tidak ada data prodi yang valid ditemukan.", "error");
          return;
        }

        setStudyPrograms(prev => {
          // Hindari duplikasi berdasarkan kode dan nama PT
          const existingKeys = new Set(prev.map(p => `${p.kode_prodi}-${p.pt_name}`.toLowerCase()));
          const uniqueNew = newProdis.filter(p => !existingKeys.has(`${p.kode_prodi}-${p.pt_name}`.toLowerCase()));
          return [...prev, ...uniqueNew];
        });

        notify(`Berhasil mengimpor ${newProdis.length} data prodi.`, "success");
      } catch (err) {
        console.error(err);
        notify("Gagal membaca file Excel.", "error");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputProdiRef.current) fileInputProdiRef.current.value = '';
  };

  const handleAddScholarship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScholarship.title || !newScholarship.provider || !newScholarship.deadline) {
      notify("Mohon lengkapi judul, penyelenggara, dan deadline.", "error");
      return;
    }

    const scholarship: Scholarship = {
      id: `sch-${Date.now()}`,
      title: newScholarship.title,
      provider: newScholarship.provider,
      description: newScholarship.description || '',
      deadline: newScholarship.deadline,
      website: newScholarship.website || ''
    };

    setScholarships(prev => [...prev, scholarship]);
    setNewScholarship({});
    setShowAddScholarship(false);
    notify("Beasiswa berhasil ditambahkan.", "success");
  };

  const handleDeleteScholarship = (id: string) => {
    if (confirm("Hapus beasiswa ini?")) {
      setScholarships(prev => prev.filter(s => s.id !== id));
      
      // Delete from cloud database
      fetch(`/api/sync?table=star_scholarships&id=${id}`, { method: 'DELETE' })
        .then(res => { if (!res.ok) console.error("Failed to delete from cloud"); })
        .catch(err => console.error("Error deleting from cloud:", err));

      notify("Beasiswa dihapus.");
    }
  };

  const handleSaveEditScholarship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScholarship || !editingScholarship.title || !editingScholarship.provider || !editingScholarship.deadline) {
      notify("Mohon lengkapi judul, penyelenggara, dan deadline.", "error");
      return;
    }

    setScholarships(prev => prev.map(s => s.id === editingScholarship.id ? editingScholarship as Scholarship : s));
    setEditingScholarship(null);
    notify("Beasiswa berhasil diperbarui.", "success");
  };

  const handleAddProdi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdi.kode_prodi || !newProdi.nama_prodi || !newProdi.pt_name) {
      notify("Mohon lengkapi kode, nama prodi, dan nama PT.", "error");
      return;
    }

    const prodi: StudyProgram = {
      id: `prodi-${Date.now()}`,
      kode_prodi: newProdi.kode_prodi,
      nama_prodi: newProdi.nama_prodi,
      jenjang: newProdi.jenjang || 'S1',
      akreditasi: newProdi.akreditasi || 'B',
      pt_name: newProdi.pt_name,
      status: newProdi.status || 'Aktif',
      peminat: newProdi.peminat || 0,
      quota: newProdi.quota || 0,
      description: newProdi.description || ''
    };

    setStudyPrograms(prev => [...prev, prodi]);
    setNewProdi({});
    setShowAddProdi(false);
    notify("Prodi berhasil ditambahkan.", "success");
  };

  const handleDeleteProdi = (id: string, name: string) => {
    if (confirm(`Hapus prodi ${name}?`)) {
      setStudyPrograms(prev => prev.filter(p => p.id !== id));
      
      // Delete from cloud database
      fetch(`/api/sync?table=star_studyPrograms&id=${id}`, { method: 'DELETE' })
        .then(res => { if (!res.ok) console.error("Failed to delete from cloud"); })
        .catch(err => console.error("Error deleting from cloud:", err));

      notify(`Prodi ${name} dihapus.`);
    }
  };

  const handleSaveEditProdi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProdi || !editingProdi.kode_prodi || !editingProdi.nama_prodi || !editingProdi.pt_name) {
      notify("Mohon lengkapi kode, nama prodi, dan nama PT.", "error");
      return;
    }

    setStudyPrograms(prev => prev.map(p => p.id === editingProdi.id ? editingProdi as StudyProgram : p));
    setEditingProdi(null);
    notify("Prodi berhasil diperbarui.", "success");
  };

  const handleAddMengenalProdi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMengenalProdi.programName || !newMengenalProdi.overview) {
      notify("Mohon isi nama prodi dan selayang pandang.", "error");
      return;
    }

    const splitInput = (val: string) => {
      return val.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    };

    const prodi: MengenalProdi = {
      id: `mp-${Date.now()}`,
      programName: newMengenalProdi.programName,
      overview: newMengenalProdi.overview,
      courses: splitInput(coursesInput),
      careers: splitInput(careersInput),
      campuses: splitInput(campusesInput),
      dateCreated: new Date().toISOString()
    };

    setMengenalProdiList(prev => [...prev, prodi]);
    setNewMengenalProdi({ programName: '', overview: '', courses: [], careers: [], campuses: [] });
    setCoursesInput('');
    setCareersInput('');
    setCampusesInput('');
    setShowAddMengenalProdi(false);
    notify("Program Studi berhasil ditambahkan ke Mengenal PRODI.", "success");
  };

  const handleDeleteMengenalProdi = (id: string, name: string) => {
    if (confirm(`Hapus data Mengenal Prodi untuk ${name}?`)) {
      setMengenalProdiList(prev => prev.filter(p => p.id !== id));
      if (viewingMengenalProdi?.id === id) {
        setViewingMengenalProdi(null);
      }
      notify(`Data Mengenal Prodi ${name} berhasil dihapus.`, "success");
    }
  };

  const handleSaveEditMengenalProdi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMengenalProdi || !editingMengenalProdi.programName || !editingMengenalProdi.overview) {
      notify("Mohon isi nama prodi dan selayang pandang.", "error");
      return;
    }

    const splitInput = (val: string) => {
      return val.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    };

    const updated: MengenalProdi = {
      ...editingMengenalProdi,
      courses: splitInput(coursesInput),
      careers: splitInput(careersInput),
      campuses: splitInput(campusesInput)
    };

    setMengenalProdiList(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (viewingMengenalProdi?.id === updated.id) {
      setViewingMengenalProdi(updated);
    }
    setEditingMengenalProdi(null);
    setCoursesInput('');
    setCareersInput('');
    setCampusesInput('');
    notify("Data Mengenal Prodi berhasil diperbarui.", "success");
  };

  const handleImportMengenalProdi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const newMengenalProdis: MengenalProdi[] = data.map((row, index) => {
          const rawCourses = String(row.courses || row['Mata Kuliah'] || '');
          const rawCareers = String(row.careers || row['Profesi dan Karir'] || '');
          const rawCampuses = String(row.campuses || row['Kampus Terkait'] || '');

          const courses = rawCourses ? rawCourses.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean) : [];
          const careers = rawCareers ? rawCareers.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean) : [];
          const campuses = rawCampuses ? rawCampuses.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean) : [];

          return {
            id: `mp-imp-${Date.now()}-${index}`,
            programName: String(row.programName || row['Nama Prodi'] || ''),
            overview: String(row.overview || row['Selayang Pandang'] || ''),
            courses,
            careers,
            campuses,
            dateCreated: new Date().toISOString()
          };
        }).filter(p => p.programName && p.overview);

        if (newMengenalProdis.length === 0) {
          notify("Tidak ada data program studi yang valid ditemukan.", "error");
          return;
        }

        setMengenalProdiList(prev => {
          const existingNames = new Set(prev.map(p => p.programName.toLowerCase()));
          const uniqueNew = newMengenalProdis.filter(p => !existingNames.has(p.programName.toLowerCase()));
          return [...prev, ...uniqueNew];
        });

        notify(`Berhasil mengimpor ${newMengenalProdis.length} data Mengenal PRODI.`, "success");
      } catch (err) {
        console.error(err);
        notify("Gagal membaca file Excel.", "error");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputMengenalProdiRef.current) fileInputMengenalProdiRef.current.value = '';
  };

  const handleExportMengenalProdi = () => {
    try {
      const exportData = mengenalProdiList.map(p => ({
        'Nama Prodi': p.programName,
        'Selayang Pandang': p.overview,
        'Mata Kuliah': p.courses ? p.courses.join('; ') : '',
        'Profesi dan Karir': p.careers ? p.careers.join('; ') : '',
        'Kampus Terkait': p.campuses ? p.campuses.join('; ') : ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mengenal PRODI");
      XLSX.writeFile(wb, `Mengenal_PRODI_${Date.now()}.xlsx`);
      notify("Data Mengenal PRODI berhasil diekspor.", "success");
    } catch (err) {
      console.error(err);
      notify("Gagal mengekspor data.", "error");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col items-start gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pusat Karir & Studi Lanjut</h2>
          <p className="text-slate-500 text-sm">Informasi perguruan tinggi, sekolah kedinasan, dan beasiswa</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-4 w-full">
          {canManage && activeTab === 'PT' && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportUniversities}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                Import Kampus
              </button>
              <button
                onClick={handleExportUniversities}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                Export Kampus
              </button>
              <button
                onClick={() => setShowImportFormat(true)}
                className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                Format Import
              </button>
            </>
          )}
          {canManage && activeTab === 'Kedinasan' && (
            <>
              <input
                type="file"
                ref={fileInputKedinasanRef}
                onChange={handleImportKedinasan}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputKedinasanRef.current?.click()}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                Import Kedinasan
              </button>
              <button
                onClick={handleExportKedinasan}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                Export Kedinasan
              </button>
              <button
                onClick={() => setShowKedinasanImportFormat(true)}
                className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                Format Import
              </button>
            </>
          )}
          {canManage && activeTab === 'Rasio' && (
            <>
              <button
                onClick={() => setShowAddProdi(true)}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Tambah Prodi
              </button>
              <input
                type="file"
                ref={fileInputProdiRef}
                onChange={handleImportStudyPrograms}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputProdiRef.current?.click()}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                Import Prodi
              </button>
              <button
                onClick={handleExportRasioProdi}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                Export Prodi
              </button>
              <button
                onClick={() => setShowProdiImportFormat(true)}
                className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                Format Import
              </button>
            </>
          )}
          {canManageMengenalProdi && activeTab === 'Mengenal' && (
            <>
              <button
                onClick={() => {
                  setNewMengenalProdi({ programName: '', overview: '', courses: [], careers: [], campuses: [] });
                  setShowAddMengenalProdi(true);
                }}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Tambah Mengenal Prodi
              </button>
              <input
                type="file"
                ref={fileInputMengenalProdiRef}
                onChange={handleImportMengenalProdi}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputMengenalProdiRef.current?.click()}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                Import Mengenal
              </button>
              <button
                onClick={handleExportMengenalProdi}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-100 hover:bg-black transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                Export Mengenal
              </button>
            </>
          )}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit overflow-x-auto">
            {['Panduan', 'PT', 'Kedinasan', 'Beasiswa', 'Rasio', 'Mengenal'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab === 'PT' ? 'Kampus Umum' : tab === 'Rasio' ? 'Rasio Prodi' : tab === 'Mengenal' ? 'Mengenal PRODI' : tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Search Bar for PT/Kedinasan/Rasio/Mengenal */}
      {(activeTab === 'PT' || activeTab === 'Kedinasan' || activeTab === 'Rasio' || activeTab === 'Mengenal') && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={activeTab === 'Rasio' ? "Cari prodi atau kampus..." : activeTab === 'Mengenal' ? "Cari nama prodi..." : "Cari nama kampus atau kota..."}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>

          {(activeTab === 'PT' || activeTab === 'Kedinasan') && (
            <div className="relative md:w-64 shrink-0">
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none text-slate-700"
              >
                <option value="">Semua Provinsi</option>
                {uniqueProvinces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          )}
        </div>
      )}

      {/* TAB: KAMPUS UMUM (PTN) & SEKOLAH KEDINASAN */}
      {(activeTab === 'PT' || activeTab === 'Kedinasan') && (
        <section className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
            {paginatedUniversities.map(pt => {
              const prodiCount = studyPrograms.filter(p => p.pt_name.toLowerCase() === pt.nama_pt.toLowerCase() || (p.pt_name.includes('SINGAPERBANGSA') && pt.nama_pt.includes('SINGAPERBANGSA'))).length;
              return (
                <div key={pt.id} className="bg-white p-4 md:p-5 lg:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col overflow-hidden relative cursor-pointer" onClick={() => setViewingUni(pt)}>
                  <div className="flex justify-end items-start mb-3 md:mb-4 relative z-10 min-h-[20px]">
                    {canManage && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleOpenEditPT(e, pt)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                        </button>
                        <button onClick={(e) => handleDeletePT(e, pt.id, pt.nama_pt)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mb-4 aspect-[4/3] bg-slate-50 rounded-2xl flex flex-col items-center justify-center p-4 text-center border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all duration-300">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{pt.kode_pt}</span>
                    <h4 className="text-[11px] font-black text-slate-800 leading-tight italic break-words line-clamp-3">{pt.nama_pt}</h4>
                  </div>

                  <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] text-slate-400 font-bold mb-4 md:mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                    <span className="truncate">{pt.kota}, {pt.provinsi}</span>
                  </div>

                  <div className="mt-auto pt-3 md:pt-4 border-t border-slate-50 space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[7px] md:text-[8px] font-black text-slate-300 uppercase tracking-widest">Akreditasi</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[7px] md:text-[8px] font-black uppercase bg-${getAccColor(pt.akreditasi)}-50 text-${getAccColor(pt.akreditasi)}-600 border border-${getAccColor(pt.akreditasi)}-100`}>{pt.akreditasi}</span>
                      </div>
                      {prodiCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[7px] md:text-[8px] font-bold">
                          {prodiCount} Prodi
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setViewingUni(pt); }} className="py-2 md:py-2.5 bg-slate-50 text-slate-600 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-sm">Detail</button>
                      <button onClick={(e) => { e.stopPropagation(); handleOpenWebsite(pt); }} className="py-2 md:py-2.5 bg-slate-900 text-white rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95">Web</button>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        if (pt.pddikti_url) window.open(pt.pddikti_url, '_blank');
                        else notify("Link PDDIKTI belum tersedia untuk kampus ini.", "info");
                      }} className={`py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${pt.pddikti_url ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                        PDDIKTI
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {totalUniPages > 1 && (
            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Halaman {currentPage} dari {totalUniPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalUniPages))} disabled={currentPage === totalUniPages} className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
              </div>
            </div>
          )}
          {filteredUniversities.length === 0 && (
            <div className="py-20 md:py-32 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-black italic uppercase tracking-widest text-[10px] md:text-xs">Database kampus kosong. Gunakan fitur Import atau Tambah Manual.</p>
            </div>
          )}
        </section>
      )}

      {/* Viewing Uni Modal */}
      {viewingUni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-8 bg-slate-900 text-white shrink-0">
              <h3 className="text-xl font-black italic">{viewingUni.nama_pt}</h3>
              <p className="text-slate-400 text-xs mt-1">{viewingUni.kota}, {viewingUni.provinsi}</p>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Program Studi</h4>
                <div className="space-y-2">
                  {studyPrograms.filter(p => p.pt_name === viewingUni.nama_pt || (p.pt_name.includes('SINGAPERBANGSA') && viewingUni.nama_pt.includes('SINGAPERBANGSA'))).map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded mr-2">{p.jenjang}</span>
                        <span className="text-xs font-bold text-slate-700">{p.nama_prodi}</span>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase bg-${getAccColor(p.akreditasi)}-50 text-${getAccColor(p.akreditasi)}-600`}>{p.akreditasi}</span>
                    </div>
                  ))}
                  {studyPrograms.filter(p => p.pt_name === viewingUni.nama_pt || (p.pt_name.includes('SINGAPERBANGSA') && viewingUni.nama_pt.includes('SINGAPERBANGSA'))).length === 0 && (
                    <p className="text-slate-400 text-xs italic text-center">Belum ada data prodi.</p>
                  )}
                </div>
              </div>
              {viewingUni.description && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deskripsi Singkat</h4>
                  <p className="text-sm text-slate-600 leading-relaxed italic">"{viewingUni.description}"</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button onClick={() => setViewingUni(null)} className="px-6 py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-300">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Panduan */}
      {activeTab === 'Panduan' && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in fade-in">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{trackGuidance.heroTitle}</h3>
            <p className="text-slate-500 font-medium">{trackGuidance.heroSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trackGuidance.details.map(d => (
              <div key={d.id} className={`p-6 rounded-[2rem] border-2 bg-${d.color}-50/30 border-${d.color}-100 flex flex-col h-full`}>
                <div className="mb-4">
                  <span className={`px-3 py-1 bg-${d.color}-100 text-${d.color}-700 rounded-lg text-[9px] font-black uppercase tracking-widest`}>{d.type}</span>
                </div>
                <h4 className={`text-lg font-black text-${d.color}-900 mb-2`}>{d.title}</h4>
                <p className={`text-xs text-${d.color}-800/70 mb-4 flex-1`}>{d.description}</p>
                <div className="space-y-3">
                  <div>
                    <p className={`text-[9px] font-black text-${d.color}-400 uppercase mb-1`}>Kelebihan</p>
                    <ul className="text-[10px] space-y-1 font-bold">
                      {d.pros.map((p, i) => <li key={i} className="flex gap-2 items-center"><div className={`w-1 h-1 rounded-full bg-${d.color}-500`} />{p}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-black text-[9px]">
                <tr>
                  <th className="p-4">Aspek</th>
                  <th className="p-4">Sarjana (S1)</th>
                  <th className="p-4">Vokasi (D3/D4)</th>
                  <th className="p-4">Kedinasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {trackGuidance.comparison.map((row, i) => (
                  <tr key={i}>
                    <td className="p-4 font-bold text-slate-900 align-top">{row.aspect}</td>
                    <td className="p-4 align-top">{row.s1}</td>
                    <td className="p-4 align-top">{row.vokasi}</td>
                    <td className="p-4 align-top">{row.kedinasan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Beasiswa */}
      {activeTab === 'Beasiswa' && (
        <div className="space-y-6 animate-in fade-in">
          {canManage && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddScholarship(true)}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Tambah Beasiswa
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scholarships.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5Z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                </div>
                {canManage && (
                  <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingScholarship({ ...s })}
                      className="p-2 bg-indigo-50 text-indigo-500 rounded-lg hover:bg-indigo-100"
                      title="Edit Beasiswa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDeleteScholarship(s.id)}
                      className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"
                      title="Hapus Beasiswa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                )}
                <div className="relative z-10">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest mb-3 inline-block">Beasiswa</span>
                  <h4 className="text-lg font-black text-slate-800 italic mb-1">{s.title}</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">{s.provider}</p>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-6">"{s.description}"</p>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deadline</p>
                      <p className="text-xs font-bold text-rose-500">{new Date(s.deadline).toLocaleDateString('id-ID')}</p>
                    </div>
                    {s.website && (
                      <button onClick={() => window.open(s.website, '_blank')} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {scholarships.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-black italic uppercase tracking-widest text-xs">Belum ada informasi beasiswa.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Rasio Prodi */}
      {activeTab === 'Rasio' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-black text-[9px]">
                <tr>
                  <th className="p-4 border-b border-slate-100">Kode</th>
                  <th className="p-4 border-b border-slate-100">Nama Prodi</th>
                  <th className="p-4 border-b border-slate-100">PTN</th>
                  <th className="p-4 border-b border-slate-100 text-center">Pendaftar</th>
                  <th className="p-4 border-b border-slate-100 text-center">Diterima</th>
                  <th className="p-4 border-b border-slate-100 text-center">Rasio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedPrograms.map((p) => {
                  const ratio = p.quota && p.peminat
                    ? `1 : ${(p.peminat / p.quota).toFixed(0)}`
                    : (p.peminat || '-');

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 font-mono text-slate-400 align-top">{p.kode_prodi}</td>
                      <td className="p-4 font-bold text-slate-900 align-top">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">{p.jenjang || 'S1'}</span>
                          <span>{p.nama_prodi}</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-slate-50 text-slate-500 border border-slate-100">{p.akreditasi || 'B'}</span>
                        </div>
                        {canManage && (
                          <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingProdi({...p})} className="text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-700">Edit</button>
                            <button onClick={() => handleDeleteProdi(p.id, p.nama_prodi)} className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-700">Hapus</button>
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-top">{p.pt_name}</td>
                      <td className="p-4 text-center align-top">{p.peminat || '-'}</td>
                      <td className="p-4 text-center align-top">{p.quota || '-'}</td>
                      <td className="p-4 text-center font-black text-indigo-600 align-top">{ratio}</td>
                    </tr>
                  );
                })}
                {paginatedPrograms.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">Tidak ada data prodi ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalProdiPages > 1 && (
            <div className="flex items-center justify-between bg-white p-6 border-t border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Halaman {currentPage} dari {totalProdiPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalProdiPages))} disabled={currentPage === totalProdiPages} className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Mengenal PRODI */}
      {activeTab === 'Mengenal' && (() => {
        const activeProdi = filteredMengenalProdi.find(p => p.id === (selectedMengenalProdiId || paginatedMengenalProdi[0]?.id)) || paginatedMengenalProdi[0];
        
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
            {/* Left Panel: Program List */}
            <div className="lg:col-span-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-50 mb-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Daftar Program Studi</h3>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">{filteredMengenalProdi.length} Prodi</span>
                </div>
                <div className="space-y-2">
                  {paginatedMengenalProdi.map(p => {
                    const isSelected = activeProdi?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedMengenalProdiId(p.id)}
                        className={`p-4 rounded-2xl cursor-pointer transition-all border text-left flex justify-between items-center group relative overflow-hidden ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'}`}
                      >
                        <div className="relative z-10">
                          <h4 className="text-xs font-black uppercase tracking-wide leading-tight">{p.programName}</h4>
                          <p className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {p.overview}
                          </p>
                        </div>
                        
                        <div className="flex gap-1 shrink-0 relative z-10 pl-2">
                          {canManageMengenalProdi && (
                            <div className={`flex gap-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMengenalProdi({ ...p });
                                  setCoursesInput(p.courses ? p.courses.join('\n') : '');
                                  setCareersInput(p.careers ? p.careers.join('\n') : '');
                                  setCampusesInput(p.campuses ? p.campuses.join('\n') : '');
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-indigo-700/50 hover:bg-indigo-700 text-white' : 'bg-white hover:bg-slate-200 text-slate-500'}`}
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMengenalProdi(p.id, p.programName);
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-rose-700/50 hover:bg-rose-700 text-white' : 'bg-white hover:bg-slate-200 text-rose-500'}`}
                                title="Hapus"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </div>
                          )}
                          <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ml-1 self-center ${isSelected ? 'text-white' : 'text-slate-400 group-hover:translate-x-1'} transition-transform`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                      </div>
                    );
                  })}
                  {filteredMengenalProdi.length === 0 && (
                    <div className="py-12 text-center text-slate-400 italic text-xs">
                      Tidak ada hasil pencarian.
                    </div>
                  )}
                </div>
              </div>
              
              {totalMengenalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6 bg-white sticky bottom-0">
                  <p className="text-[10px] text-slate-500 font-bold">Halaman {currentMengenalPage} dari {totalMengenalPages}</p>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setCurrentMengenalPage(p => Math.max(p - 1, 1))} 
                      disabled={currentMengenalPage === 1} 
                      className="p-1.5 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button 
                      onClick={() => setCurrentMengenalPage(p => Math.min(p + 1, totalMengenalPages))} 
                      disabled={currentMengenalPage === totalMengenalPages} 
                      className="p-1.5 rounded-lg border bg-white disabled:opacity-50 hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Detailed View */}
            <div className="lg:col-span-8 space-y-6">
              {activeProdi ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
                  {/* Hero Header */}
                  <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5Z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                    </div>
                    <div className="relative z-10 space-y-2">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-lg text-[9px] font-black uppercase tracking-widest inline-block">Mengenal PRODI</span>
                      <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight">{activeProdi.programName}</h2>
                      <div className="w-16 h-1 bg-white rounded-full mt-2" />
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-8 space-y-8">
                    {/* Selayang Pandang */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-600"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                        Selayang Pandang PRODI
                      </h3>
                      <div className="p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 leading-relaxed text-slate-600 font-medium text-sm">
                        "{activeProdi.overview}"
                      </div>
                    </div>

                    {/* Three Column Detail Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-50">
                      {/* Mata Kuliah */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-600"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                          Mata Kuliah
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {activeProdi.courses && activeProdi.courses.length > 0 ? (
                            activeProdi.courses.map((c, i) => (
                              <span key={i} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-xl text-[11px] font-bold transition-all border border-slate-200/60 shadow-sm flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                {c}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">Belum ada data mata kuliah.</p>
                          )}
                        </div>
                      </div>

                      {/* Profesi dan Karir */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                          Profesi & Karir
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {activeProdi.careers && activeProdi.careers.length > 0 ? (
                            activeProdi.careers.map((c, i) => (
                              <span key={i} className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-700 rounded-xl text-[11px] font-bold transition-all border border-slate-200/60 shadow-sm flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                {c}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">Belum ada data profesi & karir.</p>
                          )}
                        </div>
                      </div>

                      {/* Kampus Terkait */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-violet-600"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" /></svg>
                          Kampus Terkait
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {activeProdi.campuses && activeProdi.campuses.length > 0 ? (
                            activeProdi.campuses.map((c, i) => (
                              <span key={i} className="px-3 py-1.5 bg-slate-100 hover:bg-violet-50 hover:text-violet-600 text-slate-700 rounded-xl text-[11px] font-bold transition-all border border-slate-200/60 shadow-sm flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                                {c}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">Belum ada data kampus terkait.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 text-center space-y-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Pilih Program Studi</h4>
                  <p className="text-xs text-slate-400">Pilih program studi di panel kiri untuk melihat detail selengkapnya.</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Edit University Modal */}
      {editingUni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-600 text-white shrink-0">
              <h3 className="text-xl font-black italic uppercase tracking-tight">Edit Data Kampus</h3>
              <p className="text-indigo-100 text-xs mt-1">Perbarui informasi perguruan tinggi.</p>
            </div>
            <form onSubmit={handleSaveEditPT} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Perguruan Tinggi</label>
                  <input
                    type="text"
                    value={editingUni.nama_pt}
                    onChange={e => setEditingUni({ ...editingUni, nama_pt: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kode PT</label>
                    <input
                      type="text"
                      value={editingUni.kode_pt}
                      onChange={e => setEditingUni({ ...editingUni, kode_pt: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Akreditasi</label>
                    <select
                      value={editingUni.akreditasi}
                      onChange={e => setEditingUni({ ...editingUni, akreditasi: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="Unggul">Unggul</option>
                      <option value="A">A</option>
                      <option value="Baik Sekali">Baik Sekali</option>
                      <option value="B">B</option>
                      <option value="Baik">Baik</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Provinsi</label>
                    <input
                      type="text"
                      value={editingUni.provinsi}
                      onChange={e => setEditingUni({ ...editingUni, provinsi: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kota</label>
                    <input
                      type="text"
                      value={editingUni.kota}
                      onChange={e => setEditingUni({ ...editingUni, kota: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Website (tanpa https://)</label>
                  <input
                    type="text"
                    value={editingUni.website}
                    onChange={e => setEditingUni({ ...editingUni, website: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PDDIKTI URL</label>
                  <input
                    type="text"
                    value={editingUni.pddikti_url || ''}
                    onChange={e => setEditingUni({ ...editingUni, pddikti_url: e.target.value })}
                    placeholder="https://pddikti.kemdikbud.go.id/data_pt/..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">Masukkan URL profil kampus di PDDIKTI.</p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setEditingUni(null)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Batal</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Scholarship Modal */}
      {showAddScholarship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-emerald-600 text-white shrink-0">
              <h3 className="text-xl font-black italic uppercase tracking-tight">Tambah Beasiswa</h3>
              <p className="text-emerald-100 text-xs mt-1">Masukkan informasi beasiswa baru.</p>
            </div>
            <form onSubmit={handleAddScholarship} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Beasiswa</label>
                  <input
                    type="text"
                    value={newScholarship.title || ''}
                    onChange={e => setNewScholarship({ ...newScholarship, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Penyelenggara</label>
                  <input
                    type="text"
                    value={newScholarship.provider || ''}
                    onChange={e => setNewScholarship({ ...newScholarship, provider: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deskripsi</label>
                  <textarea
                    value={newScholarship.description || ''}
                    onChange={e => setNewScholarship({ ...newScholarship, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deadline</label>
                    <input
                      type="date"
                      value={newScholarship.deadline || ''}
                      onChange={e => setNewScholarship({ ...newScholarship, deadline: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Website</label>
                    <input
                      type="text"
                      value={newScholarship.website || ''}
                      onChange={e => setNewScholarship({ ...newScholarship, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setShowAddScholarship(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Batal</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Scholarship Modal */}
      {editingScholarship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-600 text-white shrink-0">
              <h3 className="text-xl font-black italic uppercase tracking-tight">Edit Beasiswa</h3>
              <p className="text-indigo-100 text-xs mt-1">Perbarui informasi beasiswa.</p>
            </div>
            <form onSubmit={handleSaveEditScholarship} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Beasiswa</label>
                  <input
                    type="text"
                    value={editingScholarship.title}
                    onChange={e => setEditingScholarship({ ...editingScholarship, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Penyelenggara</label>
                  <input
                    type="text"
                    value={editingScholarship.provider}
                    onChange={e => setEditingScholarship({ ...editingScholarship, provider: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deskripsi</label>
                  <textarea
                    value={editingScholarship.description}
                    onChange={e => setEditingScholarship({ ...editingScholarship, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deadline</label>
                    <input
                      type="date"
                      value={editingScholarship.deadline}
                      onChange={e => setEditingScholarship({ ...editingScholarship, deadline: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Website</label>
                    <input
                      type="text"
                      value={editingScholarship.website || ''}
                      onChange={e => setEditingScholarship({ ...editingScholarship, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setEditingScholarship(null)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Batal</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Format Modal */}
      {showImportFormat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-emerald-600 text-white shrink-0">
              <h3 className="text-xl font-black italic uppercase tracking-tight">Format Import Kampus</h3>
              <p className="text-emerald-100 text-xs mt-1">Gunakan judul kolom berikut pada file Excel Anda.</p>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-[10px] text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-black">
                    <tr>
                      <th className="p-4 border-r border-slate-200">Judul Kolom (Opsi 1)</th>
                      <th className="p-4 border-r border-slate-200">Judul Kolom (Opsi 2)</th>
                      <th className="p-4">Contoh Isi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50 align-top">Nama PT</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50 align-top">nama_pt</td>
                      <td className="p-4 text-indigo-600 italic align-top">Universitas Indonesia</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 align-top">Kode PT</td>
                      <td className="p-4 border-r border-slate-200 align-top">kode_pt</td>
                      <td className="p-4 text-indigo-600 italic align-top">001001</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">Status PT</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">status_pt</td>
                      <td className="p-4 text-indigo-600 italic">Negeri / Swasta / Kedinasan</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200">Provinsi</td>
                      <td className="p-4 border-r border-slate-200">provinsi</td>
                      <td className="p-4 text-indigo-600 italic">Jawa Barat</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">Kota</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">kota</td>
                      <td className="p-4 text-indigo-600 italic">Depok</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200">Akreditasi</td>
                      <td className="p-4 border-r border-slate-200">akreditasi</td>
                      <td className="p-4 text-indigo-600 italic">Unggul / A / B</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">Website</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">website</td>
                      <td className="p-4 text-indigo-600 italic">ui.ac.id</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200">PDDIKTI URL</td>
                      <td className="p-4 border-r border-slate-200">pddikti_url</td>
                      <td className="p-4 text-indigo-600 italic">https://pddikti.kemdikbud.go.id/...</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">Deskripsi</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">description</td>
                      <td className="p-4 text-indigo-600 italic">Kampus perjuangan...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                  <span className="font-black uppercase tracking-widest">Penting:</span> Kolom <span className="underline">Nama PT</span> wajib diisi. Kolom lainnya bersifat opsional. Pastikan file dalam format .xlsx atau .xls.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowImportFormat(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Mengerti</button>
            </div>
          </div>
        </div>
      )}

      {/* Kedinasan Import Format Modal */}
      {showKedinasanImportFormat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-emerald-600 text-white shrink-0">
              <h3 className="text-xl font-black italic uppercase tracking-tight">Format Import Kedinasan</h3>
              <p className="text-emerald-100 text-xs mt-1">Gunakan judul kolom berikut pada file Excel Anda.</p>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-[10px] text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-black">
                    <tr>
                      <th className="p-4 border-r border-slate-200">Judul Kolom (Opsi 1)</th>
                      <th className="p-4 border-r border-slate-200">Judul Kolom (Opsi 2)</th>
                      <th className="p-4">Contoh Isi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50 align-top">Nama PT</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50 align-top">nama_pt</td>
                      <td className="p-4 text-indigo-600 italic align-top">PKN STAN</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 align-top">Kode PT</td>
                      <td className="p-4 border-r border-slate-200 align-top">kode_pt</td>
                      <td className="p-4 text-indigo-600 italic align-top">001001</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">Status PT</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">status_pt</td>
                      <td className="p-4 text-indigo-600 italic">Kedinasan (Otomatis)</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200">Provinsi</td>
                      <td className="p-4 border-r border-slate-200">provinsi</td>
                      <td className="p-4 text-indigo-600 italic">Banten</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">Kota</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">kota</td>
                      <td className="p-4 text-indigo-600 italic">Tangerang Selatan</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200">Akreditasi</td>
                      <td className="p-4 border-r border-slate-200">akreditasi</td>
                      <td className="p-4 text-indigo-600 italic">Unggul / A / B</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">Website</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">website</td>
                      <td className="p-4 text-indigo-600 italic">pknstan.ac.id</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200">PDDIKTI URL</td>
                      <td className="p-4 border-r border-slate-200">pddikti_url</td>
                      <td className="p-4 text-indigo-600 italic">https://pddikti.kemdikbud.go.id/...</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">Deskripsi</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">description</td>
                      <td className="p-4 text-indigo-600 italic">Politeknik Keuangan Negara...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                  <span className="font-black uppercase tracking-widest">Penting:</span> Kolom <span className="underline">Nama PT</span> wajib diisi. Kolom lainnya bersifat opsional. Pastikan file dalam format .xlsx atau .xls.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowKedinasanImportFormat(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Mengerti</button>
            </div>
          </div>
        </div>
      )}

      {/* Prodi Import Format Modal */}
      {showProdiImportFormat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-emerald-600 text-white shrink-0">
              <h3 className="text-xl font-black italic uppercase tracking-tight">Format Import Prodi</h3>
              <p className="text-emerald-100 text-xs mt-1">Gunakan judul kolom berikut pada file Excel Anda.</p>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-[10px] text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-black">
                    <tr>
                      <th className="p-4 border-r border-slate-200">Judul Kolom (Opsi 1)</th>
                      <th className="p-4 border-r border-slate-200">Judul Kolom (Opsi 2)</th>
                      <th className="p-4">Contoh Isi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50 align-top">Kode Prodi</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50 align-top">kode_prodi</td>
                      <td className="p-4 text-indigo-600 italic align-top">361016</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 align-top">Nama Prodi</td>
                      <td className="p-4 border-r border-slate-200 align-top">nama_prodi</td>
                      <td className="p-4 text-indigo-600 italic align-top">KEDOKTERAN</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">Jenjang</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">jenjang</td>
                      <td className="p-4 text-indigo-600 italic">S1 / D3 / D4</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200">Nama PT</td>
                      <td className="p-4 border-r border-slate-200">pt_name</td>
                      <td className="p-4 text-indigo-600 italic">UNIVERSITAS GADJAH MADA</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">Akreditasi</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">akreditasi</td>
                      <td className="p-4 text-indigo-600 italic">Unggul / A</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200">Peminat</td>
                      <td className="p-4 border-r border-slate-200">peminat</td>
                      <td className="p-4 text-indigo-600 italic">3800</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">Daya Tampung</td>
                      <td className="p-4 border-r border-slate-200 bg-slate-50/50">quota</td>
                      <td className="p-4 text-indigo-600 italic">175</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                  <span className="font-black uppercase tracking-widest">Penting:</span> Kolom <span className="underline">Nama Prodi</span> dan <span className="underline">Nama PT</span> wajib diisi. Pastikan file dalam format .xlsx atau .xls.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowProdiImportFormat(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Mengerti</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Prodi Modal */}
      {showAddProdi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-600 text-white shrink-0">
              <h3 className="text-xl font-black italic uppercase tracking-tight">Tambah Prodi</h3>
              <p className="text-indigo-100 text-xs mt-1">Masukkan informasi program studi baru.</p>
            </div>
            <form onSubmit={handleAddProdi} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kode Prodi</label>
                  <input type="text" value={newProdi.kode_prodi || ''} onChange={e => setNewProdi({ ...newProdi, kode_prodi: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Prodi</label>
                  <input type="text" value={newProdi.nama_prodi || ''} onChange={e => setNewProdi({ ...newProdi, nama_prodi: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Kampus (PT)</label>
                  <input type="text" value={newProdi.pt_name || ''} onChange={e => setNewProdi({ ...newProdi, pt_name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jenjang</label>
                    <select value={newProdi.jenjang || 'S1'} onChange={e => setNewProdi({ ...newProdi, jenjang: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                      <option value="S1">S1 (Sarjana)</option>
                      <option value="D4">D4 (Diploma 4)</option>
                      <option value="D3">D3 (Diploma 3)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Akreditasi</label>
                    <select value={newProdi.akreditasi || 'B'} onChange={e => setNewProdi({ ...newProdi, akreditasi: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                      <option value="Unggul">Unggul</option>
                      <option value="A">A</option>
                      <option value="Baik Sekali">Baik Sekali</option>
                      <option value="B">B</option>
                      <option value="Baik">Baik</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pendaftar (Peminat)</label>
                    <input type="number" value={newProdi.peminat || ''} onChange={e => setNewProdi({ ...newProdi, peminat: Number(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Diterima (Daya Tampung)</label>
                    <input type="number" value={newProdi.quota || ''} onChange={e => setNewProdi({ ...newProdi, quota: Number(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setShowAddProdi(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Batal</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Prodi Modal */}
      {editingProdi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-600 text-white shrink-0">
              <h3 className="text-xl font-black italic uppercase tracking-tight">Edit Prodi</h3>
              <p className="text-indigo-100 text-xs mt-1">Perbarui informasi program studi.</p>
            </div>
            <form onSubmit={handleSaveEditProdi} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kode Prodi</label>
                  <input type="text" value={editingProdi.kode_prodi} onChange={e => setEditingProdi({ ...editingProdi, kode_prodi: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Prodi</label>
                  <input type="text" value={editingProdi.nama_prodi} onChange={e => setEditingProdi({ ...editingProdi, nama_prodi: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Kampus (PT)</label>
                  <input type="text" value={editingProdi.pt_name} onChange={e => setEditingProdi({ ...editingProdi, pt_name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jenjang</label>
                    <select value={editingProdi.jenjang || 'S1'} onChange={e => setEditingProdi({ ...editingProdi, jenjang: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                      <option value="S1">S1 (Sarjana)</option>
                      <option value="D4">D4 (Diploma 4)</option>
                      <option value="D3">D3 (Diploma 3)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Akreditasi</label>
                    <select value={editingProdi.akreditasi || 'B'} onChange={e => setEditingProdi({ ...editingProdi, akreditasi: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                      <option value="Unggul">Unggul</option>
                      <option value="A">A</option>
                      <option value="Baik Sekali">Baik Sekali</option>
                      <option value="B">B</option>
                      <option value="Baik">Baik</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pendaftar (Peminat)</label>
                    <input type="number" value={editingProdi.peminat} onChange={e => setEditingProdi({ ...editingProdi, peminat: Number(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Diterima (Daya Tampung)</label>
                    <input type="number" value={editingProdi.quota} onChange={e => setEditingProdi({ ...editingProdi, quota: Number(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setEditingProdi(null)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Batal</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Mengenal Prodi Modal */}
      {showAddMengenalProdi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-600 text-white shrink-0">
              <h3 className="text-xl font-black italic uppercase tracking-tight">Tambah Mengenal Prodi</h3>
              <p className="text-indigo-100 text-xs mt-1">Masukkan informasi detail program studi baru.</p>
            </div>
            <form onSubmit={handleAddMengenalProdi} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Program Studi</label>
                  <input
                    type="text"
                    value={newMengenalProdi.programName || ''}
                    onChange={e => setNewMengenalProdi({ ...newMengenalProdi, programName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Contoh: Teknik Informatika"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selayang Pandang PRODI</label>
                  <textarea
                    value={newMengenalProdi.overview || ''}
                    onChange={e => setNewMengenalProdi({ ...newMengenalProdi, overview: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Deskripsi ringkas mengenai program studi ini..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mata Kuliah (Pisahkan dengan baris baru atau koma)</label>
                  <textarea
                    value={coursesInput}
                    onChange={e => setCoursesInput(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Contoh:&#10;Algoritma dan Pemrograman&#10;Struktur Data&#10;Basis Data"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Profesi dan Karir (Pisahkan dengan baris baru atau koma)</label>
                  <textarea
                    value={careersInput}
                    onChange={e => setCareersInput(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Contoh:&#10;Software Engineer&#10;System Analyst"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kampus Terkait (Pisahkan dengan baris baru atau koma)</label>
                  <textarea
                    value={campusesInput}
                    onChange={e => setCampusesInput(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Contoh:&#10;Universitas Indonesia (UI)&#10;Institut Teknologi Bandung (ITB)"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowAddMengenalProdi(false)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Mengenal Prodi Modal */}
      {editingMengenalProdi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-600 text-white shrink-0">
              <h3 className="text-xl font-black italic uppercase tracking-tight">Edit Mengenal Prodi</h3>
              <p className="text-indigo-100 text-xs mt-1">Perbarui detail data program studi.</p>
            </div>
            <form onSubmit={handleSaveEditMengenalProdi} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Program Studi</label>
                  <input
                    type="text"
                    value={editingMengenalProdi.programName}
                    onChange={e => setEditingMengenalProdi({ ...editingMengenalProdi, programName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selayang Pandang PRODI</label>
                  <textarea
                    value={editingMengenalProdi.overview}
                    onChange={e => setEditingMengenalProdi({ ...editingMengenalProdi, overview: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mata Kuliah (Pisahkan dengan baris baru atau koma)</label>
                  <textarea
                    value={coursesInput}
                    onChange={e => setCoursesInput(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Profesi dan Karir (Pisahkan dengan baris baru atau koma)</label>
                  <textarea
                    value={careersInput}
                    onChange={e => setCareersInput(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kampus Terkait (Pisahkan dengan baris baru atau koma)</label>
                  <textarea
                    value={campusesInput}
                    onChange={e => setCampusesInput(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setEditingMengenalProdi(null)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerGuide;
