import sqlite3
import os

db_path = os.path.expandvars(r'%APPDATA%\pgAdmin\pgadmin4.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get list of tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables:", tables)

# Query server table if it exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='server';")
if cursor.fetchone():
    try:
        cursor.execute("SELECT * FROM server;")
        columns = [description[0] for description in cursor.description]
        print("Columns:", columns)
        rows = cursor.fetchall()
        for row in rows:
            print(dict(zip(columns, row)))
    except Exception as e:
        print("Error reading server table:", e)
conn.close()
