$(function() {
	console.log("include.js");
	var includes = $.makeArray($('.js-include'));
	for (var i = 0; i < includes.length; i++) {
		var $el = $(includes[i]);
		var request = new XMLHttpRequest();
		request.open('GET', $el.data('url'), false); // synchronous request!!
		request.send();
		$el.replaceWith(request.responseText);
	}
});
