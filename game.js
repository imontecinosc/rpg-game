const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const characterCanvas = document.getElementById("characterCanvas");
const characterCtx = characterCanvas.getContext("2d");

const minimapCanvas = document.getElementById("minimapCanvas");
const minimapCtx = minimapCanvas.getContext("2d");

const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const gameUI = document.getElementById("game-ui");
const orientationScreen = document.getElementById("orientation-screen");

const healthBar = document.getElementById("health-bar");
const healthText = document.getElementById("health-text");
const manaBar = document.getElementById("mana-bar");
const manaText = document.getElementById("mana-text");
const staminaBar = document.getElementById("stamina-bar");
const staminaText = document.getElementById("stamina-text");

const playerTitle = document.getElementById("player-title");
const goldDisplay = document.getElementById("gold-display");
const inventoryGold = document.getElementById("inventory-gold");
const shopPlayerGold = document.getElementById("shop-player-gold");

const zoneName = document.getElementById("zone-name");
const zoneDescription = document.getElementById("zone-description");
const gameMessage = document.getElementById("game-message");

const skillNotifications = document.getElementById("skill-notifications");
const interactionMessage = document.getElementById("interaction-message");
const interactionText = document.getElementById("interaction-text");

const joystickBase = document.getElementById("joystick-base");
const joystickStick = document.getElementById("joystick-stick");

const attackButton = document.getElementById("attack-button");
const magicButton = document.getElementById("magic-button");
const interactButton = document.getElementById("interact-button");
const potionButton = document.getElementById("potion-button");
const potionCount = document.getElementById("potion-count");

const inventoryButton = document.getElementById("inventory-button");
const characterButton = document.getElementById("character-button");
const skillsButton = document.getElementById("skills-button");
const mapButton = document.getElementById("map-button");

const inventoryPanel = document.getElementById("inventory-panel");
const characterPanel = document.getElementById("character-panel");
const skillsPanel = document.getElementById("skills-panel");
const shopPanel = document.getElementById("shop-panel");
const bankPanel = document.getElementById("bank-panel");
const mapPanel = document.getElementById("map-panel");
const lootPanel = document.getElementById("loot-panel");

const closeInventoryButton = document.getElementById("close-inventory-button");
const closeCharacterButton = document.getElementById("close-character-button");
const closeSkillsButton = document.getElementById("close-skills-button");
const closeShopButton = document.getElementById("close-shop-button");
const closeBankButton = document.getElementById("close-bank-button");
const closeMapButton = document.getElementById("close-map-button");
const closeLootButton = document.getElementById("close-loot-button");

const inventoryGrid = document.getElementById("inventory-grid");
const itemDetailsName = document.getElementById("item-details-name");
const itemDetailsDescription = document.getElementById("item-details-description");
const itemDetailsStats = document.getElementById("item-details-stats");
const equipItemButton = document.getElementById("equip-item-button");
const dropItemButton = document.getElementById("drop-item-button");

const skillsList = document.getElementById("skills-list");
const skillTotal = document.getElementById("skill-total");

const shopType = document.getElementById("shop-type");
const shopName = document.getElementById("shop-name");
const shopItems = document.getElementById("shop-items");
const shopItemName = document.getElementById("shop-item-name");
const shopItemDescription = document.getElementById("shop-item-description");
const shopItemStats = document.getElementById("shop-item-stats");
const shopConfirmButton = document.getElementById("shop-confirm-button");
const shopBuyTab = document.getElementById("shop-buy-tab");
const shopSellTab = document.getElementById("shop-sell-tab");

const bankInventoryGrid = document.getElementById("bank-inventory-grid");
const bankStorageGrid = document.getElementById("bank-storage-grid");
const bankCapacity = document.getElementById("bank-capacity");
const depositItemButton = document.getElementById("deposit-item-button");
const withdrawItemButton = document.getElementById("withdraw-item-button");

const lootItems = document.getElementById("loot-items");
const takeSelectedLootButton = document.getElementById("take-selected-loot-button");
const takeAllLootButton = document.getElementById("take-all-loot-button");

const specialEnemyAlert = document.getElementById("special-enemy-alert");
const specialEnemyMessage = document.getElementById("special-enemy-message");

const statDamage = document.getElementById("stat-damage");
const statDefense = document.getElementById("stat-defense");
const statAccuracy = document.getElementById("stat-accuracy");
const statMagicPower = document.getElementById("stat-magic-power");
const statAttackSpeed = document.getElementById("stat-attack-speed");
const statMagicResistance = document.getElementById("stat-magic-resistance");

const WORLD_SIZE = 200;
const TILE_WIDTH = 72;
const TILE_HEIGHT = 36;
const VIEW_DISTANCE = 17;
const ENEMY_RESPAWN_SECONDS = 120;
const SPECIAL_RESPAWN_SECONDS = 240;

let gameStarted = false;
let gamePaused = false;
let lastTime = 0;
let elapsedTime = 0;
let activeTouchId = null;
let selectedInventoryIndex = -1;
let selectedBankInventoryIndex = -1;
let selectedBankStorageIndex = -1;
let selectedShopIndex = -1;
let selectedLootIndex = -1;
let activeShop = null;
let shopMode = "buy";
let currentLootSource = null;
let nextSpecialSpawn = SPECIAL_RESPAWN_SECONDS;
let cameraShake = 0;

const joystick = {
  active: false,
  x: 0,
  y: 0
};

const camera = {
  x: 0,
  y: 0
};

const skills = {
  swords: createSkill("Espadas", 20),
  tactics: createSkill("Tácticas", 20),
  anatomy: createSkill("Anatomía", 20),
  defense: createSkill("Defensa", 20),
  endurance: createSkill("Resistencia", 20),
  healing: createSkill("Curación", 20),
  magery: createSkill("Magia", 20),
  evaluating: createSkill("Evaluar inteligencia", 20),
  meditation: createSkill("Meditación", 20),
  magicResistance: createSkill("Resistencia mágica", 20),
  inscription: createSkill("Inscripción", 20)
};

function createSkill(name, value) {
  return {
    name,
    value,
    lock: "up",
    progress: 0
  };
}

const player = {
  name: "Aldren",
  x: 100,
  y: 100,
  speed: 4,
  directionX: 1,
  directionY: 0,
  health: 100,
  maxHealth: 100,
  mana: 60,
  maxMana: 60,
  stamina: 80,
  maxStamina: 80,
  gold: 250,
  potions: 3,
  attackCooldown: 0,
  magicCooldown: 0,
  invulnerability: 0,
  attackAnimation: 0,
  magicAnimation: 0,
  walkAnimation: 0,
  isMoving: false,
  dialogue: "",
  dialogueTimer: 0,
  inventory: [],
  bank: [],
  equipment: {
    head: null,
    neck: null,
    chest: null,
    arms: null,
    gloves: null,
    legs: null,
    boots: null,
    mainHand: null,
    offHand: null,
    ring1: null,
    ring2: null
  }
};

const itemTemplates = {
  oldSword: {
    id: "oldSword",
    name: "Espada vieja",
    icon: "🗡️",
    slot: "mainHand",
    type: "weapon",
    value: 25,
    description: "Una espada sencilla pero confiable.",
    stats: { damageMin: 5, damageMax: 9 }
  },

  ironSword: {
    id: "ironSword",
    name: "Espada de hierro",
    icon: "⚔️",
    slot: "mainHand",
    type: "weapon",
    value: 120,
    description: "Una espada bien equilibrada.",
    stats: { damageMin: 8, damageMax: 14, accuracy: 3 }
  },

  knightSword: {
    id: "knightSword",
    name: "Espada del caballero",
    icon: "⚔️",
    slot: "mainHand",
    type: "weapon",
    value: 380,
    description: "Una hoja pesada creada para guerreros expertos.",
    stats: { damageMin: 13, damageMax: 21, tactics: 4 }
  },

  wornBook: {
    id: "wornBook",
    name: "Grimorio gastado",
    icon: "📖",
    slot: "offHand",
    type: "spellbook",
    value: 30,
    description: "Contiene hechizos básicos.",
    stats: { magicPower: 3 }
  },

  arcaneBook: {
    id: "arcaneBook",
    name: "Grimorio arcano",
    icon: "📘",
    slot: "offHand",
    type: "spellbook",
    value: 300,
    description: "Un grimorio cargado de energía arcana.",
    stats: { magicPower: 9, mana: 12 }
  },

  leatherChest: {
    id: "leatherChest",
    name: "Pechera de cuero",
    icon: "🥋",
    slot: "chest",
    type: "armor",
    value: 80,
    description: "Protección ligera y flexible.",
    stats: { defense: 4 }
  },

  ironChest: {
    id: "ironChest",
    name: "Pechera de hierro",
    icon: "🛡️",
    slot: "chest",
    type: "armor",
    value: 260,
    description: "Armadura resistente de hierro.",
    stats: { defense: 10, health: 12 }
  },

  leatherArms: {
    id: "leatherArms",
    name: "Brazos de cuero",
    icon: "🥋",
    slot: "arms",
    type: "armor",
    value: 60,
    description: "Protecciones ligeras para los brazos.",
    stats: { defense: 2 }
  },

  leatherGloves: {
    id: "leatherGloves",
    name: "Guantes de cuero",
    icon: "🧤",
    slot: "gloves",
    type: "armor",
    value: 45,
    description: "Guantes simples de aventurero.",
    stats: { defense: 1, accuracy: 2 }
  },

  leatherLegs: {
    id: "leatherLegs",
    name: "Pantalones de cuero",
    icon: "👖",
    slot: "legs",
    type: "armor",
    value: 70,
    description: "Protección flexible para las piernas.",
    stats: { defense: 3 }
  },

  leatherBoots: {
    id: "leatherBoots",
    name: "Botas de cuero",
    icon: "🥾",
    slot: "boots",
    type: "armor",
    value: 55,
    description: "Botas resistentes para recorrer Eldoria.",
    stats: { defense: 1, speed: 0.15 }
  },

  silverNecklace: {
    id: "silverNecklace",
    name: "Collar de plata",
    icon: "📿",
    slot: "neck",
    type: "jewelry",
    value: 180,
    description: "Reduce ligeramente el daño mágico.",
    stats: { magicResistance: 5 }
  },

  accuracyRing: {
    id: "accuracyRing",
    name: "Anillo del halcón",
    icon: "💍",
    slot: "ring",
    type: "jewelry",
    value: 340,
    description: "Mejora la precisión del portador.",
    stats: { accuracy: 8 }
  },

  vampireRing: {
    id: "vampireRing",
    name: "Anillo carmesí",
    icon: "💍",
    slot: "ring",
    type: "jewelry",
    value: 800,
    description: "Recupera una pequeña cantidad de vida al golpear.",
    stats: { lifeSteal: 0.08, damageMin: 2, damageMax: 3 }
  },

  manaRing: {
    id: "manaRing",
    name: "Anillo de meditación",
    icon: "💍",
    slot: "ring",
    type: "jewelry",
    value: 500,
    description: "Aumenta el maná y su regeneración.",
    stats: { mana: 15, manaRegen: 1.5 }
  },

  potion: {
    id: "potion",
    name: "Poción de curación",
    icon: "🧪",
    slot: null,
    type: "consumable",
    value: 35,
    description: "Recupera salud."
  },

  magicScroll: {
    id: "magicScroll",
    name: "Pergamino arcano",
    icon: "📜",
    slot: null,
    type: "consumable",
    value: 70,
    description: "Un pergamino que incrementa Magia ligeramente."
  },

  bone: {
    id: "bone",
    name: "Hueso antiguo",
    icon: "🦴",
    slot: null,
    type: "loot",
    value: 14,
    description: "Restos recogidos del cementerio."
  },

  darkCrystal: {
    id: "darkCrystal",
    name: "Cristal oscuro",
    icon: "🔮",
    slot: null,
    type: "loot",
    value: 80,
    description: "Un cristal cargado de magia corrupta."
  }
};

