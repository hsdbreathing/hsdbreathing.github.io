/**
 * @author Marius Lenzing
 */

var debugModeIsOn = false;

var theCanvas;
var centerX;
var centerY;

var maxBreathingDiameter;
var originalHalfFullDiameter;
var halfFullDiameter;
var tooEmptyDiameter;
var tooFullDiameter;
var currentDiameter

var positionOnSinusCurve = 0;

var screenOrientation;

var lungIsBeingFilled = false;
var lungIsBeingEmptied = false;
var mouseIsInsideCanvas = true;
var endStateIsActive = false;

var lungIsExploding = false;
var particles = [];
var explosionCanvas;

var lifeSpeed = 5000;
var numberOfLifeShapes = 0;
var oldLifeShapesBackground;
var newestLifeShape = null;
var oldLifeShapes = [];
var createLifeInterval;
var lifeCreationTimestamp;
var gradient;


/**
 * P5.js Method
 * call once before start
 */
function preload() {
  // Check if Countdown is active
  if (localStorage.getItem("countdown")) {
    var deathReason = localStorage.getItem("deathReason");
    if (deathReason) {
      jQuery("#endscreen").addClass(deathReason);
    }
    document.getElementById("endscreen").style.display = "unset";
    noLoop();
    triggerEndState();
  }
  else {
    gradient = loadImage('../assets/images/gradient.png');

    jQuery(document).mouseleave(function () {
      mouseIsInsideCanvas = false;
    });

    jQuery(document).mouseenter(function () {
      mouseIsInsideCanvas = true;
    });

    jQuery(window).resize(setup);

    // create new lifeShape after some seconds
    createLifeInterval = setInterval(function () {
      createNewLifeShape();
    }, lifeSpeed);
  }
}

/**
 * P5.js Method
 * call once on start
 */
function setup() {
  theCanvas = createCanvas(windowWidth, windowHeight);
  noStroke();

  centerX = windowWidth / 2;
  centerY = windowHeight / 2;

  if (centerX > centerY) {
    screenOrientation = "landscape";
    originalHalfFullDiameter = centerY;
  }
  else {
    screenOrientation = "portrait";
    originalHalfFullDiameter = centerX;
  }

  halfFullDiameter = originalHalfFullDiameter;
  tooEmptyDiameter = originalHalfFullDiameter / 6;
  tooFullDiameter = originalHalfFullDiameter * 2.3;

  oldLifeShapesBackground = createGraphics(windowWidth, windowHeight);
}

/**
 * P5.js Method
 * call once every frame
 */
function draw() {
  if (lungIsExploding) {
    drawExplosion();
  }

  if (!endStateIsActive) {
    computeInput();
    drawBackground();
    drawLife();
    drawLung();

    if (debugModeIsOn) {
      textSize(32);
      fill("red")
      text(frameRate(), 10, 30);
    }
  }
}

/** draws the motion of the particles of the explosion-endState */
function drawExplosion() {
  clear();

  if (particles.length > 0) {
    for (var i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].display();
    }
  }
}

/** takes mouse input to increase or decrease lung */
function computeInput() {
  lungIsBeingFilled = false;
  lungIsBeingEmptied = false;

  if (mouseIsInsideCanvas) {

    if (mouseX > centerX) {
      lungIsBeingEmptied = true;
      emptyLung();
    }
    else {
      lungIsBeingFilled = true;
      fillLung();
    }
  }

  maxBreathingDiameter = halfFullDiameter / 6;
  currentDiameter = computeCircleDiameter();

  if (currentDiameter <= tooEmptyDiameter) {
    lungStarve();
  }
  if (currentDiameter >= tooFullDiameter) {
    lungExplode();
  }
}

/** draws background */
function drawBackground() {
  background("white");
  if (lungIsBeingEmptied) {
    background(color(225, 225, 225));
  }

  fill("black");
  if (lungIsBeingFilled) {
    fill(color(26, 26, 26));
  }
  rect(0, 0, centerX, windowHeight);
}

/** computes state of the green background shapes and renders them */
function drawLife() {
  // draw new lifeShape
  if (newestLifeShape) {
    image(gradient, newestLifeShape.x, newestLifeShape.y, newestLifeShape.w, newestLifeShape.h);

    var lifeShapeYoungestAge = lifeCreationTimestamp;
    var lifeShapeOldestAge = lifeCreationTimestamp + lifeSpeed;
    var lifeShapeCurrentAge = + new Date(); // now
    var transparency = map(lifeShapeCurrentAge, lifeShapeYoungestAge, lifeShapeOldestAge, 255, 0, true);

    var overlayColor;
    if (newestLifeShape.x >= centerX) {
      overlayColor = "white";
      if (lungIsBeingEmptied) {
        overlayColor = color(225, 225, 225);
      }
    }
    else {
      overlayColor = "black";
      if (lungIsBeingFilled) {
        overlayColor = color(26, 26, 26);
      }
    }

    var overlayColorWithTransparency = color(red(overlayColor), green(overlayColor), blue(overlayColor), transparency);
    fill(overlayColorWithTransparency);
    rect(newestLifeShape.x, newestLifeShape.y - 1, newestLifeShape.w, newestLifeShape.h + 2);
  }

  // draw old lifeShapes
  image(oldLifeShapesBackground, 0, 0);
}

