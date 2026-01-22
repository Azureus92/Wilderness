from . import db
from flask_login import UserMixin, current_user
from flask import flash, redirect, url_for
from functools import wraps

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True) # primary keys are required by SQLAlchemy
    username = db.Column(db.String(100))
    password = db.Column(db.String(100))
    civ_name = db.Column(db.String(1000), unique=True)
    role = db.Column(db.String(20), default='user')
    
    def has_role(self, role):
        return self.role == role
    
    def is_admin(self):
        return self.role == 'admin'

# Custom decorator for role-based access
def role_required(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated or not current_user.has_role(role):
                flash('Access denied. Insufficient permissions.')
                return redirect(url_for('auth.login'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

class Hex(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    x = db.Column(db.Integer)
    y = db.Column(db.Integer)
    description = db.Column(db.String(1000))
    biome = db.Column(db.String(1000))
    features = db.Column(db.String(1000))
    flora = db.Column(db.String(1000))
    fauna = db.Column(db.String(1000))
    developments = db.Column(db.String(1000))
    resources = db.Column(db.String(1000))

class Claim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner = db.Column(db.String(1000))
    hex = db.Column(db.Integer)

class Civ(db.Model):
    owner = db.Column(db.String(1000), primary_key=True)
    earth = db.Column(db.Integer, default=-1)
    fire = db.Column(db.Integer, default=-1)
    water = db.Column(db.Integer, default=-1)
    metal = db.Column(db.Integer, default=-1)
    wood = db.Column(db.Integer, default=-1)
    earth_total = db.Column(db.Integer, default=0)
    fire_total = db.Column(db.Integer, default=0)
    water_total = db.Column(db.Integer, default=0)
    metal_total = db.Column(db.Integer, default=0)
    wood_total = db.Column(db.Integer, default=0)
    demographics = db.Column(db.String(5000))

class Settlement(db.Model):
    hex_id = db.Column(db.Integer, primary_key=True)
    owner = db.Column(db.String(1000))
    demographics = db.Column(db.String(5000))

class Tech(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner = db.Column(db.String(1000))
    name = db.Column(db.String(1000))
    description = db.Column(db.String(1000))

class Ability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner = db.Column(db.String(1000))
    name = db.Column(db.String(1000))
    description = db.Column(db.String(1000))