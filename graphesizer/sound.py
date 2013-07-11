# takes an input mathematical function and samples, digitalizes, it
# also TODO a system for saving files.. or maybe remove after a certain time
import wave
import subprocess
import os
from math import *
from hashlib import md5
from struct import pack

SAMPLERATE = 44100
DURATION   = 2

# currently signal (the mathematical function) is not used..
# just the input audio (the client-side sample of the signal)
class SoundFile():
    def __init__(self, signal="", audio=[]):
        self.signal = signal
        #self.name = md5(signal).digest()
        self.name = "wave"
        self.audio = audio
        self.ogg = True
        self.path = os.path.join(os.getcwd(),\
                                 "graphesizer/static/waves/")

    def wav_from_audio(self):
        A = 2 ** 14

        # normalize audio to 1
        greatest = 0
        for a in self.audio:
            greatest = a if abs(a) > greatest else greatest

        for i, a in enumerate(self.audio):
            self.audio[i] = a / greatest

        # pack
        wav = ""
        for a in self.audio:
            wav += pack('h', a * A)

        # write wav file
        w = wave.open(self.path + self.name + ".wav", 'w')
        w.setparams((1, 2, SAMPLERATE, 0, 'NONE', 'not compressed'))
        w.writeframes(wav)
        w.close()

    # write ogg file
    def encode_ogg(self):
        f = os.path.join(self.path, self.name + ".wav")
        cmd = ["oggenc", "-q8", f]
        subprocess.call(cmd)