/** computes state of breathing animation and renders lung */
function drawLung() {
  noStroke();

  var transparencyModifier = map(currentDiameter, tooEmptyDiameter, originalHalfFullDiameter, 0, 1, true);

  var breathingSpeed = map(currentDiameter, originalHalfFullDiameter, tooFullDiameter, 1, 7, true);

  var halfFullDiameterColor = color(151, 227, 255);
  var fullDiameterColor = color(0, 28, 61);
  var circleColorRed = Math.floor(
    map(currentDiameter, originalHalfFullDiameter, tooFullDiameter * 0.88, red(halfFullDiameterColor), red(fullDiameterColor), true)
  );
  var circleColorGreen = Math.floor(
    map(currentDiameter, originalHalfFullDiameter, tooFullDiameter * 0.88, green(halfFullDiameterColor), green(fullDiameterColor), true)
  );
  var circleColorBlue = Math.floor(
    map(currentDiameter, originalHalfFullDiameter, tooFullDiameter * 0.88, blue(halfFullDiameterColor), blue(fullDiameterColor), true)
  );

  // draw main circle:
  var transparency = 1 * transparencyModifier;
  fill("rgba(" + circleColorRed + "," + circleColorGreen + "," + circleColorBlue + "," + transparency + ")");
  circle(centerX, centerY, currentDiameter);

  // draw outer circles:
  transparency = 0.5 * transparencyModifier;
  fill("rgba(" + circleColorRed + "," + circleColorGreen + "," + circleColorBlue + "," + transparency + ")");
  circle(centerX, centerY, computeCircleDiameter(-0.2) * 1.1);

  transparency = 0.45 * transparencyModifier;
  fill("rgba(" + circleColorRed + "," + circleColorGreen + "," + circleColorBlue + "," + transparency + ")");
  circle(centerX, centerY, computeCircleDiameter(-0.4) * 1.2);

  transparency = 0.35 * transparencyModifier;
  fill("rgba(" + circleColorRed + "," + circleColorGreen + "," + circleColorBlue + "," + transparency + ")");
  circle(centerX, centerY, computeCircleDiameter(-0.6) * 1.3);

  transparency = 0.3 * transparencyModifier;
  fill("rgba(" + circleColorRed + "," + circleColorGreen + "," + circleColorBlue + "," + transparency + ")");
  circle(centerX, centerY, computeCircleDiameter(-0.8) * 1.4);

  positionOnSinusCurve += 0.02 * breathingSpeed;
}

/** math magic */
function computeCircleDiameter(sinusOffset = 0) {
  var result = halfFullDiameter + sin(positionOnSinusCurve + sinusOffset) * maxBreathingDiameter;

  if (result < 0) {
    result = 0;
  }
  return result;
}

/** makes lung bigger by tiny amount */
function fillLung() {
  halfFullDiameter += 0.1;
}

/** makes lung smaller by tiny amount */
function emptyLung() {
  halfFullDiameter -= 0.1;
}


/** create data for new green rectangle and add old data to static background */
function createNewLifeShape() {
  lifeCreationTimestamp = + new Date(); // now

  // add current lifeShape to old lifeShapes
  if (newestLifeShape !== null) {
    oldLifeShapesBackground.image(gradient, newestLifeShape.x, newestLifeShape.y, newestLifeShape.w, newestLifeShape.h);
    numberOfLifeShapes++;
    newestLifeShape = null;
  }

  // if lung is healthy add new lifeShape
  var lungIsHealthy = mouseIsInsideCanvas
    && currentDiameter > tooEmptyDiameter * 3
    && currentDiameter < tooFullDiameter / 1.2;

  if (!lungIsHealthy) {
    return;
  }

  var rectWidth = windowWidth / 8;

  var x = random([0, rectWidth, rectWidth * 2, rectWidth * 3, rectWidth * 4, rectWidth * 5, rectWidth * 6, rectWidth * 7]);

  var maxHeightModifier = 0.1 + numberOfLifeShapes * 0.02;
  var rectHeight = random(windowHeight * 0.1, windowHeight * maxHeightModifier);

  var y = Math.random() < 0.5 ? 0 : windowHeight;
  if (y !== 0) { // rect is on bottom
    y = y - rectHeight;
  }

  newestLifeShape = { x: x, y: y, w: rectWidth, h: rectHeight };
}


