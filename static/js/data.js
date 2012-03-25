function initData() {
	var promise = $.when(initSession(), initInfo());
	promise.done(initUser);
	return promise;
}

////////////////////////////////////////////////////////////////////////////////

var auth;
var authUserId;

function initSession() {
	var deferred = $.Deferred();
	auth = $.cookie('spokedAuth');
	if (auth) {
		$.get(SERVER + 'auth', {'username': auth}, function(data) {
			if (data.auth) {
				authUserId = data.auth;
				deferred.resolve();
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
	return deferred.promise()
}

////////////////////////////////////////////////////////////////////////////////

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

function initInfo() {
	var deferred = $.Deferred();
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
		}
		deferred.resolve();
	});
	return deferred.promise();
}

////////////////////////////////////////////////////////////////////////////////

var gameState = ''
var userGame = null;

function initUser() {
	console.log("initUser");
	var authUser = usersById[authUserId];
	$('.user-avatar').attr('src', authUser.avatarSrc);
	$('.user-name').text(authUser.name);
	var filters = [
		['user-color', 'color', '#' + authUser.color],
		['user-bottomcolor', 'borderBottomColor', '#' + authUser.color],
		['user-bgcolor', 'backgroundColor', '#' + authUser.color],
		['user-dark-bgcolor', 'backgroundColor', '#' + darken(authUser.color)] ];
	$(function() {
		updateStyles(getStyleSheetById('style'), filters);
	});

	userGame = usersById[authUserId].game;
	if (userGame) {
		if      (getTime() < userGame.start) { gameState = 'before'; }
		else if (getTime() < userGame.stop ) { gameState = 'during'; }
		else                                 { gameState = 'after' ; }
		gameUsers = [];
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			if (user.game == userGame) {
				gameUsers.push(user);
			}
		}
		users = gameUsers;
		var gameTracks = [];
		for (var i = 0; i < tracks.length; i++) {
			var track = tracks[i];
			if (userGame.start < track.time && track.time+track.duration < userGame.stop) {
				gameTracks.push(track);
			}
		}
		tracks = gameTracks;
	}

	for (var i = 0; i < tracks.length; i++) {
		var track = tracks[i];
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
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		if (user.tracks.length) {
			var lastTrack = user.tracks[user.tracks.length - 1];
			user.lastTrackEnd = lastTrack.time + lastTrack.duration;
			lastTrack.isLastTrack = true;
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

////////////////////////////////////////////////////////////////////////////////

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


function sessionLogout(e) {
	e.preventDefault();
	$.cookie('spokedAuth', '');
	window.location.replace('login.html');
}

