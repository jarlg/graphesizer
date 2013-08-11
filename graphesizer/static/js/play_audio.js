function writeAudioControlHTML(label, id) {
	var container = document.getElementById('sounds');
	container.innerHTML += "<li><span class='label'>" +label+
 	   "</span>  <span id='" +id+ "-container'></span>";

	var labels = document.querySelectorAll(".label");
	for (var i = 0; i < labels.length; i++) {
		labels[i].onclick = function() {
			if (isHertz(this.innerHTML)) {
				hertzInput.value = this.innerHTML;
			}
			else {
				signalInput.value = this.innerHTML;
			}
			graph_current_function();
		};
	}

	writeButton(id);
}

function writeButton(id) {
	var container = document.getElementById(id + "-container");
	container.innerHTML = "<i name='player' id='" + id + "'></i>";

	var icon = document.getElementById(id);
	icon.setAttribute('class', 'icon-play');
	icon.playing = false;
	icon.source = audioSources[id][0];
	icon.gain = audioSources[id][1];
	icon.gain.gain.value = 0;

	// a bit hacky; everytime we add, we erase the onclick
	// of the previous elements.. so we reapply them
	var players = document.getElementsByName('player');
	for (var i = 0; i < players.length; i++)  {
		players[i].onclick = function() {
			this.source = audioSources[this.id][0];
			this.gain = audioSources[this.id][1];
			if (this.playing) {
				this.gain.gain.value = 0;
				this.setAttribute('class', 'icon-play');
				this.playing = false;
			}
			else {
				this.gain.gain.value = 1;
				this.setAttribute('class', 'icon-stop');
				this.playing = true;
			}
		};
	}
	audioSources[id][0].start(0);
}

function createAudioElement() {

	var src = audioContext.createBufferSource();
	if (!audioContext.createGain) {
		audioContext.createGain = context.createGainNode;
	}
	var gain = audioContext.createGain();

	var val = getInputValue();
	var id = audioSources.length;

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
		writeAudioControlHTML(val, id);
	}, function onDecodeFailure() { alert('encode error'); });

	//audioSources[id][0].start(0);
}

// bind to appropriate elements
(function() {
	var btn = document.getElementById('submit');
	btn.onclick = createAudioElement;

	hertzInput.onkeypress = function(e) {
		if (e.keyCode == 13) {
			createAudioElement();
		}
	};

	signalInput.onkeypress = hertzInput.onkeypress;
})();
