var SERVER = 'http://dev.iamspoked.com/';

var instance = null;

function processingReady() {
	instance = Processing.getInstanceById('processing');
}

function onClickTrack() {
	var button = $(this);
	var trackid = button.data('trackid');
	$.get(SERVER + 'track/' + trackid, function(data) {
		data = JSON.parse(data);
		instance.draw(data);
	});
}

$(function() {
	$.get(SERVER + 'tracks', function(data) {
		data = JSON.parse(data);
		for (var i = 0; i < data.length; i++) {
			var button = $('<button>' + i + '</button>');
			button.data('trackid', data[i]);
			button.click(onClickTrack);
			$('body').append(button);
		}
	});
});

