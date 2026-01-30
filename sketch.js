/*
Side Quest W2 — Emotion Blob: SAD
Bonus Mischief: Steal OR bump objects on a small map

Controls:
- Move: WASD / Arrow keys
- Touch notes to STEAL them
- Hold SHIFT while touching to BUMP them away
*/

let blob;
let shelves = [];
let notes = [];
let stolenCount = 0;

// mood: 0..1 (higher = sadder vibe)
let mood = 0.65;

// rain particles
let rain = [];

function setup() {
  createCanvas(900, 540);
  textFont("system-ui");
  textAlign(LEFT, TOP);

  blob = new SadBlob(140, 140);

  // small map: "bookshop shelves" as obstacles
  shelves.push(new RectObstacle(240, 80, 40, 380));
  shelves.push(new RectObstacle(440, 0, 40, 260));
  shelves.push(new RectObstacle(440, 340, 40, 200));
  shelves.push(new RectObstacle(640, 80, 40, 380));

  // scatter notes (mischief objects)
  for (let i = 0; i < 9; i++) {
    notes.push(new Note(random(70, width - 70), random(70, height - 90)));
  }

  // rain lines
  for (let i = 0; i < 160; i++) {
    rain.push(new RainDrop());
  }
}

function draw() {
  drawGloomyBackground();

  // soft rain overlay (environment mood)
  for (let d of rain) {
    d.update();
    d.display();
  }

  // draw map obstacles
  for (let s of shelves) s.display();

  // update notes (steal/bump mechanic)
  for (let n of notes) {
    n.update(blob);
    n.display();
  }

  // update blob movement + collisions
  blob.update(shelves);

  // draw blob on top
  blob.display();

  drawHUD();
}

function drawGloomyBackground() {
  // vertical gradient (dark blue -> gray)
  for (let y = 0; y < height; y += 2) {
    let t = y / height;
    let topC = color(10, 18, 30);
    let botC = color(25, 28, 35);
    let c = lerpColor(topC, botC, t);
    stroke(c);
    line(0, y, width, y);
  }

  // subtle drifting "window glow"
  noStroke();
  let glowX = width * 0.15 + sin(frameCount * 0.01) * 12;
  let glowY = height * 0.18 + cos(frameCount * 0.012) * 10;
  fill(120, 150, 180, 18);
  ellipse(glowX, glowY, 320, 220);

  // floor line
  stroke(255, 18);
  line(0, height - 60, width, height - 60);

  // tiny dust/noise dots (organic)
  noStroke();
  for (let i = 0; i < 220; i++) {
    let x = (i * 17 + frameCount * 2) % width;
    let y = (i * 31) % height;
    let a = noise(x * 0.01, y * 0.01, frameCount * 0.01);
    fill(255, 10 * a);
    rect(x, y, 2, 2);
  }
}

function drawHUD() {
  noStroke();
  fill(0, 150);
  rect(0, 0, width, 60);

  fill(255);
  textSize(15);
  text("Emotion: SAD (slow/heavy movement + rain + droopy face)", 16, 12);
  textSize(13);
  text("Move: WASD/Arrows | Touch notes to STEAL | Hold SHIFT to BUMP", 16, 34);

  fill(255);
  textSize(14);
  text(`Stolen: ${stolenCount}`, width - 110, 22);
}

// -------------------- Input helpers --------------------
function inputVector() {
  let vx = 0,
    vy = 0;
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) vx -= 1; // A
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) vx += 1; // D
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) vy -= 1; // W
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) vy += 1; // S

  let v = createVector(vx, vy);
  if (v.mag() > 0) v.normalize();
  return v;
}

// -------------------- Classes --------------------

