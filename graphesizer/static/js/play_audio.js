function writeAudioControlHTML(label, num) {
	var container = document.getElementById('sounds');
	container.innerHTML += "<p class='play' id='" + num +
							"'>" + label + "</p>";
}

function createAudioElement() {

	var src = audioContext.createBufferSource();
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
		audioSources[id] = src;
	}, function onDecodeFailure() { alert('encode error'); });


	var e = document.getElementById(id);

	// TODO add a button that changes between pause and play
	e.onclick = function() { audioSources[e.id].start(0); };
}

// bind to appropriate elements
(function() {
	var btn = document.getElementById('submit');
	btn.onclick = createAudioElement;
})();

//s.addEventListener("mousedown", function() {
//	// TODO change back to play-element after click
//	src.stop();
//	gain.setValueAtTime(0, ctx.currentTime);}, false);
