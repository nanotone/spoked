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
		instance.data('userid', user.id);
		instance.find('.avatarLink').click(onClickPortrait);
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
	if (title == '' && window.location.search.length > 1) {
		title = window.location.search.substr(1);
	}
	console.log("loadState " + title);
	$('.selectedLink').removeClass('selectedLink');
	if (title == '' || title == 'friends') {
		$('.friendsLink').closest('li').addClass('selectedLink');
		instance.abortRideAnimations();
		instance.background('#ffffff', 0);
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			var userTracks = user.tracks;
			console.log("drawing last ride for " + user.name + ": " + userTracks[userTracks.length - 1].id);
			getTrack(userTracks[userTracks.length - 1].id, function(trackData) {
				instance.drawRide(trackData, 0);
			});
		}
	}
	else if (title == 'you') {
		$('.youLink').closest('li').addClass('selectedLink');
		instance.abortRideAnimations();
		instance.background('#ffffff', 0);
		var userTracks = users[0].tracks;
		getTrack(userTracks[userTracks.length - 1].id, function(trackData) {
			instance.drawRide(trackData, 0);
		});
	}
	else if (title.length == 24) {
		instance.abortRideAnimations();
		instance.background('#ffffff', 0);
		var userTracks = usersById[title].tracks;
		getTrack(userTracks[userTracks.length - 1].id, function(trackData) {
			instance.drawRide(trackData, 0);
		});
	}
}

function getTrack(trackId, callback) {
	$.get(SERVER + 'track/' + trackId, function(data) {
		callback(JSON.parse(data));
	});
}

function onClickPortrait(e) {
	e.preventDefault();
	var portrait = $(this).closest('.portrait');
	var userid = portrait.data('userid');
	History.pushState(null, userid, '?' + userid);
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

