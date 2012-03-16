var SERVER = 'http://dev.iamspoked.com/';

var auth;
var authUserId;

var tracks = null;
var users = null;
var usersById = {};
var tracksById = {};
var randomPjsColors = [];
function getRandomPjsColor() {
	var index = Math.pow(100, -Math.random());
	index = Math.floor(randomPjsColors.length * index);
	var value = randomPjsColors.splice(index, 1)[0];
	randomPjsColors.push(value);
	return value;
}

var sessionPromise = $.Deferred();

function clearHistoryState(replace) {
	var title = getHistoryTitle();
	if (title != 'friends') {
		if (replace) {
			History.replaceState(null, '', '?');
		}
		else {
			History.pushState(null, '', '?');
		}
	}
}
function getAuth() {
	return $.cookie('spokedAuth') || '';
}
function setAuth(value) {
	auth = value;
	$.cookie('spokedAuth', auth);
}
function onLogin(data, forceProfile) {
	var deferred = $.Deferred();

	setAuth(data.auth);
	authUserId = data.userid;
	$('.guest').hide();
	$('.wrong-login').hide();
	$('.auth').show();
	infoPromise.done(function() {
		var authUser = usersById[authUserId];
		$('.user-avatar').attr('src', authUser.avatarSrc);
		$('.user-name').text(authUser.name);
		if (forceProfile) {
			History.pushState(null, '', '?you');
		}
		else {
			loadState();
		}
		deferred.resolve();
	});
	return deferred.promise();
}

function initSession() {
	auth = getAuth();
	if (auth) {
		$.get(SERVER + 'auth', {'username': auth}, function(data) {
			if (data.auth) {
				onLogin(data, false);
			}
			else {
				setAuth(data.auth);
				console.log("not logged in");
				clearHistoryState(true);
			}
			sessionPromise.resolve();
		});
	}
	else {
		clearHistoryState(true);
		sessionPromise.resolve();
	}
}
function sessionLogin(e) {
	e.preventDefault();
	$form = $(this);
	var query = {'username': $form.find('.username').val(),
	             'password': $form.find('.password').val()};
	$.get(SERVER + 'auth', query, function(data) {
		if (data.auth) {
			onLogin(data, true);
		}
		else {
			$('.wrong-login').show();
		}
	});
}
function sessionLogout(e) {
	e.preventDefault();
	setAuth('');
	$('.auth').hide();
	$('#login-form').hide();
	$('#login-form .username').val('');
	$('#login-form .password').val('');
	$('.guest').show();

	var title = getHistoryTitle();
	if (title != 'friends') {
		History.pushState(null, '', '?');
	}
	else {
		loadState(); // refresh so we only see latest, and color-scrambled
	}
}

function initData() {
	$.get(SERVER + 'info', {'auth': auth}, function(data) {
		tracks = data.tracks;
		users = data.users;
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			user.tracks = [];
			user.lastWeekDist = user.thisWeekDist = 0;
			user.fortnightDuration = 0;
			user.slug = user.name.replace(' ', '').toLowerCase();
			user.pjsColor = 0xFF000000 + parseInt(user.color, 16);
			user.avatarSrc = 'img/avatar/' + user.slug + '.jpg';
			usersById[user.id] = user;
			randomPjsColors.push(user.pjsColor);
		}
		for (var i = 0; i < tracks.length; i++) {
			var track = tracks[i];
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

