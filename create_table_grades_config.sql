DROP TABLE IF EXISTS star_gradesConfig;
CREATE TABLE IF NOT EXISTS star_gradesConfig (
    id TEXT PRIMARY KEY,
    name TEXT,
    classCount INTEGER,
    prefixes TEXT,
    electives TEXT,
    electivesByMajor TEXT
);
