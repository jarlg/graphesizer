var canvas = document.getElementById('graph'),
	width = window.innerWidth,
	ctx = canvas.getContext('2d');

var x_zoom,
	x_origin = 0;

var checkbox = document.getElementById('sample-checkbox'),
	selection1 = null, selection2 = null;

var hertzInput = document.getElementById('hertz'),
	signalInput = document.getElementById('signal');

var view = 'simple';

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
