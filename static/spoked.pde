
//GlOBAl VARIABlES
int latPos = 0;
int longPos = 1;

float Nlat = 40.92;
float Slat = 40.53; 
float Wlong = -74.0854;
float Elong = -73.777;

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
	int n;
	RideAnimation(float[][] ridePoints, int rideColor) {
		points = ridePoints;
		color = rideColor;
		n = 1;
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
		noStroke();
		ellipse(longStop, latStop, 12, 12);
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
  frameRate(300);
  processingReady(); // tell JavaScript that Processing is done setting up
}


//DRAW
// This gets called once per frame when we're animating
void draw() {
	for (int i = 0; i < rideAnimations.size(); i++) { // loop through all rideAnimations
		RideAnimation ride = (RideAnimation) rideAnimations.get(i);
		ride.drawNextSegment();
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

	// if all ride animations have completed, stop the draw loop
	if (rideAnimations.size() == 0) {
		//noLoop();
	}
}




//
// This function gets called by JavaScript whenever someone's name is clicked.
// myData is a large array of ride samples, each represented as [lat, long]
// index is just the index of the person so we can choose between 2 colors
//
void animateRide(Object trackObj, int color) {
	RideAnimation ride = new RideAnimation(trackObj.points, color);
	rideAnimations.add(ride);
	loop();
}

// This will stop all ride animations in their tracks, without erasing them.
void abortRideAnimations() {
	rideAnimations.clear();
	//noLoop();
}

void drawRideImmediately(Object trackObj, int color) {
	RideAnimation ride = new RideAnimation(trackObj.points, color);
	while (!ride.isAtDestination()) {
		ride.drawNextSegment();
	}
	ride.drawDestination();
}
