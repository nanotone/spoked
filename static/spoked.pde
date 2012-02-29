
//GlOBAl VARIABlES
int latPos = 0;
int longPos = 1;

float Nlat = 40.92;
float Slat = 40.53; 
float Wlong = -74.0854;
float Elong = -73.777;

//SETUP
void setup() {
  size(1680, 2750);
  background(0, 0, 0, 0);
  noLoop();
  processingReady(); // tell JavaScript that Processing is done setting up
}


//DRAW
// Because of noLoop, this only gets called once
void draw() {
   PImage baseMap;
   baseMap = loadImage("map.png");
   image(baseMap, 0, 0, width, height);
}


//
// This function gets called by JavaScript whenever someone's name is clicked.
// myData is a large array of ride samples, each represented as [lat, long]
// index is just the index of the person so we can choose between 2 colors
//
void drawRide(myData, index) {

  // Map projection Translation
  beginShape();
  boolean penDown = true;

  for (int n=1; n<myData.length; n++){
    float longStart = map(myData[n-1][longPos], Wlong, Elong, 0, width);
    float latStart = map(myData[n-1][latPos], Nlat, Slat, 0, height);
    float longStop = map(myData[n][longPos], Wlong, Elong, 0, width);
    float latStop = map(myData[n][latPos], Nlat, Slat, 0, height);
    
    float wpDistLong = (longStop - longStart); 
    float wpDistLat = (latStop - latStart); 

    smooth();
    noFill();
    if (index % 2 == 0) {
      stroke(139, 176, 73); //green. magenta: 242,29,85 yellow: 244,203,28
    }
    else {
      stroke(139, 176, 73); 
    }
    strokeWeight(3); 
    strokeJoin(ROUND);
    
    // Draw line between points
    if(((wpDistLong >= -3) && (wpDistLong <= 3)) && ((wpDistLat >= -3) && (wpDistLat <= 3))) {
      if (!penDown) { // Is pen down?
        beginShape(); // If it is not, put it down
        penDown = true;
      }
      vertex(longStop, latStop);

    } else { // If it is NOT close...

      endShape();
      penDown = false;

    }
  } 
  endShape();

}
