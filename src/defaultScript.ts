//@ts-nocheck
export default `// https://p5js.org/reference/

const { radius } = p5lab.controls({
  radius: { value: 10, min: 1, max: 100 }
})

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(255);
  circle(
    width / 2, height / 2, 
    millis() / 10 % radius.value
  );
}`