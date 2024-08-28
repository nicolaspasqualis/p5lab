// @ts-nocheck
export default (
`let insideRadius = 100;
let outsideRadius = 150;

const params = p5lab.controls({
  points: {
    type: "range", min: 2, max: 12, step: 1, 
    initialValue: 3,
  },
  morePointz: {
    type: "range", min: 2, max: 12, step: 1, 
    initialValue: 3,
  },
  color: {
    type: "color", min: 2, max: 12, step: 1, 
    initialValue: "#ff00ff",
  },
  checkbox: {
    type: "checkbox", initialValue: false,
  },
  color2: {
    type: "select", options: ["color", "white", "black"], 
    initialValue: "color",
  }
})

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  colorMode(HSB);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(255);
  stroke(255);

  const centerX = width / 2;
  const centerY = height / 2;
  const pointCount = round(params.points.currentValue);
  const angleStep = 180.0 / pointCount;

  let angle = 0;

  beginShape(TRIANGLE_STRIP);
  for (let i = 0; i <= pointCount; i += 1) {
    fill(angle, 255, 255);
    vertex(
      centerX + cos(angle) * outsideRadius,
      centerY + sin(angle) * outsideRadius,
    );
    angle += angleStep;

    fill(angle, 255, 255);
    vertex(
      centerX + cos(angle) * insideRadius,
      centerY + sin(angle) * insideRadius,
    );
    angle += angleStep;
  }
  endShape();
}`
)