function createItem(templateId) {
  const template = itemTemplates[templateId];

  return {
    ...template,
    uid: `${templateId}-${Date.now()}-${Math.random()}`,
    stats: { ...(template.stats || {}) }
  };
}

player.equipment.mainHand = createItem("oldSword");
player.equipment.offHand = createItem("wornBook");
player.inventory.push(createItem("potion"));
player.inventory.push(createItem("potion"));
player.inventory.push(createItem("leatherChest"));

const buildings = [
  {
    id: "bank",
    name: "Banco de Eldoria",
    x: 96,
    y: 96,
    w: 8,
    h: 8,
    doorX: 100,
    doorY: 104,
    color: "#72634e"
  },
  {
    id: "smith",
    name: "Herrería del León",
    x: 112,
    y: 94,
    w: 9,
    h: 8,
    doorX: 116,
    doorY: 102,
    color: "#6e5542"
  },
  {
    id: "mageShop",
    name: "Torre Arcana",
    x: 82,
    y: 92,
    w: 8,
    h: 10,
    doorX: 86,
    doorY: 102,
    color: "#564a72"
  },
  {
    id: "armorer",
    name: "Armería Real",
    x: 106,
    y: 110,
    w: 9,
    h: 8,
    doorX: 110,
    doorY: 110,
    color: "#59616a"
  },
  {
    id: "tavern",
    name: "La Corona Dorada",
    x: 86,
    y: 110,
    w: 9,
    h: 8,
    doorX: 90,
    doorY: 110,
    color: "#795843"
  },
  {
    id: "cemeteryChapel",
    name: "Capilla Abandonada",
    x: 154,
    y: 40,
    w: 10,
    h: 10,
    doorX: 159,
    doorY: 50,
    color: "#4a4b50"
  }
];

const npcs = [
  createNpc(
    "banker",
    "Edwin, banquero",
    100,
    101,
    "bank",
    "Bienvenido. Tus pertenencias estarán seguras conmigo."
  ),
  createNpc(
    "blacksmith",
    "Brom, herrero",
    116,
    99,
    "weaponShop",
    "Tengo armas dignas de un verdadero guerrero."
  ),
  createNpc(
    "mage",
    "Selene, hechicera",
    86,
    98,
    "magicShop",
    "Los secretos arcanos tienen un precio."
  ),
  createNpc(
    "armorer",
    "Gareth, armero",
    110,
    114,
    "armorShop",
    "Una buena armadura puede salvarte la vida."
  ),
  createNpc(
    "innkeeper",
    "Mara, tabernera",
    90,
    114,
    "generalShop",
    "Descansa y compra provisiones para el camino."
  )
];

function createNpc(id, name, x, y, role, greeting) {
  return {
    id,
    name,
    x,
    y,
    role,
    greeting,
    dialogue: "",
    dialogueTimer: 0,
    animation: Math.random() * 10
  };
}

const shops = {
  weaponShop: {
    name: "Herrería del León",
    type: "HERRERO",
    items: [
      createItem("ironSword"),
      createItem("knightSword"),
      createItem("leatherGloves")
    ]
  },

  magicShop: {
    name: "Torre Arcana",
    type: "MAGIA",
    items: [
      createItem("arcaneBook"),
      createItem("manaRing"),
      createItem("magicScroll")
    ]
  },

  armorShop: {
    name: "Armería Real",
    type: "ARMADURAS",
    items: [
      createItem("leatherChest"),
      createItem("ironChest"),
      createItem("leatherArms"),
      createItem("leatherLegs"),
      createItem("leatherBoots"),
      createItem("silverNecklace")
    ]
  },

  generalShop: {
    name: "La Corona Dorada",
    type: "PROVISIONES",
    items: [
      createItem("potion"),
      createItem("potion"),
      createItem("potion")
    ]
  }
};

const cemeteryZone = {
  x: 140,
  y: 24,
  w: 45,
  h: 45
};

const enemies = [];
const projectiles = [];
const enemyProjectiles = [];
const particles = [];
const floatingTexts = [];
const corpses = [];

spawnInitialEnemies();

function spawnInitialEnemies() {
  const zombiePositions = [
    [148, 34],
    [153, 39],
    [160, 31],
    [166, 43],
    [172, 36],
    [146, 52],
    [158, 57],
    [176, 54]
  ];

  const magePositions = [
    [169, 29],
    [180, 44],
    [152, 61]
  ];

  zombiePositions.forEach(([x, y], index) => {
    enemies.push(
      createEnemy(
        `zombie-${index}`,
        "Zombi",
        "zombie",
        x,
        y,
        55 + index * 4,
        5 + Math.floor(index / 3)
      )
    );
  });

  magePositions.forEach(([x, y], index) => {
    enemies.push(
      createEnemy(
        `dark-mage-${index}`,
        "Mago oscuro",
        "mage",
        x,
        y,
        85 + index * 12,
        12 + index * 3
      )
    );
  });
}

