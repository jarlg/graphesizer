from graphesizer import app
from forms import SignalForm
from sound import SoundFile
from flask import render_template, request, json, url_for


@app.route("/")
@app.route("/<signal>")
def index(signal=None):
    form = SignalForm()
    return render_template("index.html",
                           signal = signal,
                           form = form)

@app.route("/generate", methods=["POST"])
def generate():
    data = json.loads(request.data)
    w = SoundFile(audio=data['audio'])
    w.wav_from_audio()
    w.encode_ogg()
    return url_for('static', filename='waves/' + w.name + '.ogg')
