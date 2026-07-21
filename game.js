const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const gameUI = document.getElementById("game-ui");

const healthBar = document.getElementById("health-bar");
const healthText = document.getElementById("health-text");
const manaBar = document.getElementById("mana-bar");
const manaText = document.getElementById("mana-text");

const playerLevel = document.getElementById("player-level");
const missionTitle = document.getElementById("mission-title");
const missionDescription = document.getElementById("mission-description");
const gameMessage = document.getElementById("game-message");

const attackButton = document.getElementById("attack-button");
const magicButton = document.getElementById("magic-button");
const interactButton = document.getElementById("interact-button");
const potionButton = document.getElementById("potion-button");
const potionCount = document.getElementById("potion-count");

const inventoryButton = document.getElementById("inventory-button");
const inventoryPanel = document.getElementById("inventory-panel");
const closeInventoryButton = document.getElementById(
  "close-inventory-button"
);

const interactionMessage = document.getElementById(
  "interaction-message"
);

const interactionText = document.getElementById(
  "interaction-text"
);

const joystickBase = document.getElementById("joystick-base");
const joystickStick = document.getElementById("joystick-stick");

let gameStarted = false;
let lastTime = 0;
let elapsedTime = 0;
let cameraShake = 0;

const TILE_WIDTH = 96;
const TILE_HEIGHT = 48;
const MAP_WIDTH = 18;
const MAP_HEIGHT = 18;

const keys = {};

const joystick = {
  active: false,
  pointerId: null,
  x: 0,
  y: 0,
  radius: 45
};

const camera = {
  x: 0,
  y: 0
};

const player = {
  x: 8,
  y: 8,
  radius: 0.25,
  speed: 3.1,
  directionX: 1,
  directionY: 0,
  health: 100,
  maxHealth: 100,
  mana: 60,
  maxMana: 60,
  level: 1,
  experience: 0,
  potions: 3,
  attackCooldown: 0,
  magicCooldown: 0,
  invulnerability: 0,
  animation: 0,
  isMoving: false
};

const gameState = {
  missionStage: 0,
  guardianDefeated: false,
  chestOpened: false,
  messageTimer: 0,
  gameOver: false
};

const map = [];

for (let y = 0; y < MAP_HEIGHT; y++) {
  const row = [];

  for (let x = 0; x < MAP_WIDTH; x++) {
    let type = "grass";

    if (
      x === 0 ||
      y === 0 ||
      x === MAP_WIDTH - 1 ||
      y === MAP_HEIGHT - 1
    ) {
      type = "wall";
    }

    if (
      (x > 3 && x < 14 && y === 4) ||
      (x > 3 && x < 14 && y === 13)
    ) {
      type = "stone";
    }

    if (
      (y > 4 && y < 13 && x === 4) ||
      (y > 4 && y < 13 && x === 13)
    ) {
      type = "stone";
    }

    if (
      (x === 8 || x === 9) &&
      (y === 4 || y === 13)
    ) {
      type = "grass";
    }

    row.push(type);
  }

  map.push(row);
}

const obstacles = [
  { x: 5, y: 6, type: "pillar" },
  { x: 12, y: 6, type: "pillar" },
  { x: 5, y: 11, type: "pillar" },
  { x: 12, y: 11, type: "pillar" },
  { x: 8, y: 5, type: "rock" },
  { x: 10, y: 12, type: "rock" },
  { x: 3, y: 9, type: "tree" },
  { x: 15, y: 8, type: "tree" }
];

const chest = {
  x: 9,
  y: 9,
  opened: false
};

const guardian = {
  x: 9,
  y: 7,
  health: 140,
  maxHealth: 140,
  alive: true,
  speed: 1.25,
  attackCooldown: 0,
  hitFlash: 0,
  animation: 0
};

const enemies = [
  createEnemy(6, 8),
  createEnemy(11, 9),
  createEnemy(8, 11)
];

const particles = [];
const projectiles = [];
const floatingTexts = [];

