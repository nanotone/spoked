var SERVER = 'http://dev.iamspoked.com/';

var instance = null;
var tracks = null;

function processingReady() {
	instance = Processing.getInstanceById('processing');
}

function onClickA(e) {
	e.preventDefault();
	var index = $(this).closest('li').index();
	$.get(SERVER + 'track/' + tracks[index].id, function(data) {
		instance.drawRide(JSON.parse(data), index);
	});
}

$(function() {
	$.get(SERVER + 'info', function(data) {
		tracks = JSON.parse(data).tracks;
	});
	$('#portrait-nav a').click(onClickA);
});

