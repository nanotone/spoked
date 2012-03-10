var SERVER = 'http://dev.iamspoked.com/';

var instance = null;
var tracks = null;
var users = null;
var usersById = {};
var tracksById = {};
var infoPromise = $.Deferred();
var pdePromise = $.Deferred();
var initPromise = $.when(infoPromise, pdePromise);

var currentUser = null;

(function() {
	var day = 24 * 3600;
	var d = new Date();
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	var midnight = Math.floor(d.getTime() / 1000);
	window.thisWeek = midnight - (d.getDay() - 1) * day;
	window.lastWeek = thisWeek - 7 * day;
})();

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
		instance.data('userId', user.id);
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
function mapHandler(e) {
	e.preventDefault();
	var mapSelect = $(this).closest('.mapSelect');
	if (mapSelect.hasClass('selected')) {
		return;
	}
	$('.mapSelect.selected').removeClass('selected');
	mapSelect.addClass('selected');

	var $body = $('body');
   $body.removeClass('streets landsea blankcanvas beatenpaths hoods');
	$body.addClass(mapSelect.attr('id'));
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
		drawTracks(users);
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
		drawTracks([usersById[title.substr(0, 24)], usersById[title.substr(25)] ]);
		$('.compare').hide();
	}
}

function showProfile(user) {
	instance.abortRideAnimations();
	instance.background('#ffffff', 0);
	var compareDivs = $('.compare');
	compareDivs.show();
	for (var i = 0; i < compareDivs.length; i++) {
		if (compareDivs.eq(i).closest('.portrait').data('userId') == user.id) {
			compareDivs.eq(i).hide();
		}
	}
	drawTracks([user]);
}

var activeTrackCollection = {
	tracks: [],
	setTracks: function(tracks) {
		this.tracks = tracks;
	},
	drawImmediately: function() {
		instance.abortRideAnimations();
		instance.background('#ffffff', 0);
		for (var i = 0; i < this.tracks.length; i++) {
			instance.drawRideImmediately(this.tracks[i]);
		}
	},
	drawAnimated: function() {
		instance.abortRideAnimations();
		instance.background('#ffffff', 0);
		instance.animateRides(this.tracks, lastWeek);
	}
};

function drawTracks(users, callback) {
	var tracksToShow = [];
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		for (var j = 0; j < user.tracks.length; j++) {
			if (user.tracks[j].time > lastWeek) {
				tracksToShow.push(user.tracks[j]);
			}
		}
	}
	fetchTracks(tracksToShow).done(function() {
		activeTrackCollection.setTracks(tracksToShow);
		activeTrackCollection.drawImmediately();
	});
}
function fetchTracks(tracks) {
	var deferred = $.Deferred();
	var trackIdsToLoad = [];
	for (var i = 0; i < tracks.length; i++) {
		if (!tracks[i].points) {
			trackIdsToLoad.push(tracks[i].id);
		}
	}
	if (trackIdsToLoad.length) {
		$.get(SERVER + 'tracks?ids=' + trackIdsToLoad.join(','), function(data) {
			data = JSON.parse(data);
			for (var trackId in data) {
				tracksById[trackId].points = data[trackId];
			}
			deferred.resolve();
		});
	}
	else {
		deferred.resolve();
	}
	return deferred.promise();
}

function onClickPortrait(e) {
	e.preventDefault();
	var portrait = $(this).closest('.portrait');
	var userId = portrait.data('userId');
	History.pushState(null, '', '?' + userId);
}
function onClickCompare(e) {
	e.preventDefault();
	var portrait = $(this).closest('.portrait');
	History.pushState(null, '', '?' + currentUser.id + '-' + portrait.data('userId'));
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
			users[i].pjsColor = 0xFF000000 + parseInt(users[i].color, 16);
			usersById[users[i].id] = users[i];
		}
		for (var i = 0; i < tracks.length; i++) {
			tracksById[tracks[i].id] = tracks[i];
			var userId = tracks[i].userid;
			if (userId) {
				//console.log("userId = " + userId);
				usersById[userId].tracks.push(tracks[i]);
				tracks[i].user = usersById[userId];
			}
		}
		showPortraits();
		infoPromise.resolve();
	});
	$('.friendsLink').click(makeLinkHandler('friends'));
	$('.youLink').click(makeLinkHandler('you'));

	$('.mapSelect a').click(mapHandler);
	$('#streets a').eq(0).click(); // select streets as the default map

	$('#animate').click(function(e) {
		e.preventDefault();
		var $a = $(this);
		if ($a.hasClass('selected')) {
			$a.removeClass('selected');
			activeTrackCollection.drawImmediately();
		}
		else {
			$a.addClass('selected');
			activeTrackCollection.drawAnimated();
		}
	});

	History.Adapter.bind(window, 'statechange', loadState);
	
	// Tony doing crazy stuff
	$("#sidebar-btn-stats").click(function(e) {
		e.preventDefault();
		$sidebar = $("#sidebar");
			
		if($sidebar.hasClass("hidden")) {
			$sidebar.removeClass("hidden");
		} else {
			$sidebar.addClass("hidden");
		}
	});
});