function createEnemy(x, y) {
  return {
    x,
    y,
    health: 45,
    maxHealth: 45,
    alive: true,
    speed: 1.05,
    attackCooldown: 0,
    hitFlash: 0,
    animation: Math.random() * Math.PI * 2
  };
}

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);

  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function worldToScreen(x, y, z = 0) {
  return {
    x:
      (x - y) * (TILE_WIDTH / 2) +
      window.innerWidth / 2 +
      camera.x,

    y:
      (x + y) * (TILE_HEIGHT / 2) +
      window.innerHeight * 0.25 +
      camera.y -
      z
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function showMessage(text, duration = 3) {
  gameMessage.textContent = text;
  gameState.messageTimer = duration;
}

function addFloatingText(x, y, text) {
  floatingTexts.push({
    x,
    y,
    text,
    life: 1,
    velocityY: -35
  });
}

function updateInterface() {
  const healthPercentage =
    (player.health / player.maxHealth) * 100;

  const manaPercentage =
    (player.mana / player.maxMana) * 100;

  healthBar.style.width = `${healthPercentage}%`;
  manaBar.style.width = `${manaPercentage}%`;

  healthText.textContent =
    `${Math.ceil(player.health)} / ${player.maxHealth}`;

  manaText.textContent =
    `${Math.ceil(player.mana)} / ${player.maxMana}`;

  playerLevel.textContent = `Nivel ${player.level}`;
  potionCount.textContent = player.potions;

  if (gameState.missionStage === 0) {
    missionTitle.textContent = "El despertar";
    missionDescription.textContent =
      "Encuentra y derrota al guardián de las ruinas.";
  }

  if (gameState.missionStage === 1) {
    missionTitle.textContent = "El tesoro perdido";
    missionDescription.textContent =
      "Abre el cofre ubicado en el centro de las ruinas.";
  }

  if (gameState.missionStage === 2) {
    missionTitle.textContent = "Misión completada";
    missionDescription.textContent =
      "Has recuperado el cristal de Eldoria.";
  }
}

function isBlocked(x, y) {
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);

  if (
    tileX < 0 ||
    tileY < 0 ||
    tileX >= MAP_WIDTH ||
    tileY >= MAP_HEIGHT
  ) {
    return true;
  }

  if (map[tileY][tileX] === "wall") {
    return true;
  }

  for (const obstacle of obstacles) {
    if (
      Math.hypot(x - obstacle.x, y - obstacle.y) < 0.6
    ) {
      return true;
    }
  }

  return false;
}

function updatePlayer(deltaTime) {
  let movementX = 0;
  let movementY = 0;

  if (keys.ArrowUp || keys.KeyW) {
    movementX -= 1;
    movementY -= 1;
  }

  if (keys.ArrowDown || keys.KeyS) {
    movementX += 1;
    movementY += 1;
  }

  if (keys.ArrowLeft || keys.KeyA) {
    movementX -= 1;
    movementY += 1;
  }

  if (keys.ArrowRight || keys.KeyD) {
    movementX += 1;
    movementY -= 1;
  }

  movementX += joystick.x;
  movementY += joystick.y;

  const movementLength = Math.hypot(movementX, movementY);

  player.isMoving = movementLength > 0.05;

  if (player.isMoving) {
    movementX /= movementLength;
    movementY /= movementLength;

    player.directionX = movementX;
    player.directionY = movementY;

    const nextX =
      player.x + movementX * player.speed * deltaTime;

    const nextY =
      player.y + movementY * player.speed * deltaTime;

    if (!isBlocked(nextX, player.y)) {
      player.x = nextX;
    }

    if (!isBlocked(player.x, nextY)) {
      player.y = nextY;
    }

    player.animation += deltaTime * 9;
  }

  player.attackCooldown = Math.max(
    0,
    player.attackCooldown - deltaTime
  );

  player.magicCooldown = Math.max(
    0,
    player.magicCooldown - deltaTime
  );

  player.invulnerability = Math.max(
    0,
    player.invulnerability - deltaTime
  );

  player.mana = Math.min(
    player.maxMana,
    player.mana + deltaTime * 3
  );

  camera.x +=
    (-((player.x - player.y) * TILE_WIDTH / 2) -
      camera.x) *
    deltaTime *
    3;

  camera.y +=
    (-((player.x + player.y) * TILE_HEIGHT / 2) +
      window.innerHeight * 0.22 -
      camera.y) *
    deltaTime *
    3;
}

function updateEnemies(deltaTime) {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    enemy.animation += deltaTime * 4;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - deltaTime);
    enemy.attackCooldown = Math.max(
      0,
      enemy.attackCooldown - deltaTime
    );

    const enemyDistance = distance(enemy, player);

    if (enemyDistance < 5 && enemyDistance > 0.7) {
      const directionX =
        (player.x - enemy.x) / enemyDistance;

      const directionY =
        (player.y - enemy.y) / enemyDistance;

      const nextX =
        enemy.x + directionX * enemy.speed * deltaTime;

      const nextY =
        enemy.y + directionY * enemy.speed * deltaTime;

      if (!isBlocked(nextX, enemy.y)) {
        enemy.x = nextX;
      }

      if (!isBlocked(enemy.x, nextY)) {
        enemy.y = nextY;
      }
    }

    if (
      enemyDistance < 0.8 &&
      enemy.attackCooldown <= 0
    ) {
      damagePlayer(8);
      enemy.attackCooldown = 1.25;
    }
  }

  if (!guardian.alive) {
    return;
  }

  guardian.animation += deltaTime * 3;
  guardian.hitFlash = Math.max(
    0,
    guardian.hitFlash - deltaTime
  );

  guardian.attackCooldown = Math.max(
    0,
    guardian.attackCooldown - deltaTime
  );

  const guardianDistance = distance(guardian, player);

  if (guardianDistance < 6 && guardianDistance > 0.9) {
    const directionX =
      (player.x - guardian.x) / guardianDistance;

    const directionY =
      (player.y - guardian.y) / guardianDistance;

    const nextX =
      guardian.x +
      directionX * guardian.speed * deltaTime;

    const nextY =
      guardian.y +
      directionY * guardian.speed * deltaTime;

    if (!isBlocked(nextX, guardian.y)) {
      guardian.x = nextX;
    }

    if (!isBlocked(guardian.x, nextY)) {
      guardian.y = nextY;
    }
  }

  if (
    guardianDistance < 1 &&
    guardian.attackCooldown <= 0
  ) {
    damagePlayer(16);
    guardian.attackCooldown = 1.5;
  }
}