function createEnemy(id, name, type, x, y, health, damage) {
  return {
    id,
    name,
    type,
    x,
    y,
    spawnX: x,
    spawnY: y,
    health,
    maxHealth: health,
    damage,
    speed: type === "zombie" ? 1.45 : 1.2,
    alive: true,
    respawnTimer: 0,
    attackCooldown: 0,
    castCooldown: 1 + Math.random() * 2,
    hitFlash: 0,
    animation: Math.random() * 10,
    special: false,
    loot: []
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

function worldToScreen(x, y, z = 0) {
  return {
    x:
      (x - y) * (TILE_WIDTH / 2) +
      window.innerWidth / 2 +
      camera.x,

    y:
      (x + y) * (TILE_HEIGHT / 2) +
      window.innerHeight * 0.28 +
      camera.y -
      z
  };
}

function screenDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

function tileType(x, y) {
  if (
    x < 0 ||
    y < 0 ||
    x >= WORLD_SIZE ||
    y >= WORLD_SIZE
  ) {
    return "void";
  }

  if (
    x < 5 ||
    y < 5 ||
    x > WORLD_SIZE - 6 ||
    y > WORLD_SIZE - 6
  ) {
    return "water";
  }

  if (
    x >= cemeteryZone.x &&
    y >= cemeteryZone.y &&
    x < cemeteryZone.x + cemeteryZone.w &&
    y < cemeteryZone.y + cemeteryZone.h
  ) {
    if (
      x === cemeteryZone.x ||
      y === cemeteryZone.y ||
      x === cemeteryZone.x + cemeteryZone.w - 1 ||
      y === cemeteryZone.y + cemeteryZone.h - 1
    ) {
      return "cemeteryWall";
    }

    if (
      x % 5 === 0 ||
      y % 6 === 0
    ) {
      return "cemeteryPath";
    }

    return "cemetery";
  }

  const centralRoad =
    Math.abs(x - 100) <= 2 ||
    Math.abs(y - 100) <= 2;

  const secondaryRoad =
    Math.abs(x - 75) <= 1 ||
    Math.abs(x - 125) <= 1 ||
    Math.abs(y - 75) <= 1 ||
    Math.abs(y - 125) <= 1;

  if (centralRoad || secondaryRoad) {
    return "road";
  }

  if (
    x > 92 &&
    x < 108 &&
    y > 92 &&
    y < 108
  ) {
    return "plaza";
  }

  if (
    x > 25 &&
    x < 60 &&
    y > 135 &&
    y < 175
  ) {
    return "forest";
  }

  return "grass";
}

function buildingAt(x, y) {
  return buildings.find(building => {
    return (
      x >= building.x &&
      y >= building.y &&
      x < building.x + building.w &&
      y < building.y + building.h
    );
  });
}

function isInsideBuilding(entity, building) {
  return (
    entity.x > building.x + 0.3 &&
    entity.y > building.y + 0.3 &&
    entity.x < building.x + building.w - 0.3 &&
    entity.y < building.y + building.h - 0.3
  );
}

function isBlocked(x, y) {
  const type = tileType(Math.floor(x), Math.floor(y));

  if (
    type === "void" ||
    type === "water" ||
    type === "cemeteryWall"
  ) {
    return true;
  }

  for (const building of buildings) {
    const insideBounds =
      x >= building.x &&
      y >= building.y &&
      x < building.x + building.w &&
      y < building.y + building.h;

    if (!insideBounds) {
      continue;
    }

    const nearDoor =
      Math.hypot(
        x - building.doorX,
        y - building.doorY
      ) < 1.15;

    const inside =
      x > building.x + 0.55 &&
      y > building.y + 0.55 &&
      x < building.x + building.w - 0.55 &&
      y < building.y + building.h - 0.55;

    if (!inside && !nearDoor) {
      return true;
    }
  }

  return false;
}

function getEquipmentStats() {
  const stats = {
    damageMin: 1,
    damageMax: 3,
    defense: 0,
    accuracy: 0,
    magicPower: 0,
    magicResistance: 0,
    health: 0,
    mana: 0,
    speed: 0,
    manaRegen: 0,
    lifeSteal: 0,
    tactics: 0
  };

  Object.values(player.equipment).forEach(item => {
    if (!item || !item.stats) {
      return;
    }

    Object.entries(item.stats).forEach(([key, value]) => {
      stats[key] = (stats[key] || 0) + value;
    });
  });

  return stats;
}

function updateDerivedStats() {
  const equipmentStats = getEquipmentStats();

  player.maxHealth =
    80 +
    skills.endurance.value * 1.2 +
    equipmentStats.health;

  player.maxMana =
    40 +
    skills.magery.value * 0.8 +
    equipmentStats.mana;

  player.maxStamina =
    60 +
    skills.endurance.value;

  player.speed =
    3.8 +
    equipmentStats.speed;

  player.health = Math.min(player.health, player.maxHealth);
  player.mana = Math.min(player.mana, player.maxMana);
  player.stamina = Math.min(player.stamina, player.maxStamina);
}

function getCombatStats() {
  const equipmentStats = getEquipmentStats();

  const damageMin =
    equipmentStats.damageMin +
    skills.tactics.value * 0.08 +
    equipmentStats.tactics * 0.1;

  const damageMax =
    equipmentStats.damageMax +
    skills.tactics.value * 0.13 +
    skills.anatomy.value * 0.04;

  const accuracy =
    clamp(
      38 +
      skills.swords.value * 0.55 +
      equipmentStats.accuracy,
      30,
      96
    );

  const magicAccuracy =
    clamp(
      42 +
      skills.magery.value * 0.52 +
      skills.evaluating.value * 0.12,
      35,
      97
    );

  const magicPower =
    4 +
    skills.magery.value * 0.18 +
    skills.evaluating.value * 0.12 +
    equipmentStats.magicPower;

  const attackSpeed =
    clamp(
      0.65 -
      skills.swords.value * 0.0015,
      0.42,
      0.65
    );

  return {
    damageMin,
    damageMax,
    accuracy,
    magicAccuracy,
    magicPower,
    attackSpeed,
    defense:
      equipmentStats.defense +
      skills.defense.value * 0.16,
    magicResistance:
      equipmentStats.magicResistance +
      skills.magicResistance.value * 0.18,
    lifeSteal: equipmentStats.lifeSteal,
    manaRegen:
      1.8 +
      skills.meditation.value * 0.06 +
      equipmentStats.manaRegen
  };
}

function updatePlayer(deltaTime) {
  let movementX = joystick.y + joystick.x;
  let movementY = joystick.y - joystick.x;

  const movementLength = Math.hypot(movementX, movementY);

  player.isMoving = movementLength > 0.08;

  if (player.isMoving && !isPanelOpen()) {
    movementX /= movementLength;
    movementY /= movementLength;

    player.directionX = movementX;
    player.directionY = movementY;

    const staminaFactor =
      player.stamina > 0 ? 1 : 0.65;

    const nextX =
      player.x +
      movementX *
      player.speed *
      staminaFactor *
      deltaTime;

    const nextY =
      player.y +
      movementY *
      player.speed *
      staminaFactor *
      deltaTime;

    if (!isBlocked(nextX, player.y)) {
      player.x = nextX;
    }

    if (!isBlocked(player.x, nextY)) {
      player.y = nextY;
    }

    player.walkAnimation += deltaTime * 10;

    player.stamina = Math.max(
      0,
      player.stamina - deltaTime * 2.2
    );
  } else {
    player.stamina = Math.min(
      player.maxStamina,
      player.stamina + deltaTime * 8
    );
  }

  const combatStats = getCombatStats();

  player.mana = Math.min(
    player.maxMana,
    player.mana + combatStats.manaRegen * deltaTime
  );

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

  player.attackAnimation = Math.max(
    0,
    player.attackAnimation - deltaTime * 4.5
  );

  player.magicAnimation = Math.max(
    0,
    player.magicAnimation - deltaTime * 3.5
  );

  player.dialogueTimer = Math.max(
    0,
    player.dialogueTimer - deltaTime
  );

  const targetCameraX =
    -((player.x - player.y) * TILE_WIDTH / 2);

  const targetCameraY =
    -((player.x + player.y) * TILE_HEIGHT / 2) +
    window.innerHeight * 0.17;

  camera.x +=
    (targetCameraX - camera.x) *
    deltaTime *
    5;

  camera.y +=
    (targetCameraY - camera.y) *
    deltaTime *
    5;
}

function updateNpcs(deltaTime) {
  npcs.forEach(npc => {
    npc.animation += deltaTime * 2;
    npc.dialogueTimer = Math.max(0, npc.dialogueTimer - deltaTime);
  });
}

function updateEnemies(deltaTime) {
  enemies.forEach(enemy => {
    if (!enemy.alive) {
      enemy.respawnTimer -= deltaTime;

      if (enemy.respawnTimer <= 0) {
        respawnEnemy(enemy);
      }

      return;
    }

    enemy.animation += deltaTime * 4;
    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - deltaTime);
    enemy.castCooldown = Math.max(0, enemy.castCooldown - deltaTime);
    enemy.hitFlash = Math.max(0, enemy.hitFlash - deltaTime);

    const distanceToPlayer = screenDistance(enemy, player);
    const distanceToSpawn = Math.hypot(
      enemy.x - enemy.spawnX,
      enemy.y - enemy.spawnY
    );

    if (distanceToSpawn > 12) {
      moveEnemyToward(
        enemy,
        enemy.spawnX,
        enemy.spawnY,
        deltaTime
      );

      return;
    }

    if (distanceToPlayer > 9) {
      return;
    }

    if (
      enemy.type === "zombie" ||
      enemy.special
    ) {
      if (distanceToPlayer > 0.9) {
        moveEnemyToward(
          enemy,
          player.x,
          player.y,
          deltaTime
        );
      }

      if (
        distanceToPlayer <= 1 &&
        enemy.attackCooldown <= 0
      ) {
        damagePlayer(enemy.damage, false);
        enemy.attackCooldown = enemy.special ? 0.85 : 1.25;
      }
    }

    if (enemy.type === "mage") {
      if (distanceToPlayer < 3.2) {
        moveEnemyToward(
          enemy,
          enemy.x - (player.x - enemy.x),
          enemy.y - (player.y - enemy.y),
          deltaTime
        );
      } else if (distanceToPlayer > 5.8) {
        moveEnemyToward(
          enemy,
          player.x,
          player.y,
          deltaTime
        );
      }

      if (
        distanceToPlayer <= 7 &&
        enemy.castCooldown <= 0
      ) {
        castEnemySpell(enemy);
        enemy.castCooldown = enemy.special ? 1.15 : 2.4;
      }
    }
  });

  nextSpecialSpawn -= deltaTime;

  const specialAlive = enemies.some(enemy => {
    return enemy.special && enemy.alive;
  });

  if (
    nextSpecialSpawn <= 0 &&
    !specialAlive
  ) {
    spawnSpecialEnemy();
    nextSpecialSpawn = SPECIAL_RESPAWN_SECONDS;
  }
}

function moveEnemyToward(enemy, targetX, targetY, deltaTime) {
  const distanceToTarget = Math.hypot(
    targetX - enemy.x,
    targetY - enemy.y
  );

  if (distanceToTarget < 0.01) {
    return;
  }

  const directionX =
    (targetX - enemy.x) / distanceToTarget;

  const directionY =
    (targetY - enemy.y) / distanceToTarget;

  const nextX =
    enemy.x +
    directionX *
    enemy.speed *
    deltaTime;

  const nextY =
    enemy.y +
    directionY *
    enemy.speed *
    deltaTime;

  if (!isBlocked(nextX, enemy.y)) {
    enemy.x = nextX;
  }

  if (!isBlocked(enemy.x, nextY)) {
    enemy.y = nextY;
  }
}

function respawnEnemy(enemy) {
  enemy.x =
    enemy.spawnX + randomBetween(-1.5, 1.5);

  enemy.y =
    enemy.spawnY + randomBetween(-1.5, 1.5);

  enemy.health = enemy.maxHealth;
  enemy.alive = true;
  enemy.attackCooldown = 1;
  enemy.castCooldown = 2;
  enemy.loot = [];
}

function spawnSpecialEnemy() {
  const specialEnemy = createEnemy(
    `special-${Date.now()}`,
    "Nigromante ancestral",
    "mage",
    160,
    45,
    320,
    24
  );

  specialEnemy.special = true;
  specialEnemy.speed = 1.4;
  specialEnemy.loot = [
    createItem("vampireRing"),
    createItem("knightSword")
  ];

  enemies.push(specialEnemy);

  specialEnemyAlert.classList.remove("hidden");
  specialEnemyMessage.textContent =
    "El Nigromante ancestral apareció en el cementerio.";

  setTimeout(() => {
    specialEnemyAlert.classList.add("hidden");
  }, 5000);

  showMessage(
    "Una presencia poderosa despertó en el cementerio.",
    5
  );
}

function castEnemySpell(enemy) {
  const directionLength = Math.hypot(
    player.x - enemy.x,
    player.y - enemy.y
  );

  enemyProjectiles.push({
    x: enemy.x,
    y: enemy.y,
    directionX:
      (player.x - enemy.x) / directionLength,
    directionY:
      (player.y - enemy.y) / directionLength,
    speed: enemy.special ? 6 : 4.5,
    damage: enemy.damage,
    life: 2.3,
    special: enemy.special
  });
}

function attack() {
  if (
    !gameStarted ||
    gamePaused ||
    isPanelOpen() ||
    player.attackCooldown > 0
  ) {
    return;
  }

  const combatStats = getCombatStats();

  player.attackCooldown = combatStats.attackSpeed;
  player.attackAnimation = 1;
  cameraShake = 3;

  gainSkill("swords", 0.7);
  gainSkill("tactics", 0.55);
  gainSkill("anatomy", 0.25);

  const target = findNearestEnemy(1.6);

  if (!target) {
    showFloatingText(
      player.x,
      player.y,
      "Sin objetivo",
      "#d9c8a4"
    );

    return;
  }

  const hitRoll = Math.random() * 100;

  if (hitRoll > combatStats.accuracy) {
    showFloatingText(
      target.x,
      target.y,
      "Fallo",
      "#d6d6d6"
    );

    return;
  }

  const damage = Math.round(
    randomBetween(
      combatStats.damageMin,
      combatStats.damageMax
    )
  );

  damageEnemy(target, damage);

  if (combatStats.lifeSteal > 0) {
    player.health = Math.min(
      player.maxHealth,
      player.health + damage * combatStats.lifeSteal
    );
  }
}

function castMagic() {
  if (
    !gameStarted ||
    gamePaused ||
    isPanelOpen() ||
    player.magicCooldown > 0
  ) {
    return;
  }

  if (player.mana < 14) {
    speak(player, "Necesito más maná.");
    return;
  }

  const combatStats = getCombatStats();

  player.mana -= 14;
  player.magicCooldown = 0.72;
  player.magicAnimation = 1;

  gainSkill("magery", 0.75);
  gainSkill("evaluating", 0.45);
  gainSkill("meditation", 0.2);
  gainSkill("inscription", 0.1);

  let directionX = player.directionX;
  let directionY = player.directionY;

  const target = findNearestEnemy(7);

  if (target) {
    const distanceToTarget = Math.hypot(
      target.x - player.x,
      target.y - player.y
    );

    directionX =
      (target.x - player.x) /
      distanceToTarget;

    directionY =
      (target.y - player.y) /
      distanceToTarget;
  }

  projectiles.push({
    x: player.x,
    y: player.y,
    directionX,
    directionY,
    speed: 7.5,
    life: 1.5,
    damage:
      combatStats.magicPower +
      randomBetween(1, 5),
    accuracy: combatStats.magicAccuracy
  });
}

function findNearestEnemy(maxDistance) {
  let nearest = null;
  let nearestDistance = Infinity;

  enemies.forEach(enemy => {
    if (!enemy.alive) {
      return;
    }

    const distanceToEnemy = screenDistance(player, enemy);

    if (
      distanceToEnemy < maxDistance &&
      distanceToEnemy < nearestDistance
    ) {
      nearest = enemy;
      nearestDistance = distanceToEnemy;
    }
  });

  return nearest;
}

function damageEnemy(enemy, amount) {
  enemy.health -= amount;
  enemy.hitFlash = 0.16;

  showFloatingText(
    enemy.x,
    enemy.y,
    `-${amount}`,
    "#ffcf92"
  );

  createParticles(enemy.x, enemy.y, 8);

  if (enemy.health <= 0) {
    enemy.health = 0;
    enemy.alive = false;
    enemy.respawnTimer = ENEMY_RESPAWN_SECONDS;

    enemy.loot = generateEnemyLoot(enemy);

    corpses.push({
      x: enemy.x,
      y: enemy.y,
      enemy,
      life: 180
    });

    player.gold +=
      enemy.special
        ? Math.floor(randomBetween(180, 320))
        : Math.floor(randomBetween(5, 30));

    showMessage(
      `${enemy.name} derrotado. Revisa su botín.`,
      3
    );
  }
}

function damagePlayer(amount, magical) {
  if (player.invulnerability > 0) {
    return;
  }

  const combatStats = getCombatStats();

  const reduction = magical
    ? combatStats.magicResistance * 0.004
    : combatStats.defense * 0.005;

  const finalDamage = Math.max(
    1,
    Math.round(amount * (1 - clamp(reduction, 0, 0.55)))
  );

  player.health -= finalDamage;
  player.invulnerability = 0.55;
  cameraShake = 8;

  showFloatingText(
    player.x,
    player.y,
    `-${finalDamage}`,
    "#ff8d8d"
  );

  if (magical) {
    gainSkill("magicResistance", 0.6);
  } else {
    gainSkill("defense", 0.55);
    gainSkill("endurance", 0.25);
  }

  if (player.health <= 0) {
    player.health = player.maxHealth;
    player.mana = player.maxMana;
    player.stamina = player.maxStamina;
    player.x = 100;
    player.y = 105;

    resetJoystick();

    speak(
      player,
      "He sido rescatado y llevado al banco."
    );
  }
}

function generateEnemyLoot(enemy) {
  if (enemy.special) {
    return [
      createItem("vampireRing"),
      Math.random() < 0.5
        ? createItem("knightSword")
        : createItem("manaRing"),
      createItem("darkCrystal")
    ];
  }

  const loot = [];

  if (enemy.type === "zombie") {
    loot.push(createItem("bone"));

    if (Math.random() < 0.18) {
      loot.push(createItem("potion"));
    }

    if (Math.random() < 0.07) {
      loot.push(createItem("accuracyRing"));
    }
  }

  if (enemy.type === "mage") {
    loot.push(createItem("darkCrystal"));

    if (Math.random() < 0.25) {
      loot.push(createItem("magicScroll"));
    }

    if (Math.random() < 0.09) {
      loot.push(createItem("manaRing"));
    }
  }

  return loot;
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

      if (
        screenDistance(projectile, enemy) < 0.6
      ) {
        if (
          Math.random() * 100 <=
          projectile.accuracy
        ) {
          damageEnemy(
            enemy,
            Math.round(projectile.damage)
          );
        } else {
          showFloatingText(
            enemy.x,
            enemy.y,
            "Resistido",
            "#cfc6ff"
          );
        }

        collided = true;
        break;
      }
    }

    if (
      projectile.life <= 0 ||
      isBlocked(projectile.x, projectile.y) ||
      collided
    ) {
      createParticles(
        projectile.x,
        projectile.y,
        10
      );

      projectiles.splice(index, 1);
    }
  }

  for (
    let index = enemyProjectiles.length - 1;
    index >= 0;
    index--
  ) {
    const projectile = enemyProjectiles[index];

    projectile.x +=
      projectile.directionX *
      projectile.speed *
      deltaTime;

    projectile.y +=
      projectile.directionY *
      projectile.speed *
      deltaTime;

    projectile.life -= deltaTime;

    if (
      screenDistance(projectile, player) < 0.55
    ) {
      damagePlayer(projectile.damage, true);
      enemyProjectiles.splice(index, 1);
      continue;
    }

    if (
      projectile.life <= 0 ||
      isBlocked(projectile.x, projectile.y)
    ) {
      enemyProjectiles.splice(index, 1);
    }
  }
}

