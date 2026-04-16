
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

window.addEventListener("resize", () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});

/* ---------- DOM ---------- */
const scoreEl = document.getElementById("score");
const hpEl = document.getElementById("hp");
const waveEl = document.getElementById("wave");
const menu = document.getElementById("menu");
const gameover = document.getElementById("gameover");
const finalScore = document.getElementById("finalScore");
const startBtn = document.getElementById("startBtn");

/* ---------- GAME STATE ---------- */
let gameRunning = false;
let keys = {};
let bullets = [];
let enemies = [];
let particles = [];
let powerups = [];
let stars = [];

let score = 0;
let hp = 100;
let wave = 1;
let frame = 0;

let rapidFire = false;
let shield = false;
let bossActive = false;
let lastShot = 0;

let boss = null;

/* ---------- PLAYER ---------- */
const player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  w: 36,
  h: 36,
  speed: 6,
  color: "#00f7ff"
};

/* ---------- STARS ---------- */
for (let i = 0; i < 120; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2,
    speed: Math.random() * 2 + 0.5
  });
}

/* ---------- CONTROLS ---------- */
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.code === "Space" && gameRunning) shoot();
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

startBtn.onclick = () => {
  menu.classList.add("hidden");
  gameRunning = true;
  animate();
};

/* ---------- SHOOT ---------- */
function shoot() {
  const now = Date.now();

  if (!rapidFire && now - lastShot < 220) return;
  if (rapidFire && now - lastShot < 90) return;

  lastShot = now;

  bullets.push({
    x: player.x + player.w / 2 - 3,
    y: player.y,
    w: 6,
    h: 18,
    speed: 10
  });
}

/* ---------- SPAWN ---------- */
function spawnEnemy() {
  const size = Math.random() * 25 + 25;

  enemies.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    w: size,
    h: size,
    speed: Math.random() * 2 + wave * 0.45
  });
}

function spawnPowerup() {
  powerups.push({
    x: Math.random() * (canvas.width - 30),
    y: -30,
    w: 28,
    h: 28,
    type: Math.random() > 0.5 ? "shield" : "rapid"
  });
}

function spawnBoss() {
  bossActive = true;

  boss = {
    x: canvas.width / 2 - 80,
    y: 40,
    w: 160,
    h: 70,
    hp: 120,
    dir: 3
  };
}

/* ---------- EFFECTS ---------- */
function createExplosion(x, y) {
  for (let i = 0; i < 16; i++) {
    particles.push({
      x,
      y,
      dx: (Math.random() - 0.5) * 7,
      dy: (Math.random() - 0.5) * 7,
      size: Math.random() * 4 + 2,
      life: 30
    });
  }
}

/* ---------- UPDATE ---------- */
function updatePlayer() {
  if (keys["a"] || keys["arrowleft"]) player.x -= player.speed;
  if (keys["d"] || keys["arrowright"]) player.x += player.speed;
  if (keys["w"] || keys["arrowup"]) player.y -= player.speed;
  if (keys["s"] || keys["arrowdown"]) player.y += player.speed;

  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
}

function updateBullets() {
  bullets.forEach((b, i) => {
    b.y -= b.speed;
    if (b.y < -20) bullets.splice(i, 1);
  });
}

function updateEnemies() {
  enemies.forEach((e, ei) => {
    e.y += e.speed;

    /* hit player */
    if (
      e.x < player.x + player.w &&
      e.x + e.w > player.x &&
      e.y < player.y + player.h &&
      e.y + e.h > player.y
    ) {
      if (!shield) hp -= 15;

      createExplosion(e.x, e.y);
      enemies.splice(ei, 1);
    }

    /* off screen */
    if (e.y > canvas.height + 50) enemies.splice(ei, 1);

    /* hit bullet */
    bullets.forEach((b, bi) => {
      if (
        b.x < e.x + e.w &&
        b.x + b.w > e.x &&
        b.y < e.y + e.h &&
        b.y + b.h > e.y
      ) {
        score += 10;
        createExplosion(e.x, e.y);
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
      }
    });
  });
}