function damagePlayer(amount) {
  if (
    player.invulnerability > 0 ||
    gameState.gameOver
  ) {
    return;
  }

  player.health -= amount;
  player.invulnerability = 0.65;
  cameraShake = 10;

  addFloatingText(player.x, player.y, `-${amount}`);
  createParticles(player.x, player.y, 8);

  if (player.health <= 0) {
    player.health = 0;
    gameState.gameOver = true;

    showMessage(
      "Has caído. Toca la pantalla para volver a intentarlo.",
      10
    );
  }

  updateInterface();
}

function attack() {
  if (
    player.attackCooldown > 0 ||
    gameState.gameOver
  ) {
    return;
  }

  player.attackCooldown = 0.5;
  cameraShake = 3;

  createParticles(
    player.x + player.directionX * 0.5,
    player.y + player.directionY * 0.5,
    5
  );

  let hitSomething = false;

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (distance(player, enemy) < 1.35) {
      damageEnemy(enemy, 25);
      hitSomething = true;
    }
  }

  if (
    guardian.alive &&
    distance(player, guardian) < 1.5
  ) {
    damageGuardian(22);
    hitSomething = true;
  }

  if (!hitSomething) {
    showMessage("Tu espada corta el aire.", 1.2);
  }
}

function castMagic() {
  if (
    player.magicCooldown > 0 ||
    player.mana < 15 ||
    gameState.gameOver
  ) {
    if (player.mana < 15) {
      showMessage("No tienes suficiente maná.", 1.5);
    }

    return;
  }

  player.mana -= 15;
  player.magicCooldown = 0.65;

  projectiles.push({
    x: player.x,
    y: player.y,
    directionX: player.directionX,
    directionY: player.directionY,
    speed: 7,
    life: 1.4,
    radius: 0.32
  });

  updateInterface();
}


