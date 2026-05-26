-- Schema for Cloudflare D1 (star_prestasi_db)

-- 1. App Users
CREATE TABLE IF NOT EXISTS star_appUsers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  username TEXT NOT NULL UNIQUE,
  password TEXT,
  role TEXT NOT NULL
);

-- 2. School Profile
CREATE TABLE IF NOT EXISTS star_schoolProfile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT,
  agencyName TEXT,
  subAgencyName TEXT,
  branchAgencyName TEXT,
  npsn TEXT,
  accreditation TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  fax TEXT,
  email TEXT,
  website TEXT,
  principalName TEXT,
  principalNip TEXT,
  counselorName TEXT,
  counselorNip TEXT,
  vision TEXT,
  mission TEXT, -- JSON Array
  logo TEXT,
  loginBackground TEXT,
  alumniCardBackground TEXT,
  counselorCardBackground TEXT,
  isLocked INTEGER DEFAULT 0,
  academicYears TEXT, -- JSON Array
  activeAcademicYear TEXT,
  editCount INTEGER DEFAULT 0,
  lastUpdated TEXT
);

-- 3. Students
CREATE TABLE IF NOT EXISTS star_students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nis TEXT, -- Removed NOT NULL constraint
  nisn TEXT,
  username TEXT NOT NULL,
  password TEXT,
  grade TEXT,
  class TEXT,
  lastMood TEXT,
  attendanceRate REAL,
  totalSessions INTEGER,
  riskLevel TEXT,
  email TEXT,
  phone TEXT,
  instagram TEXT,
  linkedin TEXT,
  parentName TEXT,
  parentPhone TEXT,
  address TEXT,
  status TEXT,
  photo TEXT,
  isLocked INTEGER DEFAULT 0,
  graduationYear INTEGER,
  graduationClass TEXT,
  alumniStatus TEXT,
  universityName TEXT,
  degreeLevel TEXT,
  studyProgram TEXT,
  companyName TEXT,
  workUnit TEXT,
  nickname TEXT,
  birthPlace TEXT,
  birthDate TEXT,
  gender TEXT,
  religion TEXT,
  familyStatus TEXT,
  birthOrder INTEGER,
  juniorHighOrigin TEXT,
  acceptedClassX TEXT,
  fatherName TEXT,
  fatherJob TEXT,
  fatherPhone TEXT,
  motherName TEXT,
  motherJob TEXT,
  motherPhone TEXT,
  hasGuardian INTEGER DEFAULT 0,
  guardianName TEXT,
  guardianJob TEXT,
  guardianPhone TEXT,
  addressStreet TEXT,
  addressRtRw TEXT,
  addressVillage TEXT,
  addressDistrict TEXT,
  addressRegency TEXT,
  addressProvince TEXT,
  isKM INTEGER DEFAULT 0,
  alumniNumber TEXT
);

-- 4. Teachers
CREATE TABLE IF NOT EXISTS star_teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT NOT NULL,
  role TEXT,
  assignment TEXT,
  email TEXT
);

-- 5. Rombels (Classes)
CREATE TABLE IF NOT EXISTS star_rombels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  major TEXT,
  homeroomTeacherId TEXT,
  studentCount INTEGER DEFAULT 0,
  averageAttendance REAL DEFAULT 0,
  classPresidentId TEXT,
  kmId TEXT
);

-- 6. Assignments
CREATE TABLE IF NOT EXISTS star_assignments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  type TEXT,
  satisfactionType TEXT,
  instructions TEXT,
  dueDate TEXT,
  targetType TEXT,
  targetId TEXT,
  materialId TEXT,
  status TEXT DEFAULT 'Aktif',
  dateCreated TEXT
);

-- 7. DCM Submissions
CREATE TABLE IF NOT EXISTS star_submissions (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  date TEXT NOT NULL,
  selectedIssues TEXT, -- JSON Array
  gradeAtTime TEXT
);

-- 8. Questionnaire Submissions (MBTI, SQ, EQ, AQ, etc)
CREATE TABLE IF NOT EXISTS star_questionnaireSubmissions (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  date TEXT NOT NULL,
  responses TEXT, -- JSON Object
  totalScore REAL,
  mbtiResult TEXT,
  sqScore REAL,
  eqScore REAL,
  aqScore REAL,
  gradeAtTime TEXT
);

-- 9. Attendance Logs
CREATE TABLE IF NOT EXISTS star_attendanceLogs (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  slotId TEXT,
  date TEXT NOT NULL,
  timestamp TEXT,
  status TEXT,
  gradeAtTime TEXT
);

-- 10. Class Reports (KM)
CREATE TABLE IF NOT EXISTS star_classReports (
  id TEXT PRIMARY KEY,
  rombelId TEXT NOT NULL,
  reporterId TEXT,
  date TEXT NOT NULL,
  absentees TEXT, -- JSON Array
  notes TEXT,
  timestamp TEXT,
  status TEXT DEFAULT 'Pending'
);

