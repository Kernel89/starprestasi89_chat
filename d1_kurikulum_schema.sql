-- Schema for Cloudflare D1 (star_kurikulum_db)

-- 1. Mata Pelajaran Pilihan Jurusan
CREATE TABLE IF NOT EXISTS star_gradesConfig (
  id TEXT PRIMARY KEY,
  name TEXT,
  minScore INTEGER,
  maxScore INTEGER,
  tahun_pelajaran TEXT,
  semester TEXT,
  updated_at TEXT
);

-- 2. Rekam Jejak Pemilihan Mapel Lintas Minat (KM)
CREATE TABLE IF NOT EXISTS star_km_subjects (
  id TEXT PRIMARY KEY,
  studentId TEXT,
  subjects TEXT,
  tahun_pelajaran TEXT,
  semester TEXT,
  updated_at TEXT
);

-- 3. Pemetaan Mapel Per Kelas (Wali Kelas)
CREATE TABLE IF NOT EXISTS star_class_subjects (
  id TEXT PRIMARY KEY,
  rombelId TEXT,
  semester TEXT,
  subjects TEXT,
  eligibleSubjects TEXT,
  tahun_pelajaran TEXT,
  updated_at TEXT
);

-- 4. Rekap Nilai Siswa (Transkrip)
CREATE TABLE IF NOT EXISTS star_student_grades (
  id TEXT PRIMARY KEY,
  studentId TEXT,
  semester TEXT,
  grades TEXT,
  tahun_pelajaran TEXT,
  updated_at TEXT
);

-- 5. Informasi Surat Kelulusan & Ijazah
CREATE TABLE IF NOT EXISTS star_graduation_info (
  id TEXT PRIMARY KEY,
  tanggalKelulusan TEXT,
  tanggalRapatPleno TEXT,
  noTranskripNilai TEXT,
  noSkl TEXT,
  noSkkb TEXT,
  tahun_pelajaran TEXT,
  semester TEXT,
  updated_at TEXT
);
-- 6. Penyimpanan Otomatis Nomor Surat
CREATE TABLE IF NOT EXISTS star_letter_records (
  id TEXT PRIMARY KEY,
  documentType TEXT,
  documentId TEXT,
  noSurat TEXT,
  tahun_pelajaran TEXT,
  semester TEXT,
  updated_at TEXT
);