function damageEnemy(enemy, amount) {
  enemy.health -= amount;
  enemy.hitFlash = 0.15;

  addFloatingText(enemy.x, enemy.y, `-${amount}`);
  createParticles(enemy.x, enemy.y, 7);

  if (enemy.health <= 0) {
    enemy.alive = false;
    player.experience += 30;

    showMessage(
      "Criatura derrotada. Has obtenido experiencia.",
      2
    );

    checkLevelUp();
  }
}

function damageGuardian(amount) {
  guardian.health -= amount;
  guardian.hitFlash = 0.15;

  addFloatingText(
    guardian.x,
    guardian.y,
    `-${amount}`
  );

  createParticles(guardian.x, guardian.y, 12);

  if (guardian.health <= 0) {
    guardian.health = 0;
    guardian.alive = false;

    gameState.guardianDefeated = true;
    gameState.missionStage = 1;

    player.experience += 100;

    showMessage(
      "El guardián ha sido derrotado. Abre el cofre.",
      4
    );

    checkLevelUp();
    updateInterface();
  }
}

function checkLevelUp() {
  const requiredExperience = player.level * 100;

  if (player.experience >= requiredExperience) {
    player.experience -= requiredExperience;
    player.level += 1;

    player.maxHealth += 20;
    player.maxMana += 10;

    player.health = player.maxHealth;
    player.mana = player.maxMana;

    showMessage(
      `Has alcanzado el nivel ${player.level}.`,
      3
    );

    updateInterface();
  }
}

function usePotion() {
  if (
    player.potions <= 0 ||
    player.health >= player.maxHealth ||
    gameState.gameOver
  ) {
    if (player.potions <= 0) {
      showMessage("No quedan pociones.", 1.5);
    } else if (player.health >= player.maxHealth) {
      showMessage("Tu salud ya está completa.", 1.5);
    }

    return;
  }

  player.potions -= 1;
  player.health = Math.min(
    player.maxHealth,
    player.health + 45
  );

  createParticles(player.x, player.y, 12);
  showMessage("Has recuperado salud.", 2);

  updateInterface();
}

function interact() {
  if (gameState.gameOver) {
    restartGame();
    return;
  }

  const chestDistance = distance(player, chest);

  if (chestDistance < 1.25) {
    if (!gameState.guardianDefeated) {
      showMessage(
        "Una fuerza oscura mantiene el cofre cerrado.",
        2.5
      );

      return;
    }

    if (!chest.opened) {
      chest.opened = true;
      gameState.chestOpened = true;
      gameState.missionStage = 2;

      player.potions += 2;
      player.experience += 50;

      createParticles(chest.x, chest.y, 25);

      showMessage(
        "Has encontrado el cristal de Eldoria y dos pociones.",
        5
      );

      checkLevelUp();
      updateInterface();

      return;
    }

    showMessage("El cofre está vacío.", 1.5);
    return;
  }

  showMessage(
    "No hay nada con lo que puedas interactuar.",
    1.5
  );
}

function restartGame() {
  player.x = 8;
  player.y = 8;
  player.health = player.maxHealth;
  player.mana = player.maxMana;
  player.invulnerability = 1;

  gameState.gameOver = false;

  showMessage(
    "Has regresado a las ruinas.",
    2
  );

  updateInterface();
}

