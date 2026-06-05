-- Membuat tabel baru untuk menyimpan referensi mata pelajaran pilihan Kurikulum Merdeka per siswa
CREATE TABLE IF NOT EXISTS star_km_subjects (
  studentId TEXT PRIMARY KEY,
  subjects TEXT NOT NULL
);
