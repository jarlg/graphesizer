var canvas = document.getElementsByTagName('canvas')[0];
var width = window.innerWidth;
var context = canvas.getContext("2d");

var x_zoom;

var checkbox = document.getElementById('sample-checkbox');
var selection1 = null, selection2 = null;

var hertzInput = document.getElementById('hertz');
var signalInput = document.getElementById('signal');

var view = 'simple';

var x_origin = 0;

try {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	var audioContext = new AudioContext();
	var audioSources = [];
}
catch (e) {
	Avgrund.show('#not-supported');
}

// Let's shape the canvas to the screen
(function() {
	var cHeight = (window.innerHeight / 1.6);

	canvas.setAttribute('width', width + 'px');
	canvas.setAttribute('height', cHeight+'%');
})();

// Firefox's range slider doesn't update realtime
(function() {
	// retarded if.. find a standard for checking browsers
	if (document.mozVisibilityState == 'visible') {
		var xSlider = document.getElementById('x-slider');

		xSlider.last = 0;

		xSlider.onmousedown = function() {
			xSlider.onmousemove = function() {
				// only render every other time.. otherwise too heavy
				if (this.last > 1) {
					setXZoom(calculate_zoom(this.value));
					time.value = calculate_time(x_zoom);
					this.last = 0;
				}
				else {
					this.last++;
				}
			};
		};

		xSlider.onmouseup = function() {
			xSlider.onmousemove = function() {};
		};
	}
})();

function getInputValue() {
	if (view == 'simple') {
		return document.getElementById('hertz').value;
	}
	else {
		return document.getElementById('signal').value;
	}
}

function isHertz(val) {
	return !isNaN(val);
}
