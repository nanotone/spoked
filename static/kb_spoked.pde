
//GlOBAl VARIABlES
int fieldNum = 4;
int latPos = 1;
int longPos =0;

float Nlat = 40.866383;
float Slat = 40.60171;
float Wlong = -74.30007;
float Elong = -73.686325;

String lines[];
String myData[][];

float latStart;
float longStart;
float latStop;
float longStop;
int diameter = 10;
float wpDistLong;
float wpDistLat;
int runCount = 0;


//SETUP
void setup() {
  size(1040,592);
  background(#FFFFEE);
  
  lines = loadStrings("kb_data.txt");
  myData = new String[lines.length][fieldNum];

  for (int i=0; i < lines.length; i++) {
    myData[i] = lines[i].split(",");
  }
}

//DRAW
void draw() {

  // Map projection Translation
  for (int n=1; n<lines.length; n++){
    float longStart = map(float(myData[n-1][latPos]), Wlong, Elong, 0, width);
    float latStart = map(float(myData[n-1][longPos]), Nlat, Slat, 0, height);
    float longStop = map(float(myData[n][latPos]), Wlong, Elong, 0, width);
    float latStop = map(float(myData[n][longPos]), Nlat, Slat, 0, height);
    
    float wpDistLong = (longStop - longStart); 
    float wpDistLat = (latStop - latStart); 
    
    // Draw line between points
    if(((wpDistLong >= -1) && (wpDistLong <= 1)) && ((wpDistLat >= -1) && (wpDistLat <= 1))) {
      smooth();
      stroke(255,0,0);
      strokeWeight(.1); 
      line(longStart, latStart, longStop, latStop);
    } 
      
      noLoop();

  } 
}