class SadBlob {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);

    this.baseR = 34;
    this.points = 26;

    this.noiseSeed = random(1000);
    this.wobble = 0.75;

    this.tearTimer = 0;
    this.tears = [];
  }

  update(obstacles) {
    let input = inputVector();

    // sad = heavy + reluctant: slow accel, low top speed
    let maxSpeed = 2.3;
    let accel = 0.12;

    // gentle drift (like you’re not fully in control)
    let driftAngle = noise(this.noiseSeed, frameCount * 0.01) * TWO_PI * 2;
    let drift = p5.Vector.fromAngle(driftAngle).mult(0.1);

    // “weight” pulling downward slightly
    let gravity = createVector(0, 0.035);

    // combine movement
    let desired = p5.Vector.add(input, drift);
    if (desired.mag() > 0) desired.normalize();

    this.vel.add(desired.mult(accel));
    this.vel.add(gravity);

    // strong damping (sad sluggishness)
    this.vel.mult(0.9);
    this.vel.limit(maxSpeed);

    // move
    this.pos.add(this.vel);

    // world bounds
    this.pos.x = constrain(this.pos.x, this.baseR, width - this.baseR);
    this.pos.y = constrain(this.pos.y, this.baseR, height - 60 - this.baseR);

    // collide with shelves (circle vs rect push-out)
    for (let r of obstacles) {
      resolveCircleRect(this.pos, this.baseR, r.x, r.y, r.w, r.h);
    }

    // tear particle occasionally (more when mostly idle)
    let idle = this.vel.mag() < 0.35;
    this.tearTimer++;
    if (idle && this.tearTimer > 22) {
      this.tearTimer = 0;
      this.tears.push(new Tear(this.pos.x, this.pos.y));
    }

    // update tears
    for (let t of this.tears) t.update();
    this.tears = this.tears.filter((t) => !t.done);

    this.noiseSeed += 0.006;
  }

  display() {
    // body color: muted blue-gray
    let bodyC = color(90, 130, 150);
    let shadowC = color(35, 55, 70);

    // soft shadow
    noStroke();
    fill(shadowC, 90);
    ellipse(
      this.pos.x + 6,
      this.pos.y + 22,
      this.baseR * 1.6,
      this.baseR * 1.0,
    );

    // blob shape (droopy bottom)
    push();
    translate(this.pos.x, this.pos.y);

    fill(bodyC);
    beginShape();
    for (let i = 0; i < this.points; i++) {
      let a = map(i, 0, this.points, 0, TWO_PI);
      let n = noise(
        cos(a) * this.wobble + this.noiseSeed,
        sin(a) * this.wobble + this.noiseSeed,
        frameCount * 0.012,
      );

      let wobbleAmt = 10;
      let r = this.baseR + (n - 0.5) * 2 * wobbleAmt;

      // droop: bottom sags more than top
      let sag = map(sin(a), -1, 1, -2, 10);
      let x = cos(a) * r;
      let y = sin(a) * r + sag;

      vertex(x, y);
    }
    endShape(CLOSE);

    // face (sad)
    // eyes
    fill(20, 40, 55);
    ellipse(-11, -8, 7, 12);
    ellipse(11, -8, 7, 12);

    // eyelids (tired look)
    stroke(20, 40, 55, 120);
    strokeWeight(2);
    line(-16, -12, -6, -12);
    line(6, -12, 16, -12);

    // mouth (downturned arc)
    noFill();
    stroke(20, 40, 55);
    strokeWeight(3);
    arc(0, 12, 22, 14, PI, TWO_PI);

    pop();

    // tears on top
    for (let t of this.tears) t.display(this.pos.x, this.pos.y);
  }
}

class RectObstacle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  display() {
    noStroke();
    // shelves are darker and “quiet”
    fill(35, 45, 60, 220);
    rect(this.x, this.y, this.w, this.h, 10);

    // small shelf lines for texture
    stroke(255, 18);
    for (let yy = this.y + 20; yy < this.y + this.h; yy += 38) {
      line(this.x + 6, yy, this.x + this.w - 6, yy);
    }
  }
}

class Note {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.r = 12;
    this.stolen = false;

    this.theta = random(TWO_PI);
    this.orbitR = random(42, 58);
    this.respawnAt = -1;

