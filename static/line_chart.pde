// max ceiling of data
// put our data in


FloatTable data;
float dataMin, dataMax;

float plotX1, plotY1;
float plotX2, plotY2;

int yearMin, yearMax;
int[] years;


void setup() {
  size(400, 200);
  
  data = new FloatTable("day_miles.tsv");

  years = int(data.getRowNames());
  yearMin = years[0];
  yearMax = years[years.length -1];
  
  dataMin = 0;
  dataMax = data.getTableMax(); 
  
  // corners of the plotted time series
  plotX1 = 10;
  plotX2 = width - plotX1;
  plotY1 = 10;
  plotY2 = height - plotY1;
  
  smooth();
}

void draw() {
  background(#EFECDE);
  //white box on plot area
  fill(255, 255, 255);
  rectMode(CORNERS);
  noStroke();
  rect(plotX1, plotY1, plotX2, plotY2); 
  
  strokeWeight(5);
  // draw data for first column
  stroke(#F1B446);
  drawDataLine(0); 
}

void drawDataLine(int col) {
  beginShape();
  int rowCount = data.getRowCount();
  for (int row = 0; row < rowCount; row++){
    if (data.isValid(row, col)) {
      float value = data.getFloat(row, col);
      float x = map(years[row], yearMin, yearMax, plotX1, plotX2);
      float y = map(value, dataMin, dataMax, plotY2, plotY1);
      vertex(x, y);
    }  
  } 
  endShape(); 
}

/*
void drawDataPoints(int col) {
  int rowCount = data.getRowCount();
  for (int row = 0; row < rowCount; row++){
    if (data.isValid(row, col)) {
      float value = data.getFloat(row, col);
      float x = map(years[row], yearMin, yearMax, plotX1, plotX2);
      float y = map(value, dataMin, dataMax, plotY2, plotY1);
      point(x, y);
    }  
  } 
} */



