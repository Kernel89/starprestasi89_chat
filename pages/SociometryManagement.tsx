
import React, { useState, useMemo, useEffect } from 'react';
import { Student, Rombel, SociometrySession, UserRole, Assignment, SchoolProfile } from '../types';
import { ICONS } from '../constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterhead } from '../utils/pdfHelper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { analyzeSociometryData } from '../geminiService';

interface SociometryManagementProps {
  students: Student[];
  rombels: Rombel[];
  sessions: SociometrySession[];
  setSessions: React.Dispatch<React.SetStateAction<SociometrySession[]>>;
  criteria: string[];
  setCriteria: React.Dispatch<React.SetStateAction<string[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userRole?: UserRole;
  currentUserId?: string;
  assignments: Assignment[];
}

const SociometryManagement: React.FC<SociometryManagementProps & { schoolProfile: SchoolProfile }> = ({ 
  students, 
  rombels, 
  sessions, 
  setSessions, 
  criteria, 
  setCriteria, 
  notify,
  userRole,
  currentUserId,
  assignments,
  schoolProfile
}) => {
  const getInitials = (name: string) => {
    if (!name) return '-';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.') + '.';
  };

  const [isAddMode, setIsAddMode] = useState(false);
  const [activeSession, setActiveSession] = useState<SociometrySession | null>(null);
  const [isManageCriteria, setIsManageCriteria] = useState(false);
  const [newCriterion, setNewCriterion] = useState('');
  const [selectedStudentForRadar, setSelectedStudentForRadar] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Graph States
  const [viewMode, setViewMode] = useState<'stats' | 'graph'>('stats');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  const [studentFillingSession, setStudentFillingSession] = useState<SociometrySession | null>(null);
  const isStudent = userRole === 'student' || userRole === 'ketua_murid';

  const [formData, setFormData] = useState({
    rombelId: '',
    criterion: criteria[0] || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    choices: {} as Record<string, string[]>,
    reasons: {} as Record<string, string[]>
  });

  const [studentChoices, setStudentChoices] = useState<string[]>([]);
  const [studentReasons, setStudentReasons] = useState<string[]>([]);

  const getRombelName = (id: string) => rombels.find(r => r.id === id)?.name || 'Kelas';
  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Siswa';
  
  // Helper Normalisasi String Kelas (Sama dengan DCM)
  const normalize = (str: string, grade: string) => {
    if (!str) return '';
    const g = grade.trim().toUpperCase();
    return str.toUpperCase()
      .replace(new RegExp(`^${g}\\s*`, 'i'), '')
      .replace(/\s+/g, ' ')
      .replace(/\b0+(\d)/g, '$1')
      .trim();
  };

  const getRombelStudents = (rombelId: string) => {
    const rombel = rombels.find(r => r.id === rombelId);
    if (!rombel) return [];
    
    // Normalisasi Rombel untuk pencarian siswa
    const targetGrade = rombel.grade.trim().toUpperCase();
    
    return students.filter(s => {
        if (s.status !== 'Aktif') return false;
        const sGrade = s.grade.trim().toUpperCase();
        if (sGrade !== targetGrade) return false;
        
        return normalize(s.class || '', sGrade) === normalize(rombel.name, targetGrade);
    });
  };

  const activeSociometryAssignment = useMemo(() => {
    if (!isStudent || !currentUserId) return null;
    const student = students.find(s => s.id === currentUserId);
    if (!student) return null;

    const targetGrade = student.grade.trim().toUpperCase();
    const studentClassNormalized = normalize(student.class, targetGrade);

    // Cari Rombel ID milik siswa dengan logika normalisasi
    const studentRombel = rombels.find(r => {
        if (r.grade.trim().toUpperCase() !== targetGrade) return false;
        return normalize(r.name, targetGrade) === studentClassNormalized;
    });

    return assignments.find(a => 
      a.type === 'Sociometry' && a.status === 'Aktif' &&
      ((a.targetType === 'Individu' && a.targetId === currentUserId) ||
       (a.targetType === 'Rombel' && studentRombel && a.targetId === studentRombel.id))
    );
  }, [isStudent, currentUserId, assignments, rombels, students]);

  const studentAvailableSessions = useMemo(() => {
    if (!activeSociometryAssignment || !currentUserId) return [];
    
    // Dapatkan Rombel ID dari assignment atau cari manual dari siswa
    let targetRombelId = '';

    if (activeSociometryAssignment.targetType === 'Rombel') {
        targetRombelId = activeSociometryAssignment.targetId;
    } else {
         // Jika target individu, cari rombel siswa tersebut
         const student = students.find(s => s.id === currentUserId);
         if(student) {
            const targetGrade = student.grade.trim().toUpperCase();
            const studentClassNormalized = normalize(student.class, targetGrade);
            const found = rombels.find(r => {
                 if (r.grade.trim().toUpperCase() !== targetGrade) return false;
                 return normalize(r.name, targetGrade) === studentClassNormalized;
            });
            if(found) targetRombelId = found.id;
         }
    }

    // Tampilkan sesi sosiometri yang dibuat untuk Rombel tersebut
    return sessions.filter(s => s.rombelId === targetRombelId);
  }, [isStudent, currentUserId, students, rombels, sessions, activeSociometryAssignment]);

  const handleStudentChoiceChange = (choiceIndex: number, targetId: string) => {
    const newChoices = [...studentChoices];
    newChoices[choiceIndex] = targetId;
    setStudentChoices(newChoices);
  };

  const handleStudentReasonChange = (choiceIndex: number, reason: string) => {
    const newReasons = [...studentReasons];
    newReasons[choiceIndex] = reason;
    setStudentReasons(newReasons);
  };

  const handleAddCriterion = () => {
    if (!newCriterion.trim()) return;
    if (criteria.includes(newCriterion.trim())) {
      notify("Kriteria sudah ada.", "error");
      return;
    }
    setCriteria(prev => [...prev, newCriterion.trim()]);
    setNewCriterion('');
    notify("Kriteria baru ditambahkan.");
  };

  const handleCreateSession = () => {
    if (!formData.rombelId || !formData.criterion) {
      notify("Mohon lengkapi konfigurasi sesi.", "error");
      return;
    }
    const newSession: SociometrySession = {
      id: `soc-${Date.now()}`,
      rombelId: formData.rombelId,
      date: new Date().toISOString(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      criterion: formData.criterion,
      choices: {},
      reasons: {} 
    };
    setSessions(prev => [newSession, ...prev]);
    setIsAddMode(false);
    notify("Sesi sosiometri berhasil dijadwalkan.");
  };

  const handleSubmitChoices = () => {
    if (!studentFillingSession || !currentUserId) return;
    if (studentChoices.filter(Boolean).length === 0) {
        notify("Pilih minimal 1 teman.", "error");
        return;
    }
    const reasonFilledCount = studentReasons.filter(r => r && r.trim().length > 3).length;
    if (reasonFilledCount < studentChoices.filter(Boolean).length) {
        notify("Mohon berikan alasan singkat untuk setiap pilihan.", "error");
        return;
    }

    setSessions(prev => prev.map(s => s.id === studentFillingSession.id ? {
        ...s,
        choices: { ...s.choices, [currentUserId]: studentChoices.filter(Boolean) },
        reasons: { ...s.reasons, [currentUserId]: studentReasons.filter(Boolean) }
    } : s));
    setStudentFillingSession(null);
    setStudentChoices([]);
    setStudentReasons([]);
    notify("Terima kasih! Pilihanmu telah disimpan.", "success");
  };

  const getSessionStatus = (s: SociometrySession) => {
    const now = new Date();
    const start = new Date(s.startDate);
    const end = new Date(s.endDate);
    end.setHours(23, 59, 59); 
    if (now < start) return 'Belum Mulai';
    if (now > end) return 'Selesai';
    return 'Berlangsung';
  };

  const stats = useMemo(() => {
    if (!activeSession) return null;
    const choicesReceived: Record<string, number> = {};
    const reasonsReceived: Record<string, string[]> = {};
    const mutualChoices: string[][] = [];
    const rombelStudents = getRombelStudents(activeSession.rombelId);
    
    rombelStudents.forEach(s => {
      choicesReceived[s.id] = 0;
      reasonsReceived[s.id] = [];
    });
    
    Object.keys(activeSession.choices).forEach((voterId) => {
      const chosenIds = activeSession.choices[voterId];
      const reasonsList = activeSession.reasons?.[voterId] || [];
      if (chosenIds) {
        chosenIds.forEach((cid, idx) => {
          if (choicesReceived[cid] !== undefined) {
            choicesReceived[cid]++;
            if (reasonsList[idx]) reasonsReceived[cid].push(reasonsList[idx]);
            // Check mutual
            if (activeSession.choices[cid]?.includes(voterId)) {
                // Store pairs consistently to avoid duplicates (e.g., sorted IDs)
                const pair = [voterId, cid].sort().join('-');
                if (!mutualChoices.find(m => m.join('-') === pair)) {
                    mutualChoices.push([voterId, cid]);
                }
            }
          }
        });
      }
    });

    const fullData = rombelStudents.map(s => ({
      name: getInitials(s.name),
      fullName: getInitials(s.name),
      gender: s.gender,
      count: choicesReceived[s.id] || 0,
      id: s.id
    })).sort((a, b) => b.count - a.count);

    return { 
        fullData, 
        dominantData: [...fullData].slice(0, Math.ceil(fullData.length * 0.25)),
        subordinateData: [...fullData].slice(-Math.ceil(fullData.length * 0.25)).reverse(),
        isolates: rombelStudents.filter(s => (choicesReceived[s.id] || 0) === 0),
        mutualChoices, 
        participantCount: Object.keys(activeSession.choices).length, 
        totalStudents: rombelStudents.length,
        choicesReceived,
        reasonsReceived
    };
  }, [activeSession, students, rombels]);

  const handleAiSociometry = async () => {
    if (!activeSession || !stats) return;
    setIsAiLoading(true);
    setAiInsight(null);
    const result = await analyzeSociometryData(getRombelName(activeSession.rombelId), stats);
    setAiInsight(result);
    setAiInsight(result);
    setIsAiLoading(false);
  };

  const handleExportPDF = () => {
    if (!activeSession || !stats) return;
    const doc = new jsPDF('portrait');
    const startY = drawLetterhead(doc, schoolProfile, 'p');

    doc.setFontSize(14); doc.setFont("times", "bold");
    doc.text("LAPORAN ANALISIS SOSIOMETRI", 105, startY + 5, { align: 'center' });
    doc.setFontSize(11); doc.setFont("times", "normal");
    doc.text(`Kriteria: ${activeSession.criterion}`, 105, startY + 11, { align: 'center' });
    doc.text(`Responden: ${stats.participantCount}/${stats.totalStudents}`, 105, startY + 17, { align: 'center' });

    autoTable(doc, {
      startY: startY + 25,
      head: [['No', 'Nama Siswa', 'Skor Popularitas', 'Status']],
      body: stats.fullData.map((s, idx) => [
        idx + 1,
        s.fullName,
        s.count,
        stats.isolates.some(iso => iso.id === s.id) ? 'Isolate' : stats.dominantData.some(dom => dom.id === s.id) ? 'Social Star' : 'Reguler'
      ]),
      styles: { font: 'times', fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const signY = finalY > 240 ? 30 : finalY;
    if (finalY > 240) doc.addPage();

    doc.text("Mengetahui,", 30, signY);
    doc.text("Kepala Sekolah,", 30, signY + 5);
    doc.text(schoolProfile.principalName, 30, signY + 30);
    doc.text(`NIP. ${schoolProfile.principalNip}`, 30, signY + 35);

    doc.text(`${schoolProfile.city || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, signY);
    doc.text("Guru BK / Konselor,", 140, signY + 5);
    doc.text(schoolProfile.counselorName, 140, signY + 30);
    doc.text(`NIP. ${schoolProfile.counselorNip}`, 140, signY + 35);

    doc.save(`Sosiometri_${getRombelName(activeSession.rombelId)}_${Date.now()}.pdf`);
    notify("Laporan sosiometri berhasil diunduh.", "success");
  };

  const radarData = useMemo(() => {
    if (!activeSession || !selectedStudentForRadar || !stats) return null;
    const sid = selectedStudentForRadar;
    const totalStudents = stats.totalStudents;
    
    const popularity = (stats.choicesReceived[sid] / Math.max(1, totalStudents - 1)) * 100;
    const outgoing = activeSession.choices[sid] || [];
    let mutualCount = 0;
    outgoing.forEach(cid => {
        if (activeSession.choices[cid]?.includes(sid)) mutualCount++;
    });
    const reciprocity = outgoing.length > 0 ? (mutualCount / outgoing.length) * 100 : 0;
    const socialActivity = (outgoing.length / 2) * 100; 
    let firstChoiceCount = 0;
    Object.keys(activeSession.choices).forEach(voterId => {
        if (activeSession.choices[voterId][0] === sid) firstChoiceCount++;
    });
    const intensity = stats.choicesReceived[sid] > 0 ? (firstChoiceCount / stats.choicesReceived[sid]) * 100 : 0;
    const connectivity = (popularity + reciprocity) / 2;

    return [
      { subject: 'Popularitas', value: Math.min(100, popularity * 2) },
      { subject: 'Resiprositas', value: reciprocity },
      { subject: 'Aktivitas', value: socialActivity },
      { subject: 'Intensitas', value: intensity },
      { subject: 'Konektivitas', value: Math.min(100, connectivity * 1.5) }
    ];
  }, [activeSession, selectedStudentForRadar, stats]);

  const getCounselorNote = () => {
    if (!radarData) return "";
    const pop = radarData.find(d => d.subject === 'Popularitas')?.value || 0;
    const res = radarData.find(d => d.subject === 'Resiprositas')?.value || 0;
    const act = radarData.find(d => d.subject === 'Aktivitas')?.value || 0;

    if (pop === 0) return "Siswa tergolong 'Isolate' (Tersisih). Tidak ada teman yang memilih siswa ini sebagai pilihan utama maupun kedua.";
    if (res === 0 && act > 0) return "Hubungan sepihak (Unreciprocated). Siswa mencoba berinteraksi namun belum mendapat sambutan balik dari teman yang dipilih.";
    if (pop > 80 && res > 80) return "Siswa merupakan 'Social Star'. Memiliki popularitas tinggi dan hubungan timbal balik yang sangat kuat di kelas.";
    if (act === 0) return "Siswa pasif secara sosial. Perlu didorong untuk lebih berani memulai interaksi dengan teman sebaya.";
    return "Profil sosial moderat. Siswa memiliki lingkaran pertemanan yang cukup stabil namun masih bisa dikembangkan.";
  };

  // --- SOSIOGRAM VISUALIZATION RENDERER ---
  const renderSociogram = () => {
    if (!stats || !activeSession) return null;

    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60; // Padding from edge

    const studentCount = stats.fullData.length;
    const angleStep = (2 * Math.PI) / studentCount;

    // 1. Calculate Positions
    const nodes = stats.fullData.map((student, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top
        return {
            ...student,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            angle
        };
    });

    // 2. Generate Links
    const links: React.ReactElement[] = [];
    
    // Draw edges
    nodes.forEach(source => {
        const choices = activeSession.choices[source.id] || [];
        choices.forEach(targetId => {
            const target = nodes.find(n => n.id === targetId);
            if (target) {
                // Check if mutual
                const isMutual = activeSession.choices[targetId]?.includes(source.id);
                
                // Determine opacity based on hover state
                // If hoverNode is null, all lines visible (but faint).
                // If hoverNode is set, only lines connected to it are visible/highlighted.
                const isRelevant = hoveredNode === source.id || hoveredNode === target.id;
                const opacity = hoveredNode ? (isRelevant ? 1 : 0.05) : 0.15;
                const strokeWidth = isRelevant ? 2 : 1;
                const color = isMutual ? '#10b981' : '#94a3b8'; // Green for mutual, Slate for one-way
                
                // Avoid drawing double lines for mutual (only draw if source ID < target ID for unique pair)
                if (isMutual && source.id > target.id) return;

                links.push(
                    <line 
                        key={`${source.id}-${target.id}`}
                        x1={source.x} y1={source.y}
                        x2={target.x} y2={target.y}
                        stroke={color}
                        strokeWidth={isMutual ? strokeWidth + 1 : strokeWidth}
                        strokeOpacity={isMutual && hoveredNode ? 1 : opacity}
                        markerEnd={isMutual ? undefined : "url(#arrowhead)"}
                    />
                );
            }
        });
    });

    return (
        <div className="w-full h-[600px] bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-center overflow-hidden relative select-none">
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                </defs>
                
                {/* Connections */}
                {links}

                {/* Nodes */}
                {nodes.map(node => {
                    const isHovered = hoveredNode === node.id;
                    const isRelated = hoveredNode && (
                        activeSession.choices[hoveredNode]?.includes(node.id) || 
                        activeSession.choices[node.id]?.includes(hoveredNode)
                    );
                    
                    const nodeColor = node.gender === 'Perempuan' ? '#ec4899' : '#3b82f6';
                    // Size based on popularity (count)
                    const nodeSize = 15 + (node.count * 1.5); 

                    return (
                        <g 
                            key={node.id} 
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            onClick={() => setSelectedStudentForRadar(node.id)}
                            className="cursor-pointer transition-all duration-300"
                            style={{ opacity: hoveredNode && !isHovered && !isRelated ? 0.3 : 1 }}
                        >
                            <circle 
                                cx={node.x} cy={node.y} r={nodeSize} 
                                fill="white" stroke={nodeColor} strokeWidth={isHovered ? 4 : 2}
                                className="transition-all duration-300 shadow-sm"
                            />
                            <text 
                                x={node.x} y={node.y} dy={4} 
                                textAnchor="middle" 
                                fontSize={10} 
                                fontWeight="bold" 
                                fill="#1e293b"
                                className="pointer-events-none"
                            >
                                {node.name}
                            </text>
                            {/* Pop Count Badge */}
                            {node.count > 0 && (
                                <g transform={`translate(${node.x + 10}, ${node.y - 10})`}>
                                    <circle r={8} fill={nodeColor} />
                                    <text dy={3} textAnchor="middle" fontSize={9} fontWeight="bold" fill="white">{node.count}</text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur p-4 rounded-2xl text-xs shadow-sm border border-slate-200">
                <h5 className="font-bold mb-2 uppercase text-slate-400 tracking-widest text-[10px]">Legenda</h5>
                <div className="space-y-2">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-blue-500 bg-white"></span> Laki-laki</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-pink-500 bg-white"></span> Perempuan</div>
                    <div className="flex items-center gap-2"><span className="w-8 h-0.5 bg-slate-400"></span> Pilihan (1 Arah)</div>
                    <div className="flex items-center gap-2"><span className="w-8 h-1 bg-emerald-500"></span> Saling Memilih</div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analisis Sosiometri</h2>
          <p className="text-slate-500 text-sm">
            {isStudent ? 'Pilih teman sesuai kriteria bimbingan.' : 'Pahami struktur dan dinamika hubungan sosial di dalam kelas.'}
          </p>
        </div>
        {!isStudent && (
          <div className="flex gap-2">
            <button onClick={() => setIsManageCriteria(!isManageCriteria)} className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Kelola Kriteria
            </button>
            <button onClick={() => setIsAddMode(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>
              Buat Sesi
            </button>
          </div>
        )}
      </header>

      {isStudent && (
        <div className="space-y-6">
            {!activeSociometryAssignment ? (
                <div className="flex flex-col items-center justify-center py-32 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold">Akses Sosiometri Belum Dibuka.</p>
                    <p className="text-xs text-slate-300 mt-2">Hubungi Guru BK untuk mengaktifkan tugas sosiometri.</p>
                </div>
            ) : !studentFillingSession ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2">
                    {studentAvailableSessions.length > 0 ? studentAvailableSessions.map(s => {
                        const status = getSessionStatus(s);
                        const hasFilled = currentUserId && s.choices[currentUserId];
                        return (
                            <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-all">
                                <span className={`w-fit px-3 py-1 rounded-full text-[9px] font-bold uppercase mb-4 ${status === 'Berlangsung' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{status}</span>
                                <h3 className="text-lg font-black text-slate-800 mb-2">{s.criterion}</h3>
                                <p className="text-xs text-slate-500 mb-6">Batas: {new Date(s.endDate).toLocaleDateString('id-ID')}</p>
                                <button disabled={!!hasFilled || status !== 'Berlangsung'} onClick={() => { setStudentFillingSession(s); setStudentChoices([]); setStudentReasons([]); }} className={`w-full py-3 rounded-xl text-xs font-black uppercase transition-all ${hasFilled ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'}`}>
                                    {hasFilled ? 'Sudah Diisi' : 'Mulai Isi'}
                                </button>
                            </div>
                        )
                    }) : (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            <p className="font-bold">Tidak ada kriteria sosiometri yang tersedia untuk kelas Anda saat ini.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl animate-in zoom-in-95">
                    <h3 className="text-xl font-black text-center text-slate-800 mb-2">{studentFillingSession.criterion}</h3>
                    <p className="text-slate-500 text-sm text-center mb-8">Pilih teman sekelasmu dan berikan alasan mengapa memilih mereka.</p>
                    <div className="space-y-6 mb-8">
                        {[0, 1].map((idx) => (
                            <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-black text-indigo-600 uppercase tracking-widest block">Pilihan Ke-{idx + 1}</label>
                                </div>
                                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" value={studentChoices[idx] || ''} onChange={(e) => handleStudentChoiceChange(idx, e.target.value)}>
                                    <option value="">-- Pilih Teman --</option>
                                    {getRombelStudents(studentFillingSession.rombelId)
                                      .filter(s => s.id !== currentUserId && (!studentChoices.includes(s.id) || studentChoices[idx] === s.id))
                                      .sort((a,b) => a.name.localeCompare(b.name))
                                      .map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                    }
                                </select>
                                <textarea 
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none h-20"
                                    placeholder="Tuliskan alasan Anda memilih teman ini..."
                                    value={studentReasons[idx] || ''}
                                    onChange={e => handleStudentReasonChange(idx, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setStudentFillingSession(null)} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase">Batal</button>
                        <button onClick={handleSubmitChoices} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl active:scale-95 transition-all">Kirim Jawaban</button>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* COUNSELOR VIEW */}
      {!isStudent && (
        <div className="space-y-8">
           {activeSession && stats ? (
             <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <button onClick={() => { setActiveSession(null); setSelectedStudentForRadar(null); setAiInsight(null); setViewMode('stats'); }} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors group">
                          <div className="p-2 bg-white rounded-xl border border-slate-200 group-hover:border-slate-400 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></div>
                          Kembali
                      </button>
                      <button onClick={handleExportPDF} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                          Unduh Laporan
                      </button>
                   </div>
                   <div className="text-right">
                      <h3 className="text-xl font-black text-slate-800">{activeSession.criterion}</h3>
                   </div>
                </div>

                {/* View Mode Toggles */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                    <button onClick={() => setViewMode('stats')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'stats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Statistik Data</button>
                    <button onClick={() => setViewMode('graph')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'graph' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Visualisasi Sosiogram</button>
                </div>

                {viewMode === 'graph' ? (
                    <div className="space-y-6">
                        {renderSociogram()}
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-center">
                            <p className="text-xs font-bold text-indigo-800">
                                <span className="font-black uppercase tracking-widest">Tips:</span> Arahkan kursor ke node siswa untuk melihat koneksi spesifik. Klik siswa untuk melihat analisis detail profil di bawah.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* STATS CARD */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Statistik Partisipasi</h4>
                                <div className="flex items-end justify-between">
                                    <span className="text-3xl font-black text-indigo-600">{stats.participantCount}/{stats.totalStudents}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-lg">Responden</span>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm max-h-[500px] overflow-y-auto custom-scrollbar">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Peringkat Popularitas</h4>
                                <div className="space-y-3">
                                    {stats.fullData.map((s, idx) => (
                                    <div key={s.id} onClick={() => setSelectedStudentForRadar(s.id)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedStudentForRadar === s.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 hover:bg-indigo-50 text-slate-700'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black w-5 ${selectedStudentForRadar === s.id ? 'text-indigo-200' : 'text-slate-400'}`}>{idx + 1}</span>
                                            <span className="text-xs font-bold truncate max-w-[120px]">{s.fullName}</span>
                                        </div>
                                        <span className={`text-xs font-black ${selectedStudentForRadar === s.id ? 'text-white' : 'text-indigo-600'}`}>{s.count}</span>
                                    </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RADAR CHART */}
                        <div className="lg:col-span-2 space-y-6">
                            {selectedStudentForRadar && radarData ? (
                                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-[500px]">
                                    <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-lg font-black text-slate-800">{getStudentName(selectedStudentForRadar)}</h4>
                                        <p className="text-xs font-bold text-slate-400 mt-1">{getCounselorNote()}</p>
                                    </div>
                                    {stats.isolates.some(s => s.id === selectedStudentForRadar) && (
                                        <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Isolate</span>
                                    )}
                                    </div>
                                    <div className="flex-1 w-full min-h-0">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name={getStudentName(selectedStudentForRadar)} dataKey="value" stroke="#4f46e5" strokeWidth={3} fill="#6366f1" fillOpacity={0.4} />
                                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px'}} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 h-[500px] flex flex-col items-center justify-center text-center text-slate-400">
                                    <ICONS.Sociometry />
                                    <p className="text-sm font-bold mt-4 uppercase tracking-widest">Pilih siswa untuk analisis detail</p>
                                </div>
                            )}

                            {/* AI ANALYSIS */}
                            <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><ICONS.Sparkles /></div>
                                <div className="relative z-10">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-indigo-300">AI Sociogram Insight</h4>
                                    {!aiInsight ? (
                                    <button onClick={handleAiSociometry} disabled={isAiLoading} className="bg-white text-indigo-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg active:scale-95 disabled:opacity-70">
                                        {isAiLoading ? 'Menganalisis Pola Sosial...' : 'Analisis Dinamika Kelas'}
                                    </button>
                                    ) : (
                                    <div className="prose prose-invert prose-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                                        <div className="whitespace-pre-line text-xs font-medium leading-relaxed opacity-90">{aiInsight}</div>
                                        <button onClick={() => setAiInsight(null)} className="mt-4 text-[10px] font-bold text-indigo-300 hover:text-white uppercase tracking-widest">Tutup</button>
                                    </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map(s => {
                   const status = getSessionStatus(s);
                   return (
                      <div key={s.id} onClick={() => { setActiveSession(s); setViewMode('stats'); }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col">
                         <div className="flex justify-between items-start mb-4">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${status === 'Berlangsung' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{status}</span>
                            <div className="text-xs font-bold text-slate-400">{new Date(s.startDate).toLocaleDateString('id-ID')}</div>
                         </div>
                         <h3 className="text-lg font-black text-slate-800 mb-1 line-clamp-2">{s.criterion}</h3>
                         <p className="text-xs font-bold text-indigo-600 mb-6">Kelas {getRombelName(s.rombelId)}</p>
                         <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Object.keys(s.choices).length} Respon</span>
                            <span className="text-[10px] font-black text-indigo-600 uppercase group-hover:translate-x-1 transition-transform">Analisis →</span>
                         </div>
                      </div>
                   );
                })}
                {sessions.length === 0 && (
                   <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold italic">Belum ada sesi sosiometri yang dibuat.</p>
                   </div>
                )}
             </div>
           )}
        </div>
      )}

      {/* MODAL ADD SESSION */}
      {isAddMode && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
               <header className="p-8 bg-indigo-600 text-white shrink-0">
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Jadwalkan Sosiometri</h3>
                  <p className="text-indigo-100 text-xs mt-1">Buat sesi pengambilan data hubungan sosial siswa.</p>
               </header>
               <div className="p-8 space-y-6">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Kelas</label>
                     <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100" value={formData.rombelId} onChange={e => setFormData({...formData, rombelId: e.target.value})}>
                        <option value="">-- Pilih Rombel --</option>
                        {rombels.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kriteria Hubungan</label>
                     <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100" value={formData.criterion} onChange={e => setFormData({...formData, criterion: e.target.value})}>
                        {criteria.map((c, i) => <option key={i} value={c}>{c}</option>)}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mulai</label>
                        <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Selesai</label>
                        <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                     </div>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-slate-50">
                     <button onClick={() => setIsAddMode(false)} className="flex-1 py-3 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Batal</button>
                     <button onClick={handleCreateSession} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Buat Sesi</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* MODAL MANAGE CRITERIA */}
      {isManageCriteria && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/20">
               <header className="p-8 bg-slate-900 text-white shrink-0">
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Kriteria Sosiometri</h3>
                  <p className="text-slate-400 text-xs mt-1">Pertanyaan dasar untuk pilihan teman.</p>
               </header>
               <div className="p-8 space-y-6">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                     {criteria.map((c, i) => (
                        <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 flex justify-between items-center group">
                           {c}
                           <button onClick={() => setCriteria(prev => prev.filter(x => x !== c))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">Hapus</button>
                        </div>
                     ))}
                  </div>
                  <div className="flex gap-2 border-t border-slate-50 pt-4">
                     <input className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100" placeholder="Tambah kriteria baru..." value={newCriterion} onChange={e => setNewCriterion(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddCriterion()} />
                     <button onClick={handleAddCriterion} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">Tambah</button>
                  </div>
                  <button onClick={() => setIsManageCriteria(false)} className="w-full py-3 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Tutup</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default SociometryManagement;
