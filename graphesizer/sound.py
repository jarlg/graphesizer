# takes an input mathematical function and samples, digitalizes, it
import wave
import subprocess
import os
from math import *
from hashlib import md5
from struct import pack

SAMPLERATE = 44100
DURATION   = 2

class SoundFile():
    def __init__(self, signal):
        self.signal = signal
        #self.name = md5(signal).digest()
        self.name = "wave"
        self.ogg = True
        self.path = os.path.join(os.getcwd(),\
                                 "graphesizer/static/waves/")

    def generate(self):
        wav = ""

        i = 1.0 / SAMPLERATE
        x = 0
        f = 2 ** 14
        while x < DURATION:
            wav += pack('h', eval(self.signal) * f)
            x += i

        w = wave.open(self.path + self.name + ".wav", 'w')
        w.setparams((1, 2, SAMPLERATE, 0, 'NONE', 'not compressed'))
        w.writeframes(wav)
        w.close()

        if self.ogg:
            self.encode_ogg()

    def encode_ogg(self):
        f = os.path.join(self.path, self.name + ".wav")
        cmd = ["oggenc", "-q8", f]
        subprocess.call(cmd)
