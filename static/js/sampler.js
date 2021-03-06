// TODO when sampling with sample area, don't extend to DURATION - loop base_audio
// maybe do this with a threshold, f.ex. loop base_audio when it is acouple of secs long

function mono_to_stereo(input) {
	var output = []
	for (var i = 0; i < input.length; i++) {
		output.push(input[i]);
		output.push(input[i]);
	}
	return output;
}

function sample_audio(f, hz) {
	var SAMPLES;
	var audio = [];
	var base_audio = [];
	var DURATION = 10; // default dur; changed if we have a frequency to go by
	var RATE = 48000; // best results so far 

	if (view == 'simple') {
		f = parse_hz_input(f);
	}

	if (!checkbox.checked) { 
		if (typeof hz !== 'undefined') {
			var threshold = 0.001; // seems to work well
			var base_samples = RATE / hz; 

			var diff = base_samples - Math.floor(base_samples);
			var base_diff = diff;
			var factor = 1;
			if (diff == 0) {
				SAMPLES = Math.floor(base_samples)
			}
			else {
				while (true) {
					if (diff < threshold) {
						SAMPLES = Math.floor(base_samples * (factor - 1));
						break;
					}
					else if (diff > (1 - threshold)) {
						SAMPLES = Math.round(base_samples * (factor - 1));
						break;
					}

					diff = base_diff * factor - Math.floor(base_diff * factor);
					factor++;
				}
			}
		}
		else {
			SAMPLES = RATE;
		}

		for (var i = 0; i < SAMPLES; i++) {
			var x = i / RATE;
			base_audio[i] = eval(mathjs(f));
		}
	}
	else if (checkbox.checked) {
		var from = (selection1 - x_origin) / x_zoom;
		var to = (selection2 - x_origin) / x_zoom;

		for (var x = from; x < to; x += 1 / RATE) {
			base_audio.push(eval(mathjs(f)));
		}
	}
	else {
		alert('Failed to detect sample area..');
	}

	var TOT_SAMPLES = RATE * DURATION;

	// find factor
	var fac = 1;
	while (base_audio.length * fac < TOT_SAMPLES) {
		fac++;
	}

	for (var t = 0; t < fac; t++) {
		for (var i = 0; i < base_audio.length; i++) {
			audio.push(base_audio[i%base_audio.length]);
		}
	}

	// fade ends of audio, to reduce jitter
	var fade_threshold = 0.005 * RATE;
	for (var i = 0; i < audio.length; i++) {
		if (i < fade_threshold) {
			audio[i] = audio[i] * i / fade_threshold;
		}
		else if (i > (audio.length - fade_threshold)) {
			audio[i] = audio[i] * Math.abs(i - audio.length) / fade_threshold;
		}
	}

	audio = mono_to_stereo(audio);

	return audio;
};
