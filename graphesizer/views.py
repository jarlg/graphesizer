from graphesizer import app
from flask import render_template, request, json, url_for, redirect,\
        send_from_directory


@app.route("/")
@app.route("/<signal>")
def index(signal="sin(220 * 2 * pi * x)"):
    return render_template("index.html",
                           signal = signal)

@app.route("/robots.txt")
@app.route("/humans.txt")
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])
