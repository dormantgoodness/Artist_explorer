from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import sqlite3

app = Flask(__name__)
CORS(app)

DB_FILE = "favorites.db"

# --- DB setup ---
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            artist_id TEXT UNIQUE,
            artist_name TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- Routes ---
@app.route("/search")
def search_artists():
    query = request.args.get("q", "")
    resp = requests.get("https://api.deezer.com/search/artist", params={"q": query})
    return jsonify(resp.json())

@app.route("/artist/<artist_id>")
def get_artist(artist_id):
    albums = requests.get(f"https://api.deezer.com/artist/{artist_id}/albums").json()
    top_tracks = requests.get(f"https://api.deezer.com/artist/{artist_id}/top").json()
    return jsonify({"albums": albums, "top_tracks": top_tracks})

@app.route("/favorites", methods=["GET", "POST", "DELETE"])
def favorites():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    if request.method == "POST":
        data = request.json
        try:
            c.execute("INSERT INTO favorites (artist_id, artist_name) VALUES (?, ?)", 
                      (data["artist_id"], data["artist_name"]))
            conn.commit()
        except sqlite3.IntegrityError:
            pass
        conn.close()
        return jsonify({"message": "Favorite added"})

    elif request.method == "DELETE":
        data = request.json
        c.execute("DELETE FROM favorites WHERE artist_id = ?", (data["artist_id"],))
        conn.commit()
        conn.close()
        return jsonify({"message": "Favorite removed"})

    else:  # GET
        c.execute("SELECT artist_id, artist_name FROM favorites")
        rows = [{"artist_id": r[0], "artist_name": r[1]} for r in c.fetchall()]
        conn.close()
        return jsonify(rows)

if __name__ == "__main__":
    app.run(debug=True)
