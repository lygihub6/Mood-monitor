// 🌻 Mood Flower + Mood Log Timeline (Gray Stress Edition)
// Motivation → Height, Bloom, Sunlight
// Focus → Stem steadiness
// Stress → Droop, Grayscale color, Face expression
// Buttons: 📝 Log Mood | 🧹 Clear Log
// Timeline: visual log of past moods with hover tooltip

let motivation = 70, focus = 50, stress = 10;
let t = 0;

// UI
let motSlider, focSlider, stSlider, logBtn, clearBtn;
// Journal UI (in-canvas)
let isJournalOpen = false;
let journalInput = null;   // <textarea>
let journalSave = null;    // Save button
let journalCancel = null;  // Cancel button
const journalBox = { x: 40, y: 90, w: 320, h: 200 };

// Mood Log
let moodLog = [];
const MAX_LOG = 120;
let clearedToastFrames = 0;

// Ground constants
const GROUND_H = 60;
const GRASS_H  = 20;

function setup() {
  createCanvas(400, 500);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();

  // --- Sliders ---
  createP("Motivation ✨ (Height, Bloom & Sun)").style("margin","8px 0 0 0");
  motSlider = createSlider(0, 100, motivation, 1).style("width","380px");

  createP("Focus 🎯 (Steadiness & Stem)").style("margin","12px 0 0 0");
  focSlider = createSlider(0, 100, focus, 1).style("width","380px");

  createP("Stress 😰 (Droop, Color → Gray)").style("margin","12px 0 0 0");
  stSlider = createSlider(0, 100, stress, 1).style("width","380px");

  // --- Buttons ---
  logBtn = createButton("📝 Log Mood");
  logBtn.mousePressed(() => logCurrentMood());
  logBtn.style("margin","10px 6px 0 0");

  clearBtn = createButton("🧹 Clear Log");
  clearBtn.mousePressed(() => { moodLog = []; clearedToastFrames = 90; });
  clearBtn.style("margin","10px 0 0 0");
}

function draw() {
  motivation = motSlider.value();
  focus = focSlider.value();
  stress = stSlider.value();

  drawBackgroundAndSun();
  updateWeather();
drawWeather();

  // Motion + plant parameters
  t += 0.02;
  const plantHeight = map(motivation, 0, 100, 80, 300);
  const bloomSize   = map(motivation, 0, 100, 20, 60);
  const stemThickness = map(focus, 0, 100, 4, 24);
  const leafSize      = map(focus, 0, 100, 20, 100);
  const swayAmount    = map(focus, 0, 100, 15, 2);
  const droopDeg      = map(stress, 0, 100, 0, 45);
  const jitterAmt     = map(stress, 0, 100, 0, 3);
  const grayMix       = map(stress, 0, 100, 0, 1);

  push();
  translate(width/2, height - GROUND_H);
  rotate(radians(sin(t) * swayAmount));

  // STEM — turns dark gray with stress
  const stemHue = lerp(110, 0, grayMix);
  const stemSat = lerp(60, 0, grayMix);
  const stemBri = lerp(60, 30, grayMix);

  push();
  stroke(stemHue, stemSat, stemBri);
  strokeWeight(stemThickness);
  strokeCap(ROUND);
  noFill();

  const pts = [];
  for (let i = 0; i <= 10; i++) {
    let y = -map(i, 0, 10, 0, plantHeight);
    let x = sin(i * 0.3 + t * 0.5) * 5;
    if (i > 0 && stress > 0) {
      x += random(-jitterAmt, jitterAmt);
      y += random(-jitterAmt / 2, jitterAmt / 2);
    }
    pts.push({x, y});
  }
  beginShape();
  curveVertex(pts[0].x, pts[0].y);
  for (let i=0;i<pts.length;i++) curveVertex(pts[i].x, pts[i].y);
  curveVertex(pts[pts.length-1].x, pts[pts.length-1].y);
  endShape();
  pop();

  // LEAVES — fade to gray
  for (let i = 0; i < 2; i++) {
    push();
    const leafY = -plantHeight * 0.6;
    translate(0, leafY);
    const side = (i % 2 === 0) ? 1 : -1;
    rotate(radians(side * (-60 + droopDeg)));
    fill(lerpColor(color(110, 50, 60), color(0, 0, 30), grayMix));
    noStroke();
    ellipse(leafSize * 0.6 * side, 0, leafSize, leafSize * 0.5);
    pop();
  }

  // BLOOM — petals fade to gray
  push();
  translate(0, -plantHeight);
  const petalColor = lerpColor(color(50, 80, 95), color(0, 0, 40), grayMix);
  const petalCount = 8;
  for (let p=0; p<petalCount; p++) {
    push();
    rotate((TWO_PI/petalCount)*p + sin(t*2)*0.05);
    noStroke(); fill(petalColor);
    ellipse(bloomSize/2, 0, bloomSize*0.8, bloomSize/2);
    pop();
  }

  // Center
  const faceSize = bloomSize * 0.7;
  const centerColor = lerpColor(color(210, 40, 92), color(0, 0, 35), grayMix);
  stroke(centerColor); strokeWeight(max(1, bloomSize*0.08));
  fill(centerColor);
  circle(0, 0, faceSize);
  drawFace(faceSize, stress);
  pop();
  pop();

  drawGroundOverlayCap();
  drawHUD();
  drawTimeline();

  if (clearedToastFrames-- > 0) drawToast("Mood log cleared!");
}

