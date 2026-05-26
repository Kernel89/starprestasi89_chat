
export type UserRole = 'super_admin' | 'principal' | 'counselor' | 'homeroom' | 'teacher' | 'supervisor' | 'student' | 'humas' | 'ketua_murid' | 'curriculum';

export enum Mood {
  SangatSenang = 'Sangat Senang',
  Senang = 'Senang',
  Netral = 'Biasa Saja',
  Sedih = 'Sedih',
  SangatSedih = 'Sangat Sedih',
  Cemas = 'Cemas',
  Marah = 'Marah'
}

export type QuestionnaireType = 'Likert' | 'Guttman' | 'Rating' | 'Semantic' | 'Essay' | 'MBTI' | 'SQ' | 'EQ' | 'AQ';

export interface AttendanceLog {
  id: string;
  studentId: string;
  slotId: string;
  date: string;
  timestamp: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
  gradeAtTime?: string;
}

export interface ClassReport {
  id: string;
  rombelId: string;
  reporterId: string; // ID KM
  date: string;
  absentees: {
    studentId: string;
    studentName: string;
    status: 'H' | 'S' | 'I' | 'A';
  }[];
  notes: string; // Permasalahan Kelas
  timestamp: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Student {
  id: string;
  name: string;
  nis: string;
  nisn?: string;
  username: string;
  password?: string;
  grade: string;
  class: string;
  lastMood: Mood;
  attendanceRate: number;
  totalSessions: number;
  riskLevel: 'Rendah' | 'Sedang' | 'Tinggi';
  email?: string;
  phone?: string;
  instagram?: string;
  linkedin?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  status: 'Aktif' | 'Alumni' | 'Pindah' | 'Keluar';
  photo?: string;
  isLocked?: boolean;
  role?: UserRole;
  // Alumni specific
  graduationYear?: number;
  graduationClass?: string;
  alumniStatus?: 'Kuliah' | 'Kerja' | 'Lain-lain';
  universityName?: string;
  degreeLevel?: 'D3' | 'D4' | 'S1' | 'S2' | 'S3' | 'D-3' | 'D-4' | 'S-1' | 'S-2' | 'S-3';
  studyProgram?: string;
  companyName?: string;
  workUnit?: string;
  // Profile details
  nickname?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: 'Laki-laki' | 'Perempuan' | 'L' | 'P';
  religion?: string;
  familyStatus?: string;
  birthOrder?: number;
  juniorHighOrigin?: string;
  acceptedClassX?: string;
  fatherName?: string;
  fatherJob?: string;
  fatherPhone?: string;
  fatherAddress?: string;
  fatherAddressStreet?: string;
  fatherAddressRtRw?: string;
  fatherAddressVillage?: string;
  fatherAddressDistrict?: string;
  fatherAddressRegency?: string;
  fatherAddressProvince?: string;
  motherName?: string;
  motherJob?: string;
  motherPhone?: string;
  motherAddress?: string;
  motherAddressStreet?: string;
  motherAddressRtRw?: string;
  motherAddressVillage?: string;
  motherAddressDistrict?: string;
  motherAddressRegency?: string;
  motherAddressProvince?: string;
  hasGuardian?: boolean;
  guardianName?: string;
  guardianJob?: string;
  guardianPhone?: string;
  guardianAddress?: string;
  guardianAddressStreet?: string;
  guardianAddressRtRw?: string;
  guardianAddressVillage?: string;
  guardianAddressDistrict?: string;
  guardianAddressRegency?: string;
  guardianAddressProvince?: string;
  addressStreet?: string;
  addressRtRw?: string;
  addressVillage?: string;
  addressDistrict?: string;
  addressRegency?: string;
  addressProvince?: string;
  isKM?: boolean;
  alumniNumber?: string;
}

export interface Teacher {
  id: string;
  name: string;
  nip: string;
  role: 'Konselor' | 'Wali Kelas' | 'Guru Mapel' | 'Humas' | 'Kepala Sekolah' | 'Pengawas' | 'Kurikulum';
  assignment: string;
  email?: string;
}

export interface Rombel {
  id: string;
  name: string;
  grade: string;
  major: 'MIPA' | 'IPS' | 'Bahasa' | 'Umum';
  homeroomTeacherId: string;
  studentCount: number;
  averageAttendance: number;
  classPresidentId?: string; // ID Ketua Murid
  kmId?: string;
}

export interface TeachingSlot {
  id: string;
  teacherId: string;
  rombelId: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  startTime: string;
  endTime: string;
  room?: string;
}

export interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  reason: string;
  status: 'Mendatang' | 'Selesai' | 'Dibatalkan';
}

