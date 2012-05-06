function initData() {
	var promise = $.when(initSession(), initInfo());
	promise.done(initUser);
	return promise;
}

////////////////////////////////////////////////////////////////////////////////

var auth;
var authUserId;
var demoMode = false;

function initSession() {
	var deferred = $.Deferred();
	if (window.unpickleState && window.getHistoryTitle) {
		var state = unpickleState(getHistoryTitle());
		if (state.mode == 'demo') {
			demoMode = true;
			auth = authUserId = state.guestId;
			deferred.resolve();
			return deferred.promise();
		}
	}
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
	var args = {'auth': auth};
	if (demoMode) {
		args = {'userid': authUserId, 'gameid': unpickleState(getHistoryTitle()).game};
	}
	$.getJSON(SERVER + 'gameinfo', args, function(data) {
		if (demoMode) {
			setRealTime(data.games[0].start + 7*86400);
			for (var i = 0; i < data.tracks.length; i++) {
				if (data.tracks[i].time + data.tracks[i].duration > demoTime) {
					data.tracks.splice(i, 1);
					i -= 1;
				}
			}
		}
		tracks = data.tracks;
		tracks.sort(function(a, b) { return a.time - b.time; });
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

	game.humanDuration = formatDuration(game.start, game.stop - 3);
}

function aggregateGameTrackData(game) {
	console.log("aggregateGameTrackData");
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		user.lastWeekSmiles = user.thisWeekSmiles = user.totalDist = user.totalSmiles = 0;
		user.smilesByWeek = [0, 0, 0];
		user.durationByWeek = [0, 0, 0];
		user.gameDays = [];
		var trackIndex = 0;
		for (; trackIndex < user.tracks.length && user.tracks[trackIndex].time < game.days[0].start; trackIndex++);
		for (var j = 0; j < game.days.length; j++) {
			var gameDay = game.days[j];
			var userGameDay = {'distance': 0, 'buildup': false, 'ss': false};
			var dayDuration = 0;
			for (; trackIndex < user.tracks.length && user.tracks[trackIndex].time < gameDay.stop; trackIndex++) {
				userGameDay.distance += user.tracks[trackIndex].distance;
				dayDuration += user.tracks[trackIndex].duration;
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
			user.durationByWeek[Math.floor(j / 7)] += dayDuration;
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
		$.post(SERVER + 'tracks', query, function(data) {
			for (var trackId in data) {
				tracksById[trackId].points = data[trackId];
			}
			deferred.resolve();
		}, 'json');
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

////////////////////////////////////////////////////////////////////////////////

function setGamesMenu(activeGame, makeGameHandler) {
	$('.game-name').text(activeGame ? activeGame.name : 'Game Archive');
	$('.game-archive')[activeGame ? 'show' : 'hide']();

	var template = $('#other-game-template');
	$('.other-game:not(.template)').remove();
	for (var i = 0; i < games.length; i++) {
		var otherGame = games[i];
		if (otherGame.stop < getTime()) { continue; }
		if (otherGame == activeGame) { continue; }
		var $instance = template.clone().removeClass('template').attr('id', null).css({display: ''});
		$instance.text(otherGame.name);
		$instance.click(makeGameHandler(otherGame));
		$instance.insertAfter($('.other-game').last());
	}
}
