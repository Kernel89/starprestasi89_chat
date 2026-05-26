-- Reset failing tables to fix schema mismatches
DROP TABLE IF EXISTS star_students;
DROP TABLE IF EXISTS star_counselorProfiles;
DROP TABLE IF EXISTS star_forumPosts;
DROP TABLE IF EXISTS star_schoolProfile;
DROP TABLE IF EXISTS star_messages;
DROP TABLE IF EXISTS star_privateCounseling;

-- Recreate with correct structure
CREATE TABLE star_students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nis TEXT, -- NULL ALLOWED
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

CREATE TABLE star_counselorProfiles (
  id TEXT PRIMARY KEY,
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

CREATE TABLE star_forumPosts (
  id TEXT PRIMARY KEY,
  grade TEXT,
  userId TEXT,
  userName TEXT,
  userRole TEXT,
  content TEXT,
  timestamp TEXT,
  likes INTEGER DEFAULT 0,
  isPrivate INTEGER DEFAULT 0,
  comments TEXT
);

CREATE TABLE star_schoolProfile (
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
  mission TEXT,
  logo TEXT,
  loginBackground TEXT,
  alumniCardBackground TEXT,
  counselorCardBackground TEXT,
  isLocked INTEGER DEFAULT 0,
  academicYears TEXT,
  activeAcademicYear TEXT,
  lastUpdated TEXT
);

CREATE TABLE star_messages (
  id TEXT PRIMARY KEY,
  senderId TEXT NOT NULL,
  receiverId TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  isRead INTEGER DEFAULT 0
);

CREATE TABLE star_privateCounseling (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  date TEXT NOT NULL,
  topic TEXT,
  content TEXT,
  outcome TEXT,
  followUp TEXT,
  counselorName TEXT,
  timestamp TEXT
);
