import os
import sqlite3

def get_dbs():
    db_dir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject"
    source_db = None
    target_db = None

    for f in os.listdir(db_dir):
        if f.endswith(".sqlite") and "metadata" not in f:
            path = os.path.join(db_dir, f)
            try:
                conn = sqlite3.connect(path)
                cursor = conn.cursor()
                
                # Check if star_km_subjects exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='star_km_subjects'")
                if cursor.fetchone():
                    # Check columns
                    cursor.execute("PRAGMA table_info(star_km_subjects)")
                    columns = [row[1] for row in cursor.fetchall()]
                    if "tahun_pelajaran" in columns:
                        target_db = path
                    else:
                        source_db = path
                conn.close()
            except Exception as e:
                print(f"Error reading {path}: {e}")

    return source_db, target_db

def migrate():
    source_db, target_db = get_dbs()
    if not source_db:
        print("Source DB not found.")
        return
    if not target_db:
        print("Target DB not found.")
        return

    print(f"Source DB: {source_db}")
    print(f"Target DB: {target_db}")

    s_conn = sqlite3.connect(source_db)
    t_conn = sqlite3.connect(target_db)
    s_cur = s_conn.cursor()
    t_cur = t_conn.cursor()

    tables = [
        'star_gradesConfig',
        'star_km_subjects',
        'star_class_subjects',
        'star_student_grades',
        'star_graduation_info'
    ]

    tp = '2024/2025'
    smt = 'Ganjil'

    for table in tables:
        print(f"Migrating {table}...")
        try:
            s_cur.execute(f"SELECT * FROM {table}")
            rows = s_cur.fetchall()
            if not rows:
                print(f"  No rows in {table}")
                continue
            
            # Get column names
            s_cur.execute(f"PRAGMA table_info({table})")
            columns = [col[1] for col in s_cur.fetchall()]
            
            inserted = 0
            for row in rows:
                data = dict(zip(columns, row))
                data['tahun_pelajaran'] = tp
                data['semester'] = smt
                
                keys = ",".join(data.keys())
                placeholders = ",".join(["?" for _ in data.keys()])
                values = tuple(data.values())
                
                try:
                    t_cur.execute(f"INSERT OR IGNORE INTO {table} ({keys}) VALUES ({placeholders})", values)
                    inserted += 1
                except Exception as e:
                    print(f"  Error inserting row into {table}: {e}")
            
            print(f"  Inserted {inserted} rows into {table}")
            t_conn.commit()
        except Exception as e:
            print(f"  Error reading from {table}: {e}")

    s_conn.close()
    t_conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
