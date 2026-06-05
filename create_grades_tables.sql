CREATE TABLE IF NOT EXISTS star_class_subjects (
    id TEXT PRIMARY KEY,
    rombelId TEXT,
    semester TEXT,
    subjects TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS star_student_grades (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    semester TEXT,
    grades TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
