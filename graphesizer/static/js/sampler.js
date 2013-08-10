// given a mathematical function, we can sample it
// so we don't sample it server-side - because
// how can we sanitize the input for eval()?


function sample_audio(f, hz) {
	var SAMPLES;
	var audio = [];
	var base_audio = [];
	var DURATION = 1;
	var RATE = 96000.0;

	if (typeof hz !== 'undefined') {
		f = "sin(" + f + " * 2 * pi * x)";
		var threshold = 0.001; // seems to work well
		var base_samples = RATE / hz; 

		var diff = base_samples - Math.floor(base_samples);
		var base_diff = diff;
		var factor = 1;
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
	else {
		SAMPLES = RATE;
	}

	for (var i = 0; i < SAMPLES; i++) {
		var x = i / RATE;
		base_audio[i] = eval(mathjs(f));
	}

	var TOT_SAMPLES = RATE * DURATION;
	for (var i = 0; i < TOT_SAMPLES; i++) {
		audio[i] = base_audio[i%base_audio.length];
	}

	return audio;
};