// -------- FACE EXPRESSION --------
function drawFace(faceSize, stress) {
  const featureStroke = max(1, faceSize * 0.06);
  stroke(0, 0, 20 + map(stress, 0, 100, 0, 40));
  strokeWeight(featureStroke);
  noFill();

  const eyeY = -faceSize * 0.15, eyeX = faceSize * 0.2;

  if (stress <= 30) { // happy
    arc(-eyeX, eyeY, faceSize*0.15, faceSize*0.15, 0, PI);
    arc( eyeX, eyeY, faceSize*0.15, faceSize*0.15, 0, PI);
    arc(0, faceSize*0.05, faceSize*0.3, faceSize*0.2, 0, PI);
  } else if (stress <= 60) { // neutral
    line(-faceSize*0.25, -faceSize*0.15, -faceSize*0.1, -faceSize*0.15);
    line( faceSize*0.1,  -faceSize*0.15,  faceSize*0.25, -faceSize*0.15);
    line(-faceSize*0.15,  faceSize*0.08,  faceSize*0.15,  faceSize*0.08);
  } else { // crying
    arc(-eyeX, eyeY, faceSize*0.15, faceSize*0.15, PI, TWO_PI);
    arc( eyeX, eyeY, faceSize*0.15, faceSize*0.15, PI, TWO_PI);
    arc(0, faceSize*0.10, faceSize*0.34, faceSize*0.25, PI, TWO_PI);
    noStroke(); fill(210, 20, 90, 70);
    ellipse(-eyeX, eyeY + faceSize*0.16, faceSize*0.07, faceSize*0.12);
    ellipse( eyeX,  eyeY + faceSize*0.16, faceSize*0.07, faceSize*0.12);
  }
}