function createParticles(x, y, amount) {
  for (let index = 0; index < amount; index++) {
    particles.push({
      x,
      y,
      offsetX: 0,
      offsetY: 0,
      velocityX: (Math.random() - 0.5) * 70,
      velocityY: -30 - Math.random() * 70,
      life: 0.4 + Math.random() * 0.5,
      size: 2 + Math.random() * 4
    });
  }
}

function updateProjectiles(deltaTime) {
  for (
    let index = projectiles.length - 1;
    index >= 0;
    index--
  ) {
    const projectile = projectiles[index];

    projectile.x +=
      projectile.directionX *
      projectile.speed *
      deltaTime;

    projectile.y +=
      projectile.directionY *
      projectile.speed *
      deltaTime;

    projectile.life -= deltaTime;

    createParticles(
      projectile.x,
      projectile.y,
      1
    );

    let collided = false;

    for (const enemy of enemies) {
      if (!enemy.alive) {
        continue;
      }

      if (distance(projectile, enemy) < 0.6) {
        damageEnemy(enemy, 35);
        collided = true;
        break;
      }
    }

    if (
      guardian.alive &&
      distance(projectile, guardian) < 0.75
    ) {
      damageGuardian(30);
      collided = true;
    }

    if (
      projectile.life <= 0 ||
      isBlocked(projectile.x, projectile.y) ||
      collided
    ) {
      createParticles(
        projectile.x,
        projectile.y,
        12
      );

      projectiles.splice(index, 1);
    }
  }
}

function updateEffects(deltaTime) {
  for (
    let index = particles.length - 1;
    index >= 0;
    index--
  ) {
    const particle = particles[index];

    particle.offsetX += particle.velocityX * deltaTime;
    particle.offsetY += particle.velocityY * deltaTime;

    particle.velocityY += 150 * deltaTime;
    particle.life -= deltaTime;

    if (particle.life <= 0) {
      particles.splice(index, 1);
    }
  }

  for (
    let index = floatingTexts.length - 1;
    index >= 0;
    index--
  ) {
    const text = floatingTexts[index];

    text.y += text.velocityY * deltaTime / TILE_HEIGHT;
    text.life -= deltaTime;

    if (text.life <= 0) {
      floatingTexts.splice(index, 1);
    }
  }

  cameraShake = Math.max(
    0,
    cameraShake - deltaTime * 30
  );

  if (gameState.messageTimer > 0) {
    gameState.messageTimer -= deltaTime;
  }
}

function updateInteractionIndicator() {
  const nearChest = distance(player, chest) < 1.35;

  if (nearChest) {
    interactionText.textContent = chest.opened
      ? "Cofre vacío"
      : "Abrir cofre";

    interactionMessage.classList.remove("hidden");
  } else {
    interactionMessage.classList.add("hidden");
  }
}

function drawTile(x, y, type) {
  const screen = worldToScreen(x, y);

  ctx.beginPath();
  ctx.moveTo(screen.x, screen.y);
  ctx.lineTo(
    screen.x + TILE_WIDTH / 2,
    screen.y + TILE_HEIGHT / 2
  );
  ctx.lineTo(
    screen.x,
    screen.y + TILE_HEIGHT
  );
  ctx.lineTo(
    screen.x - TILE_WIDTH / 2,
    screen.y + TILE_HEIGHT / 2
  );
  ctx.closePath();

  if (type === "grass") {
    ctx.fillStyle =
      (x + y) % 2 === 0 ? "#293b32" : "#24352d";
  }

  if (type === "stone") {
    ctx.fillStyle =
      (x + y) % 2 === 0 ? "#4c4d4c" : "#414342";
  }

  if (type === "wall") {
    ctx.fillStyle = "#1c2523";
  }

  ctx.fill();

  ctx.strokeStyle = "rgba(9, 14, 13, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (type === "stone") {
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();

    ctx.moveTo(
      screen.x - TILE_WIDTH * 0.2,
      screen.y + TILE_HEIGHT * 0.5
    );

    ctx.lineTo(
      screen.x + TILE_WIDTH * 0.1,
      screen.y + TILE_HEIGHT * 0.65
    );

    ctx.stroke();
  }
}

