var SERVER = 'http://dev.iamspoked.com/';

var instance = null;
var tracks = null;

function processingReady() {
	instance = Processing.getInstanceById('processing');
}

function showPortraits(users) {
	var template = $('#portrait-template');
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		var instance = template.clone().removeClass('template').attr('id', null).css({display: ''});
		var name = user.name;
		var slug = name.replace(' ', '').toLowerCase();
		var color = '#' + (user.color || '2dddd2');
		instance.find('.avatarLink').click(onClickA);
		instance.find('.avatar').attr('src', 'img/avatar/' + slug + '.jpg').css({borderColor: color});
		instance.find('.pop').css({backgroundColor: color});
		instance.find('.name').text(name);
		template.parent().append(instance);
	}
}

function onClickA(e) {
	e.preventDefault();
	var index = $(this).closest('li').index();
	$.get(SERVER + 'track/' + tracks[index].id, function(data) {
		instance.drawRide(JSON.parse(data), index);
	});
}

$(function() {
	$('.template').css({display: 'none'});
	$.get(SERVER + 'info', function(data) {
		data = JSON.parse(data);
		tracks = data.tracks;
		showPortraits(data.users);
	});
});

