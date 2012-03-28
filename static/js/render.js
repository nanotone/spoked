var mapPde = null;
var pdeDeferred = $.Deferred();

function initRender() {
	return pdeDeferred.promise();
}

function processingReady() {
	setTimeout(function() {
		mapPde = Processing.getInstanceById('processing');
		pdeDeferred.resolve();
	}, 0); // wait for Processing:setup to really finish
}

var rideCanvas = {
	minTime: lastWeek,
	maxTime: getTime(),
	users: [],
	tracks: [],
	clear: function() {
		mapPde.abortRideAnimations();
		mapPde.background('#ffffff', 0);
	},
	update: function(options) {
		for (var key in options) {
			this[key] = options[key];
		}
		this.tracks = [];
		for (var i = 0; i < this.users.length; i++) {
			var user = this.users[i];
			var userTracks = user.tracks;
			if (auth) {
				for (var j = 0; j < userTracks.length; j++) {
					var track = userTracks[j];
					if (this.minTime < track.time && track.time < this.maxTime) {
						this.tracks.push(track);
					}
				}
			}
			else if (userTracks.length) { // guests can only see latest tracks
				this.tracks.push(userTracks[userTracks.length - 1]);
			}
		}
		fetchTracks(this.tracks).done(function() {
			rideCanvas.redraw();
		});
	},
	draw: function(animated) {
		if (animated) {
			if (this.drawFrameTimeout) {
				clearTimeout(this.drawFrameTimeout);
			}
			mapPde.animateRides(this.tracks, lastWeek);
		}
		else {
			var self = this;
			var i = 0;
			this.tracks.sort(function(a, b) { return a.time - b.time; });
			var drawFrame = function() {
				self.drawFrameTimeout = null;
				var begin = getTime();
				while (i < self.tracks.length && getTime() - begin < 0.05) {
					mapPde.drawRideImmediately(self.tracks[i]);
					i++;
				}
				if (i < self.tracks.length) {
					self.drawFrameTimeout = setTimeout(drawFrame, 0);
				}
			};
			drawFrame();
		}
	},
	redraw: function() {
		this.clear();
		this.draw($('#animate').hasClass('selected'));
	}
};
