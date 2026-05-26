
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Student, Teacher, Rombel, GuidanceSession, HomeVisit, Advocacy,
  CaseConference, Referral, TeachingSlot, UserRole, UserSession,
  StarPrestasi, Assignment, DCMSubmission, GuidanceMaterial, Appointment,
  SociometrySession, University, StudyProgram, SatisfactionFeedback, Quote,
  QuestionnaireSubmission, AttendanceLog, ClassReport
} from '../types';
import { ICONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Label, LineChart, Line, AreaChart, Area, Legend } from 'recharts';

interface DashboardProps {
  schoolName: string;
  schoolLogo?: string;
  students: Student[];
  alumni?: Student[];
  rombels: Rombel[];
  sessions: GuidanceSession[];
  homeVisits: HomeVisit[];
  advocacies: Advocacy[];
  conferences: CaseConference[];
  referrals: Referral[];
  userRole: UserRole;
  teachers: Teacher[];
  schedule: TeachingSlot[];
  currentUser: UserSession;
  starData: StarPrestasi[];
  assignments: Assignment[];
  dcmSubmissions: DCMSubmission[];
  materials: GuidanceMaterial[];
  appointments: Appointment[];
  sociometrySessions: SociometrySession[];
  universities: University[];
  studyPrograms: StudyProgram[];
  feedbacks: SatisfactionFeedback[];
  setFeedbacks: React.Dispatch<React.SetStateAction<SatisfactionFeedback[]>>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  quotes: Quote[];
  questionnaireSubmissions: QuestionnaireSubmission[];
  attendanceLogs: AttendanceLog[];
  setAttendanceLogs: React.Dispatch<React.SetStateAction<AttendanceLog[]>>;
  classReports: ClassReport[];
  setClassReports: React.Dispatch<React.SetStateAction<ClassReport[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({
  schoolName, schoolLogo, students, alumni, rombels, sessions, homeVisits,
  advocacies, conferences, referrals, userRole, teachers, schedule,
  currentUser, starData, assignments, dcmSubmissions, materials,
  appointments, sociometrySessions, universities, studyPrograms,
  feedbacks, setFeedbacks, notify, quotes, questionnaireSubmissions,
  attendanceLogs, setAttendanceLogs, classReports, setClassReports
}) => {

  const normalizeClassSuffix = (str: string) => {
    if (!str) return '';
    let cleaned = str.trim().replace(/\s+/g, ' ').toUpperCase();
    const parts = cleaned.split(' ');
    const lastPart = parts[parts.length - 1];
    if (!isNaN(Number(lastPart)) && /^\d+$/.test(lastPart)) {
      parts[parts.length - 1] = parseInt(lastPart, 10).toString();
    }
    return parts.join(' ');
  };

  const extractShortName = (fullName: string, grade: string) => {
    const normalizedGrade = grade.trim().toUpperCase();
    const nameWithoutGrade = fullName.replace(new RegExp(`^${normalizedGrade}\\s*`, 'i'), '');
    return normalizeClassSuffix(nameWithoutGrade);
  };

  // Statistics
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [selectedAbsenceStatusFilter, setSelectedAbsenceStatusFilter] = useState<string>('All');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('All');
  const [selectedTrendStudent, setSelectedTrendStudent] = useState<string>('All');
  const [selectedTrendMonth, setSelectedTrendMonth] = useState<string>('All');
  const [selectedTrendYear, setSelectedTrendYear] = useState<string>('All');

  // Dynamically extract unique years from attendance logs
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    attendanceLogs.forEach(log => {
      if (log.date) {
        const year = new Date(log.date).getFullYear().toString();
        if (year && year !== 'NaN') {
          years.add(year);
        }
      }
    });
    if (years.size === 0) {
      years.add(new Date().getFullYear().toString());
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [attendanceLogs]);

  // Set of all student IDs registered in tracer alumni
  const alumniIds = useMemo(() => {
    return new Set((alumni || []).map(a => a.id));
  }, [alumni]);

  // Set of active student IDs who are registered in class management (rombels)
  const classManagementStudentIds = useMemo(() => {
    const ids = new Set<string>();

    rombels.forEach(rombel => {
      const targetGrade = rombel.grade.trim().toUpperCase();
      const targetSuffix = extractShortName(rombel.name, rombel.grade);

      students.forEach(s => {
        if (s.status !== 'Aktif') return;
        const sGrade = (s.grade || '').trim().toUpperCase();
        const sSuffix = normalizeClassSuffix(s.class || '');
        if (sGrade === targetGrade && sSuffix === targetSuffix) {
          ids.add(s.id);
        }
      });
    });

    return ids;
  }, [rombels, students]);

  const stats = useMemo(() => {
    let counselorStudentIds: Set<string> | null = null;
    let visibleRombels = rombels;
    let counselorRombelsCount = rombels.length;

    if (userRole === 'counselor') {
      const myTeacherProfile = teachers.find(t => t.name === currentUser?.name);
      if (myTeacherProfile) {
        const myRombelIds = new Set<string>();
        rombels.filter(r => r.homeroomTeacherId === myTeacherProfile.id).forEach(r => myRombelIds.add(r.id));

        const gradeMatch = myTeacherProfile.assignment.match(/Tingkat (X|XI|XII)/i);
        if (gradeMatch) {
          const targetGrade = gradeMatch[1].toUpperCase();
          rombels.filter(r => r.grade === targetGrade).forEach(r => myRombelIds.add(r.id));
        }

        visibleRombels = rombels.filter(r => myRombelIds.has(r.id));
        counselorRombelsCount = visibleRombels.length;

        counselorStudentIds = new Set<string>();
        visibleRombels.forEach(rombel => {
          const targetGrade = rombel.grade.trim().toUpperCase();
          const targetSuffix = extractShortName(rombel.name, rombel.grade);

          students.forEach(s => {
            const sGrade = (s.grade || '').trim().toUpperCase();
            const sSuffix = normalizeClassSuffix(s.class || '');
            if (sGrade === targetGrade && sSuffix === targetSuffix) {
              counselorStudentIds!.add(s.id);
            }
          });
        });
      } else {
        counselorStudentIds = new Set<string>();
        visibleRombels = [];
        counselorRombelsCount = 0;
      }
    }

    const visibleStudents = students.filter(s => {
      if (userRole === 'counselor' && counselorStudentIds && !counselorStudentIds.has(s.id)) {
        return false;
      }
      return s.status === 'Aktif';
    });

    const visibleSessions = userRole === 'counselor'
      ? sessions.filter(s => s.counselorName === currentUser?.name)
      : sessions;
    const visibleHomeVisits = userRole === 'counselor'
      ? homeVisits.filter(v => v.counselorName === currentUser?.name)
      : homeVisits;
    const visibleAdvocacies = userRole === 'counselor'
      ? advocacies.filter(a => a.counselorName === currentUser?.name)
      : advocacies;
    const visibleReferrals = userRole === 'counselor'
      ? referrals.filter(r => r.counselorName === currentUser?.name)
      : referrals;

    const totalStudents = visibleStudents.length;
    const atRiskStudents = visibleStudents.filter(s => s.riskLevel === 'Tinggi').length;
    const totalSessions = visibleSessions.length;
    const totalVisits = visibleHomeVisits.length;
    const totalRombels = counselorRombelsCount;

    // Service distribution for charts
    const services = [
      { name: 'Pribadi', value: visibleSessions.filter(s => s.type === 'Pribadi').length, color: '#14b8a6' },
      { name: 'Kelompok', value: visibleSessions.filter(s => s.type === 'Kelompok').length, color: '#8b5cf6' },
      { name: 'Klasikal', value: visibleSessions.filter(s => s.type === 'Klasikal').length, color: '#ec4899' },
      { name: 'Masalah', value: visibleHomeVisits.length + visibleAdvocacies.length + visibleReferrals.length, color: '#f43f5e' }
    ];

    return { totalStudents, atRiskStudents, totalSessions, totalVisits, totalRombels, services, visibleStudents, visibleRombels };
  }, [students, sessions, homeVisits, advocacies, referrals, userRole, teachers, currentUser, rombels]);

  const randomQuote = useMemo(() => {
    if (quotes.length === 0) return { text: "Pendidikan adalah senjata paling ampuh untuk mengubah dunia.", author: "Nelson Mandela" };
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, [quotes]);

  const isStudent = userRole === 'student' || userRole === 'ketua_murid';

  const uncompletedAssignments = useMemo(() => {
    if (!isStudent || !currentUser?.id) return [];

    const student = students.find(s => s.id === currentUser.id);
    if (!student) return [];

    return assignments.filter(a => {
      // 1. Check if assignment is active
      if (a.status !== 'Aktif') return false;

      // 2. Check if student is target
      let isTargetMatch = false;
      if (a.targetType === 'Individu' && a.targetId === currentUser.id) {
        isTargetMatch = true;
      } else if (a.targetType === 'Rombel') {
        const targetRombelObj = rombels.find(r => r.id === a.targetId);
        if (targetRombelObj) {
          const sGrade = student.grade.trim().toUpperCase();
          const rGrade = targetRombelObj.grade.trim().toUpperCase();
          const normalize = (str: string) => {
            if (!str) return '';
            const g = rGrade.trim().toUpperCase();
            return str.toUpperCase()
              .replace(new RegExp(`^${g}\\s*`, 'i'), '') // Remove Grade prefix if present
              .replace(/\s+/g, ' ') // Standardize spaces
              .replace(/\b0+(\d)/g, '$1') // Remove leading zeros from numbers (01 -> 1)
              .trim();
          };
          
          if (sGrade === rGrade && normalize(student.class) === normalize(targetRombelObj.name)) {
            isTargetMatch = true;
          }
        }
      }
      if (!isTargetMatch) return false;

      // 3. Check if already submitted
      if (a.type === 'DCM') {
        return !dcmSubmissions.some(s => s.studentId === currentUser.id);
      } else if (a.type === 'Sociometry') {
        return !sociometrySessions.some(s => s.choices && s.choices[currentUser.id]);
      } else if (a.type === 'Satisfaction') {
        return !feedbacks.some(f => f.studentId === currentUser.id);
      } else {
        return !questionnaireSubmissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id);
      }
    });
  }, [isStudent, currentUser, assignments, students, rombels, dcmSubmissions, sociometrySessions, feedbacks, questionnaireSubmissions]);

  const studentStarData = useMemo(() => {
    if (!isStudent || !currentUser?.id) return null;
    return starData.find(s => s.studentId === currentUser.id);
  }, [isStudent, currentUser, starData]);

  const studentAttendanceData = useMemo(() => {
    if (!isStudent || !currentUser?.id) return [];

    const logs = attendanceLogs.filter(log => log.studentId === currentUser.id);

    // Deduplicate logs: keep the latest one for each date+slot
    const uniqueLogsMap = new Map<string, AttendanceLog>();
    logs.forEach(log => {
      const key = `${log.date}-${log.slotId}`;
      const existing = uniqueLogsMap.get(key);
      // If no existing log for this slot, or if the current log is newer, update the map
      if (!existing || new Date(log.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
        uniqueLogsMap.set(key, log);
      }
    });
    const uniqueLogs = Array.from(uniqueLogsMap.values());

    const total = uniqueLogs.length;
    const counts = {
      Hadir: uniqueLogs.filter(l => l.status === 'Hadir').length,
      Sakit: uniqueLogs.filter(l => l.status === 'Sakit').length,
      Izin: uniqueLogs.filter(l => l.status === 'Izin').length,
      Alfa: uniqueLogs.filter(l => l.status === 'Alfa').length,
    };

    return [
      { name: 'Hadir', value: counts.Hadir, color: '#10b981' },
      { name: 'Sakit', value: counts.Sakit, color: '#f59e0b' },
      { name: 'Izin', value: counts.Izin, color: '#06b6d4' },
      { name: 'Alfa', value: counts.Alfa, color: '#f43f5e' },
    ].filter(d => d.value > 0).map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
    }));
  }, [isStudent, currentUser, attendanceLogs]);

