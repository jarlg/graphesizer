var canvas = document.getElementsByTagName('canvas')[0];
var width = window.innerWidth;

var hertzInput = document.getElementById('hertz');
var signalInput = document.getElementById('signal');

var view = 'simple';

var x_origin = 0;


window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext();
var audioSources = [];

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
