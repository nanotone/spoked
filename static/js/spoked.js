var SERVER = 'http://dev.iamspoked.com/';

var instance = null;
var tracks = null;
var users = null;
var usersById = {};
var infoPromise = $.Deferred();
var pdePromise = $.Deferred();
var initPromise = $.when(infoPromise, pdePromise);

var currentUser = null;

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
		instance.find('.compare a').click(onClickCompare);
		instance.find('.profileLink').click(onClickPortrait);
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
			History.pushState(null, '', '?' + title);
		}
	};
}
function loadState() {
	if (!initPromise.isResolved()) { return; }
	var parts = History.getState().url.split('?');
	var title = (parts.length > 1 ? parts[1] : '');
	if (title == '' && window.location.search.length > 1) {
		title = window.location.search.substr(1);
	}
	console.log("loadState " + title);
	$('.selectedLink').removeClass('selectedLink');
	currentUser = null;
	if (title == '' || title == 'friends') {
		$('.friendsLink').closest('li').addClass('selectedLink');
		instance.abortRideAnimations();
		instance.background('#ffffff', 0);
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			console.log("drawing last ride for " + user.name);
			getTrack(user, function(trackData, userColor) {
				instance.drawRide(trackData, userColor);
			});
		}
		$('.compare').hide();
	}
	else if (title == 'you') {
		$('.youLink').closest('li').addClass('selectedLink');
		currentUser = users[0];
		showProfile(currentUser);
	}
	else if (title.length == 24) {
		currentUser = usersById[title];
		showProfile(currentUser);
	}
	else if (title.length == 49) {
		instance.abortRideAnimations();
		instance.background('#ffffff', 0);
		getTrack(usersById[title.substr(0, 24)], function(trackData, userColor) {
			instance.drawRide(trackData, userColor);
		});
		getTrack(usersById[title.substr(25)], function(trackData, userColor) {
			instance.drawRide(trackData, userColor);
		});
		$('.compare').hide();
	}
}

function showProfile(user) {
	instance.abortRideAnimations();
	instance.background('#ffffff', 0);
	getTrack(user, function(trackData, userColor) {
		instance.drawRide(trackData, userColor);
	});
	var compareDivs = $('.compare');
	compareDivs.show();
	for (var i = 0; i < compareDivs.length; i++) {
		if (compareDivs.eq(i).closest('.portrait').data('userid') == user.id) {
			compareDivs.eq(i).hide();
		}
	}
}

function getTrack(user, callback) {
	var userTracks = user.tracks;
	var color = 0xFF000000 + parseInt(user.color, 16);

	$.get(SERVER + 'track/' + userTracks[userTracks.length - 1].id, function(data) {
		callback(JSON.parse(data), color);
	});
}

function onClickPortrait(e) {
	e.preventDefault();
	var portrait = $(this).closest('.portrait');
	var userid = portrait.data('userid');
	History.pushState(null, '', '?' + userid);
}
function onClickCompare(e) {
	e.preventDefault();
	var portrait = $(this).closest('.portrait');
	History.pushState(null, '', '?' + currentUser.id + '-' + portrait.data('userid'));
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
	
	// Tony doing crazy stuff
	$("#sidebar-btn-stats").click(
		function(event) {
			event.preventDefault();
			
			$sidebar = $("#sidebar");
			
			if($sidebar.hasClass("hidden")) {
				$sidebar.removeClass("hidden");
			} else {
				$sidebar.addClass("hidden");
			}
			
		}
	)

	$("#landandsea").click(
		function(event) {
			event.preventDefault();
			
			$body = $("body");
			
			if(!$body.hasClass("landandsea")) {
				$body.removeClass("blankcanvas beatenpaths hoods");
				$body.addClass("landandsea");
			}
			
		}
	)

	$("#beatenpaths").click(
		function(event) {
			event.preventDefault();
			
			$body = $("body");
			
			if(!$body.hasClass("beatenpaths")) {
				$body.removeClass("landandsea blankcanvas hoods");
				$body.addClass("beatenpaths");
			}
			
		}
	)

	$("#blankcanvas").click(
		function(event) {
			event.preventDefault();
			
			$body = $("body");
			
			if(!$body.hasClass("blankcanvas")) {
				$body.removeClass("landandsea beatenpaths hoods");
				$body.addClass("blankcanvas");
			}
			
		}
	)

	$("#hoods").click(
		function(event) {
			event.preventDefault();
			
			$body = $("body");
			
			if(!$body.hasClass("hoods")) {
				$body.removeClass("landandsea beatenpaths blankcanvas");
				$body.addClass("hoods");
			}
			
		}
	)
});

