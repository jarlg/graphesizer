// given a mathematical function, we can sample it
// so we don't sample it server-side - because
// how can we sanitize the input for eval()?


function sample_audio(f, hz) {
	var audio = [];
	var RATE = 44100.0;

	if (typeof hz !== 'undefined') {
		var threshold = 0.1;
		var base_samples = RATE / hz; 

		var diff = base_samples - Math.floor(base_samples);
		var base_diff = diff;
		var f = 1;
		while (true) {
			if (diff < threshold) {
				var SAMPLES = Math.floor(base_samples * f);
				break;
			}
			else if (diff > (1 - threshold)) {
				var SAMPLES = Math.round(base_samples * f);
				break;
			}

			diff = base_diff * f - Math.floor(base_diff * f);
		}
	}
	else {
		var SAMPLES = RATE;
	}

	for (var i = 0; i < SAMPLES; i++) {
		var x = i / RATE;
		audio[i] = eval(mathjs(f));
	}

	return audio;
};
