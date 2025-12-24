from flask import Flask
from flask import render_template

app = Flask(__name__)

@app.route("/")
def login():
    return "<p></p>"

@app.route('/map')
def map():
    return render_template('index.html')

import sqlite3
conn = sqlite3.connect("test.db")

cur = conn.cursor()

res = cur.execute("SELECT name FROM sqlite_master")
sch = res.fetchall()
if (sch is None or ('users',) not in sch):
    cur.execute("CREATE TABLE users(username, password, hexes)")

if (sch is None or ('hexes',) not in sch):
    cur.execute("CREATE TABLE hexes(id, img, description)")

res = cur.execute("SELECT name FROM sqlite_master")

# import base64
# with open("./static/images/hexes/0_0.png", 'rb') as file:
#     blobdata = file.read()

# cur.execute("INSERT INTO hexes (id, img, description) VALUES (?, ?, ?)", ('0_0', blobdata, "A hex in Tasmania"))
# conn.commit()

res = cur.execute("SELECT * FROM hexes").fetchone()

from PIL import Image
import io

# Image.open(io.BytesIO(res[1]))
