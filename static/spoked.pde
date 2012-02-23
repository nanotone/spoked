
//GlOBAl VARIABlES
int latPos = 1;
int longPos =0;

float Nlat = 40.866383;
float Slat = 40.60171;
float Wlong = -74.30007;
float Elong = -73.686325;

//SETUP
void setup() {
  size(1040,592);
  background(#FFFFEE);
  noLoop();
  processingReady();
}

//DRAW
void draw(myData) {

  // Map projection Translation
  if (myData == null) { return; }
  for (int n=1; n<myData.length; n++){
    float longStart = map(myData[n-1][latPos], Wlong, Elong, 0, width);
    float latStart = map(myData[n-1][longPos], Nlat, Slat, 0, height);
    float longStop = map(myData[n][latPos], Wlong, Elong, 0, width);
    float latStop = map(myData[n][longPos], Nlat, Slat, 0, height);
    
    float wpDistLong = (longStop - longStart); 
    float wpDistLat = (latStop - latStart); 
    
    // Draw line between points
    if(((wpDistLong >= -1) && (wpDistLong <= 1)) && ((wpDistLat >= -1) && (wpDistLat <= 1))) {
      smooth();
      stroke(255,0,0);
      strokeWeight(.1); 
      line(longStart, latStart, longStop, latStop);
    } 
  } 
}