function updateEffects(deltaTime) {
  cameraShake = Math.max(
    0,
    cameraShake - deltaTime * 28
  );

  for (
    let index = particles.length - 1;
    index >= 0;
    index--
  ) {
    const particle = particles[index];

    particle.offsetX +=
      particle.velocityX * deltaTime;

    particle.offsetY +=
      particle.velocityY * deltaTime;

    particle.velocityY +=
      120 * deltaTime;

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
    floatingTexts[index].life -= deltaTime;
    floatingTexts[index].offsetY -= 28 * deltaTime;

    if (floatingTexts[index].life <= 0) {
      floatingTexts.splice(index, 1);
    }
  }

  for (
    let index = corpses.length - 1;
    index >= 0;
    index--
  ) {
    corpses[index].life -= deltaTime;

    if (corpses[index].life <= 0) {
      corpses.splice(index, 1);
    }
  }
}

function gainSkill(skillId, effort) {
  const skill = skills[skillId];

  if (
    !skill ||
    skill.lock !== "up" ||
    skill.value >= 100
  ) {
    return;
  }

  const total = getSkillTotal();

  if (total >= 700) {
    return;
  }

  const difficulty =
    1 - skill.value / 110;

  skill.progress +=
    effort *
    difficulty *
    randomBetween(0.65, 1.25);

  if (skill.progress < 1) {
    return;
  }

  skill.progress -= 1;

  const oldValue = skill.value;

  skill.value = Math.min(
    100,
    Math.round((skill.value + 0.1) * 10) / 10
  );

  if (skill.value > oldValue) {
    showSkillNotification(skill);
    updateDerivedStats();
    renderSkills();
  }
}

