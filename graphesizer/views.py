from graphesizer import app
from flask import render_template, request, json, url_for, redirect


@app.route("/")
@app.route("/<signal>")
def index(signal="sin(220 * 2 * pi * x)"):
    return render_template("index.html",
                           signal = signal)

