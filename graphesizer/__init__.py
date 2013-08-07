from flask import Flask


app = Flask(__name__)
app.config.from_object("config")

from graphesizer import views


def run_with_debug():
    app.run(debug=True)
