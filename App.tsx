import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { pushToCloud, pullFromCloud, syncTableToCloud, deleteFromCloud, TABLES_MAP } from './syncService';
import useLocalStorage from './useLocalStorage';
import { ICONS, MOCK_STUDENTS, MOCK_TEACHERS, MOCK_ROMBELS, MOCK_SCHEDULE, MOCK_APPOINTMENTS, DCM_QUESTIONS, SNPMB_UNIVERSITIES, SNPMB_PROGRAMS, MBTI_TEMPLATE, SQ_TEMPLATE, EQ_TEMPLATE, AQ_TEMPLATE, DEFAULT_QUOTES } from './constants';
import { UserRole, Student, Teacher, Rombel, TeachingSlot, DCMSubmission, GuidanceSession, SchoolProfile, Referral, HomeVisit, Advocacy, CaseConference, SociometrySession, GuidanceMaterial, Assignment, Appointment, DCMQuestion, University, StudyProgram, UserSession, AppUser, CounselorProfileData, StarPrestasi, Scholarship, TrackGuidanceData, CareerVisibility, ChatMessage, SatisfactionFeedback, Quote, QuestionnaireSubmission, AttendanceLog, ClassReport, ForumPost, BKAdministration, PrivateCounselingSession, PrivateCounselingMessage, MengenalProdi, StudentJournal } from './types';
import Dashboard from './pages/Dashboard';
import StudentsList from './pages/StudentsList';
import StudentProfile from './pages/StudentProfile';
import TeachersList from './pages/TeachersList';
import RombelList from './pages/RombelList';
import SchoolSettings from './pages/SchoolSettings';
import AlumniList from './pages/AlumniList';
import TeachingSchedule from './pages/TeachingSchedule';
import DCMManagement from './pages/DCMManagement';
import SociometryManagement from './pages/SociometryManagement';
import BimbinganPribadi from './pages/BimbinganPribadi';
import PrivateCounseling from './pages/PrivateCounseling';
import BimbinganKelompok from './pages/BimbinganKelompok';
import BimbinganKlasikal from './pages/BimbinganKlasikal';
import GuidanceMaterials from './pages/GuidanceMaterials';
import AssignmentManagement from './pages/AssignmentManagement';
import SchoolProfilePage from './pages/SchoolProfile';
import ReferralList from './pages/ReferralList';
import HomeVisitList from './pages/HomeVisitList';
import AdvocacyList from './pages/AdvocacyList';
import CaseConferenceList from './pages/CaseConferenceList';
import Calendar from './pages/Calendar';
import CareerGuide from './pages/CareerGuide';
import UserManagement from './pages/UserManagement';
import MyProfile from './pages/MyProfile';
import StarPrestasiPage from './pages/StarPrestasi';
import StudentCareBook from './pages/StudentCareBook';
import CounselorProfilePage from './pages/CounselorProfile';
import SekilasStarPrestasi from './pages/SekilasStarPrestasi';
import DevelopmentProfile from './pages/DevelopmentProfile';
import FillQuestionnaire from './pages/FillQuestionnaire';
import CounselorReports from './pages/CounselorReports';
import ChatPage from './pages/ChatPage';
import SatisfactionReport from './pages/SatisfactionReport';
import StudentSatisfaction from './pages/StudentSatisfaction';
import MbtiReport from './pages/MbtiReport';
import SqReport from './pages/SqReport';
import EqReport from './pages/EqReport';
import AqReport from './pages/AqReport';
import SessionNotes from './pages/SessionNotes';
import GradeForum from './pages/GradeForum';
import ClassReportPage from './pages/ClassReportPage';
import ValidateReportPage from './pages/ValidateReportPage';
import SuperAdminPage from './pages/SuperAdminPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import BKAdministrationPage from './pages/BKAdministration';

export interface GradeConfig {
  id: string;
  name: string;
  classCount: number;
  prefixes: string[];
}

export interface StarMethodStep {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  color: string;
  icon: string;
}

export interface DevBenefit {
  id: string;
  title: string;
  desc: string;
  color: string;
  icon: string;
}

export interface DevBioData {
  name: string;
  role: string;
  expertise: string;
  location: string;
  email: string;
  whatsapp: string;
  quote: string;
  photo?: string;
  wallpaper?: string;
  visionTitle: string;
  visionDesc: string;
  skillsTitle: string;
  skillsDesc: string;
  privacyTitle: string;
  privacyDesc: string;
  benefits: DevBenefit[];
  isLocked: boolean;
}

const DEFAULT_COUNSELOR_PROFILE: CounselorProfileData = {
  name: '',
  nip: '',
  gender: 'Laki-laki',
  education: 'S1 Bimbingan Konseling',
  university: '',
  certification: 'Konselor Pendidikan',
  expertise: 'Konseling Remaja',
  email: '',
  phone: '',
  address: '',
  motto: 'Melayani dengan hati.'
};

const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  name: 'SMA NEGERI CONTOH',
  agencyName: 'PEMERINTAH PROVINSI',
  subAgencyName: 'DINAS PENDIDIKAN',
  branchAgencyName: 'CABANG DINAS WILAYAH',
  npsn: '12345678',
  accreditation: 'A (Unggul)',
  address: 'Jl. Pendidikan No. 1',
  city: 'Kota Pendidikan',
  phone: '(021) 1234567',
  fax: '(021) 1234567',
  email: 'info@smancontoh.sch.id',
  website: 'www.smancontoh.sch.id',
  principalName: 'Dr. Kepala Sekolah, M.Pd',
  principalNip: '197001011990031001',
  counselorName: '',
  counselorNip: '',
  vision: 'Terwujudnya peserta didik yang beriman, cerdas, terampil, mandiri, dan berwawasan lingkungan.',
  mission: ['Meningkatkan keimanan dan ketaqwaan.', 'Mengembangkan potensi peserta didik.'],
  academicYears: ['2023/2024'],
  activeAcademicYear: '2023/2024',
  logo: '',
  loginBackground: '',
  isLocked: false,
  editCount: 0,
  updated_at: ''
};

const sanitizeProfile = (raw: any): SchoolProfile => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_SCHOOL_PROFILE;
  }

  const clean: any = {};
  
  for (const key of Object.keys(DEFAULT_SCHOOL_PROFILE)) {
    const rawValue = raw[key];
    if (rawValue === undefined || rawValue === null || rawValue === 'null') {
      clean[key] = (DEFAULT_SCHOOL_PROFILE as any)[key];
    } else {
      clean[key] = rawValue;
    }
  }

  // Double check mission is always a valid array
  if (typeof clean.mission === 'string') {
    try {
      const parsed = JSON.parse(clean.mission);
      clean.mission = Array.isArray(parsed) ? parsed : DEFAULT_SCHOOL_PROFILE.mission;
    } catch {
      clean.mission = DEFAULT_SCHOOL_PROFILE.mission;
    }
  } else if (!Array.isArray(clean.mission)) {
    clean.mission = DEFAULT_SCHOOL_PROFILE.mission;
  }

  // Double check academicYears is always a valid array
  if (typeof clean.academicYears === 'string') {
    try {
      const parsed = JSON.parse(clean.academicYears);
      clean.academicYears = Array.isArray(parsed) ? parsed : DEFAULT_SCHOOL_PROFILE.academicYears;
    } catch {
      clean.academicYears = DEFAULT_SCHOOL_PROFILE.academicYears;
    }
  } else if (!Array.isArray(clean.academicYears)) {
    clean.academicYears = DEFAULT_SCHOOL_PROFILE.academicYears;
  }

  return clean as SchoolProfile;
};

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-indigo-600'
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[200] ${colors[type]} text-white px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 max-w-[90vw]`}>
      <span className="text-sm font-bold">{message}</span>
    </div>
  );
};

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick?: () => void }> = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${isActive
        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 font-bold'
        : 'text-slate-500 hover:bg-slate-100 font-medium'
        }`}
    >
      <div className={`${isActive ? 'text-white' : 'text-slate-400'}`}>{icon}</div>
      <span className="text-sm">{label}</span>
    </Link>
  );
};

