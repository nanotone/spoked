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
			user.fortnightDuration = 0;
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