  const studentAbsenceChartData = useMemo(() => {
    if (!isStudent || !currentUser?.id) return [];
    const studentLogs = (attendanceLogs || []).filter(l => l.studentId === currentUser.id);
    const counts = {
      Sakit: studentLogs.filter(l => l.status === 'Sakit').length,
      Izin: studentLogs.filter(l => l.status === 'Izin').length,
      Alfa: studentLogs.filter(l => l.status === 'Alfa').length,
    };

    return [
      { name: 'Sakit', value: counts.Sakit, color: '#f59e0b' },
      { name: 'Izin', value: counts.Izin, color: '#3b82f6' },
      { name: 'Alfa', value: counts.Alfa, color: '#f43f5e' },
    ];
  }, [isStudent, currentUser, attendanceLogs]);

  const hasStudentAbsenceData = useMemo(() => studentAbsenceChartData.some(d => d.value > 0), [studentAbsenceChartData]);

  // Absence Statistics per Class (Counselor View)
  const absenceStats = useMemo(() => {
    const counts: Record<string, { Sakit: number, Izin: number, Alfa: number, total: number }> = {};

    attendanceLogs.forEach(log => {
      if (log.status === 'Hadir') return;

      const student = stats.visibleStudents.find(s => s.id === log.studentId);
      if (student && student.status === 'Aktif' && classManagementStudentIds.has(student.id) && !alumniIds.has(student.id)) {
        // Filter by grade if selected
        if (selectedGradeFilter !== 'All' && student.grade !== selectedGradeFilter) return;

        const normalizedStudentClass = normalizeClassSuffix(student.class || '');
        const className = `${student.grade} ${normalizedStudentClass}`;
        if (!counts[className]) {
          counts[className] = { Sakit: 0, Izin: 0, Alfa: 0, total: 0 };
        }

        // We count every log entry here because a student might be absent for different slots
        // but usually, a class report marks them for the whole day.
        // To be safe and consistent with "days absent", we should probably deduplicate by date per student
        // but the user might want to see the "volume" of absences.
        // Let's stick to "days absent" (unique student-date-status)

        const status = log.status as 'Sakit' | 'Izin' | 'Alfa';
        counts[className][status] += 1;
        counts[className].total += 1;
      }
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        ...data
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [attendanceLogs, stats.visibleStudents, selectedGradeFilter, classManagementStudentIds, alumniIds]);

  // Student Absence Statistics (Counselor View)
  const studentAbsenceStats = useMemo(() => {
    const counts: Record<string, { Sakit: number, Izin: number, Alfa: number, total: number, class: string, name: string }> = {};

    attendanceLogs.forEach(log => {
      if (log.status === 'Hadir') return;

      const student = stats.visibleStudents.find(s => s.id === log.studentId);
      if (student && student.status === 'Aktif' && classManagementStudentIds.has(student.id) && !alumniIds.has(student.id)) {
        const normalizedStudentClass = normalizeClassSuffix(student.class || '');
        const className = `${student.grade} ${normalizedStudentClass}`;

        // Filter by class if selected
        if (selectedClassFilter !== 'All' && className !== selectedClassFilter) return;

        // Filter by absence status if selected
        if (selectedAbsenceStatusFilter !== 'All' && log.status !== selectedAbsenceStatusFilter) return;

        if (!counts[student.id]) {
          counts[student.id] = {
            Sakit: 0, Izin: 0, Alfa: 0,
            total: 0,
            class: className,
            name: student.name
          };
        }
        const status = log.status as 'Sakit' | 'Izin' | 'Alfa';
        counts[student.id][status] += 1;
        counts[student.id].total += 1;
      }
    });

    return Object.values(counts)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(item => ({
        name: `${item.name} (${item.class})`,
        fullName: item.name,
        className: item.class,
        Sakit: item.Sakit,
        Izin: item.Izin,
        Alfa: item.Alfa,
        total: item.total
      }));
  }, [attendanceLogs, stats.visibleStudents, selectedClassFilter, selectedAbsenceStatusFilter, classManagementStudentIds, alumniIds]);

  const monthlyAttendanceStats = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const targetYear = selectedTrendYear === 'All' ? new Date().getFullYear() : parseInt(selectedTrendYear, 10);

    if (selectedTrendMonth !== 'All') {
      const monthIndex = months.indexOf(selectedTrendMonth);
      const daysInMonth = new Date(targetYear, monthIndex + 1, 0).getDate();
      const data: Record<string, { month: string, Hadir: number, Sakit: number, Izin: number, Alfa: number, total: number }> = {};

      for (let i = 1; i <= daysInMonth; i++) {
        data[i.toString()] = { month: i.toString(), Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0, total: 0 };
      }

      attendanceLogs.forEach(log => {
        const student = stats.visibleStudents.find(s => s.id === log.studentId);
        if (!student || student.status !== 'Aktif' || !classManagementStudentIds.has(student.id) || alumniIds.has(student.id)) return;

        const date = new Date(log.date);
        const logYear = date.getFullYear().toString();
        if (selectedTrendYear !== 'All' && logYear !== selectedTrendYear) return;

        if (date.getMonth() === monthIndex) {
          if (selectedTrendStudent !== 'All' && log.studentId !== selectedTrendStudent) return;

          const day = date.getDate().toString();
          if (data[day]) {
            const status = log.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
            data[day][status] += 1;
            data[day].total += 1;
          }
        }
      });
      return Object.values(data);
    } else {
      const data: Record<string, { month: string, Hadir: number, Sakit: number, Izin: number, Alfa: number, total: number }> = {};

      months.forEach(m => {
        data[m] = { month: m, Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0, total: 0 };
      });

      attendanceLogs.forEach(log => {
        const student = stats.visibleStudents.find(s => s.id === log.studentId);
        if (!student || student.status !== 'Aktif' || !classManagementStudentIds.has(student.id) || alumniIds.has(student.id)) return;

        const date = new Date(log.date);
        const logYear = date.getFullYear().toString();
        if (selectedTrendYear !== 'All' && logYear !== selectedTrendYear) return;

        if (selectedTrendStudent !== 'All' && log.studentId !== selectedTrendStudent) return;

        const monthName = months[date.getMonth()];
        if (data[monthName]) {
          const status = log.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
          data[monthName][status] += 1;
          data[monthName].total += 1;
        }
      });

      return Object.values(data);
    }
  }, [attendanceLogs, selectedTrendStudent, selectedTrendMonth, selectedTrendYear, classManagementStudentIds, alumniIds, stats.visibleStudents]);

  // Counselor Stats for Principal
  const counselorStats = useMemo(() => {
    if (userRole !== 'principal') return null;

    const COLORS = ['#14b8a6', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4', '#f59e0b'];

    const groupByCounselor = (items: any[]) => {
      const counts: Record<string, number> = {};
      items.forEach(item => {
        const name = item.counselorName || 'Tidak Diketahui';
        counts[name] = (counts[name] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }));
    };

    return {
      homeVisits: groupByCounselor(homeVisits),
      advocacies: groupByCounselor(advocacies),
      conferences: groupByCounselor(conferences),
      referrals: groupByCounselor(referrals)
    };
  }, [userRole, homeVisits, advocacies, conferences, referrals]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 text-sm font-medium">Selamat datang kembali, <span className="text-base font-bold text-slate-800">{currentUser?.name || 'User'}</span>!</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
            <ICONS.School />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{schoolName}</p>
            <p className="text-xs font-bold text-slate-800">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </header>

      {/* Quote Section */}
      {userRole !== 'humas' && (
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-teal-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3C14.017 2.44772 14.4647 2 15.017 2H21.017C21.5693 2 22.017 2.44772 22.017 3V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM2.01695 21L2.01695 18C2.01695 16.8954 2.91238 16 4.01695 16H7.01695C7.56923 16 8.01695 15.5523 8.01695 15V9C8.01695 8.44772 7.56923 8 7.01695 8H4.01695C2.91238 8 2.01695 7.10457 2.01695 6V3C2.01695 2.44772 2.46467 2 3.01695 2H9.01695C9.56923 2 10.017 2.44772 10.017 3V15C10.017 18.3137 7.33066 21 4.01695 21H2.01695Z" /></svg>
          </div>
          <div className="relative z-10 max-w-2xl">
            <p className="text-lg md:text-xl font-bold italic leading-relaxed">"{randomQuote.text}"</p>
            <p className="text-xs font-black uppercase tracking-widest mt-4 opacity-80">— {randomQuote.author}</p>
          </div>
        </div>
      )}

      {userRole === 'humas' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-black text-slate-800 mb-4">Selamat Datang, Humas!</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              Sebagai akun Humas, Anda memiliki akses khusus untuk memantau dan mengelola data alumni sekolah melalui layanan Tracer Alumni.
            </p>
            <Link 
              to="/alumni" 
              className="inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <ICONS.Alumni />
              Buka Tracer Alumni
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {!isStudent && userRole !== 'humas' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl"><ICONS.Students /></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">Total Siswa</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{stats.totalStudents}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Siswa Aktif</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><ICONS.Adversity /></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">Perlu Perhatian</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{stats.atRiskStudents}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Risiko Tinggi</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ICONS.Individual /></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">Total Layanan</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{stats.totalSessions}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Sesi Terlaksana</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><ICONS.HomeVisit /></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">Kunjungan</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{stats.totalVisits}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Home Visit</p>
          </div>


        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Uncompleted Assignments */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Tugas & Angket Aktif</h3>
              <Link to="/assignments" className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline">Lihat Semua</Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {uncompletedAssignments.length > 0 ? uncompletedAssignments.slice(0, 3).map(assign => (
                <Link key={assign.id} to={assign.type === 'DCM' ? '/dcm' : assign.type === 'Sociometry' ? '/sociometry' : assign.type === 'Satisfaction' ? '/satisfaction-input' : `/fill-questionnaire/${assign.id}`} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${assign.type === 'DCM' || assign.type === 'Sociometry' ? 'bg-rose-500' : 'bg-teal-500'}`}>
                    {assign.type === 'DCM' ? <ICONS.DCM /> : assign.type === 'Sociometry' ? <ICONS.Sociometry /> : <ICONS.Assignments />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{assign.title}</h4>
                    <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wide">Deadline: {new Date(assign.dueDate).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6" /></svg>
                  </div>
                </Link>
              )) : (
                <div className="bg-white p-10 rounded-[2rem] border border-dashed border-slate-200 text-center">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Semua Tugas Selesai!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Access Sidebar for Students */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Statistik Kehadiran Siswa</h3>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              {hasStudentAbsenceData ? (
                <div className="space-y-4">
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={studentAbsenceChartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={30}>
                          {studentAbsenceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-2">
                    {studentAbsenceChartData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                        </div>
                        <span className="text-sm font-black" style={{ color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center text-slate-300 italic border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-20"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Belum ada data absensi</p>
                </div>
              )}
            </div>

            <h3 className="text-xl font-black text-slate-800 tracking-tight">Akses Cepat</h3>
            <div className="space-y-4">
              {/* Star Prestasi Report */}
              <Link to="/star-prestasi" className="block bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                  <ICONS.Star />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">Laporan Siswa</p>
                <h4 className="text-lg font-black italic tracking-tight">BK-STARS</h4>
                <p className="text-[10px] text-teal-200 mt-2 font-bold leading-relaxed">
                  {studentStarData ? "Lihat progres dan evaluasi impian Anda." : "Mulai susun langkah menuju impian Anda."}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
                  <span>Buka Laporan</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                </div>
              </Link>

              {/* Forum Angkatan */}
              <Link to="/grade-forum" className="block bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <ICONS.Forum />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Forum Angkatan</h4>
                    <p className="text-[10px] font-bold text-slate-400">Diskusi & Informasi</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Berbagi cerita dan informasi dengan teman seangkatan Anda.
                </p>
              </Link>

              {/* Class Report for KM */}
              {students.find(s => s.id === currentUser.id)?.isKM && (
                <Link to="/class-report" className="block bg-rose-500 p-6 rounded-[2.5rem] text-white shadow-xl hover:-translate-y-1 transition-all group">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                      <ICONS.Advocacy />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight">Laporan Kelas</h4>
                      <p className="text-[10px] font-bold text-rose-100">Khusus Ketua Murid</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-rose-100 font-medium leading-relaxed">
                    Laporkan absensi dan permasalahan kelas kepada konselor.
                  </p>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {!isStudent && userRole !== 'humas' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6">Distribusi Layanan BK</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.services}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                      {stats.services.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ICONS.Sparkles />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-50">Catatan Isu Kelas</h4>
              <div className="space-y-3">
                {userRole === 'principal' && (
                  <>
                    <Link to="/rombels" className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                      <div className="bg-emerald-500 p-2 rounded-lg text-white group-hover:scale-110 transition-transform"><ICONS.Rombel /></div>
                      <span className="text-xs font-bold uppercase tracking-wider">Manajemen Kelas</span>
                    </Link>
                    <Link to="/schedule" className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                      <div className="bg-cyan-500 p-2 rounded-lg text-white group-hover:scale-110 transition-transform"><ICONS.Teaching /></div>
                      <span className="text-xs font-bold uppercase tracking-wider">Jadwal BK</span>
                    </Link>
                    <Link to="/reports" className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                      <div className="bg-amber-500 p-2 rounded-lg text-white group-hover:scale-110 transition-transform"><ICONS.Book /></div>
                      <span className="text-xs font-bold uppercase tracking-wider">Jurnal Konselor</span>
                    </Link>
                  </>
                )}
                {userRole !== 'principal' && (
                  <Link to="/class-report" className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                    <div className="bg-teal-500 p-2 rounded-lg text-white group-hover:scale-110 transition-transform"><ICONS.ClassNotes /></div>
                    <span className="text-xs font-bold uppercase tracking-wider">Lihat Laporan Kelas</span>
                  </Link>
                )}
                {userRole !== 'principal' && (
                  <Link to="/validate-reports" className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                    <div className="bg-rose-500 p-2 rounded-lg text-white group-hover:scale-110 transition-transform"><ICONS.Advocacy /></div>
                    <span className="text-xs font-bold uppercase tracking-wider">Validasi Laporan</span>
                  </Link>
                )}
                {userRole !== 'principal' && (
                  <Link to="/rombels" className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                    <div className="bg-emerald-500 p-2 rounded-lg text-white group-hover:scale-110 transition-transform"><ICONS.Rombel /></div>
                    <span className="text-xs font-bold uppercase tracking-wider">Manajemen Rombel</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Absence Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Class Absence Chart */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Statistik Ketidakhadiran per Kelas</h3>
                  <div className="flex gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sakit</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Izin</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Alfa</span>
                    </div>
                  </div>
                </div>
                <select
                  value={selectedGradeFilter}
                  onChange={(e) => setSelectedGradeFilter(e.target.value)}
                  className="text-xs font-bold text-slate-600 bg-slate-50 border-none rounded-xl py-2 pl-3 pr-8 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="All">Semua Tingkat</option>
                  {[...new Set(students.map(s => s.grade))].sort().map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={absenceStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc', radius: 8 }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }}
                    />
                    <Bar dataKey="Sakit" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={40} />
                    <Bar dataKey="Izin" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} barSize={40} />
                    <Bar dataKey="Alfa" stackId="a" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Student Absence Chart */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-black text-slate-800">Siswa Sering Tidak Hadir</h3>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest">Top 10</span>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="text-xs font-bold text-slate-600 bg-slate-50 border-none rounded-xl py-2 pl-3 pr-8 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="All">Semua Kelas</option>
                    {stats.visibleRombels.map(r => (
                      <option key={r.id} value={`${r.grade} ${r.name.replace(r.grade, '').trim()}`}>
                        {r.grade} {r.name.replace(r.grade, '').trim()}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedAbsenceStatusFilter}
                    onChange={(e) => setSelectedAbsenceStatusFilter(e.target.value)}
                    className="text-xs font-bold text-slate-600 bg-slate-50 border-none rounded-xl py-2 pl-3 pr-8 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="All">Semua Status</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                    <option value="Alfa">Alfa</option>
                  </select>
                </div>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentAbsenceStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <YAxis type="category" dataKey="name" width={220} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc', radius: 8 }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }}
                    />
                    <Bar dataKey="Sakit" stackId="b" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={20} />
                    <Bar dataKey="Izin" stackId="b" fill="#06b6d4" radius={[0, 0, 0, 0]} barSize={20} />
                    <Bar dataKey="Alfa" stackId="b" fill="#f43f5e" radius={[0, 8, 8, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Monthly Attendance Trend Chart */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Grafik Tren Kehadiran Bulanan</h3>
                <p className="text-slate-500 text-xs font-medium mt-1">Visualisasi tren kehadiran seluruh siswa per bulan.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <select
                  value={selectedTrendStudent}
                  onChange={(e) => setSelectedTrendStudent(e.target.value)}
                  className="text-xs font-bold text-slate-600 bg-slate-50 border-none rounded-xl py-2 pl-3 pr-8 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="All">Semua Siswa</option>
                  {stats.visibleStudents.filter(s => s.status === 'Aktif' && classManagementStudentIds.has(s.id) && !alumniIds.has(s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <select
                  value={selectedTrendMonth}
                  onChange={(e) => setSelectedTrendMonth(e.target.value)}
                  className="text-xs font-bold text-slate-600 bg-slate-50 border-none rounded-xl py-2 pl-3 pr-8 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="All">Semua Bulan</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={selectedTrendYear}
                  onChange={(e) => setSelectedTrendYear(e.target.value)}
                  className="text-xs font-bold text-slate-600 bg-slate-50 border-none rounded-xl py-2 pl-3 pr-8 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="All">Semua Tahun</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-4 mb-6">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hadir</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sakit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Izin</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alfa</span>
              </div>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyAttendanceStats}>
                  <defs>
                    <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="Hadir" stroke="#10b981" fillOpacity={1} fill="url(#colorHadir)" strokeWidth={3} />
                  <Area type="monotone" dataKey="Sakit" stroke="#f59e0b" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="Izin" stroke="#06b6d4" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="Alfa" stroke="#f43f5e" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {userRole === 'principal' && counselorStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Home Visits Chart */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-6">Home Visit per Konselor</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={counselorStats.homeVisits}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {counselorStats.homeVisits.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Advocacies Chart */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-6">Advokasi per Konselor</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={counselorStats.advocacies}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {counselorStats.advocacies.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conferences Chart */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-6">Konferensi Kasus per Konselor</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={counselorStats.conferences}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {counselorStats.conferences.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Referrals Chart */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-6">Alih Tangan Kasus per Konselor</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={counselorStats.referrals}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {counselorStats.referrals.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {userRole !== 'principal' && (
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Catatan / Permasalahan Kelas</h3>
                  <p className="text-slate-500 text-xs font-medium mt-1">Laporan terbaru dari Ketua Murid (KM) mengenai kondisi kelas.</p>
                </div>
                <Link to="/validate-reports" className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline">Lihat Semua Laporan</Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classReports.filter(r => r.notes && r.notes.trim() !== '').slice(0, 6).map(report => {
                  const rombel = rombels.find(r => r.id === report.rombelId);
                  const reporter = students.find(s => s.id === report.reporterId);
                  return (
                    <div key={report.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:border-teal-200 transition-all flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-sm font-black text-xs">
                            {rombel?.name.split(' ')[0]}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-800">{rombel?.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(report.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${report.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                          report.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-700'
                          }`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 italic leading-relaxed">"{report.notes}"</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Oleh: {reporter ? reporter.name : '-'}</span>
                        <Link to="/validate-reports" className="text-[9px] font-black text-teal-600 uppercase tracking-widest hover:underline">Detail</Link>
                      </div>
                    </div>
                  );
                })}
                {classReports.filter(r => r.notes && r.notes.trim() !== '').length === 0 && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                    <p className="text-slate-400 italic text-sm">Belum ada catatan atau permasalahan kelas yang dilaporkan.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-slate-50 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-dashed border-slate-200 text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-[0.25em] leading-relaxed relative z-10">
          {isStudent ? (
            "Data 100% dikelola oleh pihak Konselor"
          ) : (
            <>
              Arsip digital STARS PRESTASI dikelola secara lokal. <br className="hidden md:block" />
              Pastikan melakukan pencetakan fisik melalui menu "Laporan" untuk dokumentasi administratif.
            </>
          )}
        </p>
        <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest mt-4 relative z-10">
          Created by Ridwan, Amd.Kom., S.Pd.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
