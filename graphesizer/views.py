from graphesizer import app
from forms import SignalForm
from sound import SoundFile
from flask import render_template, request, redirect, url_for


@app.route("/")
@app.route("/<signal>")
def index(signal=None):
    form = SignalForm()
    return render_template("index.html",
                           signal = signal,
                           form = form)

@app.route("/generate", methods=["POST"])
def generate():
    # TODO handle json, return ogg file
    pass
