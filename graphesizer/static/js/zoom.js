// the algorithm for calculating x-zoom value
function calculate_zoom(v) {
	return Math.pow(v, 2) * 4;
};

// calculate time based on zoom
function calculate_time(z) {
	return (canvas.width / z).toFixed(3);
}
