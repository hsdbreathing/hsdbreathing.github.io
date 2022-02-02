/**
 * @author Marius Lenzing
 */

var centerX;
var centerY;

var maxBreathingDiameter;
var halfFullDiameter;
var positionOnSinusCurve = 0;

var breathingSpeed;

/**
 * P5.js Method
 * call once before start
 */
function preload() {
}

/**
 * P5.js Method
 * call once on start
 */
function setup() {
  createCanvas(windowWidth, windowHeight);

  centerX = windowWidth /2;
  centerY = windowHeight /2;

  noStroke();
}

/**
 * P5.js Method
 * call once every frame
 */
function draw() {
  drawBackground();
  drawLung();
}

function drawBackground() {
  background("white");
  fill("black")
  rect(0,0, centerX, windowHeight);
}

function drawLung() {
  fill("blue");

  if (centerX > centerY) {
    halfFullDiameter = centerY;
  }
  else {
    halfFullDiameter = centerX;
  }

  maxBreathingDiameter = halfFullDiameter /4;

  breathingSpeed = 1;

  var currentDiameter = halfFullDiameter + sin(positionOnSinusCurve) * maxBreathingDiameter;

  circle(centerX, centerY, currentDiameter);

  positionOnSinusCurve += .02 * breathingSpeed;
}