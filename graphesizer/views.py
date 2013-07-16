from graphesizer import app
from forms import SignalForm
from sound import SoundFile
from flask import render_template, request, json, url_for, redirect


@app.route("/")
@app.route("/<signal>")
def index(signal="sin(10x)"):
    form = SignalForm()
    return render_template("index.html",
                           signal = signal,
                           form = form)

@app.route("/generate", methods=["GET", "POST"])
def generate():
    if request.method == "GET":
        return redirect(url_for('index'))

    try:
        data = json.loads(request.data)
    except ValueError:
        return redirect(url_for('index'))

    w = SoundFile(audio=data['audio'])
    w.wav_from_audio()
    w.encode_ogg()
    if w.corrupt:
        return "the input was corrupt"
    else:
        return url_for('static', filename='waves/' + w.name + '.ogg')
