from flask import Flask
from flask import render_template


app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, Worda!</p>"

@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/hexagons')
def css():
    return render_template('hexagons.css')