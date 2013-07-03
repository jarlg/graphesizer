from flask.ext.wtf import Form, TextField, Required


class SignalForm(Form):
    signal = TextField('signal', [Required()])
