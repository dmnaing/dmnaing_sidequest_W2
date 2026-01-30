// Object representing a soft animated blob
let blob = {
  // Position of the blob (centre of the shape)
  x: 240,
  y: 160, // centre of the canvas

  // Base size and shape resolution
  r: 28, // Base radius of the blob
  points: 48, // Number of vertices around the circle (higher = smoother)

  // Shape deformation settings
  wobble: 8, // Maximum amount the edge can move in or out
  wobbleFreq: 0.8, // Controls how lumpy or smooth the blob looks

  // Time values for animation
  t: 0, // Time input for noise()
  tSpeed: 0.01, // How fast the blob "breathes"
};

function setup() {
  createCanvas(480, 320);
  noStroke();

  // Text settings for on-screen instructions
  textFont("sans-serif");
  textSize(14);
}

function draw() {
  background(240);

  // --- Animate over time ---
  // Increment time so noise() changes smoothly every frame
  blob.t += blob.tSpeed;

  // --- Draw the blob ---
  // We draw a circle made of many points,
  // then push each point in or out using Perlin noise
  fill(20, 120, 255);
  beginShape();

  // Loop once around the circle
  for (let i = 0; i < blob.points; i++) {
    // Angle around the circle (0 → TAU)
    const a = (i / blob.points) * TAU;

    // Sample Perlin noise using:
    // - direction (cos/sin of angle)
    // - time (blob.t) for animation
    const n = noise(
      cos(a) * blob.wobbleFreq + 100,
      sin(a) * blob.wobbleFreq + 100,
      blob.t,
    );

    // Convert noise value (0–1) into a radius offset
    const r = blob.r + map(n, 0, 1, -blob.wobble, blob.wobble);

    // Convert polar coordinates (angle + radius)
    // into screen coordinates (x, y)
    vertex(blob.x + cos(a) * r, blob.y + sin(a) * r);
  }

  // Close the shape to form a solid blob
  endShape(CLOSE);

  // --- On-screen tip for experimentation ---
  fill(0);
  text("Blob breathing via noise(). Try wobble and tSpeed.", 10, 18);
}
