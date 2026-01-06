from flask import Flask, Blueprint, flash, request, redirect, url_for
from flask import render_template
from werkzeug.utils import secure_filename
import sqlite3
from .hex_mangler import mangle
from flask_login import LoginManager, login_required, current_user
from . import UPLOAD_FOLDER, db
from .models import Hex, role_required, Claim

main = Blueprint('main', __name__)

DB_NAME = 'test.db'
ALLOWED_EXTENSIONS = {'png', 'jpeg', 'jpg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@main.route("/")
@main.route('/map')
@login_required
def map():
    return render_template('index.html')

@main.route('/all-hexes', methods=['GET'])
@login_required
@role_required('admin')
def get_all_hexes():
    res = db.session.execute(db.select(Hex)).all()
    hexes = []
    for entry in res:
        e = entry[0]
        hexes.append({"id": e.id, "x": e.x, "y": e.y, "description": e.description})
    return hexes

@main.route('/register-hex', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def register_hex():
    if (request.method == 'POST'):
        player = request.form.get("player")
        hex_id = request.form.get("hex")

        db.session.add(Claim(owner=player, hex=hex_id))
        db.session.commit()

        flash("Hex Added!")
        return redirect(request.url)
    return render_template('register-hex.html')

@main.route('/get-hexes', methods=['GET'])
@login_required
def get_personal_hexes():
    res = ''
    if (current_user.role != 'admin'):
        owned = db.session.execute(db.select(Claim).filter_by(owner=current_user.name)).all()
        hexes = []
        for o in owned:
            hexes.append(o[0].hex)

        res = db.session.execute(db.select(Hex).filter(Hex.id.in_(hexes))).all()
    else:
        res = db.session.execute(db.select(Hex)).all()
        
    hexes = []
    for entry in res:
        e = entry[0]
        hexes.append({"id": e.id, "x": e.x, "y": e.y, "description": e.description})
    return hexes

@main.route('/upload-map', methods=['GET', 'POST'])
@login_required
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
            file.save(UPLOAD_FOLDER + '/' + filename)
            mangle(UPLOAD_FOLDER + '/' + filename, int(request.form['width']), int(request.form['height']), request.form['regen'])
            return redirect(url_for('main.map'))
        else:
            flash('Invalid file')
            return redirect(request.url)
    return render_template('upload.html')
