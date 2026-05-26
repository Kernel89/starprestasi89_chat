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
