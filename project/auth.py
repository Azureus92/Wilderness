from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from .models import User, role_required, Civ, Settlement, Claim
from . import db

auth = Blueprint('auth', __name__)

@auth.route('/login')
def login():
    return render_template('login.html')

@auth.route('/login', methods=['POST'])
def login_post():
    username = request.form.get('username')
    password = request.form.get('password')
    remember = True if request.form.get('remember') else False

    user = db.session.execute(db.select(User).filter_by(username=username)).first()

    if not user:
        flash('No user by that name exists!')
        return redirect(url_for('auth.login')) # if the user doesn't exist or password is wrong, reload the page
    
    user = user[0]
    # check if the user actually exists
    # take the user-supplied password, hash it, and compare it to the hashed password in the database
    if not user or not check_password_hash(user.password, password):
        flash('Your password was wrong, dumbass')
        return redirect(url_for('auth.login')) # if the user doesn't exist or password is wrong, reload the page

    # if the above check passes, then we know the user has the right credentials
    login_user(user, remember=remember)
    return redirect(url_for('main.map'))

@auth.route('/signup')
# @login_required
# @role_required('admin')
def signup():
    return render_template('signup.html')

@auth.route('/signup', methods=['POST'])
# @login_required
# @role_required('admin')
def signup_post():
    # code to validate and add user to database goes here
    username = request.form.get('username')
    civ_name = request.form.get('civ_name')
    password = request.form.get('password')
    role = 'admin' if request.form.get('admin') == 'on' else 'user'

    user = db.session.execute(db.select(User).filter_by(civ_name=civ_name)).first() # if this returns a user, then the username already exists in database

    if user: # if a user is found, we want to redirect back to signup page so user can try again
        flash("That Civ already exists!")
        return redirect(url_for('auth.signup'))

    # create a new user with the form data. Hash the password so the plaintext version isn't saved.
    new_user = User(username=username, civ_name=civ_name, password=generate_password_hash(password), role=role)

    # add the new user to the database
    db.session.add(new_user)
    db.session.add(Civ(owner=civ_name))
    db.session.commit()

    return redirect(url_for('auth.login'))

@auth.route('/manage')
@login_required
@role_required('admin')
def manage():
    return render_template('manage-users.html')

def parse_users(users):
    res = []
    for user in users:
        res.append({
            "id": user.id,
            "username": user.username,
            "civ_name": user.civ_name
        })
    return res

@auth.route('/get-users')
@login_required
@role_required('admin')
def users():
    users = db.session.execute(db.select(User)).all()
    res = []
    for user in users:
        if (user[0].role != 'admin'):
            res.append(user[0])

    return parse_users(res)

@auth.route('/manage-modify', methods=['POST'])
@login_required
@role_required('admin')
def manage_modify_post():
    user_data = request.json
    if (user_data == None):
        return "Missing Data", 400
    
    if (user_data["username"] != None):
        if (db.session.execute(db.select(User).filter_by(username=user_data["username"])).first() != None):
            return "", 400
    
    h = db.session.execute(db.select(User).filter_by(id=user_data['id'])).first()[0]

    for key, value in user_data.items():
        if (value != ""):
            setattr(h, key, value)

    db.session.commit()
    return "", 200

@auth.route('/manage-delete', methods=['POST'])
@login_required
@role_required('admin')
def manage_delete_post():
    user_data = request.json
    civ = db.session.execute(db.select(User).filter_by(id=user_data['id'])).first()[0].civ_name
    db.session.execute(db.delete(Civ).filter_by(owner=civ))
    db.session.execute(db.delete(Claim).filter_by(owner=civ))
    db.session.execute(db.delete(Settlement).filter_by(owner=civ))
    db.session.execute(db.delete(User).filter_by(id=user_data['id']))

    db.session.commit()

    return "", 200

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.map'))

