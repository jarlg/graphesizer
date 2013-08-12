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
	var y_zoom = document.getElementById('y-slider').value;
	return (y_zoom / highest); // let's normalize to y_zoom
}

function graph_function(f) {

	if (view == 'simple') {
		f = "sin(" + f + " * 2 * pi * x)";
	}

	var y_origin = (canvas.height / 2) + 0.5;

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

	if (selection1 !== null || selection2 !== null) {
		select_area(selection1, selection2);
	}
}

function select_area(x1, x2) {
	context.fillStyle = "rgba(0, 0, 0, 0.2)";
	context.strokeStyle = "rgba(0, 0, 0, 0.4)";
	context.lineWidth = 2;
	context.beginPath();
	context.moveTo(x1, 0);
	context.lineTo(x1, canvas.height);

	context.moveTo(x2, 0);
	context.lineTo(x2, canvas.height);
	context.closePath();
	context.stroke();

	if (x1 !== null && x2 !== null) {
		context.fillRect(x1, 0, (x2 - x1), canvas.height);
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
	var xSlider = document.getElementById('x-slider');
	xSlider.setAttribute('value', 112);
	xSlider.setAttribute('max', width + 20);
	xSlider.onchange = function() {
		setXZoom(calculateZoom(this.value));
 		time.value = (((canvas.width - 20) / 2) / this.value).toFixed(3);
	};

	var ySlider = document.getElementById('y-slider');
	ySlider.onchange = function() {
		setYZoom(this.value);
	};

	setXZoom(50000);
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
		graph_current_function();
	};

	advToggle.onclick = function() {
		view = 'advanced';
		graph_current_function();
	};

})();
