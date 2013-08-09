var decoded_audio;
var ctx = new AudioContext();
var src = ctx.createBufferSource();
var gain = ctx.createGain();

canvas.setAttribute('id', 'play');

//var p = document.querySelectorAll('.play');
//var s = document.querySelectorAll('.stop');
var p = document.getElementById('play');
var s = document.getElementById('stop');

function getInputValue() {
	if (view == 'simple') {
		return document.getElementById('hertz').value;
	}
	else {
		return document.getElementById('signal').value;
	}
}

p.addEventListener("mousedown", function() {
	// TODO change the clicked element to a stop-element after click
	var samples, buffer;
	var val = getInputValue();

	if (view == 'simple') {
		samples = sample_audio(val, val);
	}
	else {
		samples = sample_audio(val);
	}

	buffer = encodeWAV(samples);
	ctx.decodeAudioData(buffer, function onDecodeSuccess (b) {
		decoded_audio = b; 
	}, function onDecodeFailure() { alert('encode error'); });
	
	src.buffer = decoded_audio;
	src.loop = true;
	src.connect(gain);
	gain.connect(ctx.destination);
	src.start();
	},
   	false);

s.addEventListener("mousedown", function() {
	// TODO change back to play-element after click
	src.stop();
	gain.setValueAtTime(0, ctx.currentTime);}, false);
