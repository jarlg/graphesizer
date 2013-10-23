// the algorithm for calculating x-zoom value from slider
function calculate_zoom(v) {
	return Math.pow(v, 2) * 4;
};

// opposite of above
function calculate_slider_pos(z) {
	return sqrt(z / 4);
}

// calculate time based on zoom
function calculate_time(z) {
	return (canvas.width / z).toFixed(3);
}
