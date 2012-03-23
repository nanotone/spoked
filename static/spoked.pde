
//GlOBAl VARIABlES
int latPos = 0;
int longPos = 1;
int timePos = 2;

float Nlat = 40.9188; //40.92
float Slat = 40.53; 
float Wlong = -74.0854;
float Elong = -73.7759; //-73.777

int tstamp;
int animatedSecondsPerFrame = 30;
int animatedFrameRate = 60;

/* Variablees for hover test
float endLongStop;
float endLatStop;
boolean endHover = false;
boolean locked = false;
float endPoints[][];*/

// a RideAnimation object contains all the data needed to represent the act
// of drawing an animated ride. This includes both the lat/lon points, and
// how far we are in the animation
class RideAnimation {
	float points[][];
	int color;
	boolean isLastRide;
	int n;
	RideAnimation(Object trackObj) {
		// N.B. trackObj is a JS object, and its properties are unfortunately
		// not documented anywhere. Please refer to the JS.
		points = trackObj.points;
		color = trackObj.user.pjsColor;
		isLastRide = trackObj.isLastTrack;

		if (!auth) { // auth is a JS global that is set if the user is logged in
			color = getRandomPjsColor();
		}
		n = 1;
	}
	int getSegmentTime() {
		return points[n][timePos];
	}
	void drawNextSegment() {
		beginShape();
		float longStart = map(points[n-1][longPos], Wlong, Elong, 0, width);
		float latStart = map(points[n-1][latPos], Nlat, Slat, 0, height);
		float longStop = map(points[n][longPos], Wlong, Elong, 0, width);
		float latStop = map(points[n][latPos], Nlat, Slat, 0, height);
		smooth();
		noFill();
		stroke(color);
		strokeWeight(3); 
		strokeJoin(ROUND);
		vertex(longStart, latStart);
		vertex(longStop, latStop);
		endShape();
		n += 1;
	}
	boolean isAtDestination() {
		return (n == points.length);
	}
	void drawDestination() {
		float[] lastPoint = points[points.length - 1];
		float longStop = map(lastPoint[longPos], Wlong, Elong, 0, width);
		float latStop = map(lastPoint[latPos], Nlat, Slat, 0, height);
		fill(color - 0x69000000); // handy math trick for making it more transparent
		//fill(color);
		noStroke();
		ellipse(longStop, latStop, 9, 9);
		
		if (isLastRide) {// YANG, THIS IS THE STYLE FOR THE LAST RIDE THAT IS INTERACTIVE
			//fill(255);
			fill(color - 0x69000000); 
			stroke(255);
			strokeWeight(2);
			ellipse(longStop, latStop, 15, 15);
		}
	}
}

// this stores all of our pending animations
// we don't know ahead of time how many there might be, so use ArrayList instead of Array
ArrayList rideAnimations = new ArrayList();

//SETUP
void setup() {
  size(1680, 2750);
  background(0, 0, 0, 0);
  noLoop();
  frameRate(animatedFrameRate);
  processingReady(); // tell JavaScript that Processing is done setting up
}


//DRAW
// This gets called once per frame when we're animating
void draw() {
	tstamp += animatedSecondsPerFrame;

	int earliestSegmentTime = 0;
	for (int i = 0; i < rideAnimations.size(); i++) { // loop through all rideAnimations
		RideAnimation ride = (RideAnimation) rideAnimations.get(i);

		// this helps us figure out when the earliest time segment was (will be useful later)
		int segmentTime = ride.getSegmentTime();
		if (earliestSegmentTime == 0 || segmentTime < earliestSegmentTime) {
			earliestSegmentTime = segmentTime;
		}
		// draw all segments that occurred in the elapsed time frame
		while (!ride.isAtDestination() && ride.getSegmentTime() <= tstamp) {
			ride.drawNextSegment();
		}
		// check if this ride animation has completed
		if (ride.isAtDestination()) {
			ride.drawDestination();

			/* Attempt to create hover
			endLongStop = longStop;
			endLatStop = latStop;
			if (mouseX > endLongStop && mouseY > endLatStop) {
				endHover = true;
			
				
 					ellipse(endLongStop, endLatStop, 40, 40);
				
			}	else {
				 	ellipse(endLongStop, endLatStop, 20, 20);
				 	endHover = false;
			}	
			*/
			
			// Remove this ride from the ArrayList of active animations
			// This is TRICKY! we must decrement the counter after removing.
			// Otherwise we will accidentally skip the next one!
			rideAnimations.remove(i);
			i -= 1;
		}
	}

	// if NO segments occurred in the elapsed time frame (e.g. it's nighttime)
	// then we skip ahead to the next earliest segment, and try drawing again.
	if (tstamp < earliestSegmentTime) {
		tstamp = earliestSegmentTime;
		draw();
	}
	else {
		processingUpdatedTime(tstamp);
		// if all ride animations have completed, stop the draw loop
		if (rideAnimations.size() == 0) {
			noLoop();
			processingFinishedAnimating();
		}
	}
}




//
// This function gets called by JavaScript whenever someone's name is clicked.
// myData is a large array of ride samples, each represented as [lat, long]
// index is just the index of the person so we can choose between 2 colors
//
void animateRides(Object[] trackObjs, startTime) {
	for (int i = 0; i < trackObjs.length; i++) {
		RideAnimation ride = new RideAnimation(trackObjs[i]);
		rideAnimations.add(ride);
	}
	tstamp = startTime;
	loop();
}

// This will stop all ride animations in their tracks, without erasing them.
void abortRideAnimations() {
	rideAnimations.clear();
	noLoop();
}

void drawRideImmediately(Object trackObj) {
	RideAnimation ride = new RideAnimation(trackObj);
	while (!ride.isAtDestination()) {
		ride.drawNextSegment();
	}
	ride.drawDestination();
}
