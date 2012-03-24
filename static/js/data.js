var auth;
var authUserId;
var sessionPromise = $.Deferred();

var tracks = null;
var users = null;
var games = null;
var usersById = {};
var tracksById = {};
var gamesById = {};
var randomPjsColors = [];
function getRandomPjsColor() {
	var index = Math.pow(100, -Math.random());
	index = Math.floor(randomPjsColors.length * index);
	var value = randomPjsColors.splice(index, 1)[0];
	randomPjsColors.push(value);
	return value;
}

function clearHistoryState(replace) {
	var title = getHistoryTitle();
	if (title != 'friends') {
		if (replace) {
			History.replaceState(null, '', '?');
		}
		else {
			switchToTitle('friends');
		}
	}
}
function darken(color) {
	var intColor = 0;
	for (var i = 0; i < 3; i++) {
		intColor += Math.round(parseInt(color.substr(2*i, 2), 16) * 0.8) * Math.pow(256, 2 - i);
	}
	return intColor.toString(16);
}
function onLogin(data, forceProfile) {
	var deferred = $.Deferred();
	authUserId = data.auth;
	infoPromise.done(function() {
		var authUser = usersById[authUserId];
		$('.user-avatar').attr('src', authUser.avatarSrc);
		$('.user-name').text(authUser.name);
		var filters = [
			['user-color', 'color', '#' + authUser.color],
			['user-bottomcolor', 'borderBottomColor', '#' + authUser.color],
			['user-bgcolor', 'backgroundColor', '#' + authUser.color],
			['user-dark-bgcolor', 'backgroundColor', '#' + darken(authUser.color)] ];
		updateStyles(getStyleSheetById('style'), filters);

		if (forceProfile) {
			switchToTitle('you');
		}
		else {
			loadState();
		}
		deferred.resolve();
	});
	return deferred.promise();
}

function initSession() {
	auth = $.cookie('spokedAuth');
	if (auth) {
		$.get(SERVER + 'auth', {'username': auth}, function(data) {
			if (data.auth) {
				onLogin(data, false);
				sessionPromise.resolve();
			}
			else {
				$.cookie('spokedAuth', '');
				window.location.replace('login.html');
			}
		});
	}
	else {
		window.location.replace('login.html');
	}
}
function sessionLogout(e) {
	e.preventDefault();
	$.cookie('spokedAuth', '');
	window.location.replace('login.html');
}

function initData() {
	$.get(SERVER + 'info', {'auth': auth}, function(data) {
		tracks = data.tracks;
		users = data.users;
		games = data.games;
		for (var i = 0; i < games.length; i++) {
			var game = games[i];
			gamesById[game.id] = game;
		}
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			user.tracks = [];
			if (user.gameid) {
				user.game = gamesById[user.gameid];
			}
			user.lastWeekDist = user.thisWeekDist = 0;
			user.fortnightDuration = 0;
			user.slug = user.name.replace(' ', '').toLowerCase();
			user.pjsColor = 0xFF000000 + parseInt(user.color, 16);
			user.avatarSrc = 'img/avatar/' + user.slug + '.jpg';
			user.lastTrackEnd = 0;
			user.firstName = user.name.split(' ')[0];
			usersById[user.id] = user;
			randomPjsColors.push(user.pjsColor);
		}
		for (var i = 0; i < tracks.length; i++) {
			var track = tracks[i];
			track.isLastTrack = false;
			tracksById[track.id] = track;
			var userId = track.userid;
			if (userId) {
				var owner = usersById[userId];
				track.user = owner;
				owner.tracks.push(tracks[i]);
				if (lastWeek <= track.time && track.time < thisWeek) {
					owner.lastWeekDist += track.distance;
				}
				else if (thisWeek <= track.time) {
					owner.thisWeekDist += track.distance;
				}
				if (lastWeek <= track.time) {
					owner.fortnightDuration += track.duration;
				}
			}
		}
		for (var i = 0; i < users.length; i++) { // circle back now that users have tracks
			var user = users[i];
			if (user.tracks.length) {
				var lastTrack = user.tracks[user.tracks.length - 1];
				user.lastTrackEnd = lastTrack.time + lastTrack.duration;
				lastTrack.isLastTrack = true;
			}
		}
		infoPromise.resolve();
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
		query = {'auth': auth, 'ids': trackIdsToLoad.join(',')};
		$.get(SERVER + 'tracks', query, function(data) {
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

