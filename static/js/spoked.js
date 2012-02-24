var SERVER = 'http://dev.iamspoked.com/';

var instance = null;
var tracks = null;

function processingReady() {
	instance = Processing.getInstanceById('processing');
}

function onClickTrack() {
	var button = $(this);
	var trackid = button.data('trackid');
	$.get(SERVER + 'track/' + trackid, function(data) {
		data = JSON.parse(data);
		instance.drawRide(data);
	});
}

function onClickA(e) {
	e.preventDefault();
	var index = $(this).closest('li').index();
	$.get(SERVER + 'track/' + tracks[index], function(data) {
		instance.drawRide(JSON.parse(data), index);
	});
}

$(function() {
	$.get(SERVER + 'tracks', function(data) {
		tracks = JSON.parse(data);
	});
	$('#portrait-nav a').click(onClickA);
});

