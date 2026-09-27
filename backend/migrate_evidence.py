import sqlite3

def migrate():
    conn = sqlite3.connect("metrisure.db")
    cursor = conn.cursor()
    cols = [c[1] for c in cursor.execute("PRAGMA table_info(evidence)").fetchall()]
    print("Initial columns:", cols)

    new_cols = [
        ("review_disposition", "VARCHAR(50) DEFAULT 'REVIEW PENDING'"),
        ("reviewer_name", "VARCHAR(255)"),
        ("reviewed_at", "DATETIME"),
        ("review_notes", "TEXT"),
    ]

    for col_name, col_type in new_cols:
        if col_name not in cols:
            cursor.execute(f"ALTER TABLE evidence ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name}")

    conn.commit()
    cols_after = [c[1] for c in cursor.execute("PRAGMA table_info(evidence)").fetchall()]
    print("Updated columns:", cols_after)
    conn.close()

if __name__ == "__main__":
    migrate()