export interface GuidanceSession {
  id: string;
  type: 'Pribadi' | 'Kelompok' | 'Klasikal';
  date: string;
  studentIds: string[]; // For group/individual
  rombelId?: string; // For klasikal
  topic: string;
  objective: string;
  content: string;
  urgency: 'Rendah' | 'Menengah' | 'Tinggi';
  counselorName?: string;
  gradeAtTime?: string;
}

export interface HomeVisit {
  id: string;
  studentId: string;
  date: string;
  reason: string;
  findings: string;
  solutions: string;
  followUp: string;
  parentName: string;
  teacherIds: string[];
  counselorName?: string;
  documentation?: string;
  gradeAtTime?: string;
}

export interface Referral {
  id: string;
  studentId: string;
  date: string;
  reason: string;
  targetAgency: string;
  summary: string;
  status: 'Terkirim' | 'Proses' | 'Selesai';
  counselorName?: string;
  gradeAtTime?: string;
}

export interface Advocacy {
  id: string;
  studentId: string;
  date: string;
  category: string;
  incidentDescription: string;
  witnesses?: string;
  stepsTaken: string;
  status: string;
  counselorName?: string;
  gradeAtTime?: string;
}

export interface CaseConference {
  id: string;
  studentId: string;
  date: string;
  location: string;
  participants: string[];
  agenda: string;
  discussionNotes: string;
  decisions: string;
  counselorName?: string;
  gradeAtTime?: string;
}

export interface SociometrySession {
  id: string;
  rombelId: string;
  date: string;
  startDate: string;
  endDate: string;
  criterion: string;
  choices: Record<string, string[]>; // voterId -> [chosenId1, chosenId2]
  reasons: Record<string, string[]>; // voterId -> [reason1, reason2]
}

export interface MbtiOption {
  a: string;
  b: string;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
}

export interface GuidanceMaterial {
  id: string;
  title: string;
  category: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir';
  description: string;
  discussion?: string;
  task?: string;
  linkUrl?: string;
  dateCreated: string;
  isQuestionnaire?: boolean;
  qTitle?: string;
  qType?: QuestionnaireType;
  qItemCount?: number;
  qOptionCount?: number;
  qCalculation?: string;
  qItems?: string[];
  qReverseItems?: number[];
  qAdjectives?: { left: string; right: string }[];
  qMbtiOptions?: MbtiOption[];
  isInstrumentActive?: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  category: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir';
  type: 'General' | 'DCM' | 'Sociometry' | 'Satisfaction' | 'MBTI' | 'SQ' | 'EQ' | 'AQ';
  satisfactionType?: 'BK' | 'Sekolah';
  instructions: string;
  dueDate: string;
  targetType: 'Rombel' | 'Individu';
  targetId: string;
  materialId?: string;
  status: 'Aktif' | 'Selesai';
  dateCreated: string;
}

export interface QuestionnaireSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  date: string;
  responses: Record<number, number | string>;
  totalScore?: number;
  mbtiResult?: string;
  sqScore?: number;
  eqScore?: number;
  aqScore?: number;
  gradeAtTime?: string;
}

export interface DCMQuestion {
  id: string;
  domain: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir';
  category: string;
  text: string;
}

export interface DCMSubmission {
  id: string;
  studentId: string;
  date: string;
  selectedIssues: string[]; // IDs of questions
  gradeAtTime?: string;
}

export interface SatisfactionFeedback {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  rating: number;
  comment: string;
  category: string;
  serviceSource: 'BK' | 'Sekolah';
  date: string;
  gradeAtTime?: string;
}

export interface ImplementationItem {
  id: string;
  date: string;
  activity: string;
  isExecuted: boolean;
}

export interface StarPrestasi {
  id: string;
  studentId: string;
  dream: string;
  weakness: string[];
  obstacle: string;
  steps: { id: string; text: string; isCompleted: boolean }[];
  aspiration: string[];
  evaluation: string;
  implementation: ImplementationItem[];
  status: 'On Process' | 'Achieved';
  dateCreated: string;
  gradeAtTime?: string;
}