// ENDSTATE:

/** Stops breathing. Shows overlay with restart-countdown */
function triggerEndState() {
  endStateIsActive = true;

  jQuery(window).off("resize", setup);

  document.getElementById("endscreen").style.display = "flex";

  var timeLeft = localStorage.getItem("countdown");
  if (timeLeft > 0) {
    let now = new Date().getTime();
    let dyingDate = localStorage.getItem("dyingDate");

    let seconds = Math.floor(((24 * 60 * 60 * 1000) - (now - dyingDate)) / 1000);
    localStorage.setItem("countdown", seconds);
  }
  else {
    // Set the date we're counting down to
    var countDownDate = new Date(new Date().getTime() + (24 * 60 * 60 * 1000)).getTime();
    let now = new Date().getTime();
    localStorage.setItem("dyingDate", now);

    // Find the distance between now and the count down date
    let seconds = Math.floor((countDownDate - now) / 1000);
    localStorage.setItem("countdown", seconds);
  }

  // Update the count down every 1 second
  var x = setInterval(function () {
    // Get today's date and time

    let distance = localStorage.getItem("countdown") - 1;
    localStorage.setItem("countdown", distance);

    // Time calculations for days, hours, minutes and seconds
    var hours = Math.floor((distance % (60 * 60 * 24)) / (60 * 60));
    var minutes = Math.floor((distance % (60 * 60)) / (60));
    var seconds = Math.floor((distance % (60)));

    // Display the result in the element with id="endscreen"
    document.getElementById("countdown").innerHTML = (hours > 9 ? "" : "0") + hours + ":"
      + (minutes > 9 ? "" : "0") + minutes + ":" + (seconds > 9 ? "" : "0") + seconds + "";

    // If the count down is finished, write some text
    if (distance <= 0) {
      clearInterval(x);
      localStorage.removeItem("countdown");
      localStorage.removeItem("dyingDate");
      localStorage.removeItem("deathReason");
      window.location.reload();
    }
  }, 1000);
}

/** starts starving-endState */
function lungStarve() {
  jQuery("#endscreen").addClass("lung-was-to-empty");
  localStorage.setItem("deathReason", "lung-was-to-empty");

  triggerEndState();
}

/** starts explosion-endState */
function lungExplode() {
  jQuery("#endscreen").addClass("lung-was-to-full");
  jQuery(".about-link").css("display", "none");
  jQuery("#about-link-copy").css("display", "block");

  localStorage.setItem("deathReason", "lung-was-to-full");
  triggerEndState();
  lungIsExploding = true;
  theCanvas.canvas.classList.add("explosion-state");

  var i;
  for (i = 0; i < 200; i++) {
    particles[i] = new Particle(centerX, centerY, random(3, 40));
  }

  setInterval(function () {
    if (i <= 230) {
      particles[i] = new Particle(centerX, centerY, random(3, 30));
      i++;
    }
  }, 1);
}


/** explosion particle */
class Particle {

  constructor(x, y, r) {
    this.pos = createVector(x, y);
    this.acc = createVector(0, 0);
    this.r = r ? r : 48;
    this.halfr = r / 2;

    var velX, velY, velIsToSlow;
    do {
      velX = random(-10, 10);
      velY = random(-10, 10);
      if ((Math.abs(velX) + Math.abs(velY)) > 15) {
        let overSpeed = - ((10 - (Math.abs(velX) + Math.abs(velY))) / 2);
        velX > 0 ? velX -= overSpeed : velX += overSpeed;
        velY > 0 ? velY -= overSpeed : velY += overSpeed;
      }
      velIsToSlow = (velX > -0.4 && velX < 0.4) && (velY > -0.4 && velY < 0.4);
    } while (velIsToSlow);
    this.vel = createVector(velX, velY);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }

  display() {
    noStroke();
    fill(color(0, 28, 61));
    ellipse(this.pos.x, this.pos.y, this.r, this.r);
  }

  edges() {
    if (this.pos.y > (height - this.halfr)) {
      this.vel.y *= -1;
      this.pos.y = (height - this.halfr);
    }

    if (this.pos.y < 0 + this.halfr) {
      this.vel.y *= -1;
      this.pos.y = 0 + this.halfr;
    }

    if (this.pos.x > (width - this.halfr)) {
      this.vel.x *= -1;
      this.pos.x = (width - this.halfr);
    }

    if (this.pos.x < this.halfr) {
      this.vel.x /= -1;
      this.pos.x = this.halfr;
    }
  }

}
