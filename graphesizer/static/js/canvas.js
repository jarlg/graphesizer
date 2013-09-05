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

function parse_hz_input(str) {
	var splits = ["+", "-", "*", "/", "(", ")"],
		tmp = str,
		res = "",
		separator = "|";

	// javascript's str.replace() sucks
	tmp = tmp.split('');

	for (var s = 0; s < splits.length; s++) {
		for (var i = 0; i < tmp.length; i++) {
			if (tmp[i] == splits[s]) {
				tmp[i] = separator + splits[s] + separator;
			}
		}
	}

	var str_tmp = "";
	for (var i = 0; i < tmp.length; i++) {
		str_tmp += tmp[i];
	}

	tmp = str_tmp.split(separator);

	for (var i = 0; i < tmp.length; i++) {
		if (isHertz(tmp[i])) {
			tmp[i] = " sin(" + tmp[i] + " * 2 * pi * x) ";
		}
		res += tmp[i];
	}

	return res;
}

// what am I missing?
function elem(el, arr) {
	for (var i = 0; i < arr.length; i++) {
		if (el == arr[i]) {
			return true;
		}
	}
	return false;
}

function draw_axis() {
	var axis_height = 12,
	 	offset = 0,
	 	sections = 5, // 5 sections = 1 section of higher 'base'
		ms = 1000000; // microseconds

	// x_zoom is defined so that it is the number pixels per x (second) of the graph
	// hence width % x_zoom gives n x seconds shown on screen
	var xSlider = document.getElementById('x-slider');

	var lowest = calculate_zoom(xSlider.max);
	var base = width / lowest * ms;
	
	base = (base < 100) ? 100 : (base + 100 - (base % 100));

	// roof base - ex. to 200 for this screen
	// i.e. to nearest 100, 10, thousand or whatever
	//
	// draw 5 medium-sized lines (we are rounding up,
	// so maybe adjust sections variable)
	// introduce next step of lines as bigger ones;
	// growing smaller as we zoom out. the 5th line
	// should be big, belonging to a bigger scale
	//
	// the smaller lines should shrink until a scale 
	// two orders of magnitude bigger is shown, i.e. 50 
	// lines in total. at any given time, maximum three
	// scales of lines are shown
	//
	// TODO add other scales, down to base and up to ~10secs
	
	
	var steps = [ms / Math.pow(5, 2), ms / 5, ms],
		cur = (width / x_zoom) * ms,
		start = (-1 * x_origin * ms / x_zoom),
		end = start + (width * ms / x_zoom),
		painted = [],
		n_ms,
		n_lines,
		first,
		x;

 	ctx.strokeStyle = "#000";
	ctx.lineWidth = 1;

	for (var s = steps.length - 1; s >= 0; s--) {
		first = (start == 0) ? 0 : Math.round(start / steps[s] + 0.5);
		first_x = first * steps[s] * x_zoom / ms + x_origin;

		n_lines = Math.floor((width - first_x) / (steps[s] * x_zoom / ms)) + 1;

		for (var i = 0; i < n_lines; i++) {
			n_ms = (first + i) * steps[s];
			x = n_ms * x_zoom / ms + x_origin;
	
			if (elem(n_ms, painted)) {
				continue;
			}

			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, axis_height * (s + 1));
			ctx.stroke();

			painted.push(n_ms);
		}
	}
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
		f = parse_hz_input(f);
	}

	//var y_factor = 1.0; //y_zoom_fit(f);

	// clear canvas
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

 	ctx.strokeStyle = "#E01B5D";
	ctx.lineWidth = 1;

	var points = normalize_points(graph_points(f), y_zoom);
	
	draw_points(points, y_origin);
	draw_axis();

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

// onclick event for canvas, to capture selection, and drag
(function() {
	canvas.ondblclick = function(e) {
		if (checkbox.checked) {
			selection1 = e.pageX;
			selection2 = null;
		}
		else {
			x_origin = e.x;
		}
		graph_current_function();
	};

	canvas.onmousedown = function(e) {
		if (checkbox.checked) {
			canvas.onmousemove = canvas.onmousedown;
			if (selection1 === null) {
				selection1 = e.pageX;
			}
			else {
				selection2 = e.pageX;
			}
		}
		else {
			var start = e.pageX;
			var orig = x_origin;
			canvas.onmousemove = function(e) {
				delta = e.pageX - start;
				x_origin = orig + delta;
				graph_current_function();
			}
		}
		graph_current_function();
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

		// chrome's delta y is 120 when firefox's is -3 (a normal scroll)
		var factor = (dy == "deltaY") ? -40 : 1;

		if (x_zoom + (event[dy] * factor * Math.log(x_zoom / 5)) > slider.min) {
			setXZoom(x_zoom + (event[dy] * factor * Math.log(x_zoom / 5)));
			slider.value = calculate_slider_pos(x_zoom);
			time.value = calculate_time(x_zoom);
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

	var ySlider = document.getElementById('y-slider');
	var xSlider = document.getElementById('x-slider');

	function redraw(v) {
		setXZoom(calculate_zoom(v));
 		time.value = calculate_time(x_zoom);
	}

	// Firefox's range slider doesn't update realtime
	var FF = /Firefox/i.test(navigator.userAgent);
	if (FF) {
		// only redraw on value change
		// might be unneccesary -- check oninput implementation
		
		var vx = xSlider.value;
		var vy = ySlider.value;

		xSlider.onclick = function() {
			vx = this.value;
		}

		xSlider.oninput = function() {
			if (this.value != vx) {
				redraw(this.value);
			}
		}

		ySlider.onclick = function() {
			vy = this.value;
		}

		ySlider.oninput = function() {
			if (this.value != vy) {
				setYZoom(this.value);
			}
		}
	}
	else {
		xSlider.onchange = function() {
			redraw(this.value);
		}

		ySlider.onchange = function() {
			setYZoom(this.value);
		};
	}
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
