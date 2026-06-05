CREATE TABLE IF NOT EXISTS star_student_grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId TEXT NOT NULL,
    semester TEXT NOT NULL,
    grades TEXT NOT NULL,
    UNIQUE(studentId, semester)
);
