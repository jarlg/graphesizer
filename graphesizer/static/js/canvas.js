// VARS
var defZoom = (window.innerWidth - 20);
// origins for axis
var y_origin = (canvas.height / 2) + 0.5;
var x_origin = 0;
//x_origin = 0;
//zoom means n pixels corresponding to 1 x on graph
var x_zoom = defZoom;
var y_zoom = 200; // now we use zoom_fit to find a fitting zoom

function graph_current_function() {
	if (view == "advanced") {
 		f = document.getElementById('signal').value;
	}
	else {
		f = document.getElementById('hertz').value;
	}
 	graph_function(f);
}

function setXZoom(val) {
 	x_zoom = val;
 	graph_current_function();
}

function setYZoom(val) {
 	y_zoom = val;
 	graph_current_function();
}

function draw_axis() {
 	var canvas = document.getElementsByTagName("canvas")[0];
 	var context = canvas.getContext("2d");
 	context.beginPath();

 	// x-axis
 	context.moveTo(0, y_origin);
 	context.lineTo(canvas.width, y_origin);

 	// y-axis
 	context.moveTo(x_origin, 0);
 	context.lineTo(x_origin, canvas.height);

 	// zoom; default 44100px = 1
 	// unit axis
 	for (var i = x_origin + x_zoom; i < canvas.width; i += x_zoom) {
 		context.moveTo(i, y_origin - 3);
 		context.lineTo(i, y_origin + 3);
 	}

 	// y-axis over x-axis
 	for (var i = y_origin - y_zoom; i > 0; i -= y_zoom) {
 		context.moveTo(x_origin - 3, i);
 		context.lineTo(x_origin + 3, i);
 	}
 	for (var i = y_origin + y_zoom; i < canvas.height; i += y_zoom) {
 		context.moveTo(x_origin - 3, i);
 		context.lineTo(x_origin + 3, i);
 	}

 	context.closePath();
 	context.strokeStyle = "#000";
 	context.stroke();
}

function y_zoom_fit(f) {
	var highest = 0;
	for (var i = 0; i < canvas.width; i += 0.5) {
 		var x = (i - x_origin) / x_zoom;
		var y = abs(eval(mathjs(f)));
		if (y > highest) {
			highest = y; 
		}
	}
	return (y_zoom / highest); // let's normalize to y_zoom
}

function graph_function(f) {

	if (view == 'simple') {
		f = "sin(" + f + " * 2 * pi * x)";
	}

 	var canvas = document.getElementsByTagName("canvas")[0];
 	var context = canvas.getContext("2d");

	var y_factor = y_zoom_fit(f);

 	canvas.width = canvas.width;
 	// redraw of axis every time is heavy... crash!
 	//draw_axis();

 	context.fillStyle = "#E01B5D";
 	context.strokeStyle = "#E01B5D";
 	context.beginPath();

 	for (var i = 0; i < canvas.width; i += 0.5) {
 		var x = (i - x_origin) / x_zoom;
 		var y_coord = (-1 * eval(mathjs(f)) * y_factor) + y_origin;

 		if (i == 0) {
 			context.moveTo(x, y_coord);
 		}

 		context.lineTo(i, y_coord);
 		context.moveTo(i, y_coord);
 	}
 	context.closePath();
 	context.stroke();
}

