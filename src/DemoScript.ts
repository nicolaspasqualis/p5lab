// @ts-nocheck
export default (
`let insideRadius = 100;
let outsideRadius = 150;


const {points, button, someText} = p5lab.controls({
  points: { value: 3, min: 2, max: 12 },
  color: { value: "#ff00ff" },
  checkbox: { value: true },
  someText: { value: "#noiiice!!"},
  color2: { value: "color", 
    options: ["color", "hkghjb", "black"],
    onChange: (value) => alert(value)
  },
  superImportantButton: { 
    onTrigger: () => window.alert("test") 
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
  noStroke()
  fill(0)
  text(someText.value, 20, 20)
  stroke(255);

  const centerX = width / 2;
  const centerY = height / 2;
  const pointCount = round(points.value);
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