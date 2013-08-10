function writeAudioControlHTML(label, id) {
	var container = document.getElementById('sounds');
	container.innerHTML += "<p>" + label +
 	   "  <span id='" + id + "-container'></span></p>";
	writePlayButton(id);
}

function writePauseButton(id) {
	var e = document.getElementById(id);
	var container = document.getElementById(id + "-container");
	container.innerHTML = "<i class='icon-stop' id='" + id + "'></i>";

	var btn = document.getElementById(id);
	btn.onclick = function() {
		writePlayButton(e.id);
		var gain = audioSources[e.id][1];
		gain.gain.value = 0;
	};
}

function writePlayButton(id) {
	var e = document.getElementById(id);
	var container = document.getElementById(id + "-container");
	container.innerHTML = "<i class='icon-play' id='" + id + "'></i>";

	var btn = document.getElementById(id);
	btn.onclick = function() {
		writePauseButton(e.id);
		var gain = audioSources[e.id][1];
		gain.gain.value = 1;
	};
}


function createAudioElement() {

	var src = audioContext.createBufferSource();
	if (!audioContext.createGain) {
		audioContext.createGain = context.createGainNode;
	}
	var gain = audioContext.createGain();

	var val = getInputValue();
	var id = audioSources.length;
	writeAudioControlHTML(val, id);

	var samples, buffer;

	if (view == 'simple') {
		samples = sample_audio(val, val);
	}
	else {
		samples = sample_audio(val);
	}

	buffer = encodeWAV(samples);
	audioContext.decodeAudioData(buffer, function onDecodeSuccess (b) {
		src.buffer = b;
		src.loop = true;
		src.connect(gain);
		gain.connect(audioContext.destination);
		audioSources[id] = [src, gain];
	}, function onDecodeFailure() { alert('encode error'); });


	var e = document.getElementById(id);

	e.onclick = function() { 
		audioSources[e.id][0].start(0);
		writePauseButton(e.id);
   	};
}

// bind to appropriate elements
(function() {
	var btn = document.getElementById('submit');
	btn.onclick = createAudioElement;
})();
