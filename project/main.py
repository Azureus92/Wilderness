from flask import Flask, Blueprint, flash, request, redirect, url_for
from flask import render_template
from werkzeug.utils import secure_filename
import sqlite3
from .hex_mangler import mangle
from flask_login import LoginManager, login_required, current_user
from . import UPLOAD_FOLDER, db
from .models import Hex, role_required, Claim, User

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

@main.route('/register-hex', methods=['GET'])
@login_required
@role_required('admin')
def register_hex():
    return render_template('register-hex.html')

@main.route('/register-hex', methods=['POST'])
@login_required
@role_required('admin')
def register_hex_post():
    player = request.form.get("player")
    hex_id = request.form.get("hex")
    

    db.session.add(Claim(owner=player, hex=hex_id))
    db.session.commit()

    flash("Hex Added!")
    return redirect(request.url)

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

@main.route('/update-hex', methods=['POST'])
@login_required
@role_required('admin')
def update_hex_post():
    hex_data = request.json
    if (hex_data == None):
        return "Missing Data", 400
    
    h = db.session.execute(db.select(Hex).filter_by(id=hex_data['id'])).first()[0]

    for key, value in hex_data.items():
        if (value != None):
            setattr(h, key, value)

    db.session.commit()
    return "", 200

@main.route('/get-hexes', methods=['GET'])
@login_required
def get_personal_hexes():
    res = ''
    if (current_user.role != 'admin'):
        owned = db.session.execute(db.select(Claim).filter_by(owner=current_user.civ_name)).all()
        hexes = []
        for o in owned:
            hexes.append(o[0].hex)

        res = db.session.execute(db.select(Hex).filter(Hex.id.in_(hexes))).all()
    else:
        res = db.session.execute(db.select(Hex)).all()
        
    return resolve_hexes(res)

@main.route('/get-civs', methods=['GET'])
@login_required
@role_required('admin')
def get_civs():
    res = db.session.execute(db.select(User)).all()
    users = []
    for u in res:
        user = u[0]
        print(user.username)
        if user.role != 'admin':
            users.append(user.civ_name)
    return users

@main.route('/get-claims', methods=['GET'])
@login_required
@role_required('admin')
def get_claims():
    res = db.session.execute(db.select(Claim)).all()
    claims = []
    for c in res:
        claim = c[0]
        claims.append({
            "owner": claim.owner,
            "hex_id": claim.hex
        })
    return claims

@main.route('/get-hexes-for', methods=['GET'])
@login_required
@role_required('admin')
def get_hexes_for():
    name = request.args.get("civ_name")

    owned = db.session.execute(db.select(Claim).filter_by(owner=name)).all()
    hexes = []
    for o in owned:
        hexes.append(o[0].hex)

    res = db.session.execute(db.select(Hex).filter(Hex.id.in_(hexes))).all()

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