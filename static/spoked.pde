
//GlOBAl VARIABlES
int latPos = 0;
int longPos = 1;

float Nlat = 40.92;
float Slat = 40.53; 
float Wlong = -74.0854;
float Elong = -73.777;

// a RideAnimation object contains all the data needed to represent the act
// of drawing an animated ride. This includes both the lat/lon points, and
// how far we are in the animation
class RideAnimation {
	float points[][];
	int n;
	RideAnimation(float[][] ridePoints) {
		points = ridePoints;
		n = 1;
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

		beginShape();

		float longStart = map(ride.points[ride.n-1][longPos], Wlong, Elong, 0, width);
		float latStart = map(ride.points[ride.n-1][latPos], Nlat, Slat, 0, height);
		float longStop = map(ride.points[ride.n][longPos], Wlong, Elong, 0, width);
		float latStop = map(ride.points[ride.n][latPos], Nlat, Slat, 0, height);

		smooth();
		noFill();
		stroke(139, 176, 73); //green. magenta: 242,29,85 yellow: 244,203,28
		strokeWeight(3); 
		strokeJoin(ROUND);
		vertex(longStart, latStart);
		vertex(longStop, latStop);
		endShape();

		ride.n += 1;
		// check if this ride animation has completed
		if (ride.n == ride.points.length) {
			fill(139, 176, 73, 150);
			noStroke();
			ellipse(longStop, latStop, 12, 12);

			// Remove this ride animation from the ArrayList
			// This is TRICKY! we must decrement the counter when removing.
			// Otherwise we will accidentally skip the next one!
			rideAnimations.remove(i);
			i -= 1;
		}
	}

	// if all ride animations have completed, stop the draw loop
	if (rideAnimations.size() == 0) {
		noLoop();
	}
}


//
// This function gets called by JavaScript whenever someone's name is clicked.
// myData is a large array of ride samples, each represented as [lat, long]
// index is just the index of the person so we can choose between 2 colors
//
void drawRide(myData, index) {
	RideAnimation ride = new RideAnimation(myData);
	rideAnimations.add(ride);
	loop();
}
