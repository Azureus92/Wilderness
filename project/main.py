from flask import Blueprint, flash, request, redirect, url_for
from flask import render_template
from werkzeug.utils import secure_filename
from .hex_mangler import mangle
from flask_login import login_required, current_user
from . import UPLOAD_FOLDER, db
from .models import Hex, role_required, Claim, User, Civ, Tech, Ability

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
            "x": e.x, 
            "y": e.y, 
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

@main.route('/update-stats', methods=['POST'])
@login_required
@role_required('admin')
def update_stats_post():
    stats_data = request.json
    if (stats_data == None):
        return "Missing Data", 400
    
    h = db.session.execute(db.select(Civ).filter_by(owner=(stats_data['owner']))).first()[0]

    for key, value in stats_data.items():
        if (key != "owner" and value != None):
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

@main.route('/get-techs', methods=['GET'])
@login_required
def get_techs():
    res = []
    if request.args.get("civ") == None:
        return "", 400
    if (current_user.civ_name == request.args.get("civ") or current_user.role == "admin"): 
        res = db.session.execute(db.select(Tech).filter_by(owner=request.args.get("civ"))).all()
    else:
        return "", 401

    if (res == None):
        return []

    techs = []
    for t in res:
        tech = t[0]
        techs.append({
            "id": tech.id,
            "tech": tech.name,
            "desc": tech.description
        })
    return techs

@main.route('/get-abilities', methods=['GET'])
@login_required
def get_abilities():
    res = []
    if request.args.get("civ") == None:
        return "", 400
    if (current_user.civ_name == request.args.get("civ") or current_user.role == "admin"): 
        res = db.session.execute(db.select(Ability).filter_by(owner=request.args.get("civ"))).all()
    else:
        return "", 401
    if (res == None):
        return []

    abilities = []
    for a in res:
        ability = a[0]
        abilities.append({
            "id": ability.id,
            "tech": ability.name,
            "desc": ability.description
        })
    return abilities

@main.route('/get-stats', methods=['GET'])
@login_required
def get_stats():
    res = []
    if request.args.get("civ") == None:
        return "", 400
    if ((current_user.civ_name == request.args.get("civ") or current_user.role == "admin")): 
        res = db.session.execute(db.select(Civ).filter_by(owner=request.args.get("civ"))).first()
    else:
        return "", 401

    stats = {
        "earth": res[0].earth,
        "metal": res[0].metal,
        "wood": res[0].wood,
        "water": res[0].water,
        "fire": res[0].fire,
        "earth_total": res[0].earth_total,
        "metal_total": res[0].metal_total,
        "wood_total": res[0].wood_total,
        "water_total": res[0].water_total,
        "fire_total": res[0].fire_total
    }
    return stats

from io import BytesIO
from flask import send_file
@main.route('/get-demographics', methods=['GET'])
@login_required
def get_demographics():
    res = []
    if request.args.get("civ") == None:
        return "", 400
    if ((current_user.civ_name == request.args.get("civ") or current_user.role == "admin")): 
        res = db.session.execute(db.select(Civ).filter_by(owner=request.args.get("civ"))).first()
    else:
        return "", 401

    if (res[0].demographics  == None): 
        return [], 200

    test = []
    for row in res[0].demographics.split("\n")[0:-1]:
        temp = []
        for col in row.split("|")[0:-1]:
            temp.append(col)
        test.append(temp)

    return test, 200


@main.route('/update-demographics', methods=['POST'])
@login_required
@role_required('admin')
def update_demographics():
    d = request.json
    res = []
    if request.args.get("civ") == None:
        return "", 400
    if ((current_user.civ_name == request.args.get("civ") or current_user.role == "admin")): 
        res = db.session.execute(db.select(Civ).filter_by(owner=request.args.get("civ"))).first()
    else:
        return "", 401
    
    demo = ""
    for row in d["demographics"]:
        for val in row:
            demo += val + "|"
        demo += "\n"

    res[0].demographics = demo
    db.session.commit()

    return "", 200

@main.route('/get-civs', methods=['GET'])
@login_required
@role_required('admin')
def get_civs():
    res = db.session.execute(db.select(User)).all()
    users = []
    for u in res:
        user = u[0]
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

@main.route('/get-active-civs', methods=['GET'])
@login_required
def get_active_Civs():
    res = []
    if (current_user.role == "admin"): 
        res = db.session.execute(db.select(Civ)).all()
    else:
        res = db.session.execute(db.select(Civ).filter_by(owner=current_user.civ_name))

    civ_stats = []
    for s in res:
        stat = s[0]
        civ_stats.append({
            "owner": stat.owner
        })
    return civ_stats

@main.route('/register-hexes', methods=['POST'])
@login_required
@role_required('admin')
def register_hexes():
    data = request.json
    player = data['register-to']
    hexes = data['hex-ids']
    
    for h in hexes:
        if (db.session.execute(db.select(Claim).filter_by(owner=player, hex=h)).first() == None):
            db.session.add(Claim(owner=player, hex=h))
    db.session.commit()

    return "", 200

@main.route('/deregister-hexes', methods=['POST'])
@login_required
@role_required('admin')
def deregister_hexes():
    data = request.json
    player = data['delete-from']
    hexes = data['hex-ids']
    
    for h in hexes:
        db.session.execute(db.delete(Claim).filter_by(owner=player, hex=h))
    db.session.commit()

    return "", 200

@main.route('/delete-tech', methods=['POST'])
@login_required
@role_required('admin')
def delete_tech():
    data = request.json
    id = data['id']

    db.session.execute(db.delete(Tech).filter_by(id=id))
    db.session.commit()

    return "", 200

@main.route('/create-tech', methods=['POST'])
@login_required
@role_required('admin')
def create_tech():
    data = request.json
    player = data['player']
    name = data['name']
    desc = data['description']
    
    db.session.add(Tech(owner=player, name=name, description=desc))
    db.session.commit()

    return "", 200

@main.route('/update-techs', methods=['POST'])
@login_required
@role_required('admin')
def modify_tech():
    data = request.json
    to_update = data['update']
    for upd in to_update:
        id = upd['id']
        name = upd['name']
        desc = upd['description']

        tech = db.session.execute(db.select(Tech).filter_by(id=id)).first()[0]
        if (name != None):
            setattr(tech, "name", name)
        if (desc != None):
            setattr(tech, "description", desc)
        db.session.commit()

    return "", 200

@main.route('/delete-ability', methods=['POST'])
@login_required
@role_required('admin')
def delete_ability():
    data = request.json
    id = data['id']
    
    db.session.execute(db.delete(Ability).filter_by(id=id))
    db.session.commit()

    return "", 200

@main.route('/create-ability', methods=['POST'])
@login_required
@role_required('admin')
def create_ability():
    data = request.json
    player = data['player']
    name = data['name']
    desc = data['description']
    
    db.session.add(Ability(owner=player, name=name, description=desc))
    db.session.commit()

    return "", 200

@main.route('/update-abilities', methods=['POST'])
@login_required
@role_required('admin')
def update_abilities():
    data = request.json
    to_update = data['update']
    for upd in to_update:
        id = upd['id']
        name = upd['name']
        desc = upd['description']

        ability = db.session.execute(db.select(Ability).filter_by(id=id)).first()[0]
        if (name != None):
            setattr(ability, "name", name)
        if (desc != None):
            setattr(ability, "description", desc)
        db.session.commit()

    return "", 200

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