function showSkillNotification(skill) {
  const notification = document.createElement("div");

  notification.className = "skill-notification";
  notification.textContent =
    `${skill.name} aumentó a ${skill.value.toFixed(1)}`;

  skillNotifications.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function getSkillTotal() {
  return Object.values(skills).reduce(
    (total, skill) => total + skill.value,
    0
  );
}

function interact() {
  if (
    !gameStarted ||
    gamePaused ||
    isPanelOpen()
  ) {
    return;
  }

  const nearbyNpc = findNearbyNpc();

  if (nearbyNpc) {
    speak(nearbyNpc, nearbyNpc.greeting);

    if (nearbyNpc.role === "bank") {
      openBank();
      return;
    }

    if (shops[nearbyNpc.role]) {
      openShop(nearbyNpc.role);
      return;
    }
  }

  const nearbyCorpse = corpses.find(corpse => {
    return screenDistance(corpse, player) < 1.5;
  });

  if (nearbyCorpse) {
    openLoot(nearbyCorpse);
    return;
  }

  speak(player, "No hay nada cerca para usar.");
}

function findNearbyNpc() {
  return npcs.find(npc => {
    return screenDistance(npc, player) < 1.6;
  });
}

function usePotion() {
  if (player.health >= player.maxHealth) {
    speak(player, "Mi salud ya está completa.");
    return;
  }

  if (player.potions <= 0) {
    speak(player, "No tengo pociones.");
    return;
  }

  const healingPower =
    38 + skills.healing.value * 0.5;

  player.potions -= 1;

  player.health = Math.min(
    player.maxHealth,
    player.health + healingPower
  );

  gainSkill("healing", 0.8);
  createParticles(player.x, player.y, 14);
}

function speak(entity, text) {
  entity.dialogue = text;
  entity.dialogueTimer = 3.5;
}

function createParticles(x, y, amount) {
  const allowed = Math.max(
    0,
    Math.min(amount, 180 - particles.length)
  );

  for (let index = 0; index < allowed; index++) {
    particles.push({
      x,
      y,
      offsetX: 0,
      offsetY: 0,
      velocityX: randomBetween(-45, 45),
      velocityY: randomBetween(-75, -20),
      life: randomBetween(0.35, 0.75),
      size: randomBetween(2, 5)
    });
  }
}

function showFloatingText(x, y, text, color) {
  floatingTexts.push({
    x,
    y,
    text,
    color,
    offsetY: 0,
    life: 1
  });
}

function getCurrentZone() {
  if (
    player.x >= cemeteryZone.x &&
    player.y >= cemeteryZone.y &&
    player.x < cemeteryZone.x + cemeteryZone.w &&
    player.y < cemeteryZone.y + cemeteryZone.h
  ) {
    return {
      name: "Cementerio de los Caídos",
      description: "Una zona peligrosa dominada por muertos y hechiceros."
    };
  }

  const building = buildings.find(current => {
    return isInsideBuilding(player, current);
  });

  if (building) {
    return {
      name: building.name,
      description: "Interior del edificio."
    };
  }

  if (
    player.x > 90 &&
    player.x < 110 &&
    player.y > 90 &&
    player.y < 110
  ) {
    return {
      name: "Plaza del Banco",
      description: "El corazón seguro de Eldoria."
    };
  }

  if (player.x > 135 && player.y < 80) {
    return {
      name: "Camino del Cementerio",
      description: "La ciudad queda atrás y el aire se vuelve frío."
    };
  }

  return {
    name: "Ciudad de Eldoria",
    description: "Calles, comercios y hogares protegidos por la guardia."
  };
}

function updateInterface() {
  updateDerivedStats();

  const zone = getCurrentZone();
  const combatStats = getCombatStats();

  healthBar.style.width =
    `${player.health / player.maxHealth * 100}%`;

  manaBar.style.width =
    `${player.mana / player.maxMana * 100}%`;

  staminaBar.style.width =
    `${player.stamina / player.maxStamina * 100}%`;

  healthText.textContent =
    `${Math.ceil(player.health)} / ${Math.ceil(player.maxHealth)}`;

  manaText.textContent =
    `${Math.ceil(player.mana)} / ${Math.ceil(player.maxMana)}`;

  staminaText.textContent =
    `${Math.ceil(player.stamina)} / ${Math.ceil(player.maxStamina)}`;

  potionCount.textContent = player.potions;
  goldDisplay.textContent = `${player.gold} oro`;
  inventoryGold.textContent = `${player.gold} oro`;
  shopPlayerGold.textContent = `${player.gold} oro`;

  zoneName.textContent = zone.name;
  zoneDescription.textContent = zone.description;

  const totalSkill = getSkillTotal();

  playerTitle.textContent =
    totalSkill < 300
      ? "Aprendiz aventurero"
      : totalSkill < 500
        ? "Aventurero experimentado"
        : "Maestro de Eldoria";

  statDamage.textContent =
    `${Math.round(combatStats.damageMin)}–${Math.round(combatStats.damageMax)}`;

  statDefense.textContent =
    Math.round(combatStats.defense);

  statAccuracy.textContent =
    `${Math.round(combatStats.accuracy)}%`;

  statMagicPower.textContent =
    Math.round(combatStats.magicPower);

  statAttackSpeed.textContent =
    `${combatStats.attackSpeed.toFixed(2)} s`;

  statMagicResistance.textContent =
    `${Math.round(combatStats.magicResistance)}%`;
}

function updateInteractionIndicator() {
  if (isPanelOpen()) {
    interactionMessage.classList.add("hidden");
    return;
  }

  const npc = findNearbyNpc();

  if (npc) {
    interactionText.textContent =
      npc.role === "bank"
        ? "Abrir banco"
        : "Hablar y comerciar";

    interactionMessage.classList.remove("hidden");
    return;
  }

  const corpse = corpses.find(current => {
    return screenDistance(current, player) < 1.5;
  });

  if (corpse) {
    interactionText.textContent = "Revisar botín";
    interactionMessage.classList.remove("hidden");
    return;
  }

  interactionMessage.classList.add("hidden");
}

function isPanelOpen() {
  return [
    inventoryPanel,
    characterPanel,
    skillsPanel,
    shopPanel,
    bankPanel,
    mapPanel,
    lootPanel
  ].some(panel => !panel.classList.contains("hidden"));
}

function closeAllPanels() {
  [
    inventoryPanel,
    characterPanel,
    skillsPanel,
    shopPanel,
    bankPanel,
    mapPanel,
    lootPanel
  ].forEach(panel => panel.classList.add("hidden"));

  resetJoystick();
}

function openInventory() {
  closeAllPanels();
  inventoryPanel.classList.remove("hidden");
  selectedInventoryIndex = -1;
  renderInventory();
}

function renderInventory() {
  inventoryGrid.innerHTML = "";

  player.inventory.forEach((item, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className =
      `inventory-slot ${index === selectedInventoryIndex ? "selected" : ""}`;

    button.innerHTML = `
      <span>${item.icon}</span>
      <small>${item.name}</small>
    `;

    button.addEventListener("click", () => {
      selectedInventoryIndex = index;
      renderInventory();
      renderItemDetails(item);
    });

    inventoryGrid.appendChild(button);
  });

  if (player.inventory.length === 0) {
    inventoryGrid.innerHTML =
      "<p>Tu mochila está vacía.</p>";
  }
}

function renderItemDetails(item) {
  itemDetailsName.textContent = item.name;
  itemDetailsDescription.textContent = item.description;
  itemDetailsStats.innerHTML = renderStatsHtml(item.stats);

  equipItemButton.disabled = !item.slot;
  dropItemButton.disabled = false;
}

function equipSelectedItem() {
  const item = player.inventory[selectedInventoryIndex];

  if (!item || !item.slot) {
    return;
  }

  let slot = item.slot;

  if (slot === "ring") {
    slot = !player.equipment.ring1
      ? "ring1"
      : "ring2";
  }

  const previousItem = player.equipment[slot];

  player.equipment[slot] = item;
  player.inventory.splice(selectedInventoryIndex, 1);

  if (previousItem) {
    player.inventory.push(previousItem);
  }

  selectedInventoryIndex = -1;

  updateDerivedStats();
  renderInventory();
  renderEquipment();
  drawCharacterPreview();
}

function dropSelectedItem() {
  if (selectedInventoryIndex < 0) {
    return;
  }

  player.inventory.splice(selectedInventoryIndex, 1);
  selectedInventoryIndex = -1;
  renderInventory();
}

function renderEquipment() {
  Object.entries(player.equipment).forEach(([slot, item]) => {
    const element = document.getElementById(`equipment-${slot}`);

    if (element) {
      element.textContent = item ? item.name : "Vacío";
    }
  });
}

function unequipSlot(slot) {
  const item = player.equipment[slot];

  if (!item) {
    return;
  }

  player.inventory.push(item);
  player.equipment[slot] = null;

  updateDerivedStats();
  renderEquipment();
  renderInventory();
  drawCharacterPreview();
}

function renderSkills() {
  skillsList.innerHTML = "";

  Object.entries(skills).forEach(([id, skill]) => {
    const row = document.createElement("div");
    row.className = "skill-row";

    row.innerHTML = `
      <div class="skill-info">
        <strong>${skill.name}</strong>
        <span>${skill.value.toFixed(1)}</span>
      </div>

      <div class="skill-progress">
        <div style="width:${skill.value}%"></div>
      </div>

      <button
        type="button"
        class="skill-lock-button"
        aria-label="Cambiar bloqueo"
      >
        ${skill.lock === "up" ? "↑" : skill.lock === "down" ? "↓" : "🔒"}
      </button>
    `;

    row
      .querySelector(".skill-lock-button")
      .addEventListener("click", () => {
        skill.lock =
          skill.lock === "up"
            ? "locked"
            : skill.lock === "locked"
              ? "down"
              : "up";

        renderSkills();
      });

    skillsList.appendChild(row);
  });

  skillTotal.textContent =
    `Total: ${getSkillTotal().toFixed(1)} / 700.0`;
}

function openShop(role) {
  closeAllPanels();

  activeShop = shops[role];
  shopMode = "buy";
  selectedShopIndex = -1;

  shopPanel.classList.remove("hidden");

  shopName.textContent = activeShop.name;
  shopType.textContent = activeShop.type;

  renderShop();
}

function renderShop() {
  shopItems.innerHTML = "";

  const source =
    shopMode === "buy"
      ? activeShop.items
      : player.inventory;

  source.forEach((item, index) => {
    const button = document.createElement("button");

    const price =
      shopMode === "buy"
        ? item.value
        : Math.max(1, Math.floor(item.value * 0.5));

    button.type = "button";
    button.className =
      `shop-item ${index === selectedShopIndex ? "selected" : ""}`;

    button.innerHTML = `
      <span>${item.icon}</span>
      <div>
        <strong>${item.name}</strong>
        <small>${price} oro</small>
      </div>
    `;

    button.addEventListener("click", () => {
      selectedShopIndex = index;
      renderShop();
      renderShopDetails(item, price);
    });

    shopItems.appendChild(button);
  });

  shopBuyTab.classList.toggle("active", shopMode === "buy");
  shopSellTab.classList.toggle("active", shopMode === "sell");

  shopConfirmButton.textContent =
    shopMode === "buy" ? "Comprar" : "Vender";

  shopConfirmButton.disabled = selectedShopIndex < 0;
}

function renderShopDetails(item, price) {
  shopItemName.textContent = item.name;
  shopItemDescription.textContent =
    `${item.description} Precio: ${price} oro.`;

  shopItemStats.innerHTML = renderStatsHtml(item.stats);
  shopConfirmButton.disabled = false;
}

function confirmShopAction() {
  if (selectedShopIndex < 0) {
    return;
  }

  if (shopMode === "buy") {
    const item = activeShop.items[selectedShopIndex];

    if (player.gold < item.value) {
      speak(player, "No tengo suficiente oro.");
      return;
    }

    player.gold -= item.value;
    player.inventory.push(createItem(item.id));

    showMessage(
      `Compraste ${item.name}.`,
      2
    );
  } else {
    const item = player.inventory[selectedShopIndex];

    if (!item) {
      return;
    }

    const salePrice =
      Math.max(1, Math.floor(item.value * 0.5));

    player.gold += salePrice;
    player.inventory.splice(selectedShopIndex, 1);

    showMessage(
      `Vendiste ${item.name} por ${salePrice} oro.`,
      2
    );
  }

  selectedShopIndex = -1;
  updateInterface();
  renderShop();
}

function openBank() {
  closeAllPanels();
  bankPanel.classList.remove("hidden");

  selectedBankInventoryIndex = -1;
  selectedBankStorageIndex = -1;

  renderBank();
}

function renderBank() {
  bankInventoryGrid.innerHTML = "";
  bankStorageGrid.innerHTML = "";

  player.inventory.forEach((item, index) => {
    bankInventoryGrid.appendChild(
      createBankItemButton(
        item,
        index,
        "inventory"
      )
    );
  });

  player.bank.forEach((item, index) => {
    bankStorageGrid.appendChild(
      createBankItemButton(
        item,
        index,
        "bank"
      )
    );
  });

  bankCapacity.textContent =
    `Espacio bancario: ${player.bank.length} / 60`;

  depositItemButton.disabled =
    selectedBankInventoryIndex < 0;

  withdrawItemButton.disabled =
    selectedBankStorageIndex < 0;
}

function createBankItemButton(item, index, source) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "inventory-slot";

  button.innerHTML = `
    <span>${item.icon}</span>
    <small>${item.name}</small>
  `;

  button.addEventListener("click", () => {
    if (source === "inventory") {
      selectedBankInventoryIndex = index;
      selectedBankStorageIndex = -1;
    } else {
      selectedBankStorageIndex = index;
      selectedBankInventoryIndex = -1;
    }

    renderBank();
  });

  return button;
}

