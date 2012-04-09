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
		$.getJSON(SERVER + 'auth', {'username': auth}, function(data) {
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
	$.getJSON(SERVER + 'gameinfo', {'auth': auth}, function(data) {
		tracks = data.tracks;
		users = data.users;
		games = data.games;
		games.sort(function(a, b) { return a.start - b.start; }); // earliest first
		for (var i = 0; i < games.length; i++) {
			var game = games[i];
			gamesById[game.id] = game;
			if      (getTime() < game.start) { game.state = 'before'; }
			else if (getTime() < game.stop ) { game.state = 'during'; }
			else                             { game.state = 'after' ; }
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

function initUser() {
	console.log("initUser");
	var authUser = usersById[authUserId];
	$(function() {
		$('.user-avatar').attr('src', authUser.avatarSrc);
		$('.user-name').text(authUser.name);
		var filters = [
			['user-color', 'color', '#' + authUser.color],
			['user-bottomcolor', 'borderBottomColor', '#' + authUser.color],
			['user-bgcolor', 'backgroundColor', '#' + authUser.color],
			['user-dark-bgcolor', 'backgroundColor', '#' + darken(authUser.color)],
			['user-lite-bgcolor', 'backgroundColor', '#' + lighten(authUser.color)] ];
		updateStyles(getStyleSheetById('style'), filters);
	});

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


function initGame(game) {
	console.log("initGame " + game.id);
	game.days = [];
	var d = new Date(game.start * 1000); // let js Date handle all tz yuckiness
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	while (true) {
		var start = d.getTime() / 1000;
		if (start >= game.stop) { break; }
		var day = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()];
		d.setDate(d.getDate() + 1);
		game.days.push({'start': start, 'stop': d.getTime() / 1000, 'day': day});
	}
	game.week1 = game.days[0].start;
	game.week2 = game.week1 + 7 * 86400;
	game.week3 = game.week2 + 7 * 86400;

	var startDate = new Date(game.start * 1000);
	var stopDate = new Date((game.stop - 3) * 1000);
	var startFmt = formatDay(startDate);
	if (startDate.getYear() != stopDate.getYear()) {
		startFmt += " " + startDate.getFullYear();
	}
	game.humanDuration = startFmt + " - " + formatDay(stopDate) + " " + stopDate.getFullYear();
}

function aggregateGameTrackData(game) {
	console.log("aggregateGameTrackData");
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		user.lastWeekSmiles = user.thisWeekSmiles = user.totalDist = user.totalSmiles = 0;
		user.smilesByWeek = [0, 0, 0];
		user.gameDays = [];
		var trackIndex = 0;
		for (; trackIndex < user.tracks.length && user.tracks[trackIndex].time < game.days[0].start; trackIndex++);
		for (var j = 0; j < game.days.length; j++) {
			var gameDay = game.days[j];
			var userGameDay = {'distance': 0, 'buildup': false, 'ss': false};
			for (; trackIndex < user.tracks.length && user.tracks[trackIndex].time < gameDay.stop; trackIndex++) {
				userGameDay.distance += user.tracks[trackIndex].distance;
			}
			if (userGameDay.distance > 0) {
				if (user.gameDays.length >= 2 && user.gameDays[user.gameDays.length - 2].buildup &&
				                                 user.gameDays[user.gameDays.length - 1].buildup) {
					userGameDay.ss = true;
				}
				else {
					userGameDay.buildup = true;
				}
			}
			var smiles = userGameDay.distance * (userGameDay.ss ? 2 : 1);
			if (lastWeek <= gameDay.start) {
				var field = (gameDay.start < thisWeek ? 'last' : 'this') + 'WeekSmiles';
				user[field] += smiles;
			}
			user.smilesByWeek[Math.floor(j / 7)] += smiles;
			user.totalSmiles += smiles;
			user.totalDist += userGameDay.distance;

			user.gameDays.push(userGameDay);
		}
	}
}

function isUserInGame(user, game) {
	for (var i = 0; i < game.players.length; i++) {
		if (game.players[i].userid == user.id) { return true; }
	}
	return false;
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
		$.getJSON(SERVER + 'tracks', query, function(data) {
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