// -------- BACKGROUND + SUN --------
function drawBackgroundAndSun() {
  // --- Sky color & cleanliness ---
  const skyHue = map(motivation, 0, 100, 200, 55);          // calm blue → warm yellow
  const baseSkyBri = 90 - map(stress, 0, 100, 0, 50);       // dims with stress

  // Cleanliness with Focus: higher focus = cleaner, slightly brighter sky
  const cleanSat = map(focus, 0, 100, 10, 25);
  const cleanBri = constrain(baseSkyBri + map(focus, 0, 100, -10, 10), 20, 100);
  background(skyHue, cleanSat, cleanBri);

  // Subtle "messy" texture only when focus is low
  if (focus < 50) {
    const noiseAmt = floor(map(focus, 0, 100, 80, 10)); // fewer specks at higher focus
    noStroke();
    fill(0, 0, 100, 4);
    for (let i = 0; i < noiseAmt; i++) {
      const x = random(width);
      const y = random(height - 80);
      ellipse(x, y, random(1, 4));
    }
  }

  // --- Ground layers ---
  fill(100, 40, 40, 100);
  rect(0, height - GROUND_H, width, GROUND_H);
  fill(100, 30, 60, 100);
  rect(0, height - GROUND_H, width, GRASS_H);

  // --- SUN with glow and expanding beams ---
  let sx = width * 0.12;
  let sy = height * 0.18;

  // Sun core size and brightness
  let coreSize = map(motivation, 0, 100, 36, 140);  // grows with motivation
  let coreBri = constrain(
    map(motivation, 0, 100, 70, 100) - map(stress, 0, 100, 0, 40),
    30,
    100
  );

  // Glow layers
  noStroke();
  for (let i = 10; i > 0; i--) {
    const r = coreSize * (1 + i * 0.15);
    const alpha = map(i, 10, 0, 0, 100);
    fill(55, 40, coreBri, alpha);
    ellipse(sx, sy, r, r);
  }

  // Rays — longer, thicker, brighter as sun grows
  const rayCount = 24;
  const rayLength   = map(coreSize, 36, 140, 10, 130);
  const rayThickness= map(coreSize, 36, 140, 1, 6);
  const rayAlpha    = map(coreSize, 36, 140, 20, 90);

  push();
  stroke(55, 50, coreBri, rayAlpha);
  strokeWeight(rayThickness);
  for (let k = 0; k < rayCount; k++) {
    const a = (TWO_PI / rayCount) * k;
    const x1 = sx + cos(a) * (coreSize * 0.55);
    const y1 = sy + sin(a) * (coreSize * 0.55);
    const x2 = sx + cos(a) * (coreSize * 0.55 + rayLength);
    const y2 = sy + sin(a) * (coreSize * 0.55 + rayLength);
    line(x1, y1, x2, y2);
  }
  pop();

  // Sun core
  fill(55, 40, coreBri, 95);
  ellipse(sx, sy, coreSize);
}


// -------- SOIL CAP (stem base) --------
function drawGroundOverlayCap() {
  const capY = height - GROUND_H + 8;
  fill(100, 40, 40, 100);
  ellipse(width / 2, capY, 36, 18);
  fill(100, 30, 60, 100);
  rect(0, height - GROUND_H, width, GRASS_H);
}

// -------- HUD --------
function drawHUD() {
  push();
  fill(0, 0, 100, 80);
  rect(10, 10, 230, 78, 10);
  fill(0, 0, 15);
  textSize(12);
  textStyle(BOLD);
  text("Mood Readout", 20, 30);
  textStyle(NORMAL);
  text(`Motivation: ${motivation}`, 20, 48);
  text(`Focus:      ${focus}`, 20, 64);
  text(`Stress:     ${stress}`, 20, 80);
  pop(); 
  
}

// --- Weather effect arrays ---
let raindrops = [];
let petals = [];

// --- Weather setup ---
function updateWeather() {
  // Heavy rain when stress > 70
  if (stress > 70 && raindrops.length < 200) {
    for (let i = 0; i < 5; i++) {
      raindrops.push({
        x: random(width),
        y: random(-50, height),
        speed: random(5, 10),
        len: random(10, 20)
      });
    }
  } else if (stress <= 70) {
    raindrops = []; // clear rain when calm
  }

  // Floating petals when motivation > 80
  if (motivation > 80 && petals.length < 50) {
    for (let i = 0; i < 1; i++) {
      petals.push({
        x: random(width),
        y: random(height - 100, height),
        size: random(8, 16),
        angle: random(TWO_PI),
        speedY: random(0.3, 0.8),
        speedX: random(-0.3, 0.3),
        rotSpeed: random(-0.02, 0.02)
      });
    }
  } else if (motivation <= 80) {
    petals = []; // clear petals when motivation drops
  }
}

// --- Weather drawing ---
function drawWeather() {
  // Draw rain
  stroke(210, 20, 90, 80);
  strokeWeight(2);
  for (let drop of raindrops) {
    line(drop.x, drop.y, drop.x, drop.y + drop.len);
    drop.y += drop.speed;
    if (drop.y > height) {
      drop.y = random(-100, 0);
      drop.x = random(width);
    }
  }

  // Draw floating petals
  noStroke();
  fill(random(330, 345), random(30, 60), random(90, 100), 85);
  for (let p of petals) {
    push();
    translate(p.x, p.y);
    rotate(p.angle);
    ellipse(0, 0, p.size, p.size * 0.6);
    pop();
    p.x += p.speedX;
    p.y -= p.speedY;
    p.angle += p.rotSpeed;
    if (p.y < -20) {
      p.y = height + 20;
      p.x = random(width);
    }
  }
}

  // Dim background
    push();
