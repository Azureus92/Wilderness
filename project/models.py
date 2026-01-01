from . import db
from flask_login import UserMixin, current_user
from flask import flash, redirect, url_for
from functools import wraps

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True) # primary keys are required by SQLAlchemy
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    name = db.Column(db.String(1000))
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
                return redirect(url_for('main.index'))
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
    known_by = db.Column(db.String(1000))