// thanks to user Ian Kuca for this
// ref: http://stackoverflow.com/questions/1255948/post-data-in-json-format-with-javascript
//

function post_json(e) {
	// collect the form data while iterating over the 
	var data = {};
	for (var i = 0, ii = e.length; i < ii; ++i) {
	    var input = e[i];
	    if (input.name) {
	        data[input.name] = input.value;
	    }
	}

	// let's sample the audio
	data['audio'] = sample_audio(data['signal']);

	// construct an HTTP request
	var xhr = new XMLHttpRequest();
	xhr.open(e.method, e.action, true);
	xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

	// send the collected data as JSON
	xhr.send(JSON.stringify(data));

	xhr.onloadend = function () {
		alert(xhr.responseText);
	};

	// do stop form submitting data
	return false;
};