-- 11. Guidance Sessions (Pribadi, Kelompok, Klasikal)
CREATE TABLE IF NOT EXISTS star_sessions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  studentIds TEXT, -- JSON Array
  rombelId TEXT,
  topic TEXT,
  objective TEXT,
  content TEXT,
  urgency TEXT,
  counselorName TEXT,
  gradeAtTime TEXT
);

-- 12. Home Visits
CREATE TABLE IF NOT EXISTS star_homeVisits (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  date TEXT NOT NULL,
  reason TEXT,
  findings TEXT,
  solutions TEXT,
  followUp TEXT,
  parentName TEXT,
  teacherIds TEXT, -- JSON Array
  counselorName TEXT,
  documentation TEXT,
  gradeAtTime TEXT
);

-- 13. Advocacy Cases
CREATE TABLE IF NOT EXISTS star_advocacies (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT,
  incidentDescription TEXT,
  witnesses TEXT,
  stepsTaken TEXT,
  status TEXT,
  counselorName TEXT,
  gradeAtTime TEXT
);

-- 14. Case Conferences
CREATE TABLE IF NOT EXISTS star_conferences (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT,
  participants TEXT, -- JSON Array
  agenda TEXT,
  discussionNotes TEXT,
  decisions TEXT,
  counselorName TEXT,
  gradeAtTime TEXT
);

-- 15. Referrals
CREATE TABLE IF NOT EXISTS star_referrals (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  date TEXT NOT NULL,
  reason TEXT,
  targetAgency TEXT,
  summary TEXT,
  status TEXT,
  counselorName TEXT,
  gradeAtTime TEXT
);

-- 16. Star Prestasi
CREATE TABLE IF NOT EXISTS star_starData (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  dream TEXT,
  weakness TEXT, -- JSON Array
  obstacle TEXT,
  steps TEXT, -- JSON Array of Objects
  aspiration TEXT, -- JSON Array
  evaluation TEXT,
  implementation TEXT, -- JSON Array
  status TEXT DEFAULT 'On Process',
  dateCreated TEXT,
  gradeAtTime TEXT
);

-- 17. Sociometry Sessions
CREATE TABLE IF NOT EXISTS star_sociometrySessions (
  id TEXT PRIMARY KEY,
  rombelId TEXT NOT NULL,
  date TEXT NOT NULL,
  startDate TEXT,
  endDate TEXT,
  criterion TEXT,
  choices TEXT, -- JSON Object (voterId -> [ids])
  reasons TEXT -- JSON Object (voterId -> [texts])
);

-- 18. Forum Posts
CREATE TABLE IF NOT EXISTS star_forumPosts (
  id TEXT PRIMARY KEY,
  grade TEXT,
  userId TEXT,
  userName TEXT,
  userRole TEXT,
  content TEXT,
  timestamp TEXT,
  likes INTEGER DEFAULT 0,
  isPrivate INTEGER DEFAULT 0,
  comments TEXT -- JSON Array
);

-- 19. Quotes
CREATE TABLE IF NOT EXISTS star_quotes (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT
);

-- 20. Materials
CREATE TABLE IF NOT EXISTS star_materials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  discussion TEXT,
  task TEXT,
  linkUrl TEXT,
  dateCreated TEXT,
  isQuestionnaire INTEGER DEFAULT 0,
  qTitle TEXT,
  qType TEXT,
  qItemCount INTEGER,
  qOptionCount INTEGER,
  qCalculation TEXT,
  qItems TEXT, -- JSON Array
  qReverseItems TEXT, -- JSON Array
  qAdjectives TEXT, -- JSON Array
  qMbtiOptions TEXT -- JSON Array
);

-- 21. Teaching Schedule
CREATE TABLE IF NOT EXISTS star_schedule (
  id TEXT PRIMARY KEY,
  teacherId TEXT NOT NULL,
  rombelId TEXT NOT NULL,
  day TEXT NOT NULL,
  startTime TEXT,
  endTime TEXT,
  room TEXT
);

-- 22. Universities & Study Programs (Career)
CREATE TABLE IF NOT EXISTS star_universities (
  id TEXT PRIMARY KEY,
  kode_pt TEXT,
  nama_pt TEXT,
  status_pt TEXT,
  provinsi TEXT,
  kota TEXT,
  akreditasi TEXT,
  website TEXT,
  description TEXT,
  pddikti_url TEXT,
  logo TEXT
);

CREATE TABLE IF NOT EXISTS star_studyPrograms (
  id TEXT PRIMARY KEY,
  kode_prodi TEXT,
  nama_prodi TEXT,
  jenjang TEXT,
  akreditasi TEXT,
  pt_name TEXT,
  status TEXT,
  peminat INTEGER,
  quota INTEGER,
  description TEXT
);

