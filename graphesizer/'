// VARS 
// origins for axis
y_origin = (canvas.height / 2) + 0.5;
x_origin = ((canvas.width) * 0.05) + 0.5;
//x_origin = 0;
//zoom means n pixels corresponding to 1 x on graph
x_zoom = 100;
y_zoom = 100;

function graph_current_function() {
	f = document.getElementById('signal').value;
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

function graph_function(f) {
	var canvas = document.getElementsByTagName("canvas")[0];
	var context = canvas.getContext("2d");

	canvas.width = canvas.width;
	// redraw of axis every time is heavy... crash!
	//draw_axis();

	context.fillStyle = "#E01B5D";
	context.strokeStyle = "#E01B5D";
	for (var i = 0; i < canvas.width; i += 1) {
		context.beginPath();
		var x = (i - x_origin) / x_zoom;
		context.arc(i, (-1 * eval(mathjs(f)) * y_zoom) + y_origin, 1.5, 0, 2 * Math.PI, false);
		context.fill();
		context.closePath();
	}
}