const LoginPage: React.FC<{ onLogin: (u: UserSession) => void, appUsers: AppUser[], students: Student[], schoolProfile: SchoolProfile, quotes: Quote[] }> = ({ onLogin, appUsers, students, schoolProfile, quotes }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [gmailInput, setGmailInput] = useState('');
  const [gmailError, setGmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const randomQuote = useMemo(() => {
    const safeQuotes = Array.isArray(quotes) ? quotes : DEFAULT_QUOTES;
    if (!safeQuotes || safeQuotes.length === 0) {
      return { text: "Temukan potensi terbaik dirimu dan bersinarlah.", author: "STAR PRESTASI" };
    }
    const quote = safeQuotes[Math.floor(Math.random() * safeQuotes.length)];
    return quote || { text: "Temukan potensi terbaik dirimu dan bersinarlah.", author: "STAR PRESTASI" };
  }, [quotes]);

  const safeSchoolProfile = useMemo(() => {
    return sanitizeProfile(schoolProfile);
  }, [schoolProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = username.trim().toLowerCase();
    setIsLoading(true);
    setError('');

    const safeAppUsers = Array.isArray(appUsers) ? appUsers : [];
    const safeStudents = Array.isArray(students) ? students : [];

    // Cek Lokal Pertama
    const appUser = safeAppUsers.find(u => u.username && u.username.toLowerCase() === normalizedUsername && u.password === password);
    if (appUser) {
      onLogin({ username: appUser.username, role: appUser.role, name: appUser.name, id: appUser.id });
      setIsLoading(false);
      return;
    }

    const studentUser = safeStudents.find(s => s.username && s.username.toLowerCase() === normalizedUsername && s.password === password);
    if (studentUser) {
      onLogin({ username: studentUser.username, role: (studentUser.role && (studentUser.role as any) !== 'null') ? studentUser.role : 'student', name: studentUser.name, id: studentUser.id });
      setIsLoading(false);
      return;
    }

    // Jika tidak ada di lokal, coba ambil dari Cloud (konselingsmandak.info)
    try {
      const appUsersRes = await fetch('/api/sync?table=star_appUsers');
      if (appUsersRes.ok) {
        const cloudAppUsers = await appUsersRes.json();
        const cloudAppUser = cloudAppUsers.find((u: AppUser) => u.username && u.username.toLowerCase() === normalizedUsername && u.password === password);
        if (cloudAppUser) {
          onLogin({ username: cloudAppUser.username, role: cloudAppUser.role, name: cloudAppUser.name, id: cloudAppUser.id });
          setIsLoading(false);
          return;
        }
      }

      const studentsRes = await fetch('/api/sync?table=star_students');
      if (studentsRes.ok) {
        const cloudStudents = await studentsRes.json();
        const cloudStudent = cloudStudents.find((s: Student) => s.username && s.username.toLowerCase() === normalizedUsername && s.password === password);
        if (cloudStudent) {
          onLogin({ username: cloudStudent.username, role: (cloudStudent.role && cloudStudent.role !== 'null') ? cloudStudent.role : 'student', name: cloudStudent.name, id: cloudStudent.id });
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Gagal terhubung ke server:", err);
    }

    setError('Username atau password salah');
    setIsLoading(false);
  };

  const handleGmailLoginClick = () => {
    setIsGmailModalOpen(true);
    setGmailInput('');
    setGmailError('');
  };

  const processGmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailInput) return;
    setIsLoading(true);
    setGmailError('');
    
    const email = gmailInput.trim().toLowerCase();
    const safeAppUsers = Array.isArray(appUsers) ? appUsers : [];
    const safeStudents = Array.isArray(students) ? students : [];
    
    const appUser = safeAppUsers.find(u => u.email?.toLowerCase() === email);
    if (appUser) {
      onLogin({ username: appUser.username, role: appUser.role, name: appUser.name, id: appUser.id });
      setIsLoading(false);
      return;
    }
    
    const studentUser = safeStudents.find(s => s.email?.toLowerCase() === email);
    if (studentUser) {
      onLogin({ username: studentUser.username, role: 'student', name: studentUser.name, id: studentUser.id });
      setIsLoading(false);
      return;
    }
    
    // Coba ambil dari Cloud
    try {
      const appUsersRes = await fetch('/api/sync?table=star_appUsers');
      if (appUsersRes.ok) {
        const cloudAppUsers = await appUsersRes.json();
        const cloudAppUser = cloudAppUsers.find((u: AppUser) => u.email?.toLowerCase() === email);
        if (cloudAppUser) {
          onLogin({ username: cloudAppUser.username, role: cloudAppUser.role, name: cloudAppUser.name, id: cloudAppUser.id });
          setIsLoading(false);
          return;
        }
      }

      const studentsRes = await fetch('/api/sync?table=star_students');
      if (studentsRes.ok) {
        const cloudStudents = await studentsRes.json();
        const cloudStudent = cloudStudents.find((s: Student) => s.email?.toLowerCase() === email);
        if (cloudStudent) {
          onLogin({ username: cloudStudent.username, role: 'student', name: cloudStudent.name, id: cloudStudent.id });
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Gagal terhubung ke server:", err);
    }
    
    setGmailError("Alamat email tidak terdaftar di sistem STAR PRESTASI.");
    setIsLoading(false);
  };

  return (
    <div className="h-[100dvh] w-full relative flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* SIMULATED GOOGLE LOGIN MODAL */}
      {isGmailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-[400px] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-10">
                 <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                 <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                 <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                 <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
               </svg>
            </div>
            <h2 className="text-2xl font-normal text-center text-[#202124] mb-1">Login dengan Google</h2>
            <p className="text-center text-[#202124] mb-8 font-medium">Lanjutkan ke STAR PRESTASI</p>
            
            <form onSubmit={processGmailLogin} className="space-y-6">
              <div>
                <input 
                  type="email" 
                  value={gmailInput}
                  onChange={e => setGmailInput(e.target.value)}
                  className="w-full border border-slate-300 rounded px-4 py-3 text-base text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] placeholder-slate-500"
                  placeholder="Email atau ponsel"
                  autoFocus
                  required
                />
                {gmailError && (
                  <div className="flex items-center gap-2 mt-2 text-[#d93025] text-xs font-medium">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                     {gmailError}
                  </div>
                )}
              </div>
              <p className="text-sm text-[#5f6368] font-medium leading-relaxed">
                 Masukan alamat gmail anda
              </p>
              
              <div className="flex justify-between items-center pt-6">
                <button type="button" onClick={() => setIsGmailModalOpen(false)} disabled={isLoading} className="text-[#1a73e8] font-bold text-sm px-2 py-2 hover:bg-[#f8facc] rounded opacity-80 transition-all disabled:opacity-50">
                  Kembali
                </button>
                <button type="submit" disabled={isLoading} className="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-sm px-6 py-2 rounded transition-all shadow-sm flex items-center gap-2 disabled:opacity-50">
                  {isLoading ? 'Memeriksa...' : 'Selanjutnya'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div
        className="fixed inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{
          backgroundImage: safeSchoolProfile.loginBackground ? `url(${safeSchoolProfile.loginBackground})` : `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80')`,
          opacity: 0.75
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-tr from-indigo-950/90 via-slate-900/80 to-blue-900/60" />

      <div className="relative z-10 w-full max-w-6xl h-full flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-16">
        <div className="hidden sm:flex flex-col w-full lg:w-1/2 text-white text-center lg:text-left space-y-3 md:space-y-6 animate-in fade-in slide-in-from-left-10 duration-1000 max-h-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 w-fit mx-auto lg:mx-0 group cursor-default">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse group-hover:animate-none" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-indigo-300 transition-colors">STAR PRESTASI K8.9</span>
          </div>

          <div className="space-y-3 lg:space-y-5">
            <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tighter drop-shadow-2xl">
              Temukan <span className="text-indigo-400 italic">Potensi</span> <br className="hidden lg:block" /> Raih Prestasi.
            </h1>

            <div className="max-w-md mx-auto lg:mx-0 p-4 md:p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] shadow-inner">
              <p className="text-xs sm:text-sm md:text-base lg:text-xl font-medium leading-relaxed italic text-indigo-100">"{randomQuote.text}"</p>
              <div className="mt-2 md:mt-4 flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-8 h-0.5 bg-indigo-50 rounded-full" />
                <span className="text-[8px] md:text-xs font-bold uppercase tracking-widest text-indigo-300">{randomQuote.author}</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8 pt-4 opacity-50">
            <div className="text-left">
              <p className="text-xl md:text-2xl font-black tracking-tighter text-white">100%</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-indigo-200">Data Lokal</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-left">
              <p className="text-xl md:text-2xl font-black tracking-tighter text-white">SECURE</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-indigo-200">Privasi Siswa</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[450px] flex flex-col justify-center animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] p-6 sm:p-8 md:p-10 lg:p-12 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.6)] border border-white/10 relative flex flex-col max-h-[95dvh] overflow-hidden">
            <div className="text-center mb-5 sm:mb-8 relative z-10 shrink-0">
              <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-indigo-50 to-blue-700 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-2xl md:text-3xl shadow-xl shadow-indigo-100 mx-auto mb-3 sm:mb-4 transform hover:rotate-6 transition-transform overflow-hidden">
                {safeSchoolProfile.logo ? (
                  <img src={safeSchoolProfile.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  safeSchoolProfile.name.charAt(0)
                )}
              </div>
              <h2 className="text-xs sm:text-sm md:text-lg lg:text-xl font-black text-slate-900 tracking-tight uppercase leading-tight">{safeSchoolProfile.name}</h2>
              <p className="text-slate-400 text-[7px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1">Portal Bimbingan Konseling</p>
            </div>

            <div className="overflow-y-auto no-scrollbar relative z-10 space-y-4 md:space-y-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">Username / NISN</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-10 sm:h-12 md:h-14 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-6 text-xs sm:text-sm md:text-base font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300"
                    placeholder="Username..."
                    autoFocus
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Kata Sandi</label>
                    <button type="button" className="text-[8px] sm:text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest transition-colors">Lupa?</button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 sm:h-12 md:h-14 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-4 sm:px-6 text-xs sm:text-sm md:text-base font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-bold flex items-center gap-2 animate-in shake duration-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 sm:h-13 md:h-15 lg:h-16 bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 mt-2 disabled:opacity-70 disabled:hover:-translate-y-0 disabled:active:scale-100"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Menghubungkan Server...
                    </span>
                  ) : (
                    <>
                      Masuk Sekarang
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-4 flex items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="shrink-0 px-3 text-[10px] sm:text-[11px] font-bold text-slate-400">Atau masuk dengan</span>
                  <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                  type="button"
                  onClick={handleGmailLoginClick}
                  className="w-full h-11 sm:h-13 md:h-15 lg:h-16 bg-white border border-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-slate-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 sm:w-5 sm:h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Masuk dengan Gmail
              </button>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 text-center opacity-40 shrink-0">
            <p className="text-[7px] sm:text-[8px] font-black text-white uppercase tracking-[0.2em]">© 2026 STARS PRESTASI • Hak Cipta Dilindungi</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const useAutoSync = (lsKey: string, data: any) => {
  const previousDataRef = useRef<any>(data);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Prevent syncing if initial pull is not yet done to avoid overwriting cloud with mock data
    let hasPulled = null;
    try {
        hasPulled = sessionStorage.getItem('initial_pull_done');
    } catch (e) {}
    if (!hasPulled) {
      previousDataRef.current = data;
      return;
    }

    // Check if user changed to prevent cross-account deletions
    let currentUserId = null;
    try {
        const userStr = localStorage.getItem('star_currentUser');
        if (userStr) {
            const u = JSON.parse(userStr);
            currentUserId = u?.id || null;
        }
    } catch (e) {}

    // If user changed (e.g., login, logout, switch account), reset refs and ABORT auto-delete
    if (currentUserId !== previousUserIdRef.current) {
        previousUserIdRef.current = currentUserId;
        previousDataRef.current = data;
        return;
    }

    // Abort Auto-Delete if pullFromCloud is running (prevent shrinking arrays from triggering massive deletes)
    let isSyncing = false;
    try { isSyncing = !!sessionStorage.getItem('sync_in_progress'); } catch (e) {}
    
    if (isSyncing) {
        previousDataRef.current = data;
        return;
    }

    const previousData = previousDataRef.current;
    
    // Auto-Delete Detection (Disable for star_privateCounseling due to RBAC filtering)
    if (lsKey !== 'star_privateCounseling' && Array.isArray(data) && Array.isArray(previousData)) {
      // Create a Set of current IDs for fast lookup
      const currentIds = new Set(data.map(item => item.id).filter(Boolean));
      
      // Find items that were in previousData but are missing in current data
      const deletedItems = previousData.filter(item => item.id && !currentIds.has(item.id));
      
      for (const deletedItem of deletedItems) {
        const tableName = TABLES_MAP[lsKey];
        if (tableName) {
          console.log(`[AutoSync] Detected deletion of ${deletedItem.id} in ${tableName}`);
          // Send DELETE request to cloud without blocking the main thread
          deleteFromCloud(tableName, deletedItem.id).catch(err => 
            console.error(`[AutoSync] Failed to delete ${deletedItem.id} from ${tableName}`, err)
          );
        }
      }
    }

    // Update ref for next comparison
    previousDataRef.current = data;

    const timer = setTimeout(() => {
      syncTableToCloud(lsKey, data);
    }, 2000); // Wait 2s after last change
    return () => clearTimeout(timer);
  }, [data, lsKey]);
};

const App: React.FC = () => {
  const [user, setUser] = useLocalStorage<UserSession | null>('star_auth_user', null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Status Data
  const [students, setStudents] = useLocalStorage<Student[]>('star_students', MOCK_STUDENTS);
  const [alumni, setAlumni] = useLocalStorage<Student[]>('star_alumni', []);
  const [teachers, setTeachers] = useLocalStorage<Teacher[]>('star_teachers', MOCK_TEACHERS);
  const [rombels, setRombels] = useLocalStorage<Rombel[]>('star_rombels', MOCK_ROMBELS);
  const [schedule, setSchedule] = useLocalStorage<TeachingSlot[]>('star_schedule', MOCK_SCHEDULE);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('star_appointments', MOCK_APPOINTMENTS);

  const [sessions, setSessions] = useLocalStorage<GuidanceSession[]>('star_sessions', []);
  const [homeVisits, setHomeVisits] = useLocalStorage<HomeVisit[]>('star_homeVisits', []);
  const [advocacies, setAdvocacies] = useLocalStorage<Advocacy[]>('star_advocacies', []);
  const [conferences, setConferences] = useLocalStorage<CaseConference[]>('star_conferences', []);
  const [referrals, setReferrals] = useLocalStorage<Referral[]>('star_referrals', []);
  const [privateSessions, setPrivateSessions] = useLocalStorage<PrivateCounselingSession[]>('star_privateCounseling', []);

  // Inisialisasi Materi Psikologi dan Tugas Default
  // Auto-Update Mechanism: Cek jika ada versi baru dari aplikasi setiap kali aplikasi dibuka
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // Ambil index.html terbaru dari server, abaikan cache dengan Date.now()
        const res = await fetch(`/?_t=${Date.now()}`);
        if (!res.ok) return;
        const html = await res.text();
        
        // Cari nama file script JS utama (index-XXXXXX.js) yang sedang berjalan
        const currentScript = Array.from(document.scripts).find(s => s.src.includes('/assets/index-'));
        if (currentScript) {
          const currentHashMatch = currentScript.src.match(/\/assets\/index-([a-zA-Z0-9_-]+)\.js/);
          const newHashMatch = html.match(/\/assets\/index-([a-zA-Z0-9_-]+)\.js/);
          
          if (currentHashMatch && newHashMatch && currentHashMatch[1] !== newHashMatch[1]) {
            console.log("Versi baru terdeteksi! Memuat ulang halaman...");
            // Mencegah looping reload terus menerus jika gagal
            if (!sessionStorage.getItem('reloaded_for_update')) {
              sessionStorage.setItem('reloaded_for_update', 'true');
              window.location.reload();
            }
          }
        }
      } catch (e) {}
    };

    // Cek versi baru setiap kali user kembali membuka tab aplikasi ini
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdates();
    });
    
    // Cek saat pertama kali dimuat
    checkForUpdates();
  }, []);

  const [materials, setMaterials] = useLocalStorage<GuidanceMaterial[]>('star_materials', [
    {
      id: 'mat-mbti-01',
      title: 'Modul Tes Kepribadian MBTI (80 Soal)',
      category: 'Pribadi',
      description: 'Instrumen untuk mengetahui tipe kepribadian siswa guna memetakan gaya belajar dan potensi karir. Menggunakan skala pilihan ganda (Forced Choice) untuk akurasi tinggi.',
      discussion: 'Myers-Briggs Type Indicator (MBTI) adalah psikotes yang dirancang untuk mengukur preferensi psikologis seseorang dalam melihat dunia dan membuat keputusan.',
      task: 'Pilihlah salah satu dari dua pernyataan (A atau B) yang paling menggambarkan diri Anda secara alami.',
      linkUrl: '',
      dateCreated: new Date().toISOString(),
      isQuestionnaire: true,
      isInstrumentActive: true,
      qTitle: 'Inventori Kepribadian',
      qType: 'MBTI',
      qItemCount: MBTI_TEMPLATE.length,
      qOptionCount: 2,
      qCalculation: 'Kalkulasi Otomatis Dimensi (E/I, S/N, T/F, J/P) berdasarkan skor dominan.',
      qMbtiOptions: MBTI_TEMPLATE,
      qItems: [],
      qReverseItems: [],
      qAdjectives: []
    },
    {
      id: 'mat-sq-01',
      title: 'Tes Kecerdasan Spiritual (SQ) - 40 Soal',
      category: 'Pribadi',
      description: 'Instrumen untuk mengukur tingkat kecerdasan spiritual siswa, mencakup makna hidup, ketenangan batin, dan hubungan transendental.',
      discussion: 'Kecerdasan Spiritual (SQ) adalah kemampuan untuk memberi makna pada kehidupan, menemukan tujuan hidup, dan merasakan keterhubungan dengan semesta.',
      task: 'Berikan penilaian pada setiap pernyataan berdasarkan seberapa sesuai pernyataan tersebut dengan kondisi Anda (1: Sangat Tidak Sesuai, 5: Sangat Sesuai).',
      dateCreated: new Date().toISOString(),
      isQuestionnaire: true,
      isInstrumentActive: true,
      qTitle: 'Inventori Kecerdasan Spiritual (SQ)',
      qType: 'SQ',
      qItemCount: SQ_TEMPLATE.length,
      qOptionCount: 5,
      qCalculation: 'Total Skor = Jumlah skor semua butir. Rendah (40-93), Sedang (94-147), Tinggi (148-200).',
      qItems: SQ_TEMPLATE,
      qReverseItems: [],
      qAdjectives: []
    },
    {
      id: 'mat-eq-01',
      title: 'Tes Kecerdasan Emosional (EQ) - 40 Soal',
      category: 'Sosial',
      description: 'Instrumen untuk mengukur kemampuan mengenali, memahami, dan mengelola emosi diri sendiri serta orang lain.',
      discussion: 'Kecerdasan Emosional (EQ) mencakup kesadaran diri, pengendalian diri, motivasi, empati, dan keterampilan sosial.',
      task: 'Pilihlah jawaban yang paling menggambarkan diri Anda pada setiap butir pernyataan.',
      dateCreated: new Date().toISOString(),
      isQuestionnaire: true,
      isInstrumentActive: true,
      qTitle: 'Inventori Kecerdasan Emosional (EQ)',
      qType: 'EQ',
      qItemCount: EQ_TEMPLATE.length,
      qOptionCount: 5,
      qCalculation: 'Total Skor = Jumlah skor semua butir. Rendah (40-93), Sedang (94-147), Tinggi (148-200).',
      qItems: EQ_TEMPLATE,
      qReverseItems: [],
      qAdjectives: []
    },
    {
      id: 'mat-aq-01',
      title: 'Tes Kecerdasan Adversitas (AQ) - 40 Soal',
      category: 'Pribadi',
      description: 'Instrumen untuk mengukur daya tahan dan kemampuan siswa dalam menghadapi serta mengatasi kesulitan atau tantangan.',
      discussion: 'Adversity Quotient (AQ) adalah kemampuan seseorang dalam menghadapi rintangan dan mengubah tantangan menjadi peluang.',
      task: 'Berikan respon yang jujur pada setiap butir untuk mengetahui daya tahan mental Anda.',
      dateCreated: new Date().toISOString(),
      isQuestionnaire: true,
      isInstrumentActive: true,
      qTitle: 'Inventori Kecerdasan Adversitas (AQ)',
      qType: 'AQ',
      qItemCount: AQ_TEMPLATE.length,
      qOptionCount: 5,
      qCalculation: 'Total Skor = Jumlah skor semua butir. Rendah (40-93), Sedang (94-147), Tinggi (148-200).',
      qItems: AQ_TEMPLATE,
      qReverseItems: [],
      qAdjectives: []
    }
  ]);

  const [assignments, setAssignments] = useLocalStorage<Assignment[]>('star_assignments', [
    {
      id: 'assign-mbti-01',
      title: 'Asesmen Kepribadian (MBTI)',
      category: 'Pribadi',
      type: 'MBTI',
      instructions: 'Silakan kerjakan tes kepribadian ini untuk mengetahui potensi diri Anda.',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      targetType: 'Rombel',
      targetId: MOCK_ROMBELS[0].id,
      materialId: 'mat-mbti-01',
      status: 'Aktif',
      dateCreated: new Date().toISOString()
    },
    {
      id: 'assign-sq-01',
      title: 'Asesmen Kecerdasan Spiritual (SQ)',
      category: 'Pribadi',
      type: 'SQ',
      instructions: 'Kerjakan instrumen SQ ini untuk memetakan kematangan spiritual Anda.',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      targetType: 'Rombel',
      targetId: MOCK_ROMBELS[0].id,
      materialId: 'mat-sq-01',
      status: 'Aktif',
      dateCreated: new Date().toISOString()
    },
    {
      id: 'assign-eq-01',
      title: 'Asesmen Kecerdasan Emosional (EQ)',
      category: 'Sosial',
      type: 'EQ',
      instructions: 'Kerjakan instrumen EQ ini untuk memetakan kecerdasan emosional Anda.',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      targetType: 'Rombel',
      targetId: MOCK_ROMBELS[0].id,
      materialId: 'mat-eq-01',
      status: 'Aktif',
      dateCreated: new Date().toISOString()
    },
    {
      id: 'assign-aq-01',
      title: 'Asesmen Kecerdasan Adversitas (AQ)',
      category: 'Pribadi',
      type: 'AQ',
      instructions: 'Kerjakan instrumen AQ ini untuk mengetahui daya tahan Anda terhadap hambatan.',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      targetType: 'Rombel',
      targetId: MOCK_ROMBELS[0].id,
      materialId: 'mat-aq-01',
      status: 'Aktif',
      dateCreated: new Date().toISOString()
    }
  ]);

  const [submissions, setSubmissions] = useLocalStorage<DCMSubmission[]>('star_submissions', []); // Pengumpulan DCM
  const [questionnaireSubmissions, setQuestionnaireSubmissions] = useLocalStorage<QuestionnaireSubmission[]>('star_questionnaireSubmissions', []); // Kuesioner lainnya
  const [eqSubmissions, setEqSubmissions] = useLocalStorage<QuestionnaireSubmission[]>('star_eqSubmissions', []);
  const [aqSubmissions, setAqSubmissions] = useLocalStorage<QuestionnaireSubmission[]>('star_aqSubmissions', []);
  const [sqSubmissions, setSqSubmissions] = useLocalStorage<QuestionnaireSubmission[]>('star_sqSubmissions', []);

  const [starData, setStarData] = useLocalStorage<StarPrestasi[]>('star_starData', []);
  const [feedbacks, setFeedbacks] = useLocalStorage<SatisfactionFeedback[]>('star_feedbacks', []);
  const [questions, setQuestions] = useLocalStorage<DCMQuestion[]>('star_questions', DCM_QUESTIONS);

  const [sociometrySessions, setSociometrySessions] = useLocalStorage<SociometrySession[]>('star_sociometrySessions', []);
  const [sociometryCriteria, setSociometryCriteria] = useLocalStorage<string[]>('star_sociometryCriteria', ['Teman Belajar', 'Teman Bermain']);

  const [attendanceLogs, setAttendanceLogs] = useLocalStorage<AttendanceLog[]>('star_attendanceLogs', []);
  const [classReports, setClassReports] = useLocalStorage<any[]>('star_classReports', []);
  
  const [lastSync, setLastSync] = useState<string | null>(() => {
      try {
          return localStorage.getItem('last_sync_time');
      } catch(e) { return null; }
  });

  const [forumPosts, setForumPosts] = useLocalStorage<ForumPost[]>('star_forumPosts', [
    {
      id: 'p1',
      grade: 'XII',
      userId: 's1',
      userName: 'Andi Pratama',
      userRole: 'student',
      content: 'Ada yang tau info tryout UTBK minggu depan?',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      likes: 5,
      comments: [
        {
          id: 'c1',
          postId: 'p1',
          userId: 's2',
          userName: 'Budi Santoso',
          userRole: 'student',
          content: 'Cek di mading sekolah bro, ada infonya.',
          timestamp: new Date(Date.now() - 80000000).toISOString()
        }
      ]
    },
    {
      id: 'p2',
      grade: 'X',
      userId: 's3',
      userName: 'Citra Dewi',
      userRole: 'student',
      content: 'Bingung milih ekskul nih, ada saran?',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      likes: 2,
      comments: []
    },
    {
      id: 'p3',
      grade: 'XI',
      userId: 's4',
      userName: 'Dedi Kurniawan',
      userRole: 'student',
      content: 'Tugas Sejarah banyak banget ya minggu ini...',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      likes: 10,
      comments: []
    }
  ]);

  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('star_messages', []);

  // Auto-pull from cloud on load and every 5 minutes
  useEffect(() => {
    const autoPull = async () => {
      try {
        await pullFromCloud((msg, type) => console.log(`[Auto-Pull]: ${msg}`));
        try { sessionStorage.setItem('initial_pull_done', 'true'); } catch (e) {}
      } catch (error) {
        console.error("Auto-pull failed:", error);
      }
    };
    autoPull();

    const interval = setInterval(autoPull, 300000); // Pull every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Status Konfigurasi
  const [appUsers, setAppUsers] = useLocalStorage<AppUser[]>('star_appUsers', [
    { id: 'u1', name: 'Admin', username: 'admin', password: '56Ramadhan47', role: 'super_admin' },
    { id: 'u2', name: 'Konselor Umum', username: 'konselor', password: 'konselor', role: 'counselor' }
  ]);

  // Migration: Update admin password if it's still the old default
  useEffect(() => {
    setAppUsers(prev => {
      const adminUser = prev.find(u => u.username === 'admin');
      if (adminUser && adminUser.password === 'admin') {
        return prev.map(u => u.username === 'admin' ? { ...u, password: '56Ramadhan47' } : u);
      }
      return prev;
    });
  }, [setAppUsers]);

  const [quotes, setQuotes] = useLocalStorage<Quote[]>('star_quotes', DEFAULT_QUOTES);

  const [schoolProfile, setSchoolProfile] = useLocalStorage<SchoolProfile>('star_schoolProfile', DEFAULT_SCHOOL_PROFILE);

  const safeSchoolProfile = useMemo((): SchoolProfile => {
    return sanitizeProfile(schoolProfile);
  }, [schoolProfile]);

  // Migration: Ensure schoolProfile has academicYears and activeAcademicYear
  useEffect(() => {
    setSchoolProfile(prev => {
      const safePrev = prev || DEFAULT_SCHOOL_PROFILE;
      if (!safePrev.academicYears || !safePrev.activeAcademicYear) {
        return {
          ...safePrev,
          academicYears: safePrev.academicYears || ['2023/2024'],
          activeAcademicYear: safePrev.activeAcademicYear || '2023/2024'
        };
      }
      return safePrev;
    });
  }, [setSchoolProfile]);

  // Sync School Principal info from Teachers list
  useEffect(() => {
    const principal = teachers.find(t => t.role === 'Kepala Sekolah');
    if (principal) {
      setSchoolProfile(prev => {
        const safePrev = prev || DEFAULT_SCHOOL_PROFILE;
        if (safePrev.principalName !== principal.name || safePrev.principalNip !== principal.nip) {
          return {
            ...safePrev,
            principalName: principal.name,
            principalNip: principal.nip
          };
        }
        return safePrev;
      });
    }
  }, [teachers, setSchoolProfile]);

  const nonStudentUsers = useMemo(() => appUsers.filter(u => (u.role as any) !== 'siswa' && (u.role as any) !== '-'), [appUsers]);

  // Migration: Ensure default materials (MBTI, SQ, EQ, AQ) exist
  useEffect(() => {
    setMaterials(prev => {
      const requiredIds = ['mat-mbti-01', 'mat-sq-01', 'mat-eq-01', 'mat-aq-01'];
      const existingIds = new Set(prev.map(m => m.id));
      const missingIds = requiredIds.filter(id => !existingIds.has(id));
      
      if (missingIds.length === 0) return prev;
      
      const newMaterials = [...prev];
      if (missingIds.includes('mat-mbti-01')) {
        newMaterials.push({
          id: 'mat-mbti-01',
          title: 'Modul Tes Kepribadian MBTI (80 Soal)',
          category: 'Pribadi',
          description: 'Instrumen untuk mengetahui tipe kepribadian siswa guna memetakan gaya belajar dan potensi karir. Menggunakan skala pilihan ganda (Forced Choice) untuk akurasi tinggi.',
          discussion: 'Myers-Briggs Type Indicator (MBTI) adalah psikotes yang dirancang untuk mengukur preferensi psikologis seseorang dalam melihat dunia dan membuat keputusan.',
          task: 'Pilihlah salah satu dari dua pernyataan (A atau B) yang paling menggambarkan diri Anda secara alami.',
          dateCreated: new Date().toISOString(),
          isQuestionnaire: true,
          qTitle: 'Inventori Kepribadian',
          qType: 'MBTI',
          qItemCount: MBTI_TEMPLATE.length,
          qOptionCount: 2,
          qCalculation: 'Kalkulasi Otomatis Dimensi (E/I, S/N, T/F, J/P) berdasarkan skor dominan.',
          qMbtiOptions: MBTI_TEMPLATE,
          qItems: [],
          qReverseItems: [],
          qAdjectives: []
        });
      }
      if (missingIds.includes('mat-sq-01')) {
        newMaterials.push({
          id: 'mat-sq-01',
          title: 'Tes Kecerdasan Spiritual (SQ) - 40 Soal',
          category: 'Pribadi',
          description: 'Instrumen untuk mengukur tingkat kecerdasan spiritual siswa, mencakup makna hidup, ketenangan batin, dan hubungan transendental.',
          discussion: 'Kecerdasan Spiritual (SQ) adalah kemampuan untuk memberi makna pada kehidupan, menemukan tujuan hidup, dan merasakan keterhubungan dengan semesta.',
          task: 'Berikan penilaian pada setiap pernyataan berdasarkan seberapa sesuai pernyataan tersebut dengan kondisi Anda (1: Sangat Tidak Sesuai, 5: Sangat Sesuai).',
          dateCreated: new Date().toISOString(),
          isQuestionnaire: true,
          qTitle: 'Inventori Kecerdasan Spiritual (SQ)',
          qType: 'SQ',
          qItemCount: SQ_TEMPLATE.length,
          qOptionCount: 5,
          qCalculation: 'Total Skor = Jumlah skor semua butir. Rendah (40-93), Sedang (94-147), Tinggi (148-200).',
          qItems: SQ_TEMPLATE,
          qReverseItems: [],
          qAdjectives: []
        });
      }
      if (missingIds.includes('mat-eq-01')) {
        newMaterials.push({
          id: 'mat-eq-01',
          title: 'Tes Kecerdasan Emosional (EQ) - 40 Soal',
          category: 'Sosial',
          description: 'Instrumen untuk mengukur kemampuan mengenali, memahami, dan mengelola emosi diri sendiri serta orang lain.',
          discussion: 'Kecerdasan Emosional (EQ) mencakup kesadaran diri, pengendalian diri, motivasi, empati, dan keterampilan sosial.',
          task: 'Pilihlah jawaban yang paling menggambarkan diri Anda pada setiap butir pernyataan.',
          dateCreated: new Date().toISOString(),
          isQuestionnaire: true,
          qTitle: 'Inventori Kecerdasan Emosional (EQ)',
          qType: 'EQ',
          qItemCount: EQ_TEMPLATE.length,
          qOptionCount: 5,
          qCalculation: 'Total Skor = Jumlah skor semua butir. Rendah (40-93), Sedang (94-147), Tinggi (148-200).',
          qItems: EQ_TEMPLATE,
          qReverseItems: [],
          qAdjectives: []
        });
      }
      if (missingIds.includes('mat-aq-01')) {
        newMaterials.push({
          id: 'mat-aq-01',
          title: 'Tes Kecerdasan Adversitas (AQ) - 40 Soal',
          category: 'Pribadi',
          description: 'Instrumen untuk mengukur daya tahan dan kemampuan siswa dalam menghadapi serta mengatasi kesulitan atau tantangan.',
          discussion: 'Adversity Quotient (AQ) adalah kemampuan seseorang dalam menghadapi rintangan dan mengubah tantangan menjadi peluang.',
          task: 'Berikan respon yang jujur pada setiap butir untuk mengetahui daya tahan mental Anda.',
          dateCreated: new Date().toISOString(),
          isQuestionnaire: true,
          qTitle: 'Inventori Kecerdasan Adversitas (AQ)',
          qType: 'AQ',
          qItemCount: AQ_TEMPLATE.length,
          qOptionCount: 5,
          qCalculation: 'Total Skor = Jumlah skor semua butir. Rendah (40-93), Sedang (94-147), Tinggi (148-200).',
          qItems: AQ_TEMPLATE,
          qReverseItems: [],
          qAdjectives: []
        });
      }
      return newMaterials;
    });
  }, [setMaterials]);

  // Migration: Ensure default assignments exist
  useEffect(() => {
    setAssignments(prev => {
      const requiredIds = ['assign-mbti-01', 'assign-sq-01', 'assign-eq-01', 'assign-aq-01'];
      const existingIds = new Set(prev.map(a => a.id));
      const missingIds = requiredIds.filter(id => !existingIds.has(id));
      
      if (missingIds.length === 0) return prev;
      
      const newAssignments = [...prev];
      const targetId = rombels.length > 0 ? rombels[0].id : '';
      
      if (missingIds.includes('assign-mbti-01')) {
        newAssignments.push({
          id: 'assign-mbti-01',
          title: 'Asesmen Kepribadian (MBTI)',
          category: 'Pribadi',
          type: 'MBTI',
          instructions: 'Silakan kerjakan tes kepribadian ini untuk mengetahui potensi diri Anda.',
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          targetType: 'Rombel',
          targetId: targetId,
          materialId: 'mat-mbti-01',
          status: 'Aktif',
          dateCreated: new Date().toISOString()
        });
      }
      if (missingIds.includes('assign-sq-01')) {
        newAssignments.push({
          id: 'assign-sq-01',
          title: 'Asesmen Kecerdasan Spiritual (SQ)',
          category: 'Pribadi',
          type: 'SQ',
          instructions: 'Kerjakan instrumen SQ ini untuk memetakan kematangan spiritual Anda.',
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          targetType: 'Rombel',
          targetId: targetId,
          materialId: 'mat-sq-01',
          status: 'Aktif',
          dateCreated: new Date().toISOString()
        });
      }
      if (missingIds.includes('assign-eq-01')) {
        newAssignments.push({
          id: 'assign-eq-01',
          title: 'Asesmen Kecerdasan Emosional (EQ)',
          category: 'Sosial',
          type: 'EQ',
          instructions: 'Kerjakan instrumen EQ ini untuk memetakan kecerdasan emosional Anda.',
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          targetType: 'Rombel',
          targetId: targetId,
          materialId: 'mat-eq-01',
          status: 'Aktif',
          dateCreated: new Date().toISOString()
        });
      }
      if (missingIds.includes('assign-aq-01')) {
        newAssignments.push({
          id: 'assign-aq-01',
          title: 'Asesmen Kecerdasan Adversitas (AQ)',
          category: 'Pribadi',
          type: 'AQ',
          instructions: 'Kerjakan instrumen AQ ini untuk mengetahui daya tahan Anda terhadap hambatan.',
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          targetType: 'Rombel',
          targetId: targetId,
          materialId: 'mat-aq-01',
          status: 'Aktif',
          dateCreated: new Date().toISOString()
        });
      }
      return newAssignments;
    });
  }, [setAssignments, rombels]);

  // SIMPAN PROFIL SEBAGAI KAMUS: [UserID] -> CounselorProfileData
  const [counselorProfiles, setCounselorProfiles] = useLocalStorage<Record<string, CounselorProfileData>>('star_counselorProfiles', {
    'u2': { // Profil default untuk demo 'Konselor Umum'
      name: 'Konselor Umum',
      nip: '199001012015011001',
      gender: 'Laki-laki',
      education: 'S1 Bimbingan Konseling',
      university: 'Universitas Negeri',
      certification: 'Konselor Pendidikan',
      expertise: 'Konseling Remaja',
      email: 'konselor@sekolah.id',
      phone: '081234567890',
      address: 'Jl. Guru No. 1',
      motto: 'Melayani dengan hati.'
    }
  });

  const [gradesConfig, setGradesConfig] = useLocalStorage<GradeConfig[]>('star_gradesConfig', [
    { id: 'g1', name: 'X', classCount: 5, prefixes: ['MIPA', 'IPS'] },
    { id: 'g2', name: 'XI', classCount: 5, prefixes: ['MIPA', 'IPS'] },
    { id: 'g3', name: 'XII', classCount: 5, prefixes: ['MIPA', 'IPS'] }
  ]);

  const [bkAdmin, setBkAdmin] = useLocalStorage<BKAdministration>('star_bkAdmin', {
    visionMission: '',
    annualPrograms: [],
    semesterPrograms: [],
    generalProgram: '',
    rplDocuments: []
  });

  const [careerVisibility, setCareerVisibility] = useLocalStorage<CareerVisibility>('star_careerVisibility', {
    PanduanBeasiswa: true,
    PT: true,
    Prodi: true,
    Kedinasan: true
  });

  const [trackGuidance, setTrackGuidance] = useLocalStorage<TrackGuidanceData>('star_trackGuidance', {
    heroTitle: 'Raih Masa Depan Impian',
    heroSubtitle: 'Temukan jalur pendidikan yang sesuai dengan potensi dan minatmu.',
    comparison: [
      { aspect: 'Fokus', s1: 'Akademik & Teori (60:40)', vokasi: 'Praktik & Skill (60:40)', kedinasan: 'Ikatan Dinas & Praktis' },
      { aspect: 'Durasi', s1: '4 Tahun (8 Sem)', vokasi: '3-4 Tahun', kedinasan: '3-4 Tahun' },
      { aspect: 'Gelar', s1: 'Sarjana (S.X)', vokasi: 'Ahli Madya / Sarjana Trp', kedinasan: 'S.Tr / D3' },
      { aspect: 'Biaya', s1: 'UKT (Bervariasi)', vokasi: 'UKT (Bervariasi)', kedinasan: 'Ditanggung Negara (Umumnya)' }
    ],
    details: [
      { id: 'd1', type: 'S1', subtitle: 'Jalur Akademik', title: 'Sarjana (S1)', description: 'Fokus pada pengembangan ilmu pengetahuan.', pros: ['Peluang karir luas', 'Lanjut S2 mudah'], cons: ['Biaya mandiri', 'Kurang praktik'], color: 'indigo' },
      { id: 'd2', type: 'Vokasi', subtitle: 'Jalur Terapan', title: 'Vokasi (D3/D4)', description: 'Fokus pada keahlian siap kerja.', pros: ['Skill spesifik', 'Siap kerja'], cons: ['Terbatas lanjut akademik', 'Pilihan prodi'], color: 'emerald' },
      { id: 'd3', type: 'Kedinasan', subtitle: 'Ikatan Dinas', title: 'Sekolah Kedinasan', description: 'Pendidikan dengan jaminan kerja pemerintah.', pros: ['Kuliah gratis', 'Jaminan CPNS'], cons: ['Seleksi ketat', 'Disiplin tinggi'], color: 'amber' }
    ],
    tipsTitle: 'Tips Memilih',
    tipsContent: 'Kenali diri, riset mendalam, dan diskusikan dengan orang tua.'
  });

  const [scholarships, setScholarships] = useLocalStorage<Scholarship[]>('star_scholarships', []);
  const [universities, setUniversities] = useLocalStorage<University[]>('star_universities', SNPMB_UNIVERSITIES);
  const [studyPrograms, setStudyPrograms] = useLocalStorage<StudyProgram[]>('star_studyPrograms', SNPMB_PROGRAMS);
  const [mengenalProdiList, setMengenalProdiList] = useLocalStorage<MengenalProdi[]>('star_mengenalProdi', []);
  const [studentJournals, setStudentJournals] = useLocalStorage<StudentJournal[]>('star_studentJournals', []);

  // [BUG FIX] Removed auto-sync useEffect for universities and studyPrograms
  // to prevent deleted items from being infinitely regenerated from constants.

  // Auto-migration: Move any students with status 'Alumni' or grade 'Alumni' from active students to dedicated alumni list
  useEffect(() => {
    const safeStudents = Array.isArray(students) ? students : [];
    const alumniToMove = safeStudents.filter(s => s && (s.status === 'Alumni' || s.grade === 'Alumni'));
    
    if (alumniToMove.length > 0) {
      const currentYear = new Date().getFullYear();
      const newAlumniRecords: Student[] = alumniToMove.map(s => {
        return {
          ...s,
          status: 'Alumni',
          grade: 'Alumni',
          class: s.class === 'Alumni' ? 'Lulus' : (s.class || 'Lulus'),
          graduationClass: s.graduationClass || `${s.grade || 'XII'} ${s.class || 'Lulus'}`,
          graduationYear: s.graduationYear || currentYear,
          alumniStatus: s.alumniStatus || 'Lain-lain',
          lastMood: 'Netral' as any,
          attendanceRate: 100,
          totalSessions: 0,
          riskLevel: 'Rendah'
        } as Student;
      });

      // Update alumni state (avoid duplicates by ID)
      setAlumni(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const existingIds = new Set(safePrev.map(a => a.id));
        const filteredNew = newAlumniRecords.filter(a => !existingIds.has(a.id));
        if (filteredNew.length === 0) return safePrev;
        return [...filteredNew, ...safePrev];
      });

      // Remove from active students state
      setStudents(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.filter(s => s && s.status !== 'Alumni' && s.grade !== 'Alumni');
      });

      notify(`Sistem mendeteksi ada ${alumniToMove.length} siswa alumni di database aktif. Mengalihkan mereka ke Tracer Alumni...`, 'info');
    }
  }, [students, setStudents, setAlumni, notify]);

  // Dev Bio Data State - Persisted to LocalStorage
  const [devBioData, setDevBioData] = useLocalStorage<DevBioData>('star_devBioData', {
    name: "Developer Name",
    role: "Full Stack Engineer",
    expertise: "React, Node.js, AI Integration",
    location: "Jakarta, Indonesia",
    email: "dev@example.com",
    whatsapp: "+62 812 3456 7890",
    quote: "Code is poetry.",
    visionTitle: "Innovating Education",
    visionDesc: "Building tools for better learning environments.",
    skillsTitle: "Professional Background",
    skillsDesc: "Experienced in building scalable educational platforms.",
    privacyTitle: "Data Privacy",
    privacyDesc: "Committed to user data protection and privacy.",
    benefits: [
      { id: 'b1', title: 'Efficiency', desc: 'Streamlined workflows.', color: 'blue', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { id: 'b2', title: 'Security', desc: 'Data protection first.', color: 'emerald', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10' }
    ],
    isLocked: false
  });

  // CMS Content States
  const [methodSteps, setMethodSteps] = useLocalStorage<StarMethodStep[]>('star_methodSteps', [
    { id: 'step1', title: 'Stagnasi', subtitle: 'Kondisi Awal', desc: 'Identifikasi masalah dan hambatan.', color: 'amber', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { id: 'step2', title: 'Progres', subtitle: 'Kekuatan Diri', desc: 'Kenali potensi untuk maju.', color: 'indigo', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { id: 'step3', title: 'Aspirasi', subtitle: 'Tujuan Mulia', desc: 'Tetapkan mimpi yang tinggi.', color: 'violet', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976 2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { id: 'step4', title: 'Evaluasi', subtitle: 'Strategi', desc: 'Susun rencana tindakan.', color: 'blue', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'step5', title: 'Implementasi', subtitle: 'Jadwal', desc: 'Lakukan aksi nyata.', color: 'cyan', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 0 0-2-2H5a2 2 0 00 2 2z' },
    { id: 'step6', title: 'Eksekusi', subtitle: 'Hasil', desc: 'Wujudkan impianmu.', color: 'teal', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
  ]);
  const [introText, setIntroText] = useLocalStorage<string>('star_introText', "Kami berdedikasi untuk membantu siswa mencapai potensi terbaik mereka melalui bimbingan yang terstruktur dan personal.");
  const [philosophyDesc, setPhilosophyDesc] = useLocalStorage<string>('star_philosophyDesc', "Setiap siswa adalah bintang yang memiliki cahaya unik. Tugas kami adalah membantu mereka bersinar terang.");
  const [quoteText, setQuoteText] = useLocalStorage<string>('star_quoteText', "Pendidikan bukan persiapan untuk hidup, pendidikan adalah hidup itu sendiri.");
  const [devText, setDevText] = useLocalStorage<string>('star_devText', "Sistem ini dibangun dengan keamanan data tingkat tinggi dan privasi siswa sebagai prioritas utama.");

  // AUTO SYNC WATCHERS (Called after all states are defined)
  useAutoSync('star_students', students);
  useAutoSync('star_alumni', alumni);
  useAutoSync('star_teachers', teachers);
  useAutoSync('star_rombels', rombels);
  useAutoSync('star_sessions', sessions);
  useAutoSync('star_homeVisits', homeVisits);
  useAutoSync('star_advocacies', advocacies);
  useAutoSync('star_conferences', conferences);
  useAutoSync('star_referrals', referrals);
  useAutoSync('star_starData', starData);
  useAutoSync('star_appointments', appointments);
  useAutoSync('star_schoolProfile', schoolProfile);
  useAutoSync('star_counselorProfiles', counselorProfiles);
  useAutoSync('star_attendanceLogs', attendanceLogs);
  useAutoSync('star_classReports', classReports);
  useAutoSync('star_appUsers', appUsers);
  useAutoSync('star_quotes', quotes);
  useAutoSync('star_materials', materials);
  useAutoSync('star_assignments', assignments);
  useAutoSync('star_submissions', submissions);
  useAutoSync('star_questionnaireSubmissions', questionnaireSubmissions);
  useAutoSync('star_eqSubmissions', eqSubmissions);
  useAutoSync('star_aqSubmissions', aqSubmissions);
  useAutoSync('star_sqSubmissions', sqSubmissions);
  useAutoSync('star_sociometrySessions', sociometrySessions);
  useAutoSync('star_forumPosts', forumPosts);
  useAutoSync('star_methodSteps', methodSteps);
  useAutoSync('star_schedule', schedule);
  useAutoSync('star_universities', universities);
  useAutoSync('star_studyPrograms', studyPrograms);
  useAutoSync('star_messages', messages);
  useAutoSync('star_privateCounseling', privateSessions);
  useAutoSync('star_mengenalProdi', mengenalProdiList);
  useAutoSync('star_studentJournals', studentJournals);
  useAutoSync('star_devBioData', devBioData);
  // 1. Pull on mount (ensure latest data)
  useEffect(() => {
    let pending = null;
    try {
        pending = localStorage.getItem('sync_pending_star_studyPrograms');
    } catch (e) {}
    if (!pending) {
      pullFromCloud(notify);
    } else {
      console.log('[Auto-Pull] Skipped because of pending sync for star_studyPrograms');
    }
  }, []);

  // 1b. Bidirectional Auto-Sync: Forum Privat (Konseling) <-> Private Counseling Sessions
  useEffect(() => {
    let forumChanged = false;
    let sessionsChanged = false;

    const safeForumPosts = Array.isArray(forumPosts) ? forumPosts : [];
    const safePrivateSessions = Array.isArray(privateSessions) ? privateSessions : [];
    const safeStudents = Array.isArray(students) ? students : [];

    const updatedPosts = [...safeForumPosts];
    const updatedSessions = [...safePrivateSessions];

    updatedPosts.forEach((post, pIdx) => {
      if (!post.isPrivate) return;

      // Check if there is at least one counselor / super admin response
      const staffComments = (post.comments || []).filter(
        c => c.userRole === 'counselor' || c.userRole === 'super_admin'
      );
      if (staffComments.length === 0) return;

      const sessionId = `cs-forum-${post.id}`;
      const existingSessionIdx = updatedSessions.findIndex(s => s.id === sessionId);

      const student = safeStudents.find(s => s.id === post.userId);
      const firstStaffComment = staffComments[0];

      // Build the base messages from the forum thread (initial post + replies)
      const forumMessages: PrivateCounselingMessage[] = [
        {
          id: `msg-init-${post.id}`,
          senderId: post.userId,
          senderName: post.userName,
          senderRole: 'student',
          content: post.content,
          timestamp: post.timestamp
        },
        ...(post.comments || []).map(c => ({
          id: c.id.startsWith('msg-') ? c.id : `msg-${c.id}`,
          senderId: c.userId,
          senderName: c.userName,
          senderRole: ((c.userRole === 'counselor' || c.userRole === 'super_admin') ? 'counselor' : 'student') as UserRole,
          content: c.content,
          timestamp: c.timestamp
        }))
      ];

      if (existingSessionIdx === -1) {
        // Create new private counseling session
        const newSession: PrivateCounselingSession = {
          id: sessionId,
          studentId: post.userId,
          studentName: post.userName || 'Siswa',
          studentGrade: student?.grade || post.grade || 'XII',
          studentClass: student?.class || 'MIPA-1',
          counselorId: firstStaffComment.userId || 'unknown-counselor',
          counselorName: firstStaffComment.userName || 'Guru Konselor',
          category: 'Pribadi',
          chronology: post.content,
          status: 'Aktif',
          dateCreated: post.timestamp,
          messages: forumMessages
        };
        updatedSessions.push(newSession);
        sessionsChanged = true;
      } else {
        // Session already exists. Check for new messages written directly in the Private Counseling Chat room
        const existingSession = updatedSessions[existingSessionIdx];
        const existingSessionMessages = Array.isArray(existingSession.messages) ? existingSession.messages : [];

        // Identify chat room messages: they don't originate from the initial forum post or comment IDs
        const chatRoomMessages = existingSessionMessages.filter(m => 
          m.id !== `msg-init-${post.id}` && 
          !(post.comments || []).some(c => c.id === m.id || `msg-${c.id}` === m.id)
        );

        // If new chat messages exist, push them back as comments in the Forum Post so both stay identical!
        if (chatRoomMessages.length > 0) {
          const newComments = chatRoomMessages.map(m => ({
            id: m.id.startsWith('msg-') ? m.id.substring(4) : m.id,
            postId: post.id,
            userId: m.senderId,
            userName: m.senderName,
            userRole: m.senderRole,
            content: m.content,
            timestamp: m.timestamp
          }));

          const existingCommentIds = new Set((post.comments || []).map(c => c.id));
          const commentsToAppend = newComments.filter(nc => !existingCommentIds.has(nc.id));

          if (commentsToAppend.length > 0) {
            updatedPosts[pIdx] = {
              ...post,
              comments: [...(post.comments || []), ...commentsToAppend]
            };
            forumChanged = true;
            
            // Explicit targeted sync to D1 since global sync is disabled for star_forumPosts
            fetch('/api/sync?table=star_forumPosts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify([updatedPosts[pIdx]])
            }).catch(console.error);
          }
        }

        // Merge messages and sort chronologically by timestamp
        const mergedMessages = [...forumMessages];
        chatRoomMessages.forEach(cm => {
          if (!mergedMessages.some(um => um.id === cm.id)) {
            mergedMessages.push(cm);
          }
        });
        mergedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const isDifferent = JSON.stringify(mergedMessages) !== JSON.stringify(existingSessionMessages);
        if (isDifferent) {
          updatedSessions[existingSessionIdx] = {
            ...existingSession,
            messages: mergedMessages
          };
          sessionsChanged = true;
        }
      }
    });

    if (forumChanged) {
      setForumPosts(updatedPosts);
    }
    if (sessionsChanged) {
      setPrivateSessions(updatedSessions);
    }
  }, [forumPosts, privateSessions, students, setForumPosts, setPrivateSessions]);

  function notify(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type });
  }

  const handleLogin = async (u: UserSession) => {
    setUser(u);
    window.location.hash = '#/';
    notify(`Selamat datang, ${u.name}! Sedang mensinkronkan data...`, 'info');
    // Ensure localStorage is updated before pullFromCloud reads it
    localStorage.setItem('star_currentUser', JSON.stringify(u));
    await pullFromCloud((msg, type) => console.log(`[Pull]: ${msg}`));
    notify(`Sinkronisasi selesai!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('star_currentUser');
    notify('Berhasil keluar.', 'info');
  };

  const handleStudentCleanup = (mode: 'MUTASI' | 'PROMOTION' | 'GRADUATE', ids: string[]) => {
    if (ids.length === 0) return;

    const wipeStudentData = () => {
      setAppointments(prev => prev.filter(a => !ids.includes(a.studentId)));
      setSessions(prev => prev.map(s => ({ ...s, studentIds: (s.studentIds || []).filter(id => !ids.includes(id)) })).filter(s => (s.studentIds || []).length > 0));
      setHomeVisits(prev => prev.filter(h => !ids.includes(h.studentId)));
      setAdvocacies(prev => prev.filter(a => !ids.includes(a.studentId)));
      setConferences(prev => prev.filter(c => !ids.includes(c.studentId)));
      setReferrals(prev => prev.filter(r => !ids.includes(r.studentId)));
      setStarData(prev => prev.filter(d => !ids.includes(d.studentId)));
      setAssignments(prev => prev.filter(a => !(a.targetType === 'Individu' && ids.includes(a.targetId))));
      setSubmissions(prev => prev.filter(s => !ids.includes(s.studentId)));
      setQuestionnaireSubmissions(prev => prev.filter(s => !ids.includes(s.studentId)));
      setAttendanceLogs(prev => prev.filter(l => !ids.includes(l.studentId)));
      setClassReports(prev => prev.filter(r => !ids.includes(r.reporterId)));
      
      // Additional complete wipe for GRADUATE/MUTASI
      setEqSubmissions(prev => prev.filter(s => !ids.includes(s.studentId)));
      setAqSubmissions(prev => prev.filter(s => !ids.includes(s.studentId)));
      setSqSubmissions(prev => prev.filter(s => !ids.includes(s.studentId)));
      setFeedbacks(prev => prev.filter(f => !ids.includes(f.studentId)));
      setPrivateSessions(prev => prev.filter(p => !ids.includes(p.studentId)));
      setStudentJournals(prev => prev.filter(j => !ids.includes(j.studentId)));
      setSociometrySessions(prev => prev.map(sess => {
        if (!sess.choices) return sess;
        const newChoices = { ...sess.choices };
        ids.forEach(id => delete newChoices[id]);
        return { ...sess, choices: newChoices };
      }));
    };

    if (mode === 'MUTASI') {
      wipeStudentData();
      setForumPosts(prev => prev.map(p => ({
        ...p,
        comments: p.comments.filter(c => !ids.includes(c.userId))
      })).filter(p => !ids.includes(p.userId)));
    } else if (mode === 'PROMOTION') {
      setClassReports([]);
      setForumPosts([]);
      setAttendanceLogs(prev => prev.filter(l => !ids.includes(l.studentId)));
      notify("Data Kolektif (Laporan KM & Forum) dan Absensi Siswa telah dibersihkan untuk tahun pelajaran baru.", "info");
    } else if (mode === 'GRADUATE') {
      wipeStudentData();
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus siswa ini? Semua data terkait (sesi, laporan, dll) akan dihapus secara permanen.')) {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      handleStudentCleanup('MUTASI', [studentId]);
      
      // Delete from cloud database
      fetch(`/api/sync?table=star_students&id=${studentId}`, { method: 'DELETE' })
        .then(res => { if (!res.ok) console.error("Failed to delete student from cloud"); })
        .catch(err => console.error("Error deleting student from cloud:", err));

      notify('Siswa dan semua data terkait telah dihapus.', 'success');
    }
  };

  const handleGraduateCleanup = (studentIds: string[]) => {
    handleStudentCleanup('GRADUATE', studentIds);
  };

  // Helper untuk mendapatkan profil konselor aktif
  const getCurrentCounselorProfile = useCallback(() => {
    // Jika user adalah konselor, kembalikan profil spesifik mereka atau buat baru jika belum ada
    if (user && user.role === 'counselor') {
      return counselorProfiles[user.id] || { ...DEFAULT_COUNSELOR_PROFILE, name: user.name };
    }
    // Jika admin/kepsek, kembalikan profil default (misal profil koordinator atau konselor pertama)
    // Atau return empty jika tidak ada
    return Object.values(counselorProfiles)[0] || DEFAULT_COUNSELOR_PROFILE;
  }, [user, counselorProfiles]);

  // Wrapper untuk update profil konselor yang sedang login
  const handleUpdateCounselorProfile = (newProfileOrFn: React.SetStateAction<CounselorProfileData>) => {
    if (!user || user.role !== 'counselor') return;

    setCounselorProfiles(prev => {
      const currentProfile = prev[user.id] || { ...DEFAULT_COUNSELOR_PROFILE, name: user.name };
      const updatedProfile = typeof newProfileOrFn === 'function'
        ? newProfileOrFn(currentProfile)
        : newProfileOrFn;

      return {
        ...prev,
        [user.id]: {
          ...updatedProfile,
          updated_at: new Date().toISOString()
        }
      };
    });
  };

  const allQuestionnaireSubmissions = useMemo(() => {
    return [
      ...(Array.isArray(questionnaireSubmissions) ? questionnaireSubmissions : []),
      ...(Array.isArray(eqSubmissions) ? eqSubmissions : []),
      ...(Array.isArray(aqSubmissions) ? aqSubmissions : []),
      ...(Array.isArray(sqSubmissions) ? sqSubmissions : [])
    ];
  }, [questionnaireSubmissions, eqSubmissions, aqSubmissions, sqSubmissions]);

  if (!user) {
    return <LoginPage onLogin={handleLogin} appUsers={appUsers} students={students} schoolProfile={safeSchoolProfile} quotes={quotes} />;
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const activeCounselorProfile = getCurrentCounselorProfile();

  return (
    <Router>
      <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-40 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`h-8 rounded-lg flex items-center justify-center font-black italic shadow-lg shadow-indigo-200 overflow-hidden ${safeSchoolProfile.logo ? 'bg-white w-auto px-1' : 'bg-indigo-600 text-white w-8'}`}>
              {safeSchoolProfile.logo ? <img src={safeSchoolProfile.logo} alt="Logo" className="h-full w-auto object-contain" /> : 'S'}
            </div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">STAR PRESTASI K8.9</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            )}
          </button>
        </div>

        {/* Overlay for mobile sidebar */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={closeMobileMenu}
          />
        )}

        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 transform lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 hidden lg:block">
            <div className="flex items-center gap-3">
              <div className={`h-10 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-indigo-200 overflow-hidden ${safeSchoolProfile.logo ? 'bg-white w-auto px-1' : 'bg-indigo-600 text-white w-10'}`}>
                {safeSchoolProfile.logo ? <img src={safeSchoolProfile.logo} alt="Logo" className="h-full w-auto object-contain" /> : 'S'}
              </div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">STAR PRESTASI K8.9</h1>
            </div>
          </div>

          {/* Mobile Menu Header inside sidebar */}
          <div className="p-6 lg:hidden flex justify-between items-center border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className={`h-8 rounded-lg flex items-center justify-center font-black italic overflow-hidden ${safeSchoolProfile.logo ? 'bg-white w-auto px-1' : 'bg-indigo-600 text-white w-8'}`}>
                {safeSchoolProfile.logo ? <img src={safeSchoolProfile.logo} alt="Logo" className="h-full w-auto object-contain" /> : 'S'}
              </div>
              <h1 className="text-lg font-black text-slate-800">Menu</h1>
            </div>
            <button onClick={closeMobileMenu} className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
            {user.role !== 'humas' && <SidebarItem to="/" icon={<ICONS.Dashboard />} label={(user.role === 'student' || user.role === 'ketua_murid' || (user.role as any) === 'siswa' || (user.role as any) === '-') ? "Dashboard Siswa" : "Dashboard"} onClick={closeMobileMenu} />}
            {user.role === 'humas' && <SidebarItem to="/alumni" icon={<ICONS.Alumni />} label="Tracer Alumni" onClick={closeMobileMenu} />}
            {['super_admin', 'counselor', 'principal', 'supervisor'].includes(user.role) && (
              <>
                {(user.role === 'super_admin' || user.role === 'counselor') && (
                  <SidebarItem to="/students" icon={<ICONS.Students />} label="Database Siswa" onClick={closeMobileMenu} />
                )}
                {user.role === 'super_admin' && (
                  <SidebarItem to="/teachers" icon={<ICONS.Teachers />} label="Database Guru" onClick={closeMobileMenu} />
                )}
                <SidebarItem to="/rombels" icon={<ICONS.Rombel />} label="Manajemen Kelas" onClick={closeMobileMenu} />
                <SidebarItem to="/schedule" icon={<ICONS.Teaching />} label="Jadwal BK" onClick={closeMobileMenu} />
                <div className="pt-4 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Layanan BK</div>
                <SidebarItem to="/bimbingan-pribadi" icon={<ICONS.Individual />} label="BK Pribadi" onClick={closeMobileMenu} />
                {user.role !== 'principal' && user.role !== 'supervisor' && (
                  <SidebarItem to="/konseling-private" icon={<ICONS.Forum />} label="Konseling Private" onClick={closeMobileMenu} />
                )}
                <SidebarItem to="/bimbingan-kelompok" icon={<ICONS.Group />} label="BK Kelompok" onClick={closeMobileMenu} />
                <SidebarItem to="/bimbingan-klasikal" icon={<ICONS.Class />} label="BK Klasikal" onClick={closeMobileMenu} />
                {user.role !== 'principal' && user.role !== 'supervisor' && (
                  <SidebarItem to="/validate-reports" icon={<ICONS.Book />} label="Validasi Laporan KM" onClick={closeMobileMenu} />
                )}
                {user.role !== 'supervisor' && (
                  <SidebarItem to="/grade-forum" icon={<ICONS.Forum />} label="Forum Angkatan" onClick={closeMobileMenu} />
                )}
                <SidebarItem to="/home-visits" icon={<ICONS.HomeVisit />} label="Home Visit" onClick={closeMobileMenu} />
                <SidebarItem to="/advocacy" icon={<ICONS.Advocacy />} label="Advokasi" onClick={closeMobileMenu} />
                <SidebarItem to="/conferences" icon={<ICONS.Conference />} label="Konferensi Kasus" onClick={closeMobileMenu} />
                <SidebarItem to="/referrals" icon={<ICONS.Referral />} label="Alih Tangan Kasus" onClick={closeMobileMenu} />
                <div className="pt-4 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Instrumen & Data</div>
                {user.role !== 'principal' && user.role !== 'supervisor' && (
                  <>
                    <SidebarItem to="/dcm" icon={<ICONS.DCM />} label="Asesmen DCM" onClick={closeMobileMenu} />
                    <SidebarItem to="/sociometry" icon={<ICONS.Sociometry />} label="Sosiometri" onClick={closeMobileMenu} />
                  </>
                )}
                {user.role !== 'supervisor' && (
                  <SidebarItem to="/assignments" icon={<ICONS.Assignments />} label="Tugas & Angket" onClick={closeMobileMenu} />
                )}
                {user.role !== 'principal' && user.role !== 'supervisor' && (
                  <SidebarItem to="/materials" icon={<ICONS.Materials />} label="Materi & Modul" onClick={closeMobileMenu} />
                )}
                <SidebarItem to="/star-prestasi" icon={<ICONS.Star />} label="Star Prestasi" onClick={closeMobileMenu} />
                <SidebarItem to="/career" icon={<ICONS.Career />} label="Pusat Karir" onClick={closeMobileMenu} />
                <div className="pt-4 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Laporan</div>
                <SidebarItem to="/calendar" icon={<ICONS.Book />} label="Agenda Kegiatan" onClick={closeMobileMenu} />
                <SidebarItem to="/reports" icon={<ICONS.Book />} label="Jurnal Konselor" onClick={closeMobileMenu} />
                {(user.role === 'super_admin' || user.role === 'counselor') && (
                  <SidebarItem to="/administration" icon={<ICONS.Administration />} label="Administrasi BK" onClick={closeMobileMenu} />
                )}
                {user.role !== 'principal' && user.role !== 'supervisor' && (
                  <SidebarItem to="/care-book" icon={<ICONS.Book />} label="Siswa Asuh" onClick={closeMobileMenu} />
                )}
                <SidebarItem to="/satisfaction-report" icon={<ICONS.Star />} label="Kepuasan Layanan" onClick={closeMobileMenu} />
                {user.role !== 'principal' && user.role !== 'supervisor' && (
                  <SidebarItem to="/report/mbti" icon={<ICONS.Profile />} label="Laporan MBTI" onClick={closeMobileMenu} />
                )}
                <SidebarItem to="/report/sq" icon={<ICONS.Spiritual />} label="Laporan SQ" onClick={closeMobileMenu} />
                <SidebarItem to="/report/eq" icon={<ICONS.Emotional />} label="Laporan EQ" onClick={closeMobileMenu} />
                <SidebarItem to="/report/aq" icon={<ICONS.Adversity />} label="Laporan AQ" onClick={closeMobileMenu} />
                <SidebarItem to="/alumni" icon={<ICONS.Alumni />} label="Tracer Alumni" onClick={closeMobileMenu} />

                <div className="pt-4 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Manajemen</div>

                {user.role === 'super_admin' && (
                  <SidebarItem to="/users" icon={<ICONS.Users />} label="Manajemen User" onClick={closeMobileMenu} />
                )}

                {user.role === 'counselor' && (
                  <SidebarItem to="/counselor-profile" icon={<ICONS.Profile />} label="Profil Konselor" onClick={closeMobileMenu} />
                )}

                {user.role === 'super_admin' && (
                  <>
                    <SidebarItem to="/settings" icon={<ICONS.Settings />} label="Konfigurasi Sekolah" onClick={closeMobileMenu} />
                    <SidebarItem to="/school-profile" icon={<ICONS.School />} label="Profil Sekolah" onClick={closeMobileMenu} />
                  </>
                )}


                {user.role === 'super_admin' && (
                  <SidebarItem to="/super-admin" icon={<ICONS.Settings />} label="Super Admin" onClick={closeMobileMenu} />
                )}

                <SidebarItem to="/change-password" icon={<ICONS.Settings />} label="Ganti Kata Sandi" onClick={closeMobileMenu} />
              </>
            )}
            {(user.role === 'student' || user.role === 'ketua_murid' || (user.role as any) === 'siswa' || (user.role as any) === '-') && (
              <>
                <SidebarItem to="/my-profile" icon={<ICONS.Profile />} label="Biodata Saya" onClick={closeMobileMenu} />
                <SidebarItem to="/assignments" icon={<ICONS.Assignments />} label="Tugas & Angket" onClick={closeMobileMenu} />
                <SidebarItem to="/star-prestasi" icon={<ICONS.Star />} label="Star Prestasi" onClick={closeMobileMenu} />
                <SidebarItem to="/career" icon={<ICONS.Career />} label="Pusat Karir" onClick={closeMobileMenu} />
                <SidebarItem to="/dcm" icon={<ICONS.DCM />} label="Isi DCM" onClick={closeMobileMenu} />
                <SidebarItem to="/sociometry" icon={<ICONS.Sociometry />} label="Isi Sosiometri" onClick={closeMobileMenu} />
                <SidebarItem to="/satisfaction-input" icon={<ICONS.Star />} label="Penilaian Layanan" onClick={closeMobileMenu} />
                <SidebarItem to="/grade-forum" icon={<ICONS.Forum />} label="Forum Angkatan" onClick={closeMobileMenu} />
                <SidebarItem to="/konseling-private" icon={<ICONS.Individual />} label="Konseling Private" onClick={closeMobileMenu} />
              </>
            )}
            <div className="pt-4 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Umum</div>
            <SidebarItem to="/about" icon={<ICONS.Sparkles />} label="Tentang Aplikasi" onClick={closeMobileMenu} />
            <SidebarItem to="/dev" icon={<ICONS.Sparkles />} label="Info Pengembang" onClick={closeMobileMenu} />
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 font-bold w-full mt-10 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              <span>Keluar</span>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">STAR PRESTASI K8.9 • Licensed</p>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64 p-4 md:p-8 overflow-x-hidden pt-20 lg:pt-8 transition-all duration-300 flex flex-col min-h-screen">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={user.role === 'humas' ? <Navigate to="/alumni" replace /> : <Dashboard
                schoolName={safeSchoolProfile.name}
                schoolLogo={safeSchoolProfile.logo}
                students={students}
                alumni={alumni}
                rombels={rombels}
                sessions={sessions}
                homeVisits={homeVisits}
                advocacies={advocacies}
                conferences={conferences}
                referrals={referrals}
                userRole={user.role}
                teachers={teachers}
                schedule={schedule}
                currentUser={user}
                starData={starData}
                assignments={assignments}
                dcmSubmissions={submissions}
                materials={materials}
                appointments={appointments}
                sociometrySessions={sociometrySessions}
                universities={universities}
                studyPrograms={studyPrograms}
                feedbacks={feedbacks}
                setFeedbacks={setFeedbacks}
                notify={notify}
                quotes={quotes}
                questionnaireSubmissions={allQuestionnaireSubmissions}
                attendanceLogs={attendanceLogs}
                setAttendanceLogs={setAttendanceLogs}
                classReports={classReports}
                setClassReports={setClassReports}
              />} />
              <Route path="/students" element={(user.role === 'super_admin' || user.role === 'counselor') ? <StudentsList
                students={students}
                setStudents={setStudents}
                setAlumni={setAlumni}
                rombels={rombels}
                teachers={teachers}
                notify={notify}
                setAppointments={setAppointments}
                setGuidanceSessions={setSessions}
                setHomeVisits={setHomeVisits}
                setAdvocacyCases={setAdvocacies}
                setConferences={setConferences}
                setReferrals={setReferrals}
                setStarPrestasiData={setStarData}
                setAssignments={setAssignments}
                userRole={user.role}
                currentUser={user}
                handleDeleteStudent={handleDeleteStudent}
                handleCleanup={handleStudentCleanup}
              /> : <Navigate to="/" replace />} />
              <Route path="/students/:id" element={<StudentProfile 
                students={students} 
                submissions={allQuestionnaireSubmissions} 
                attendanceLogs={attendanceLogs} 
                sessions={sessions}
                homeVisits={homeVisits}
                advocacies={advocacies}
                conferences={conferences}
                referrals={referrals}
              />} />
              <Route path="/teachers" element={<TeachersList teachers={teachers} setTeachers={setTeachers} students={students} rombels={rombels} schedule={schedule} notify={notify} userRole={user.role} appUsers={appUsers} setAppUsers={setAppUsers} />} />
              <Route path="/rombels" element={<RombelList rombels={rombels} setRombels={setRombels} students={students} setStudents={setStudents} setAlumni={setAlumni} teachers={teachers} gradesConfig={gradesConfig} setGradesConfig={setGradesConfig} notify={notify} userRole={user.role} currentUser={user} handleCleanup={handleStudentCleanup} onGraduateCleanup={handleGraduateCleanup} />} />
              <Route path="/settings" element={<SchoolSettings gradesConfig={gradesConfig} setGradesConfig={setGradesConfig} rombels={rombels} setRombels={setRombels} notify={notify} userRole={user.role} quotes={quotes} setQuotes={setQuotes} />} />
              <Route path="/alumni" element={(user.role === 'super_admin' || user.role === 'humas' || user.role === 'counselor' || user.role === 'principal' || user.role === 'supervisor') ? <AlumniList students={alumni} setStudents={setAlumni} schoolProfile={safeSchoolProfile} notify={notify} userRole={user.role} /> : <Navigate to="/" replace />} />
              <Route path="/schedule" element={<TeachingSchedule schedule={schedule} setSchedule={setSchedule} rombels={rombels} teachers={teachers} userRole={user.role} students={students} attendanceLogs={attendanceLogs} setAttendanceLogs={setAttendanceLogs} notify={notify} />} />
              <Route path="/dcm" element={(user.role !== 'principal' && user.role !== 'supervisor') ? <DCMManagement students={students} submissions={submissions} setSubmissions={setSubmissions} questions={questions} setQuestions={setQuestions} notify={notify} userRole={user.role} currentUserId={user.id} assignments={assignments} rombels={rombels} schoolProfile={safeSchoolProfile} /> : <Navigate to="/" replace />} />
              <Route path="/sociometry" element={(user.role !== 'principal' && user.role !== 'supervisor') ? <SociometryManagement students={students} rombels={rombels} sessions={sociometrySessions} setSessions={setSociometrySessions} criteria={sociometryCriteria} setCriteria={setSociometryCriteria} notify={notify} userRole={user.role} currentUserId={user.id} assignments={assignments} schoolProfile={safeSchoolProfile} /> : <Navigate to="/" replace />} />
              <Route path="/bimbingan-pribadi" element={<BimbinganPribadi students={students} sessions={sessions} setSessions={setSessions} setAppointments={setAppointments} schoolProfile={safeSchoolProfile} notify={notify} userRole={user.role} counselorProfile={activeCounselorProfile} />} />
              <Route path="/bimbingan-kelompok" element={<BimbinganKelompok students={students} rombels={rombels} sessions={sessions} setSessions={setSessions} setAppointments={setAppointments} schoolProfile={safeSchoolProfile} notify={notify} userRole={user.role} counselorProfile={activeCounselorProfile} teachers={teachers} currentUser={user} />} />
              <Route path="/bimbingan-klasikal" element={<BimbinganKlasikal rombels={rombels} sessions={sessions} setSessions={setSessions} setAppointments={setAppointments} schoolProfile={safeSchoolProfile} notify={notify} userRole={user.role} counselorProfile={activeCounselorProfile} currentUser={user} teachers={teachers} />} />
              <Route path="/materials" element={(user.role !== 'principal' && user.role !== 'supervisor') ? <GuidanceMaterials materials={materials} setMaterials={setMaterials} notify={notify} userRole={user.role} /> : <Navigate to="/" replace />} />
              <Route path="/assignments" element={user.role !== 'supervisor' ? <AssignmentManagement assignments={assignments} setAssignments={setAssignments} materials={materials} rombels={rombels} students={students} notify={notify} userRole={user.role} currentUserId={user.id} dcmSubmissions={submissions} setDcmSubmissions={setSubmissions} questionnaireSubmissions={allQuestionnaireSubmissions} setQuestionnaireSubmissions={setQuestionnaireSubmissions} eqSubmissions={eqSubmissions} setEqSubmissions={setEqSubmissions} aqSubmissions={aqSubmissions} setAqSubmissions={setAqSubmissions} sqSubmissions={sqSubmissions} setSqSubmissions={setSqSubmissions} sociometrySessions={sociometrySessions} setSociometrySessions={setSociometrySessions} satisfactionFeedbacks={feedbacks} setSatisfactionFeedbacks={setFeedbacks} teachers={teachers} schoolProfile={safeSchoolProfile} /> : <Navigate to="/" replace />} />
              <Route path="/school-profile" element={<SchoolProfilePage profile={safeSchoolProfile} setProfile={setSchoolProfile} notify={notify} userRole={user.role} />} />
              <Route path="/referrals" element={<ReferralList students={students} rombels={rombels} teachers={teachers} referrals={referrals} setReferrals={setReferrals} setAppointments={setAppointments} schoolProfile={safeSchoolProfile} notify={notify} userRole={user.role} counselorProfile={activeCounselorProfile} currentUser={user} />} />
              <Route path="/home-visits" element={<HomeVisitList students={students} rombels={rombels} teachers={teachers} homeVisits={homeVisits} setHomeVisits={setHomeVisits} setAppointments={setAppointments} schoolProfile={safeSchoolProfile} notify={notify} userRole={user.role} counselorProfile={activeCounselorProfile} currentUser={user} />} />
              <Route path="/advocacy" element={<AdvocacyList students={students} rombels={rombels} teachers={teachers} advocacyCases={advocacies} setAdvocacyCases={setAdvocacies} setAppointments={setAppointments} schoolProfile={safeSchoolProfile} notify={notify} userRole={user.role} counselorProfile={activeCounselorProfile} currentUser={user} />} />
              <Route path="/conferences" element={<CaseConferenceList students={students} rombels={rombels} teachers={teachers} conferences={conferences} setConferences={setConferences} setAppointments={setAppointments} schoolProfile={safeSchoolProfile} notify={notify} userRole={user.role} counselorProfile={activeCounselorProfile} currentUser={user} />} />
              <Route path="/calendar" element={<Calendar appointments={appointments} setAppointments={setAppointments} students={students} rombels={rombels} schoolProfile={safeSchoolProfile} notify={notify} rawSessions={sessions} rawHomeVisits={homeVisits} rawAdvocacies={advocacies} rawConferences={conferences} rawReferrals={referrals} userRole={user.role} />} />
              <Route path="/career" element={<CareerGuide universities={universities} setUniversities={setUniversities} studyPrograms={studyPrograms} setStudyPrograms={setStudyPrograms} scholarships={scholarships} setScholarships={setScholarships} trackGuidance={trackGuidance} setTrackGuidance={setTrackGuidance} careerVisibility={careerVisibility} setCareerVisibility={setCareerVisibility} notify={notify} userRole={user.role} mengenalProdiList={mengenalProdiList} setMengenalProdiList={setMengenalProdiList} />} />
              <Route path="/users" element={user.role === 'super_admin' ? <UserManagement appUsers={appUsers} setAppUsers={setAppUsers} notify={notify} teachers={teachers} /> : <Navigate to="/" replace />} />
              <Route path="/my-profile" element={(user.role === 'student' || user.role === 'ketua_murid') && user.id ? <MyProfile student={students.find(s => s.id === user.id) || students[0]} setStudents={setStudents} notify={notify} attendanceLogs={attendanceLogs} /> : <Navigate to="/" />} />
              <Route path="/star-prestasi" element={<StarPrestasiPage students={students} starData={starData} setStarData={setStarData} rombels={rombels} notify={notify} userRole={user.role} currentUserId={user.id} />} />
              <Route path="/care-book" element={user.role !== 'supervisor' ? <StudentCareBook students={students} rombels={rombels} schoolProfile={safeSchoolProfile} teachers={teachers} counselorProfile={activeCounselorProfile} notify={notify} currentUser={user} schedule={schedule} studentJournals={studentJournals} setStudentJournals={setStudentJournals} sessions={sessions} setSessions={setSessions} privateSessions={privateSessions} setPrivateSessions={setPrivateSessions} homeVisits={homeVisits} setHomeVisits={setHomeVisits} advocacies={advocacies} setAdvocacies={setAdvocacies} conferences={conferences} setConferences={setConferences} referrals={referrals} setReferrals={setReferrals} dcmSubmissions={submissions} setDcmSubmissions={setSubmissions} questionnaireSubmissions={allQuestionnaireSubmissions} setQuestionnaireSubmissions={setQuestionnaireSubmissions} setEqSubmissions={setEqSubmissions} setAqSubmissions={setAqSubmissions} setSqSubmissions={setSqSubmissions} sociometrySessions={sociometrySessions} setSociometrySessions={setSociometrySessions} starData={starData} setStarData={setStarData} assignments={assignments} materials={materials} /> : <Navigate to="/" replace />} />
              <Route path="/counselor-profile" element={
                user.role === 'counselor' ? (
                  <CounselorProfilePage
                    counselorProfile={activeCounselorProfile}
                    setCounselorProfile={handleUpdateCounselorProfile}
                    notify={notify}
                    appUsers={appUsers}
                    setAppUsers={setAppUsers}
                    currentUser={user}
                    teachers={teachers}
                    setTeachers={setTeachers}
                    schoolProfile={safeSchoolProfile}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              } />
              <Route path="/about" element={<SekilasStarPrestasi methodSteps={methodSteps} setMethodSteps={setMethodSteps} introText={introText} setIntroText={setIntroText} philosophyDesc={philosophyDesc} setPhilosophyDesc={setPhilosophyDesc} quoteText={quoteText} setQuoteText={setQuoteText} devText={devText} setDevText={setDevText} userRole={user.role} notify={notify} onPushCloud={() => pushToCloud(notify)} onPullCloud={() => pullFromCloud(notify)} />} />
              <Route path="/dev" element={<DevelopmentProfile bioData={devBioData} setBioData={setDevBioData} userRole={user.role} notify={notify} />} />
              <Route path="/fill-questionnaire/:assignmentId" element={<FillQuestionnaire 
                assignments={assignments} 
                materials={materials} 
                notify={notify} 
                currentUserId={user.id} 
                submissions={allQuestionnaireSubmissions} 
                setSubmissions={setQuestionnaireSubmissions}
                eqSubmissions={eqSubmissions}
                setEqSubmissions={setEqSubmissions}
                aqSubmissions={aqSubmissions}
                setAqSubmissions={setAqSubmissions}
                sqSubmissions={sqSubmissions}
                setSqSubmissions={setSqSubmissions}
                students={students} 
                rombels={rombels} 
              />} />
              <Route path="/reports" element={<CounselorReports sessions={sessions} homeVisits={homeVisits} referrals={referrals} advocacyCases={advocacies} conferences={conferences} currentUser={user} schoolProfile={safeSchoolProfile} counselorProfile={activeCounselorProfile} notify={notify} students={students} rombels={rombels} appUsers={appUsers} />} />
              <Route path="/chat" element={<ChatPage currentUser={user} appUsers={appUsers} students={students} messages={messages} setMessages={setMessages} />} />
              <Route path="/konseling-private" element={(user.role !== 'principal' && user.role !== 'supervisor') ? <PrivateCounseling currentUser={user} students={students} teachers={teachers} sessions={privateSessions} setSessions={setPrivateSessions} notify={notify} /> : <Navigate to="/" replace />} />
              <Route path="/grade-forum" element={user.role !== 'supervisor' ? <GradeForum userRole={user.role} userGrade={students.find(s => s.id === user.id)?.grade} userName={user.name} userId={user.id} posts={forumPosts} setPosts={setForumPosts} /> : <Navigate to="/" replace />} />
              <Route path="/class-report" element={(user.role === 'student' || user.role === 'ketua_murid') ? <ClassReportPage user={user} students={students} rombels={rombels} classReports={classReports} attendanceLogs={attendanceLogs} setClassReports={setClassReports} setAttendanceLogs={setAttendanceLogs} notify={notify} /> : <Navigate to="/" replace />} />
              <Route path="/validate-reports" element={user.role === 'counselor' || user.role === 'super_admin' ? <ValidateReportPage user={user} students={students} rombels={rombels} classReports={classReports} setClassReports={setClassReports} setAttendanceLogs={setAttendanceLogs} notify={notify} teachers={teachers} /> : <Navigate to="/" replace />} />
              <Route path="/satisfaction-report" element={<SatisfactionReport feedbacks={feedbacks} assignments={assignments} setAssignments={setAssignments} rombels={rombels} students={students} notify={notify} userRole={user.role} schoolProfile={safeSchoolProfile} />} />
              <Route path="/satisfaction-input" element={<StudentSatisfaction currentUser={user} students={students} rombels={rombels} feedbacks={feedbacks} setFeedbacks={setFeedbacks} notify={notify} assignments={assignments} />} />
              <Route path="/report/mbti" element={user.role !== 'principal' && user.role !== 'supervisor' ? <MbtiReport submissions={allQuestionnaireSubmissions} setSubmissions={setQuestionnaireSubmissions} students={students} rombels={rombels} assignments={assignments} schoolProfile={safeSchoolProfile} counselorProfile={activeCounselorProfile} notify={notify} userRole={user.role} /> : <Navigate to="/" replace />} />
              <Route path="/report/sq" element={<SqReport submissions={sqSubmissions} setSubmissions={setSqSubmissions} students={students} rombels={rombels} assignments={assignments} schoolProfile={safeSchoolProfile} counselorProfile={activeCounselorProfile} notify={notify} userRole={user.role} />} />
              <Route path="/report/eq" element={<EqReport submissions={eqSubmissions} setSubmissions={setEqSubmissions} students={students} rombels={rombels} assignments={assignments} schoolProfile={safeSchoolProfile} counselorProfile={activeCounselorProfile} notify={notify} userRole={user.role} />} />
              <Route path="/report/aq" element={<AqReport submissions={aqSubmissions} setSubmissions={setAqSubmissions} students={students} rombels={rombels} assignments={assignments} schoolProfile={safeSchoolProfile} counselorProfile={activeCounselorProfile} notify={notify} userRole={user.role} />} />

              <Route path="/super-admin" element={user.role === 'super_admin' ? <SuperAdminPage
                notify={notify}
                classReports={classReports}
                attendanceLogs={attendanceLogs}
                students={students}
                forumPosts={forumPosts}
                submissions={submissions}
                setStudents={setStudents}
                setTeachers={setTeachers}
                setRombels={setRombels}
                setSchedule={setSchedule}
                setAppointments={setAppointments}
                setSessions={setSessions}
                setHomeVisits={setHomeVisits}
                setAdvocacies={setAdvocacies}
                setConferences={setConferences}
                setReferrals={setReferrals}
                setMaterials={setMaterials}
                setAssignments={setAssignments}
                setSubmissions={setSubmissions}
                setQuestionnaireSubmissions={setQuestionnaireSubmissions}
                eqSubmissions={eqSubmissions}
                setEqSubmissions={setEqSubmissions}
                aqSubmissions={aqSubmissions}
                setAqSubmissions={setAqSubmissions}
                sqSubmissions={sqSubmissions}
                setSqSubmissions={setSqSubmissions}
                setStarData={setStarData}
                setFeedbacks={setFeedbacks}
                setSociometrySessions={setSociometrySessions}
                setAttendanceLogs={setAttendanceLogs}
                setClassReports={setClassReports}
                setMessages={setMessages}
              /> : <Navigate to="/" replace />} />
              <Route path="/administration" element={(user.role === 'super_admin' || user.role === 'counselor') ? <BKAdministrationPage data={bkAdmin} setData={setBkAdmin} notify={notify} schoolProfile={safeSchoolProfile} gradesConfig={gradesConfig} counselorProfile={counselorProfiles[user.id] || counselorProfiles['u2']} /> : <Navigate to="/" replace />} />
              <Route path="/change-password" element={<ChangePasswordPage notify={notify} currentUser={user} appUsers={appUsers} setAppUsers={setAppUsers} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          <footer className="mt-12 py-6 text-center border-t border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
              © {new Date().getFullYear()} STAR PRESTASI K8.9 • Hak Cipta Dilindungi Undang-Undang
            </p>
          </footer>
        </main>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </Router>
  );
};

export default App;