-- 23. Appointments (Calendar)
CREATE TABLE IF NOT EXISTS star_appointments (
  id TEXT PRIMARY KEY,
  studentId TEXT,
  studentName TEXT,
  date TEXT NOT NULL,
  time TEXT,
  reason TEXT,
  status TEXT DEFAULT 'Mendatang'
);

-- 24. Method Steps (About Page)
CREATE TABLE IF NOT EXISTS star_methodSteps (
  id TEXT PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  desc TEXT,
  color TEXT,
  icon TEXT
);

-- 25. Counselor Profiles
CREATE TABLE IF NOT EXISTS star_counselorProfiles (
  id TEXT PRIMARY KEY, -- User ID
  name TEXT,
  nip TEXT,
  gender TEXT,
  education TEXT,
  university TEXT,
  certification TEXT,
  expertise TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  motto TEXT,
  photo TEXT
);
-- 26. Alumni (Dedicated Table for Tracer with Full Biodata Preservation)
CREATE TABLE IF NOT EXISTS star_alumni (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nis TEXT,
  nisn TEXT,
  username TEXT NOT NULL,
  password TEXT,
  grade TEXT,
  class TEXT,
  lastMood TEXT,
  attendanceRate REAL,
  totalSessions INTEGER,
  riskLevel TEXT,
  email TEXT,
  phone TEXT,
  instagram TEXT,
  linkedin TEXT,
  parentName TEXT,
  parentPhone TEXT,
  address TEXT,
  status TEXT,
  photo TEXT,
  isLocked INTEGER DEFAULT 0,
  graduationYear INTEGER,
  graduationClass TEXT,
  alumniStatus TEXT,
  universityName TEXT,
  degreeLevel TEXT,
  studyProgram TEXT,
  companyName TEXT,
  workUnit TEXT,
  nickname TEXT,
  birthPlace TEXT,
  birthDate TEXT,
  gender TEXT,
  religion TEXT,
  familyStatus TEXT,
  birthOrder INTEGER,
  juniorHighOrigin TEXT,
  acceptedClassX TEXT,
  fatherName TEXT,
  fatherJob TEXT,
  fatherPhone TEXT,
  motherName TEXT,
  motherJob TEXT,
  motherPhone TEXT,
  hasGuardian INTEGER DEFAULT 0,
  guardianName TEXT,
  guardianJob TEXT,
  guardianPhone TEXT,
  addressStreet TEXT,
  addressRtRw TEXT,
  addressVillage TEXT,
  addressDistrict TEXT,
  addressRegency TEXT,
  addressProvince TEXT,
  isKM INTEGER DEFAULT 0,
  alumniNumber TEXT,
  dateCreated TEXT
);

-- 27. Chat Messages
CREATE TABLE IF NOT EXISTS star_messages (
  id TEXT PRIMARY KEY,
  senderId TEXT NOT NULL,
  receiverId TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  isRead INTEGER DEFAULT 0
);

-- 28. Private Counseling (Dedicated Persistent Table)
CREATE TABLE IF NOT EXISTS star_privateCounseling (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  studentName TEXT,
  studentGrade TEXT,
  studentClass TEXT,
  counselorId TEXT,
  counselorName TEXT,
  category TEXT,
  chronology TEXT,
  status TEXT DEFAULT 'Aktif',
  outcome TEXT,
  followUp TEXT,
  dateCreated TEXT,
  messages TEXT -- JSON Array of PrivateCounselingMessage
);

-- 29. Mengenal Prodi (Dedicated Table for In-Depth Study Program Overview)
CREATE TABLE IF NOT EXISTS star_mengenalProdi (
  id TEXT PRIMARY KEY,
  programName TEXT NOT NULL UNIQUE,
  overview TEXT,
  courses TEXT, -- JSON Array of strings
  careers TEXT, -- JSON Array of strings
  campuses TEXT, -- JSON Array of strings
  dateCreated TEXT
);
-- Add new tables for EQ, AQ, SQ Submissions
CREATE TABLE IF NOT EXISTS star_eqSubmissions (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  date TEXT NOT NULL,
  responses TEXT,
  totalScore REAL,
  mbtiResult TEXT,
  sqScore REAL,
  eqScore REAL,
  aqScore REAL,
  gradeAtTime TEXT
);

CREATE TABLE IF NOT EXISTS star_aqSubmissions (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  date TEXT NOT NULL,
  responses TEXT,
  totalScore REAL,
  mbtiResult TEXT,
  sqScore REAL,
  eqScore REAL,
  aqScore REAL,
  gradeAtTime TEXT
);

CREATE TABLE IF NOT EXISTS star_sqSubmissions (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  date TEXT NOT NULL,
  responses TEXT,
  totalScore REAL,
  mbtiResult TEXT,
  sqScore REAL,
  eqScore REAL,
  aqScore REAL,
  gradeAtTime TEXT
);


-- 27. Student Journals
CREATE TABLE IF NOT EXISTS star_studentJournals (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  date TEXT NOT NULL,
  topic TEXT,
  notes TEXT,
  counselorId TEXT,
  createdAt TEXT
);
