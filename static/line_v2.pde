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
  plotX1 = 0;
  plotX2 = width - plotX1;
  plotY1 = 0;
  plotY2 = height - plotY1;
  
  smooth();
  
  // ** need to determine min and max values of data--- for the y-axis only, x-axis is fixed
    
}

void draw() {
  background(#EFECDE);
  // white box on plot area
  fill(255, 255, 255, 5);
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
      beginShape();
   
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