noStroke();
  fill(0, 0, 0, 120);           // translucent black overlay
  rect(0, 0, width, height);

  // Panel card
  fill(0, 0, 100, 96);          // white card (HSB)
  stroke(0, 0, 85, 100);
  strokeWeight(1.2);
  rect(journalBox.x, journalBox.y, journalBox.w, journalBox.h, 14);

  // Title & hint
  noStroke();
  fill(0, 0, 15);
  textSize(14);
  textStyle(BOLD);
  text("🪶 Journal reflection", journalBox.x + 14, journalBox.y + 24);
  textStyle(NORMAL);
  textSize(12);
  fill(0, 0, 25);
  text("What made you feel this way?  (Ctrl/Cmd+Enter to save, Esc to cancel)",
       journalBox.x + 14, journalBox.y + 40);
  pop();

// -------- LOG SYSTEM --------
function logCurrentMood() {
  openJournalPopup();   // no push here
}

    function openJournalPopup() {
  if (isJournalOpen) return;
  isJournalOpen = true;
// Park the card near the top-left so it doesn't cover the bloom
journalBox.x = 40;
journalBox.y = 260;
journalBox.w = 320;
journalBox.h = 100;

  // Create textarea
  journalInput = createElement('textarea');
  journalInput.attribute('rows', '5');
  journalInput.attribute('maxlength', '400');
  journalInput.style('resize', 'none');
  journalInput.style('outline', 'none');
  journalInput.style('border', '1px solid #d4eed8');
  journalInput.style('border-radius', '10px');
  journalInput.style('padding', '10px 12px');
  journalInput.style('font-size', '13px');
  journalInput.style('line-height', '1.35');
  journalInput.style('box-shadow', '0 4px 16px rgba(0,0,0,0.08)');
  journalInput.style('background', '#ffffff');


  // Create buttons
  journalSave = createButton('✅ Save');
  journalSave.mousePressed(saveJournalNote);
  journalSave.style('padding', '6px 10px');
  journalSave.style('border-radius', '10px');
  journalSave.style('border', 'none');
  journalSave.style('background', '#4CAF50');
  journalSave.style('color', '#fff');
  journalSave.style('font-size', '12px');
  journalSave.style('box-shadow', '0 2px 10px rgba(0,0,0,0.08)');

  journalCancel = createButton('✖ Cancel');
  journalCancel.mousePressed(closeJournalPopup);
  journalCancel.style('padding', '6px 10px');
  journalCancel.style('border-radius', '10px');
  journalCancel.style('border', '1px solid #ccc');
  journalCancel.style('background', '#fff');
  journalCancel.style('font-size', '12px');

  layoutJournalDOM(); // initial placement
}
function saveJournalNote() {
  const noteText =
    journalInput ? journalInput.value() : "";

  moodLog.push({
    mot: motivation,
    foc: focus,
    st: stress,
    t: (typeof millis === "function"
          ? millis()
        : (performance.now ? performance.now() : Date.now())),
    createdAt: new Date().toISOString(),
    note: noteText
  });

  if (moodLog.length > MAX_LOG) moodLog.shift();
  closeJournalPopup();
  clearedToastFrames = 80; // toast “Saved”
}


function closeJournalPopup() {
  isJournalOpen = false;
  if (journalInput) { journalInput.remove(); journalInput = null; }
  if (journalSave)  { journalSave.remove();  journalSave  = null; }
  if (journalCancel){ journalCancel.remove();journalCancel = null; }
}

function layoutJournalDOM() {
  if (!isJournalOpen) return;
  // Anchor DOM elements to canvas coordinates
  const x = journalBox.x + 12;
  const y = journalBox.y + 40;

  journalInput.size(journalBox.w - 24, 110);
  journalInput.position(x + window.scrollX, y + window.scrollY);

  journalSave.position(x + window.scrollX, y + 120 + window.scrollY);
  journalCancel.position(x + 80 + window.scrollX, y + 120 + window.scrollY);
}

// Optional: let user press Ctrl/Cmd+Enter to save, Esc to cancel
function keyPressed() {
  if (isJournalOpen) {
    if (keyCode === ESCAPE) { closeJournalPopup(); }
    if ((keyCode === ENTER) && (keyIsDown(CONTROL) || keyIsDown(91))) { // 91≈Cmd
      saveJournalNote();
      return false;
    }
  }
}

  // Save current mood + note
