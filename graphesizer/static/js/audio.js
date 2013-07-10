// given a mathematical function, we can sample it
// so we don't sample it server-side - because
// how can we sanitize the input for eval()?


audio = [];
RATE = 44100.0;
DURATION = 1;

function sample_audio(f) {
	for (var x = 0, i = 0; x < DURATION; x += 1 / RATE) {
		audio[i++] = eval(mathjs(f));
	}
	return audio;
}
