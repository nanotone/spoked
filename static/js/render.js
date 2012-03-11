var rideCanvas = {
	minTime: lastWeek,
	maxTime: getTime(),
	users: [],
	tracks: [],
	update: function(options) {
		for (var key in options) {
			this[key] = options[key];
		}
		this.tracks = [];
		for (var i = 0; i < this.users.length; i++) {
			var user = this.users[i];
			for (var j = 0; j < user.tracks.length; j++) {
				var track = user.tracks[j];
				if (this.minTime < track.time && track.time < this.maxTime) {
					this.tracks.push(track);
				}
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
			instance.animateRides(this.tracks, lastWeek);
		}
		else {
			var self = this;
			var i = 0;
			var drawFrame = function() {
				self.drawFrameTimeout = null;
				var begin = getTime();
				while (i < self.tracks.length && getTime() - begin < 0.05) {
					instance.drawRideImmediately(self.tracks[i]);
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
		instance.abortRideAnimations();
		instance.background('#ffffff', 0);
		this.draw($('#animate').hasClass('selected'));
	}
};
