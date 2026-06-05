DROP TABLE IF EXISTS star_student_grades;
CREATE TABLE IF NOT EXISTS star_student_grades (
    id TEXT PRIMARY KEY,
    studentId TEXT NOT NULL,
    semester TEXT NOT NULL,
    grades TEXT NOT NULL,
    UNIQUE(studentId, semester)
);