    // gentle bob
    this.seed = random(999);
  }

  update(blob) {
    if (this.stolen) {
      // orbit slowly (sad vibe: slow, not playful)
      this.theta += 0.025;
      let ox = cos(this.theta) * this.orbitR;
      let oy = sin(this.theta) * (this.orbitR * 0.55);
      this.pos.x = blob.pos.x + ox;
      this.pos.y = blob.pos.y + oy + 14;

      // respawn later so you can keep interacting
      if (this.respawnAt === -1) this.respawnAt = frameCount + 260;
      if (frameCount > this.respawnAt) {
        this.stolen = false;
        this.respawnAt = -1;
        this.pos.set(random(70, width - 70), random(70, height - 90));
      }
      return;
    }

    // idle wobble
    let w = noise(this.seed, frameCount * 0.01) - 0.5;
    this.pos.x += w * 0.25;
    this.pos.y += sin(frameCount * 0.02 + this.seed) * 0.1;

    // interact: steal or bump
    let d = dist(this.pos.x, this.pos.y, blob.pos.x, blob.pos.y);
    if (d < this.r + blob.baseR * 0.85) {
      if (keyIsDown(SHIFT)) {
        // bump away (push direction from blob)
        let push = p5.Vector.sub(this.pos, blob.pos);
        if (push.mag() === 0) push = createVector(1, 0);
        push.normalize().mult(18);
        this.pos.add(push);
      } else {
        // steal
        this.stolen = true;
        stolenCount++;
      }
    }

    // keep inside play area
    this.pos.x = constrain(this.pos.x, 50, width - 50);
    this.pos.y = constrain(this.pos.y, 50, height - 90);
  }

  display() {
    noStroke();
    if (this.stolen) {
      fill(255, 200);
    } else {
      fill(235, 220, 200, 230);
    }

    // note shape
    rect(this.pos.x - this.r, this.pos.y - this.r, this.r * 2, this.r * 2, 4);

    // tiny “writing”
    stroke(30, 60);
    strokeWeight(2);
    line(this.pos.x - 7, this.pos.y - 3, this.pos.x + 7, this.pos.y - 3);
    line(this.pos.x - 7, this.pos.y + 3, this.pos.x + 4, this.pos.y + 3);
  }
}

class RainDrop {
  constructor() {
    this.reset(true);
  }

  reset(first = false) {
    this.x = random(width);
    this.y = first ? random(height) : random(-200, -20);
    this.len = random(8, 16);
    this.spd = random(3.2, 6.2);
    this.a = random(22, 60);
  }

  update() {
    this.y += this.spd;
    this.x += 0.35; // slight slant
    if (this.y > height) this.reset(false);
    if (this.x > width + 20) this.x = -20;
  }

  display() {
    stroke(170, 200, 220, this.a);
    strokeWeight(2);
    line(this.x, this.y, this.x + 2, this.y + this.len);
  }
}

class Tear {
  constructor(bx, by) {
    // spawn near left or right eye
    this.side = random() < 0.5 ? -1 : 1;
    this.x = bx + this.side * 11;
    this.y = by - 2;
    this.vy = random(1.4, 2.4);
    this.life = 110;
    this.done = false;
  }

  update() {
    this.y += this.vy;
    this.vy += 0.02;
    this.life--;
    if (this.life <= 0 || this.y > height - 60) this.done = true;
  }

  display() {
    noStroke();
    fill(180, 220, 255, 150);
    ellipse(this.x, this.y, 6, 8);
  }
}

// -------------------- Collision helper --------------------
// Pushes circle out of rect if overlapping.
function resolveCircleRect(cPos, cR, rx, ry, rw, rh) {
  let closestX = constrain(cPos.x, rx, rx + rw);
  let closestY = constrain(cPos.y, ry, ry + rh);

  let dx = cPos.x - closestX;
  let dy = cPos.y - closestY;

  let distSq = dx * dx + dy * dy;
  if (distSq < cR * cR) {
    let d = sqrt(distSq);
    if (d === 0) {
      dx = 1;
      dy = 0;
      d = 1;
    }

    let overlap = cR - d;
    cPos.x += (dx / d) * overlap;
    cPos.y += (dy / d) * overlap;
    return true;
  }
  return false;
}