function depositSelectedItem() {
  if (
    selectedBankInventoryIndex < 0 ||
    player.bank.length >= 60
  ) {
    return;
  }

  const [item] = player.inventory.splice(
    selectedBankInventoryIndex,
    1
  );

  player.bank.push(item);
  selectedBankInventoryIndex = -1;

  renderBank();
}

function withdrawSelectedItem() {
  if (selectedBankStorageIndex < 0) {
    return;
  }

  const [item] = player.bank.splice(
    selectedBankStorageIndex,
    1
  );

  player.inventory.push(item);
  selectedBankStorageIndex = -1;

  renderBank();
}

function openLoot(corpse) {
  currentLootSource = corpse;
  selectedLootIndex = -1;

  closeAllPanels();
  lootPanel.classList.remove("hidden");

  renderLoot();
}

function renderLoot() {
  lootItems.innerHTML = "";

  if (
    !currentLootSource ||
    currentLootSource.enemy.loot.length === 0
  ) {
    lootItems.innerHTML =
      "<p>No hay objetos en este cuerpo.</p>";

    takeAllLootButton.disabled = true;
    return;
  }

  currentLootSource.enemy.loot.forEach((item, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className =
      `loot-item ${index === selectedLootIndex ? "selected" : ""}`;

    button.innerHTML = `
      <span>${item.icon}</span>
      <strong>${item.name}</strong>
    `;

    button.addEventListener("click", () => {
      selectedLootIndex = index;
      renderLoot();
    });

    lootItems.appendChild(button);
  });

  takeSelectedLootButton.disabled =
    selectedLootIndex < 0;

  takeAllLootButton.disabled = false;
}

function takeSelectedLoot() {
  if (
    !currentLootSource ||
    selectedLootIndex < 0
  ) {
    return;
  }

  const [item] =
    currentLootSource.enemy.loot.splice(
      selectedLootIndex,
      1
    );

  player.inventory.push(item);
  selectedLootIndex = -1;

  renderLoot();
}

function takeAllLoot() {
  if (!currentLootSource) {
    return;
  }

  player.inventory.push(
    ...currentLootSource.enemy.loot
  );

  currentLootSource.enemy.loot = [];

  renderLoot();
}

function renderStatsHtml(stats = {}) {
  const entries = Object.entries(stats);

  if (entries.length === 0) {
    return "<p>Sin bonificaciones especiales.</p>";
  }

  return entries
    .map(([key, value]) => {
      const labels = {
        damageMin: "Daño mínimo",
        damageMax: "Daño máximo",
        defense: "Defensa",
        accuracy: "Precisión",
        magicPower: "Poder mágico",
        magicResistance: "Resistencia mágica",
        health: "Vida",
        mana: "Maná",
        speed: "Velocidad",
        manaRegen: "Regeneración de maná",
        lifeSteal: "Robo de vida",
        tactics: "Tácticas"
      };

      const shownValue =
        key === "lifeSteal"
          ? `${Math.round(value * 100)}%`
          : value;

      return `
        <div class="item-stat">
          <span>${labels[key] || key}</span>
          <strong>+${shownValue}</strong>
        </div>
      `;
    })
    .join("");
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

  const colors = {
    grass: (x + y) % 2 === 0 ? "#34533d" : "#304a38",
    road: (x + y) % 2 === 0 ? "#67645f" : "#5c5a56",
    plaza: (x + y) % 2 === 0 ? "#78736b" : "#6c6861",
    forest: "#294536",
    cemetery: (x + y) % 2 === 0 ? "#343d35" : "#303831",
    cemeteryPath: "#555651",
    cemeteryWall: "#272a2a",
    water: "#1f4052",
    void: "#080b0f"
  };

  ctx.fillStyle = colors[type] || colors.grass;
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.16)";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (
    type === "cemetery" &&
    (x * 7 + y * 11) % 17 === 0
  ) {
    ctx.fillStyle = "#77766c";
    ctx.fillRect(
      screen.x - 4,
      screen.y + 4,
      8,
      13
    );
  }

  if (
    type === "forest" &&
    (x * 5 + y * 3) % 13 === 0
  ) {
    drawTreeAt(x + 0.4, y + 0.5);
  }
}