export interface University {
  id: string;
  kode_pt: string;
  nama_pt: string;
  status_pt: 'Negeri' | 'Swasta' | 'Kedinasan';
  provinsi: string;
  kota: string;
  akreditasi: string;
  website: string;
  description?: string;
  pddikti_url?: string;
  logo?: string;
}

export interface StudyProgram {
  id: string;
  kode_prodi: string;
  nama_prodi: string;
  jenjang: string; // S1, D3, D4
  akreditasi: string;
  pt_name: string;
  status: 'Aktif' | 'Non-Aktif';
  peminat?: number;
  quota?: number;
  description?: string;
}

export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  description: string;
  deadline: string;
  website?: string;
}

export interface SchoolProfile {
  name: string;
  agencyName: string;
  subAgencyName: string;
  branchAgencyName: string;
  npsn: string;
  accreditation: string;
  address: string;
  city: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  principalName: string;
  principalNip: string;
  counselorName: string;
  counselorNip: string;
  vision: string;
  mission: string[];
  logo?: string;
  loginBackground?: string;
  alumniCardBackground?: string;
  counselorCardBackground?: string;
  isLocked?: boolean;
  editCount?: number;
  academicYears?: string[];
  activeAcademicYear?: string;
}

export interface CounselorProfileData {
  name: string;
  nip: string;
  gender: string;
  education: string;
  university: string;
  certification: string;
  expertise: string;
  email: string;
  phone: string;
  address: string;
  motto: string;
  photo?: string;
}

export interface UserSession {
  id?: string;
  username: string;
  role: UserRole;
  name: string;
}

export interface AppUser {
  id: string;
  name: string;
  email?: string;
  username: string;
  password?: string;
  role: UserRole;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string; // Group ID or User ID
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface TrackGuidanceData {
  heroTitle: string;
  heroSubtitle: string;
  comparison: { aspect: string; s1: string; vokasi: string; kedinasan: string }[];
  details: { id: string; type: string; subtitle: string; title: string; description: string; pros: string[]; cons: string[]; color: string }[];
  tipsTitle: string;
  tipsContent: string;
}

export interface CareerVisibility {
  PanduanBeasiswa: boolean;
  PT: boolean;
  Prodi: boolean;
  Kedinasan: boolean;
}

export interface DevBenefit {
  id: string;
  title: string;
  desc: string;
  color: string;
  icon: string;
}

export interface ForumComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  timestamp: string;
  parentId?: string;
}

export interface ForumPost {
  id: string;
  grade: string; // 'X', 'XI', 'XII'
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  timestamp: string;
  likes: number;
  comments: ForumComment[];
  isPrivate?: boolean;
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
export interface BKAdminDocument {
  id: string;
  title: string;
  category: 'Annual' | 'Semester' | 'General' | 'RPL' | 'VisiMisi';
  content: string;
  date: string;
  lastEdited: string;
}

export interface BKAdministration {
  visionMission: string;
  annualPrograms: BKAdminDocument[];
  semesterPrograms: BKAdminDocument[];
  generalProgram: string;
  rplDocuments: BKAdminDocument[];
  lastUsedKelas?: string;
  lastUsedSemester?: string;
}

export interface PrivateCounselingMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
}

export interface PrivateCounselingSession {
  id: string;
  studentId: string;
  studentName: string;
  studentGrade: string;
  studentClass: string;
  counselorId: string;
  counselorName: string;
  category: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir';
  chronology: string;
  status: 'Aktif' | 'Selesai';
  outcome?: string;
  followUp?: string;
  dateCreated: string;
  messages: PrivateCounselingMessage[];
}

export interface MengenalProdi {
  id: string;
  programName: string;
  overview: string;
  courses: string[];
  careers: string[];
  campuses: string[];
  dateCreated: string;
}

export interface StudentJournal {
  id: string;
  studentId: string;
  date: string;
  topic: string;
  notes: string;
  counselorId: string;
  createdAt: string;
}


// Global Cloudflare Types for Sync
declare global {
  interface D1Database {
    prepare(query: string): any;
    batch(statements: any[]): Promise<any[]>;
  }
  type PagesFunction<T = any> = (context: { env: T; request: Request }) => Promise<Response>;
}
