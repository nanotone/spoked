var SERVER = 'http://dev.iamspoked.com/';

var tracks = null;
var users = null;
var usersById = {};
var tracksById = {};

function initData() {
	$.get(SERVER + 'info', function(data) {
		tracks = data.tracks;
		users = data.users;
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			user.tracks = [];
			user.lastWeekDist = user.thisWeekDist = 0;
			user.slug = user.name.replace(' ', '').toLowerCase();
			user.pjsColor = 0xFF000000 + parseInt(user.color, 16);
			usersById[user.id] = user;
		}
		for (var i = 0; i < tracks.length; i++) {
			var track = tracks[i];
			tracksById[track.id] = track;
			var userId = track.userid;
			if (userId) {
				var owner = usersById[userId];
				track.user = owner;
				owner.tracks.push(tracks[i]);
				owner[(track.time < thisWeek ? 'last':'this') + 'WeekDist'] += track.distance;
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
		$.get(SERVER + 'tracks?ids=' + trackIdsToLoad.join(','), function(data) {
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

