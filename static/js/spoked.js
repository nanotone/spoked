var SERVER = 'http://dev.iamspoked.com/';

var instance = null;
var tracks = null;
var users = null;
var usersById = {};
var infoPromise = $.Deferred();
var pdePromise = $.Deferred();
var initPromise = $.when(infoPromise, pdePromise);

function processingReady() {
	instance = Processing.getInstanceById('processing');
	pdePromise.resolve();
}

function showPortraits() {
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

function makeLinkHandler(title) {
	return function(e) {
		e.preventDefault();
		if (title != History.getState().title) {
			History.pushState(null, title, '?' + title);
		}
	};
}
function loadState() {
	if (!initPromise.isResolved()) { return; }
	var title = History.getState().title;
	console.log("loadState " + title);
	$('.selectedLink').removeClass('selectedLink');
	if (title == '' || title == 'friends') {
		$('.friendsLink').closest('li').addClass('selectedLink');
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			var userTracks = user.tracks;
			console.log("drawing last ride for " + user.name + ": " + userTracks[userTracks.length - 1].id);
			$.get(SERVER + 'track/' + userTracks[userTracks.length - 1].id, function(data) {
				instance.drawRide(JSON.parse(data), 0);
			});
		}
	}
	else if (title == 'you') {
		$('.youLink').closest('li').addClass('selectedLink');
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
	infoPromise.done(loadState);
	$.get(SERVER + 'info', function(data) {
		data = JSON.parse(data);
		tracks = data.tracks;
		users = data.users;
		for (var i = 0; i < users.length; i++) {
			users[i].tracks = [];
			usersById[users[i].id] = users[i];
		}
		for (var i = 0; i < tracks.length; i++) {
			var userid = tracks[i].userid;
			if (userid) {
				//console.log("userid = " + userid);
				usersById[userid].tracks.push(tracks[i]);
			}
		}
		showPortraits();
		infoPromise.resolve();
	});
	$('.friendsLink').click(makeLinkHandler('friends'));
	$('.youLink').click(makeLinkHandler('you'));
	History.Adapter.bind(window, 'statechange', loadState);
});

