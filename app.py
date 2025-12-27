from flask import Flask, flash, request, redirect, url_for
from flask import render_template
from werkzeug.utils import secure_filename
import sqlite3
from hex_mangler import mangle
import os

UPLOAD_FOLDER = './static/images/uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def login():
    return "<p></p>"

@app.route('/map')
def map():
    return render_template('index.html')

@app.route('/all-hexes')
def get_hexes():
    with sqlite3.connect("test.db") as conn:
        cur = conn.cursor()
        res = cur.execute("SELECT * FROM hexes WHERE (x = 10 AND y = 5) OR (x = 10 AND y = 7) OR (x = 10 AND y = 2)")
        hexes = []
        for entry in res.fetchall():
            print(entry)
            hexes.append({"id": entry[0], "x": entry[1], "y": entry[2], "description": entry[3]})
        return hexes

@app.route('/upload-map', methods=['GET', 'POST'])
def upload_map():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            print(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            file.save(app.config['UPLOAD_FOLDER'] + '/' + filename)
            with sqlite3.connect("test.db") as conn:
                cur = conn.cursor()
                mangle(app.config['UPLOAD_FOLDER'] + '/' + filename, 20, 25, conn, cur)
                res = cur.execute("SELECT * FROM hexes").fetchall()
                print(len(res))
            return redirect(url_for('download_file', name=filename))
    return '''
    <!doctype html>
    <title>Upload new File</title>
    <h1>Upload new File</h1>
    <form method=post enctype=multipart/form-data>
    <input type=file name=file>
    <input type=submit value=Upload>
    </form>
    '''

from flask import send_from_directory

@app.route('/uploads/<name>')
def download_file(name):
    return send_from_directory(app.config["UPLOAD_FOLDER"], name)


with sqlite3.connect("test.db") as conn:
    cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS users(username, password, hexes)")
    cur.execute("CREATE TABLE IF NOT EXISTS hexes(" \
    "id int NOT NULL, " \
    "x int NOT NULL, " \
    "y int NOT NULL, " \
    "description varchar(256) DEFAULT 'A hex in Tasmania', " \
    "biome varchar(256) DEFAULT 'Plains', " \
    "features varchar(256) DEFAULT 'Hills', " \
    "flora varchar(256) DEFAULT 'Grass', " \
    "fauna varchar(256) DEFAULT 'Birds', " \
    "developments varchar(256) DEFAULT 'No Developments', " \
    "resources varchar(256) DEFAULT 'Nothing'" \
    ")")

from PIL import Image
import io

# Image.open(io.BytesIO(res[1]))