function updatePowerups() {
  powerups.forEach((p, i) => {
    p.y += 3;

    if (
      p.x < player.x + player.w &&
      p.x + p.w > player.x &&
      p.y < player.y + player.h &&
      p.y + p.h > player.y
    ) {
      if (p.type === "shield") {
        shield = true;
        setTimeout(() => shield = false, 7000);
      } else {
        rapidFire = true;
        setTimeout(() => rapidFire = false, 7000);
      }

      powerups.splice(i, 1);
    }

    if (p.y > canvas.height) powerups.splice(i, 1);
  });
}

function updateBoss() {
  if (!boss) return;

  boss.x += boss.dir;

  if (boss.x <= 0 || boss.x + boss.w >= canvas.width) boss.dir *= -1;

  bullets.forEach((b, bi) => {
    if (
      b.x < boss.x + boss.w &&
      b.x + b.w > boss.x &&
      b.y < boss.y + boss.h &&
      b.y + b.h > boss.y
    ) {
      boss.hp -= 5;
      bullets.splice(bi, 1);
    }
  });

  if (boss.hp <= 0) {
    score += 200;
    createExplosion(boss.x + 80, boss.y + 30);
    boss = null;
    bossActive = false;
  }
}

function updateParticles() {
  particles.forEach((p, i) => {
    p.x += p.dx;
    p.y += p.dy;
    p.life--;

    if (p.life <= 0) particles.splice(i, 1);
  });
}

/* ---------- DRAW ---------- */
function drawStars() {
  stars.forEach(s => {
    s.y += s.speed;

    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.shadowBlur = 20;
  ctx.shadowColor = player.color;

  ctx.beginPath();
  ctx.moveTo(player.x + player.w / 2, player.y);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;

  if (shield) {
    ctx.beginPath();
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    ctx.arc(player.x + 18, player.y + 18, 28, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBullets() {
  bullets.forEach(b => {
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#fff";
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });
  ctx.shadowBlur = 0;
}

function drawEnemies() {
  enemies.forEach(e => {
    ctx.fillStyle = "#ff2d75";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#ff2d75";
    ctx.fillRect(e.x, e.y, e.w, e.h);
  });
  ctx.shadowBlur = 0;
}

function drawPowerups() {
  powerups.forEach(p => {
    ctx.fillStyle = p.type === "shield" ? "#00ff88" : "#ffd700";

    ctx.beginPath();
    ctx.arc(p.x + 14, p.y + 14, 14, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBoss() {
  if (!boss) return;

  ctx.fillStyle = "#8a2eff";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#8a2eff";
  ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "red";
  ctx.fillRect(boss.x, boss.y - 12, boss.w, 8);

  ctx.fillStyle = "#00ff88";
  ctx.fillRect(boss.x, boss.y - 12, (boss.hp / 120) * boss.w, 8);
}

function drawParticles() {
  particles.forEach(p => {
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
}

/* ---------- HUD ---------- */
function updateHUD() {
  scoreEl.textContent = score;
  hpEl.textContent = hp;
  waveEl.textContent = wave;
}

/* ---------- END ---------- */
function endGame() {
  gameRunning = false;
  finalScore.textContent = score;
  gameover.classList.remove("hidden");
}

/* ---------- LOOP ---------- */
function animate() {
  if (!gameRunning) return;

  requestAnimationFrame(animate);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  frame++;

  drawStars();

  if (frame % Math.max(40 - wave * 2, 12) === 0 && !bossActive)
    spawnEnemy();

  if (frame % 600 === 0) spawnPowerup();

  if (score > wave * 100) wave++;

  if (wave % 5 === 0 && !bossActive && !boss) spawnBoss();

  updatePlayer();
  updateBullets();
  updateEnemies();
  updatePowerups();
  updateBoss();
  updateParticles();

  drawPlayer();
  drawBullets();
  drawEnemies();
  drawPowerups();
  drawBoss();
  drawParticles();

  updateHUD();

  if (hp <= 0) endGame();
}