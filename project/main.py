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

def resolve_hexes(res):
    m_x = 9999
    m_y = 9999
    hexes = []
    for entry in res:
        m_x = min(m_x, entry[0].x)
        m_y = min(m_y, entry[0].y)

    for entry in res:
        e = entry[0]
        hexes.append({
            "id": e.id, 
            "x": e.x - m_x, 
            "y": e.y - m_y, 
            "description": e.description,
            "biome": e.biome,
            "features": e.features,
            "flora": e.flora,
            "fauna": e.fauna,
            "developments": e.developments,
            "resources": e.resources
        })
    return hexes
    

@main.route('/all-hexes', methods=['GET'])
@login_required
@role_required('admin')
def get_all_hexes():
    res = db.session.execute(db.select(Hex)).all()
    return resolve_hexes(res)


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
        
    return resolve_hexes(res)

@main.route('/upload-map', methods=['GET'])
@login_required
@role_required('admin')
def upload_map():
    return render_template('upload.html')


@main.route('/upload-map', methods=['POST'])
@login_required
@role_required('admin')
def upload_map_post():
    w = request.form.get("width")
    h = request.form.get("height")
    r = request.form.get("regen")
    print(request.files)

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
        mangle(UPLOAD_FOLDER + '/' + filename, int(w), int(h), r)
        return redirect(url_for('main.map'))
    else:
        flash('Invalid file')
        return redirect(request.url)