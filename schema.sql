
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

-- 28. Forum Posts
CREATE TABLE IF NOT EXISTS star_forumPosts (
  id TEXT PRIMARY KEY,
  userId TEXT,
  userName TEXT,
  userRole TEXT,
  grade TEXT,
  content TEXT,
  timestamp TEXT,
  likes INTEGER,
  comments TEXT,
  isPrivate INTEGER
);
