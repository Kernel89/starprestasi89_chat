-- 29. Mata Pelajaran Pilihan Jurusan
CREATE TABLE IF NOT EXISTS star_gradesConfig (
  id TEXT PRIMARY KEY,
  name TEXT,
  minScore INTEGER,
  maxScore INTEGER,
  updated_at TEXT
);

-- 30. Rekam Jejak Pemilihan Mapel Lintas Minat (KM)
CREATE TABLE IF NOT EXISTS star_km_subjects (
  id TEXT PRIMARY KEY,
  studentId TEXT,
  subjects TEXT,
  updated_at TEXT
);

-- 31. Pemetaan Mapel Per Kelas (Wali Kelas)
CREATE TABLE IF NOT EXISTS star_class_subjects (
  id TEXT PRIMARY KEY,
  rombelId TEXT,
  semester TEXT,
  subjects TEXT,
  eligibleSubjects TEXT,
  updated_at TEXT
);

-- 32. Rekap Nilai Siswa (Transkrip)
CREATE TABLE IF NOT EXISTS star_student_grades (
  id TEXT PRIMARY KEY,
  studentId TEXT,
  semester TEXT,
  grades TEXT,
  updated_at TEXT
);

-- 33. Informasi Surat Kelulusan & Ijazah
CREATE TABLE IF NOT EXISTS star_graduation_info (
  id TEXT PRIMARY KEY,
  tanggalKelulusan TEXT,
  tanggalRapatPleno TEXT,
  noTranskripNilai TEXT,
  noSkl TEXT,
  noSkkb TEXT,
  updated_at TEXT
);