function drawTreeAt(x, y) {
  const screen = worldToScreen(x, y);

  ctx.fillStyle = "#35281e";
  ctx.fillRect(
    screen.x - 4,
    screen.y - 34,
    8,
    38
  );

  ctx.fillStyle = "#1d3827";
  ctx.beginPath();
  ctx.arc(
    screen.x,
    screen.y - 44,
    22,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawBuilding(building) {
  const playerInside = isInsideBuilding(player, building);
  const alpha = playerInside ? 0.2 : 1;

  for (let y = building.y; y < building.y + building.h; y++) {
    for (let x = building.x; x < building.x + building.w; x++) {
      const screen = worldToScreen(x, y);

      ctx.fillStyle =
        (x + y) % 2 === 0
          ? "#6c6258"
          : "#62594f";

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
      ctx.fill();
    }
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  const top = worldToScreen(
    building.x,
    building.y,
    70
  );

  const right = worldToScreen(
    building.x + building.w,
    building.y,
    70
  );

  const bottom = worldToScreen(
    building.x + building.w,
    building.y + building.h,
    70
  );

  const left = worldToScreen(
    building.x,
    building.y + building.h,
    70
  );

  ctx.fillStyle = building.color;
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(right.x, right.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(left.x, left.y);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  if (playerInside) {
    drawInterior(building);
  }
}

function drawInterior(building) {
  const center = worldToScreen(
    building.x + building.w / 2,
    building.y + building.h / 2
  );

  ctx.fillStyle = "#5a3f2d";

  ctx.fillRect(
    center.x - 18,
    center.y - 12,
    36,
    22
  );

  ctx.fillStyle = "#d0b278";

  ctx.fillRect(
    center.x - 3,
    center.y - 22,
    6,
    20
  );
}

function drawCharacter(
  entity,
  color,
  enemyMode = false
) {
  const screen = worldToScreen(entity.x, entity.y);

  const bob =
    Math.sin(entity.animation || player.walkAnimation) * 2;

  ctx.fillStyle = "rgba(0,0,0,0.33)";
  ctx.beginPath();
  ctx.ellipse(
    screen.x,
    screen.y + 5,
    enemyMode ? 17 : 15,
    7,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.fillStyle =
    entity.hitFlash > 0
      ? "#ffffff"
      : color;

  ctx.beginPath();
  ctx.moveTo(screen.x, screen.y - 40 + bob);
  ctx.lineTo(screen.x + 16, screen.y);
  ctx.lineTo(screen.x - 16, screen.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = enemyMode ? "#9b846f" : "#d5aa82";
  ctx.beginPath();
  ctx.arc(
    screen.x,
    screen.y - 47 + bob,
    9,
    0,
    Math.PI * 2
  );
  ctx.fill();

  if (entity === player) {
    drawPlayerWeapons(screen, bob);
  }

  if (enemyMode) {
    drawHealthBar(entity, screen);
  }

  drawWorldSpeech(entity, screen);
}

function drawPlayerWeapons(screen, bob) {
  const attackProgress =
    1 - player.attackAnimation;

  const swordAngle =
    player.attackAnimation > 0
      ? -1.8 + attackProgress * 2.8
      : -0.65;

  ctx.save();
  ctx.translate(
    screen.x + 10,
    screen.y - 28 + bob
  );
  ctx.rotate(swordAngle);

  ctx.strokeStyle = "#d7dce4";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -30);
  ctx.stroke();

  ctx.strokeStyle = "#a77d42";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.lineTo(6, -2);
  ctx.stroke();

  ctx.restore();

  const bookLift =
    player.magicAnimation > 0
      ? 12 * player.magicAnimation
      : 0;

  ctx.save();
  ctx.translate(
    screen.x - 14,
    screen.y - 25 - bookLift + bob
  );
  ctx.rotate(0.25);

  ctx.fillStyle = "#643f77";
  ctx.fillRect(-9, -7, 18, 14);

  ctx.strokeStyle = "#d8bd66";
  ctx.lineWidth = 2;
  ctx.strokeRect(-9, -7, 18, 14);

  ctx.restore();
}

function drawWorldSpeech(entity, screen) {
  if (
    !entity.dialogue ||
    entity.dialogueTimer <= 0
  ) {
    return;
  }

  ctx.font = "12px sans-serif";

  const name =
    entity.name || player.name;

  const width = Math.max(
    ctx.measureText(entity.dialogue).width,
    ctx.measureText(name).width
  ) + 18;

  ctx.fillStyle = "rgba(5,7,9,0.82)";
  ctx.fillRect(
    screen.x - width / 2,
    screen.y - 92,
    width,
    38
  );

  ctx.textAlign = "center";
  ctx.fillStyle = "#e8d9ad";
  ctx.fillText(
    entity.dialogue,
    screen.x,
    screen.y - 76
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText(
    name,
    screen.x,
    screen.y - 61
  );
}

function drawHealthBar(entity, screen) {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(
    screen.x - 20,
    screen.y - 70,
    40,
    5
  );

  ctx.fillStyle =
    entity.special
      ? "#b24acb"
      : "#a94242";

  ctx.fillRect(
    screen.x - 20,
    screen.y - 70,
    40 * entity.health / entity.maxHealth,
    5
  );
}

function drawProjectiles() {
  projectiles.forEach(projectile => {
    const screen = worldToScreen(
      projectile.x,
      projectile.y,
      22
    );

    ctx.fillStyle = "#ffad44";
    ctx.beginPath();
    ctx.arc(
      screen.x,
      screen.y,
      9,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });

  enemyProjectiles.forEach(projectile => {
    const screen = worldToScreen(
      projectile.x,
      projectile.y,
      22
    );

    ctx.fillStyle =
      projectile.special
        ? "#d558ff"
        : "#734dcc";

    ctx.beginPath();
    ctx.arc(
      screen.x,
      screen.y,
      projectile.special ? 11 : 8,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
}

function drawEffects() {
  particles.forEach(particle => {
    const screen = worldToScreen(
      particle.x,
      particle.y,
      18
    );

    ctx.globalAlpha = clamp(
      particle.life * 2,
      0,
      1
    );

    ctx.fillStyle = "#e6bc67";
    ctx.fillRect(
      screen.x + particle.offsetX,
      screen.y + particle.offsetY,
      particle.size,
      particle.size
    );
  });

  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.font = "bold 16px sans-serif";

  floatingTexts.forEach(text => {
    const screen = worldToScreen(
      text.x,
      text.y,
      65
    );

    ctx.globalAlpha = text.life;
    ctx.fillStyle = text.color;

    ctx.fillText(
      text.text,
      screen.x,
      screen.y + text.offsetY
    );
  });

  ctx.globalAlpha = 1;
}

function drawScene() {
  ctx.clearRect(
    0,
    0,
    window.innerWidth,
    window.innerHeight
  );

  const shakeX =
    cameraShake > 0
      ? randomBetween(-cameraShake, cameraShake)
      : 0;

  const shakeY =
    cameraShake > 0
      ? randomBetween(-cameraShake, cameraShake)
      : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  const startX = clamp(
    Math.floor(player.x - VIEW_DISTANCE),
    0,
    WORLD_SIZE - 1
  );

  const endX = clamp(
    Math.ceil(player.x + VIEW_DISTANCE),
    0,
    WORLD_SIZE - 1
  );

  const startY = clamp(
    Math.floor(player.y - VIEW_DISTANCE),
    0,
    WORLD_SIZE - 1
  );

  const endY = clamp(
    Math.ceil(player.y + VIEW_DISTANCE),
    0,
    WORLD_SIZE - 1
  );

  for (let depth = startX + startY; depth <= endX + endY; depth++) {
    for (let x = startX; x <= endX; x++) {
      const y = depth - x;

      if (
        y < startY ||
        y > endY
      ) {
        continue;
      }

      drawTile(x, y, tileType(x, y));
    }
  }

  const renderables = [];

  buildings.forEach(building => {
    if (
      Math.abs(building.x - player.x) < VIEW_DISTANCE + 10 &&
      Math.abs(building.y - player.y) < VIEW_DISTANCE + 10
    ) {
      renderables.push({
        depth:
          building.x +
          building.y +
          building.w +
          building.h,
        draw: () => drawBuilding(building)
      });
    }
  });

  npcs.forEach(npc => {
    renderables.push({
      depth: npc.x + npc.y,
      draw: () =>
        drawCharacter(npc, "#8a653f")
    });
  });

  enemies.forEach(enemy => {
    if (!enemy.alive) {
      return;
    }

    if (
      Math.abs(enemy.x - player.x) > VIEW_DISTANCE ||
      Math.abs(enemy.y - player.y) > VIEW_DISTANCE
    ) {
      return;
    }

    renderables.push({
      depth: enemy.x + enemy.y,
      draw: () =>
        drawCharacter(
          enemy,
          enemy.special
            ? "#5d275f"
            : enemy.type === "mage"
              ? "#442d68"
              : "#486240",
          true
        )
    });
  });

  corpses.forEach(corpse => {
    renderables.push({
      depth: corpse.x + corpse.y - 0.1,
      draw: () => {
        const screen = worldToScreen(corpse.x, corpse.y);

        ctx.fillStyle = "#342e2c";
        ctx.beginPath();
        ctx.ellipse(
          screen.x,
          screen.y,
          18,
          7,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        if (corpse.enemy.loot.length > 0) {
          ctx.fillStyle = "#e0b65d";
          ctx.font = "bold 16px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            "✦",
            screen.x,
            screen.y - 13
          );
        }
      }
    });
  });

  renderables.push({
    depth: player.x + player.y,
    draw: () =>
      drawCharacter(player, "#274c72")
  });

  renderables.sort(
    (first, second) =>
      first.depth - second.depth
  );

  renderables.forEach(renderable => renderable.draw());

  drawProjectiles();
  drawEffects();

  ctx.restore();
}

function drawCharacterPreview() {
  characterCtx.clearRect(
    0,
    0,
    characterCanvas.width,
    characterCanvas.height
  );

  characterCtx.fillStyle = "#111820";
  characterCtx.fillRect(
    0,
    0,
    characterCanvas.width,
    characterCanvas.height
  );

  characterCtx.fillStyle = "#274c72";

  characterCtx.beginPath();
  characterCtx.moveTo(130, 70);
  characterCtx.lineTo(185, 260);
  characterCtx.lineTo(75, 260);
  characterCtx.closePath();
  characterCtx.fill();

  characterCtx.fillStyle = "#d5aa82";
  characterCtx.beginPath();
  characterCtx.arc(
    130,
    72,
    28,
    0,
    Math.PI * 2
  );
  characterCtx.fill();

  characterCtx.strokeStyle = "#d7dce4";
  characterCtx.lineWidth = 8;
  characterCtx.beginPath();
  characterCtx.moveTo(170, 145);
  characterCtx.lineTo(210, 55);
  characterCtx.stroke();

  characterCtx.fillStyle = "#643f77";
  characterCtx.fillRect(
    42,
    130,
    42,
    32
  );

  characterCtx.fillStyle = "#e8d9ad";
  characterCtx.textAlign = "center";
  characterCtx.font = "bold 16px serif";
  characterCtx.fillText(
    "Aldren",
    130,
    295
  );
}

function drawMinimap() {
  minimapCtx.clearRect(
    0,
    0,
    minimapCanvas.width,
    minimapCanvas.height
  );

  const scaleX =
    minimapCanvas.width / WORLD_SIZE;

  const scaleY =
    minimapCanvas.height / WORLD_SIZE;

  for (let y = 0; y < WORLD_SIZE; y += 2) {
    for (let x = 0; x < WORLD_SIZE; x += 2) {
      const type = tileType(x, y);

      const colors = {
        grass: "#38543c",
        road: "#716d65",
        plaza: "#8a857b",
        forest: "#233e2c",
        cemetery: "#343934",
        cemeteryPath: "#5d5c56",
        cemeteryWall: "#202323",
        water: "#24485c"
      };

      minimapCtx.fillStyle =
        colors[type] || "#38543c";

      minimapCtx.fillRect(
        x * scaleX,
        y * scaleY,
        scaleX * 2 + 1,
        scaleY * 2 + 1
      );
    }
  }

  minimapCtx.fillStyle = "#e6c56c";
  minimapCtx.fillRect(
    99 * scaleX,
    99 * scaleY,
    scaleX * 3,
    scaleY * 3
  );

  minimapCtx.fillStyle = "#ffffff";
  minimapCtx.beginPath();
  minimapCtx.arc(
    player.x * scaleX,
    player.y * scaleY,
    5,
    0,
    Math.PI * 2
  );
  minimapCtx.fill();
}

function checkOrientation() {
  const portrait =
    window.innerHeight > window.innerWidth;

  orientationScreen.classList.toggle(
    "hidden",
    !portrait
  );

  gamePaused = portrait;

  if (portrait) {
    resetJoystick();
  }
}

function gameLoop(timestamp) {
  if (!gameStarted) {
    return;
  }

  const deltaTime = Math.min(
    Math.max(
      (timestamp - lastTime) / 1000,
      0
    ),
    0.033
  );

  lastTime = timestamp;
  elapsedTime += deltaTime;

  if (!gamePaused) {
    updatePlayer(deltaTime);
    updateNpcs(deltaTime);
    updateEnemies(deltaTime);
    updateProjectiles(deltaTime);
    updateEffects(deltaTime);
  }

  updateInterface();
  updateInteractionIndicator();
  drawScene();

  requestAnimationFrame(gameLoop);
}

function startGame(event) {
  if (event) {
    event.preventDefault();
  }

  if (gameStarted) {
    return;
  }

  gameStarted = true;

  startScreen.classList.remove("active");
  startScreen.classList.add("hidden");
  gameUI.classList.remove("hidden");

  checkOrientation();

  speak(
    npcs[0],
    "Bienvenido al Banco de Eldoria."
  );

  showMessage(
    "Explora la ciudad y visita el cementerio cuando estés preparado.",
    5
  );

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function moveJoystick(clientX, clientY) {
  const bounds =
    joystickBase.getBoundingClientRect();

  const centerX =
    bounds.left + bounds.width / 2;

  const centerY =
    bounds.top + bounds.height / 2;

  let differenceX = clientX - centerX;
  let differenceY = clientY - centerY;

  const maximumDistance =
    Math.max(28, bounds.width * 0.34);

  const distanceFromCenter =
    Math.hypot(differenceX, differenceY);

  if (distanceFromCenter > maximumDistance) {
    differenceX =
      differenceX /
      distanceFromCenter *
      maximumDistance;

    differenceY =
      differenceY /
      distanceFromCenter *
      maximumDistance;
  }

  joystick.x =
    differenceX / maximumDistance;

  joystick.y =
    differenceY / maximumDistance;

  joystickStick.style.transform =
    `translate(${differenceX}px, ${differenceY}px)`;
}

function resetJoystick() {
  joystick.active = false;
  joystick.x = 0;
  joystick.y = 0;
  activeTouchId = null;

  joystickStick.style.transform =
    "translate(0px, 0px)";
}

function findTouch(touchList, identifier) {
  for (
    let index = 0;
    index < touchList.length;
    index++
  ) {
    if (
      touchList[index].identifier === identifier
    ) {
      return touchList[index];
    }
  }

  return null;
}

joystickBase.addEventListener(
  "touchstart",
  event => {
    event.preventDefault();

    if (activeTouchId !== null) {
      return;
    }

    const touch = event.changedTouches[0];

    activeTouchId = touch.identifier;
    joystick.active = true;

    moveJoystick(
      touch.clientX,
      touch.clientY
    );
  },
  { passive: false }
);

joystickBase.addEventListener(
  "touchmove",
  event => {
    event.preventDefault();

    const touch = findTouch(
      event.touches,
      activeTouchId
    );

    if (!touch) {
      return;
    }

    moveJoystick(
      touch.clientX,
      touch.clientY
    );
  },
  { passive: false }
);

joystickBase.addEventListener(
  "touchend",
  event => {
    event.preventDefault();

    const touch = findTouch(
      event.changedTouches,
      activeTouchId
    );

    if (touch) {
      resetJoystick();
    }
  },
  { passive: false }
);

joystickBase.addEventListener(
  "touchcancel",
  event => {
    event.preventDefault();
    resetJoystick();
  },
  { passive: false }
);

let mouseJoystickActive = false;

joystickBase.addEventListener("mousedown", event => {
  event.preventDefault();
  mouseJoystickActive = true;
  joystick.active = true;
  moveJoystick(event.clientX, event.clientY);
});

window.addEventListener("mousemove", event => {
  if (!mouseJoystickActive) {
    return;
  }

  moveJoystick(event.clientX, event.clientY);
});

window.addEventListener("mouseup", () => {
  if (!mouseJoystickActive) {
    return;
  }

  mouseJoystickActive = false;
  resetJoystick();
});

function addMobileButtonControl(button, action) {
  let touched = false;

  button.addEventListener(
    "touchstart",
    event => {
      event.preventDefault();
      event.stopPropagation();
      touched = true;
      action();
    },
    { passive: false }
  );

  button.addEventListener(
    "touchend",
    event => {
      event.preventDefault();

      setTimeout(() => {
        touched = false;
      }, 300);
    },
    { passive: false }
  );

  button.addEventListener("click", event => {
    event.preventDefault();

    if (!touched) {
      action();
    }
  });
}

addMobileButtonControl(startButton, startGame);
addMobileButtonControl(attackButton, attack);
addMobileButtonControl(magicButton, castMagic);
addMobileButtonControl(interactButton, interact);
addMobileButtonControl(potionButton, usePotion);

addMobileButtonControl(inventoryButton, openInventory);

addMobileButtonControl(characterButton, () => {
  closeAllPanels();
  characterPanel.classList.remove("hidden");
  renderEquipment();
  drawCharacterPreview();
});

addMobileButtonControl(skillsButton, () => {
  closeAllPanels();
  skillsPanel.classList.remove("hidden");
  renderSkills();
});

addMobileButtonControl(mapButton, () => {
  closeAllPanels();
  mapPanel.classList.remove("hidden");
  drawMinimap();
});

addMobileButtonControl(closeInventoryButton, closeAllPanels);
addMobileButtonControl(closeCharacterButton, closeAllPanels);
addMobileButtonControl(closeSkillsButton, closeAllPanels);
addMobileButtonControl(closeShopButton, closeAllPanels);
addMobileButtonControl(closeBankButton, closeAllPanels);
addMobileButtonControl(closeMapButton, closeAllPanels);
addMobileButtonControl(closeLootButton, closeAllPanels);

addMobileButtonControl(equipItemButton, equipSelectedItem);
addMobileButtonControl(dropItemButton, dropSelectedItem);
addMobileButtonControl(shopConfirmButton, confirmShopAction);
addMobileButtonControl(depositItemButton, depositSelectedItem);
addMobileButtonControl(withdrawItemButton, withdrawSelectedItem);
addMobileButtonControl(takeSelectedLootButton, takeSelectedLoot);
addMobileButtonControl(takeAllLootButton, takeAllLoot);

shopBuyTab.addEventListener("click", () => {
  shopMode = "buy";
  selectedShopIndex = -1;
  renderShop();
});

shopSellTab.addEventListener("click", () => {
  shopMode = "sell";
  selectedShopIndex = -1;
  renderShop();
});

document
  .querySelectorAll(".equipment-slot")
  .forEach(button => {
    button.addEventListener("click", () => {
      unequipSlot(button.dataset.slot);
    });
  });

window.addEventListener("resize", () => {
  resizeCanvas();
  checkOrientation();

  if (!mapPanel.classList.contains("hidden")) {
    drawMinimap();
  }
});

window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    resizeCanvas();
    checkOrientation();
  }, 250);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    resetJoystick();
  }

  lastTime = performance.now();
});

canvas.addEventListener("contextmenu", event => {
  event.preventDefault();
});

resizeCanvas();
checkOrientation();
updateDerivedStats();
updateInterface();
renderEquipment();
renderSkills();
drawCharacterPreview();
drawScene();