moodLog.push({
  mot: motivation,
  foc: focus,
  st: stress,
  t: (typeof millis === "function" ? millis() : (performance.now ? performance.now() : Date.now())),
  createdAt: new Date().toISOString(),
});


  // Keep list within limit
  if (moodLog.length > MAX_LOG) moodLog.shift();

  
function drawTimeline() {
  const margin = 12, stripH = 14;
  const stripX = margin, stripW = width - margin * 2;
  const stripY = height - stripH - 6;
  push();
  rectMode(CORNER);

  // strip background
  fill(0, 0, 100, 60);
  rect(stripX, stripY, stripW, stripH, 8);

  if (moodLog.length > 0) {
    const segW = max(2, stripW / moodLog.length);

    // segments
    for (let i = 0; i < moodLog.length; i++) {
      const { mot, st } = moodLog[i];
      const grayMix = map(st, 0, 100, 0, 1);
      const hue = lerp(200, 0, grayMix);
      const sat = lerp(40, 0, grayMix);
      const bri = lerp(90, 30, grayMix);
      fill(hue, sat, bri, 100);
      rect(stripX + i * segW, stripY, segW + 0.5, stripH, 4);
    }

    // label (draw BEFORE tooltip so tooltip can sit on top)
    fill(0, 0, 20, 80);
    textSize(11);
    textAlign(LEFT, BOTTOM);
    text("Mood Timeline (older → newer) — hover for details", stripX, stripY - 4);

    // ---- HOVER TOOLTIP (draw last) ----
    if (
      mouseX >= stripX && mouseX <= stripX + stripW &&
      mouseY >= stripY && mouseY <= stripY + stripH
    ) {
      let idx = floor((mouseX - stripX) / segW);
      idx = constrain(idx, 0, moodLog.length - 1);

      const segX = stripX + idx * segW;

      // highlight segment
      noFill(); stroke(0, 0, 10, 90); strokeWeight(2);
      rect(segX, stripY, segW + 0.5, stripH, 4);
      noStroke();

      // tooltip content
      const m = moodLog[idx];
      let tip = `#${idx + 1}\nMotivation: ${m.mot}\nFocus: ${m.foc}\nStress: ${m.st}`;
      if (m.note && m.note.trim() !== "") tip += `\nNote: ${m.note}`;

      // card position & clamp
      const padding = 10, tipW = 240, tipH = 120;
      let tx = mouseX + 14, ty = mouseY - tipH - 12;
      tx = constrain(tx, 12, width - tipW - 12);
      ty = constrain(ty, 12, height - tipH - 12);

      // shadow + card
      fill(0, 0, 0, 30); rect(tx + 2, ty + 3, tipW, tipH, 12);
      stroke(0, 0, 85, 100); strokeWeight(1.2);
      fill(0, 0, 100, 100); rect(tx, ty, tipW, tipH, 12);

      // text
      fill(0, 0, 15);
      textSize(12); textLeading(16); textAlign(LEFT, TOP);
      if (typeof textWrap === "function") textWrap(WORD);
      text(tip, tx + padding, ty + padding, tipW - padding * 2);
    }
  } else {
    // no logs yet
    fill(0, 0, 20, 70); textSize(11); textAlign(CENTER, CENTER);
    text(
      "No logs yet — click 📝 to add your first mood.",
      stripX + stripW / 2, stripY + stripH / 2
    );

    // label
    fill(0, 0, 20, 80); textSize(11); textAlign(LEFT, BOTTOM);
    text("Mood Timeline (older → newer) — hover for details", stripX, stripY - 4);
  }

  pop(); // closes push()
}


// -------- Toast --------
function drawToast(msg){
  const w = 160, h = 38;
  const x = width - w - 12;
  const y = 12;

  push();
  noStroke();

  // shadow
  fill(0, 0, 0, 30);
  rect(x + 2, y + 3, w, h, 10);

  // card
  fill(0, 0, 100, 95);
  rect(x, y, w, h, 10);

  // text
  fill(0, 0, 15);
  textSize(12);
  textAlign(CENTER, CENTER);
  text(msg, x + w / 2, y + h / 2);
  pop();
}