function drawWorldObject(object) {
  const screen = worldToScreen(object.x, object.y);

  if (object.type === "pillar") {
    ctx.fillStyle = "#242a29";
    ctx.fillRect(screen.x - 13, screen.y - 45, 26, 48);

    ctx.fillStyle = "#59605d";
    ctx.fillRect(screen.x - 17, screen.y - 50, 34, 9);

    ctx.fillStyle = "#373d3b";
    ctx.fillRect(screen.x - 18, screen.y - 4, 36, 9);
  }

  if (object.type === "rock") {
    ctx.fillStyle = "#343b39";

    ctx.beginPath();
    ctx.moveTo(screen.x - 20, screen.y);
    ctx.lineTo(screen.x - 12, screen.y - 18);
    ctx.lineTo(screen.x + 10, screen.y - 23);
    ctx.lineTo(screen.x + 22, screen.y - 5);
    ctx.lineTo(screen.x + 12, screen.y + 6);
    ctx.closePath();
    ctx.fill();
  }

  if (object.type === "tree") {
    ctx.fillStyle = "#30251d";
    ctx.fillRect(screen.x - 7, screen.y - 45, 14, 50);

    ctx.fillStyle = "#173326";

    ctx.beginPath();
    ctx.arc(screen.x, screen.y - 55, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#214833";

    ctx.beginPath();
    ctx.arc(
      screen.x - 10,
      screen.y - 67,
      18,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function drawChest() {
  const screen = worldToScreen(chest.x, chest.y);

  ctx.fillStyle = "#291d15";
  ctx.fillRect(screen.x - 22, screen.y - 18, 44, 24);

  ctx.fillStyle = chest.opened ? "#443326" : "#70502d";
  ctx.fillRect(screen.x - 20, screen.y - 30, 40, 16);

  ctx.fillStyle = "#c5a45c";
  ctx.fillRect(screen.x - 3, screen.y - 20, 6, 15);

  if (!chest.opened) {
    ctx.fillStyle = "rgba(221, 185, 96, 0.2)";

    ctx.beginPath();
    ctx.arc(
      screen.x,
      screen.y - 15,
      28 + Math.sin(elapsedTime * 3) * 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function drawCharacter(character, guardianMode = false) {
  if (!character.alive && character !== player) {
    return;
  }

  const screen = worldToScreen(character.x, character.y);

  const walk =
    character === player && player.isMoving
      ? Math.sin(player.animation) * 3
      : Math.sin(character.animation || 0) * 1.5;

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";

  ctx.beginPath();
  ctx.ellipse(
    screen.x,
    screen.y + 5,
    guardianMode ? 25 : 17,
    guardianMode ? 11 : 8,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  if (
    character === player &&
    player.invulnerability > 0 &&
    Math.floor(player.invulnerability * 15) % 2 === 0
  ) {
    ctx.globalAlpha = 0.4;
  }

  if (character.hitFlash > 0) {
    ctx.fillStyle = "#ffffff";
  } else if (guardianMode) {
    ctx.fillStyle = "#3b1c28";
  } else if (character === player) {
    ctx.fillStyle = "#233c59";
  } else {
    ctx.fillStyle = "#472c3e";
  }

  ctx.beginPath();

  ctx.moveTo(
    screen.x,
    screen.y - (guardianMode ? 54 : 45) + walk
  );

  ctx.lineTo(
    screen.x + (guardianMode ? 24 : 18),
    screen.y
  );

  ctx.lineTo(
    screen.x - (guardianMode ? 24 : 18),
    screen.y
  );

  ctx.closePath();
  ctx.fill();

  ctx.fillStyle =
    character.hitFlash > 0 ? "#ffffff" : "#d7b08a";

  ctx.beginPath();

  ctx.arc(
    screen.x,
    screen.y - (guardianMode ? 62 : 51) + walk,
    guardianMode ? 12 : 10,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle = guardianMode ? "#161418" : "#16283c";

  ctx.beginPath();

  ctx.moveTo(
    screen.x - (guardianMode ? 20 : 16),
    screen.y - (guardianMode ? 60 : 50) + walk
  );

  ctx.lineTo(
    screen.x,
    screen.y - (guardianMode ? 94 : 82) + walk
  );

  ctx.lineTo(
    screen.x + (guardianMode ? 20 : 16),
    screen.y - (guardianMode ? 60 : 50) + walk
  );

  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d6b75e";

  ctx.beginPath();

  ctx.arc(
    screen.x + 4,
    screen.y - (guardianMode ? 63 : 52) + walk,
    2,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.globalAlpha = 1;

  if (character !== player) {
    const healthWidth = guardianMode ? 62 : 40;
    const healthPercentage =
      character.health / character.maxHealth;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";

    ctx.fillRect(
      screen.x - healthWidth / 2,
      screen.y - (guardianMode ? 110 : 94),
      healthWidth,
      6
    );

    ctx.fillStyle = guardianMode ? "#9d293c" : "#a64242";

    ctx.fillRect(
      screen.x - healthWidth / 2,
      screen.y - (guardianMode ? 110 : 94),
      healthWidth * healthPercentage,
      6
    );
  }
}

function drawProjectiles() {
  for (const projectile of projectiles) {
    const screen = worldToScreen(
      projectile.x,
      projectile.y,
      22
    );

    const glow = ctx.createRadialGradient(
      screen.x,
      screen.y,
      1,
      screen.x,
      screen.y,
      18
    );

    glow.addColorStop(0, "rgba(255,255,220,1)");
    glow.addColorStop(0.3, "rgba(255,150,45,0.9)");
    glow.addColorStop(1, "rgba(255,70,20,0)");

    ctx.fillStyle = glow;

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEffects() {
  for (const particle of particles) {
    const screen = worldToScreen(particle.x, particle.y, 20);

    ctx.globalAlpha = clamp(particle.life * 2, 0, 1);
    ctx.fillStyle = "#e5b65a";

    ctx.fillRect(
      screen.x + particle.offsetX,
      screen.y + particle.offsetY,
      particle.size,
      particle.size
    );
  }

  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.font = "bold 18px sans-serif";

  for (const text of floatingTexts) {
    const screen = worldToScreen(text.x, text.y, 65);

    ctx.globalAlpha = clamp(text.life, 0, 1);
    ctx.fillStyle = "#ffd5a2";
    ctx.fillText(text.text, screen.x, screen.y);
  }

  ctx.globalAlpha = 1;
}

function drawScene() {
  const shakeX =
    cameraShake > 0
      ? (Math.random() - 0.5) * cameraShake
      : 0;

  const shakeY =
    cameraShake > 0
      ? (Math.random() - 0.5) * cameraShake
      : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  const background = ctx.createLinearGradient(
    0,
    0,
    0,
    window.innerHeight
  );

  background.addColorStop(0, "#090d12");
  background.addColorStop(1, "#151d1b");

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      drawTile(x, y, map[y][x]);
    }
  }

  const renderObjects = [];

  for (const obstacle of obstacles) {
    renderObjects.push({
      depth: obstacle.x + obstacle.y,
      draw: () => drawWorldObject(obstacle)
    });
  }

  renderObjects.push({
    depth: chest.x + chest.y,
    draw: drawChest
  });

  for (const enemy of enemies) {
    if (enemy.alive) {
      renderObjects.push({
        depth: enemy.x + enemy.y,
        draw: () => drawCharacter(enemy)
      });
    }
  }

  if (guardian.alive) {
    renderObjects.push({
      depth: guardian.x + guardian.y,
      draw: () => drawCharacter(guardian, true)
    });
  }

  renderObjects.push({
    depth: player.x + player.y,
    draw: () => drawCharacter(player)
  });

  renderObjects.sort((a, b) => a.depth - b.depth);

  for (const object of renderObjects) {
    object.draw();
  }

  drawProjectiles();
  drawEffects();

  ctx.restore();

  if (gameState.gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 34px serif";

    ctx.fillText(
      "Has caído",
      window.innerWidth / 2,
      window.innerHeight / 2 - 20
    );

    ctx.font = "18px sans-serif";

    ctx.fillText(
      "Pulsa Usar para regresar",
      window.innerWidth / 2,
      window.innerHeight / 2 + 22
    );
  }
}

function gameLoop(timestamp) {
  if (!gameStarted) {
    return;
  }

  const deltaTime = Math.min(
    (timestamp - lastTime) / 1000,
    0.033
  );

  lastTime = timestamp;
  elapsedTime += deltaTime;

  if (!gameState.gameOver) {
    updatePlayer(deltaTime);
    updateEnemies(deltaTime);
    updateProjectiles(deltaTime);
  }

  updateEffects(deltaTime);
  updateInteractionIndicator();
  drawScene();
  updateInterface();

  requestAnimationFrame(gameLoop);
}

function startGame() {
  gameStarted = true;

  startScreen.classList.remove("active");
  startScreen.classList.add("hidden");

  gameUI.classList.remove("hidden");

  showMessage(
    "Has despertado en las ruinas de Eldoria.",
    4
  );

  updateInterface();

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", event => {
  keys[event.code] = true;

  if (event.code === "Space") {
    event.preventDefault();
    attack();
  }

  if (event.code === "KeyQ") {
    castMagic();
  }

  if (event.code === "KeyE") {
    interact();
  }
});

window.addEventListener("keyup", event => {
  keys[event.code] = false;
});

joystickBase.addEventListener("pointerdown", event => {
  joystick.active = true;
  joystick.pointerId = event.pointerId;

  joystickBase.setPointerCapture(event.pointerId);
});

joystickBase.addEventListener("pointermove", event => {
  if (
    !joystick.active ||
    event.pointerId !== joystick.pointerId
  ) {
    return;
  }

  const bounds = joystickBase.getBoundingClientRect();

  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;

  let differenceX = event.clientX - centerX;
  let differenceY = event.clientY - centerY;

  const length = Math.hypot(differenceX, differenceY);

  if (length > joystick.radius) {
    differenceX =
      differenceX / length * joystick.radius;

    differenceY =
      differenceY / length * joystick.radius;
  }

  joystick.x = differenceX / joystick.radius;
  joystick.y = differenceY / joystick.radius;

  joystickStick.style.transform =
    `translate(${differenceX}px, ${differenceY}px)`;
});

function releaseJoystick(event) {
  if (
    event.pointerId !== joystick.pointerId
  ) {
    return;
  }

  joystick.active = false;
  joystick.pointerId = null;
  joystick.x = 0;
  joystick.y = 0;

  joystickStick.style.transform =
    "translate(0px, 0px)";
}

joystickBase.addEventListener(
  "pointerup",
  releaseJoystick
);

joystickBase.addEventListener(
  "pointercancel",
  releaseJoystick
);

startButton.addEventListener("click", startGame);
attackButton.addEventListener("click", attack);
magicButton.addEventListener("click", castMagic);
interactButton.addEventListener("click", interact);
potionButton.addEventListener("click", usePotion);

inventoryButton.addEventListener("click", () => {
  inventoryPanel.classList.remove("hidden");
});

closeInventoryButton.addEventListener("click", () => {
  inventoryPanel.classList.add("hidden");
});

inventoryPanel.addEventListener("click", event => {
  if (event.target === inventoryPanel) {
    inventoryPanel.classList.add("hidden");
  }
});

canvas.addEventListener("contextmenu", event => {
  event.preventDefault();
});

updateInterface();
drawScene();
