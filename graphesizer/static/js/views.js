// we define two views: advanced and simple

var ds;
var view = "advanced";

function set_simple_view() {
	view = "simple";
	ds = document.getElementById('signal').value;
	var simple_html = '<span class="adjust"><input type="text" id="hertz" name="hertz" value=368 onkeyup="graph_function(hertz=this.value)" />Hz</span>'
	document.getElementById('signal_view').innerHTML = simple_html;
}

function set_advanced_view() {
	view = "advanced";
	var advanced_html = '<span class="adjust"><i>f</i>(<i>x</i>): <input type="text" id="signal" name="signal" value="' + ds + '" onkeyup="graph_function(this.value)" /></span>'
	document.getElementById('signal_view').innerHTML = advanced_html;
}
