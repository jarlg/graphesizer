# takes an input mathematical function and samples, digitalizes, it
# also TODO a system for saving files.. or maybe remove after a certain time
import wave
import subprocess
import os
from math import *
from struct import pack

SAMPLERATE = 44100

# currently signal (the mathematical function) is not used..
# just the input audio (the client-side sample of the signal)
class SoundFile():
    def __init__(self, signal="", audio=[]):
        self.signal = signal
        self.name = ""
        self.corrupt = False
        # just a silly way to make names.. should be pretty unique
        for i in xrange(1, 25):
            if (type(audio[i]) == type(1.0)) or (audio[i] == 0):
                self.name += str(audio[i])[-1]
            else:
                self.corrupt = True
                break

        self.audio = audio
        self.path = os.path.join(os.getcwd(),\
                                 "graphesizer/static/waves/")

        # we only create the file if it doesn't exist
        if os.path.isfile(os.path.join(self.path, self.name + ".ogg")):
            self.exists = True
        else:
            self.exists = False

    def wav_from_audio(self):
        if (not self.exists) and (not self.corrupt):
            A = 2 ** 14

            # normalize audio to 1
            greatest = 0
            for a in self.audio:
                greatest = abs(a) if abs(a) > greatest else greatest

            for i, a in enumerate(self.audio):
                self.audio[i] = a / greatest

            # pack
            wav = ""
            for a in self.audio:
                wav += pack('h', a * A)
            # hey let's do it twice for double the sound length
            for a in self.audio:
                wav += pack('h', a * A)
            # why not 3 times
            for a in self.audio:
                wav += pack('h', a * A)

            # write wav file
            w = wave.open(self.path + self.name + ".wav", 'w')
            w.setparams((1, 2, SAMPLERATE, 0, 'NONE', 'not compressed'))
            w.writeframes(wav)
            w.close()

        else:
            print "file %s exists" % self.name

    # write ogg file
    def encode_ogg(self):
        if (not self.exists) and (not self.corrupt):
            f = os.path.join(self.path, self.name + ".wav")
            cmd = ["oggenc", "-q7", f]
            subprocess.call(cmd)
            self.delete_wav()

    def delete_wav(self):
        f = os.path.join(self.path, self.name + ".wav")
        cmd = ["rm", f]
        subprocess.call(cmd)
