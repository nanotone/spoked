// Line Graph with Stacked Bar Chart
// ** need to get the data pulled from .csv working

float plotX1, plotY1;
float plotX2, plotY2;

String lines[];
String myData[][]; 

int fieldNum = 2; // how many pieces of data you have
int scaleFactor = -1; // use negative to get the rectangles to start at bottom and go up
int numLines = 15;


void setup() {
  size(400, 200);

  // corners of plot area
  // width of sidebar is 400, padding on each side = 10
  plotX1 = 10;
  plotX2 = width - plotX1;
  plotY1 = 10;
  plotY2 = height - plotY1;
  
  smooth();
  
  // load data from text file
  lines = loadStrings("data.txt"); 
  // get the lines length (four), determined by data AND get the fieldNum, set manually in global variables
  myData = new String[lines.length][fieldNum]; 
  for (int i=0; i < lines.length; i++) {
    // refer to data, take whatever is in lines
    myData[i] = lines[i].split(","); // for each of those lines split it at the comma
  }  
  
  // ** need to determine min and max values of data--- for the y-axis only, x-axis is fixed
    
}

void draw() {
  background(#EFECDE);
  // white box on plot area
  fill(255);
  rectMode(CORNERS);
  noStroke();
  rect(plotX1, plotY1, plotX2, plotY2); 
  
// ** need to draw vertical lines for days
// ** need to map vertex points to the canvas 
  
// --------- stacked bar chart for profile view ---------
      stroke(#DA1C5C);
      fill(#DA1C5C);
      rectMode(CORNERS);
      rect(12, 0, 23, 140);
      rect(37, 0, 48, 140);
      rect(62, 0, 73, 140);
      rect(87, 0, 98, 140);
  
 
// --------- line graph for comparison ---------
  for (int i=0; i < lines.length; i++) {
      beginShape();
      //point(float(myData[i][1])*scaleFactor, float(myData[i][2])*scaleFactor); // *scaleFactor not working
   
      // style of plot line
      strokeWeight(4);
      stroke(#F1B446);   
      noFill();    
      
      /////// test run without pulling from data set
      vertex(10, 14); // day 1
      vertex(35, 5);
      vertex(60, 9);
      vertex(85, 28);
      vertex(110, 8);
      vertex(135, 19);
      vertex(160, 22);
      vertex(185, 12);
      vertex(210, 2);
      vertex(235, 0);
      vertex(260, 5);
      vertex(285, 1);
      vertex(310, 8);
      vertex(335, 4); // day 14

      endShape();
      noLoop();
  } 

}


/*
  for (int i=0; i < lines.length; i++) {
    
    //point(float(myData[i][1])*scaleFactor, float(myData[i][2])*scaleFactor);
  
    float x = plotX1;
    for(x = plotX1; x < plotX2; x += 20){
      //float value = myData[n][dayMiles];
      //float y = 50;
      //float y2 = 70;
      beginShape();
      point(x, float(myData[i][2]));  
      //vertex(x, 70);
      endShape(); 
      //println(x); // x is incrementing by 20 
      println(float(myData[i][2]));  
      }    
  } 
*/
