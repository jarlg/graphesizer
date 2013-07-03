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

@app.route("/generate")
def generate():
    signal = SignalForm(request.args)
    sound_file = SoundFile(signal.data["signal"])
    sound_file.generate()
   # if "ogg" in request.args:
   #     if request.args["ogg"]:
   #         sound_file.encode_ogg()
    return redirect("/%s" % sound_file.name)
