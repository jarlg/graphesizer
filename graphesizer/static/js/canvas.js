function graph_current_function() {
	if (view == "advanced") {
 		f = document.getElementById('signal').value;
	}
	else if (view == 'simple') {
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
	var y_origin = (canvas.height / 2) + 0.5;
 	var ctx = canvas.getContext("2d");
 	ctx.beginPath();

 	// x-axis
 	ctx.moveTo(0, y_origin);
 	ctx.lineTo(canvas.width, y_origin);

 	// y-axis
 	ctx.moveTo(x_origin, 0);
 	ctx.lineTo(x_origin, canvas.height);

 	// zoom; default 44100px = 1
 	// unit axis
 	for (var i = x_origin + x_zoom; i < canvas.width; i += x_zoom) {
 		ctx.moveTo(i, y_origin - 3);
 		ctx.lineTo(i, y_origin + 3);
 	}

 	// y-axis over x-axis
 	for (var i = y_origin - y_zoom; i > 0; i -= y_zoom) {
 		ctx.moveTo(x_origin - 3, i);
 		ctx.lineTo(x_origin + 3, i);
 	}
 	for (var i = y_origin + y_zoom; i < canvas.height; i += y_zoom) {
 		ctx.moveTo(x_origin - 3, i);
 		ctx.lineTo(x_origin + 3, i);
 	}

 	ctx.closePath();
 	ctx.strokeStyle = "#000";
 	ctx.stroke();
}

function normalize_points(p, n) {
	var highest = 0,
		v;

	for (var i = 0; i < p.length; i++) {
		v = abs(p[i]);
		highest = (v > highest) ? v : highest;
	}

	return p.map(function(elem) { return elem * n / highest; });
}

// graph points with resolution of 2 per x
function graph_points(f) {
	var x,
		result = [];

 	for (var i = 0; i < canvas.width; i += 0.5) {
 		 x = (i - x_origin) / x_zoom;
		 result.push((-1 * eval(f)));
	}
	return result;
}

// FF performs better with many strokes;
// Chrome (Webkit?) with just one big at the end
function draw_points(points, y_origin) {
	var x, y;

	// check if Firefox
	if (/Firefox/i.test(navigator.userAgent)) {
		var last = [0, points[0]];
		for (var i = 1; i < points.length; i++) {
			x = i / 2;
			y = points[i] + y_origin;

			ctx.beginPath();
			ctx.moveTo.apply(ctx, last);
			ctx.lineTo(x, y);
			ctx.stroke();

			last = [x, y];
 		}
	}
	else {
		ctx.beginPath();
		ctx.moveTo(0, points[0]+y_origin);

		for (var i = 1; i < points.length; i++) {
			x = i / 2;
			y = points[i] + y_origin;

			ctx.lineTo(x, y);
			ctx.moveTo(x, y);
		}

		ctx.stroke();
	}
}

function graph_function(f) {
	var x,
		y,
		y_origin = (canvas.height / 2) + 0.5;
	
	if (view == 'simple') {
		f = "sin(" + f + " * 2 * pi * x)";
	}

	//var y_factor = 1.0; //y_zoom_fit(f);

	// clear canvas
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

 	ctx.fillStyle = "#E01B5D";
 	ctx.strokeStyle = "#E01B5D";

	var points = normalize_points(graph_points(f), y_zoom);
	
	draw_points(points, y_origin);

	if (selection1 !== null || selection2 !== null) {
		select_area(selection1, selection2);
	}
}

function select_area(x1, x2) {
	ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
	ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x1, 0);
	ctx.lineTo(x1, canvas.height);

	ctx.moveTo(x2, 0);
	ctx.lineTo(x2, canvas.height);
	ctx.closePath();
	ctx.stroke();

	if (x1 !== null && x2 !== null) {
		ctx.fillRect(x1, 0, (x2 - x1), canvas.height);
	}
}

// onclick event for canvas, to capture selection
(function() {
	canvas.ondblclick = function(e) {
		if (checkbox.checked) {
			selection1 = e.pageX;
			selection2 = null;
			graph_current_function();
		}
	};

	canvas.onmousedown = function(e) {
		if (checkbox.checked) {
			// only care about mouse move while mouse is down
			canvas.onmousemove = canvas.onmousedown;
			if (selection1 === null) {
				selection1 = e.pageX;
			}
			else {
				selection2 = e.pageX;
			}
			graph_current_function();
		}
	};

	canvas.onmouseup = function() {
		canvas.onmousemove = null;
	};

})();

// scroll events for canvas
(function() {
	function scrollToZoom(event) {
		var slider = document.getElementById('x-slider');

		// chrome uses wheelDeltaY, firefox uses deltaY
		var dy = ("wheelDeltaY" in event) ? "wheelDeltaY" : "deltaY";

		// chrome's delta y is 120 when firefox's is 3 (a normal scroll)
		var factor = (dy == "deltaY") ? 40 : 1;

		if (x_zoom + (event[dy] * factor * Math.log(x_zoom / 5)) > slider.min) {
			setXZoom(x_zoom + (event[dy] * factor * Math.log(x_zoom / 5)));
			slider.value = calculate_slider_pos(x_zoom);
		}
	}

	if ("onmousewheel" in canvas) {
		canvas.onmousewheel = scrollToZoom;
	}
	else if ("onwheel" in canvas) {
		canvas.onwheel = scrollToZoom;
	}
})();


// sample-checkbox should reset selection values
(function() {
	checkbox.onchange = function() {
		if (!this.checked) {
			selection1 = null;
			selection2 = null;
			graph_current_function();
		}
	};
})();

// Let's draw the initial graph based on default value in our input
// and prepare the slider according to initial zoom
(function() {
	setXZoom(50000);
 	time.value = calculate_time(x_zoom);

	var xSlider = document.getElementById('x-slider');
	xSlider.setAttribute('value', 112);
	xSlider.setAttribute('max', width + 20);

	function redraw(v) {
		setXZoom(calculate_zoom(v));
 		time.value = calculate_time(x_zoom);
	}

	// Firefox's range slider doesn't update realtime
	var FF = /Firefox/i.test(navigator.userAgent);
	if (FF) {
		// only redraw on value change
		
		var v = xSlider.value;

		xSlider.onclick = function() {
			v = this.value;
		}

		xSlider.oninput = function() {
			if (this.value != v) {
				redraw(this.value);
			}
		}
	}
	else {
		xSlider.onchange = function() {
			redraw(this.value);
		}
	}

	var ySlider = document.getElementById('y-slider');
	ySlider.onchange = function() {
		setYZoom(this.value);
	};
})();

// events for inputs
(function() {
	hertzInput.onkeyup = function() {
		view = 'simple';
		graph_current_function();
	};

	signalInput.onkeyup = function() {
		view = 'advanced';
		graph_current_function();
	};
})();

// events for view toggle
(function() {
	var simpleToggle = document.getElementById('simple_toggle');
	var advToggle = document.getElementById('advanced_toggle');

	simpleToggle.onclick = function() {
		view = 'simple';
		selection1 = null;
		selection2 = null;
		checkbox.checked = false;
		graph_current_function();
	};

	advToggle.onclick = function() {
		view = 'advanced';
		graph_current_function();
	};

})();
