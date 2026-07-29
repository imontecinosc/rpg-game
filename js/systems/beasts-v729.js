(function (U) {
  'use strict';
  U.VERSION = '7.29';

  /* ══════════════════════════════════════════════════════════════════
     1 · PALETAS — sin esto, drake/dragon/orc/ghoul/wraith caerían al
     renderer humano (beastPalettes es privado en characterAdapter.js,
     así que se parchea el método público CharacterAdapter.getState).
     ══════════════════════════════════════════════════════════════════ */
  const NEW_BEAST_PALETTES = {
    drake: { body: '#4a6650', belly: '#7a8c62', accent: '#d8cc9c' },
    dragon: { body: '#5a2030', belly: '#8c4a3c', accent: '#e8dcae' },
    orc: { body: '#5e7048', belly: '#6e8054', accent: '#cbbfa8' },
    ghoul: { body: '#9aa08a', belly: '#b0b49c', accent: '#e2eab0' },
    wraith: { body: '#3a4050', belly: '#4a5264', accent: '#c8f0ff' },
  };
  const previousGetState = U.CharacterAdapter.getState;
  U.CharacterAdapter.getState = function (actor, options = {}) {
    const type = (actor.visualType || actor.type || '').toLowerCase();
    if (NEW_BEAST_PALETTES[type]) {
      const variantScale = actor.variant === 'exalted' ? 1.45 : actor.variant === 'renowned' ? 1.25 : 1;
      const palette =
        actor.variant === 'exalted'
          ? { body: '#d8ad32', belly: '#f0c95d', accent: '#fff0a6' }
          : NEW_BEAST_PALETTES[type];
      return {
        beast: type,
        palette,
        time: actor.anim || 0,
        dir: actor.facing || 'right',
        action: (actor.attackAnim || 0) > 0 ? 'attack' : actor.moving ? 'walk' : 'idle',
        attackProgress: Math.max(0, Math.min(1, 1 - (actor.attackAnim || 0) / (actor.attackTotal || 0.45))),
        hit: Math.min(1, (actor.hitAnim || 0) / 0.18),
        death: Math.max(0, Math.min(1, 1 - (actor.deathAnim || 0) / (actor.deathTotal || 0.8))),
        dying: !!actor.dead && (actor.deathAnim || 0) > 0,
        scale: actor.boss ? 1.22 : variantScale,
      };
    }
    return previousGetState(actor, options);
  };

  /* ══════════════════════════════════════════════════════════════════
     2 · RECURSOS Y EQUIPO NUEVO — U.itemDefs sí es público, se puede
     extender directamente sin tocar data/items.js.
     ══════════════════════════════════════════════════════════════════ */
  Object.assign(U.itemDefs, {
    orcIron: {
      name: 'Hierro robado',
      icon: '⚔️',
      stack: true,
      type: 'resource',
      desc: 'Chatarra de hierro arrancada a un orco de clan.',
    },
    ghoulIchor: {
      name: 'Icor de tumba',
      icon: '🧪',
      stack: true,
      type: 'resource',
      desc: 'Fluido negro hallado en un gul. Alquimistas lo pagan bien.',
    },
    drakeScale: {
      name: 'Escama de drake',
      icon: '🟢',
      stack: true,
      type: 'resource',
      desc: 'Escama córnea de un drake de caverna.',
    },
    dragonScale: {
      name: 'Escama de dragón',
      icon: '🔴',
      stack: true,
      type: 'resource',
      desc: 'Escama al rojo vivo, aún tibia mucho después de la caza.',
    },
    wraithEssence: {
      name: 'Esencia de wraith',
      icon: '👻',
      stack: true,
      type: 'resource',
      desc: 'Niebla condensada que nunca termina de disiparse.',
    },
    orcCleaver: {
      name: 'Hendedor orco',
      desc: 'Hacha pesada de dos manos forjada con hierro robado.',
      material: 'Hierro',
      quality: 'Poco común',
      durability: 120,
      icon: '🪓',
      type: 'weapon',
      slot: 'weapon',
      skill: 'Armas contundentes',
      damage: 23,
      twoHand: true,
      value: 340,
      insurable: true,
      bonuses: { weaponDamage: 5, armorPen: 4 },
    },
    ghoulClaws: {
      name: 'Garras de gul',
      desc: 'Guanteletes improvisados a partir de garras de gul.',
      material: 'Hueso',
      quality: 'Poco común',
      durability: 95,
      icon: '🥊',
      type: 'weapon',
      slot: 'weapon',
      skill: 'Pelea',
      damage: 16,
      value: 300,
      insurable: true,
      bonuses: { attackSpeed: 5, lifeSteal: 3 },
    },
    drakeMail: {
      name: 'Cota de escamas de drake',
      desc: 'Armadura ligera hecha con escamas de drake superpuestas.',
      material: 'Hueso',
      quality: 'Raro',
      durability: 150,
      icon: '🥋',
      type: 'armor',
      visualLayer: 'armor',
      slot: 'chest',
      armor: 15,
      value: 620,
      insurable: true,
      bonuses: { physicalResist: 5, moveSpeed: 2 },
    },
    wraithCloak: {
      name: 'Manto del wraith',
      desc: 'Tela que nunca deja de moverse, incluso sin viento.',
      material: 'Seda del Velo',
      quality: 'Épico',
      durability: 140,
      icon: '🧥',
      type: 'clothing',
      slot: 'cloak',
      armor: 4,
      value: 980,
      insurable: true,
      bonuses: { magicResist: 8, manaRegen: 6, moveSpeed: 4 },
    },
    dragonfang: {
      name: 'Colmillo del Dragón',
      desc: 'El último diente que soltó. Sigue caliente al tacto.',
      material: 'Hierro ennegrecido',
      rarity: 'Legendario',
      durability: 240,
      icon: '🗡️',
      type: 'weapon',
      visualLayer: 'armor',
      slot: 'weapon',
      skill: 'Espada',
      twoHand: true,
      damage: 34,
      value: 3200,
      insurable: true,
      bonuses: { weaponDamage: 10, critDamage: 15, armorPen: 8 },
    },
  });

  /* ══════════════════════════════════════════════════════════════════
     3 · STATS Y LOOT — U.spawnEnemy se envuelve: si el tipo es una de
     las 5 bestias nuevas usa esta tabla, si no, delega al original.
     Los números están calibrados contra la tabla de combat.js:
       orco    ≈ bandido (danger 3) pero más tanque
       gul     ≈ zombie/esqueleto (danger 3) pero más rápido y frágil
       drake   ≈ un escalón sobre troll (danger 5), embosca en cuevas
       wraith  ≈ élite rara (danger 6), flota y golpea fuerte a distancia corta
       dragón  = jefe de mundo único, por encima del Guardián del Umbral (danger 9)
     ══════════════════════════════════════════════════════════════════ */
  const NEW_DEFS = {
    orc: {
      name: 'Orco de clan',
      hp: 120,
      dmg: 13,
      speed: 2.3,
      color: '#5e7048',
      danger: 3,
      loot: [
        ['gold', 1],
        ['orcIron', 0.7],
        ['ironOre', 0.4],
        ['orcCleaver', 0.03],
      ],
    },
    ghoul: {
      name: 'Gul',
      hp: 95,
      dmg: 10,
      speed: 2.9,
      color: '#9aa08a',
      danger: 3,
      loot: [
        ['gold', 0.7],
        ['ghoulIchor', 0.65],
        ['boneShard', 0.3],
        ['ghoulClaws', 0.025],
      ],
    },
    drake: {
      name: 'Drake de caverna',
      hp: 230,
      dmg: 18,
      speed: 2.0,
      color: '#4a6650',
      danger: 5,
      loot: [
        ['gold', 0.9],
        ['drakeScale', 1],
        ['coal', 0.4],
        ['drakeMail', 0.03],
      ],
    },
    wraith: {
      name: 'Wraith',
      hp: 260,
      dmg: 17,
      speed: 2.6,
      color: '#3a4050',
      danger: 6,
      loot: [
        ['gold', 0.6],
        ['wraithEssence', 0.8],
        ['manaPotion', 0.3],
        ['wraithCloak', 0.025],
      ],
    },
    dragon: {
      name: 'Dragón de la Cima',
      hp: 900,
      dmg: 30,
      speed: 1.3,
      color: '#5a2030',
      danger: 9,
      loot: [
        ['dragonfang', 0.08],
        ['dragonScale', 1],
        ['gold', 1],
        ['contract120', 0.25],
        ['contract115', 0.4],
      ],
    },
  };
  const dangerColors = ['#ffe45c', '#f39a3c', '#e3483e', '#9f2034', '#6b3d88'];
  const previousSpawnEnemy = U.spawnEnemy;
  U.spawnEnemy = function (type, x, y, boss = false, variant = null) {
    if (!NEW_DEFS[type]) return previousSpawnEnemy(type, x, y, boss, variant);
    const base = NEW_DEFS[type];
    let d = { ...base, danger: Math.max(1, Math.min(5, Math.ceil((base.danger + 1) / 2))) };
    variant =
      variant ||
      (!boss && Math.random() < 0.025 ? 'exalted' : !boss && Math.random() < 0.09 ? 'renowned' : null);
    if (variant === 'renowned')
      d = {
        ...d,
        name: d.name + ' [Notable]',
        hp: Math.round(d.hp * 3),
        dmg: Math.round(d.dmg * 1.8),
        speed: Math.min(4.35, d.speed * 1.25),
      };
    if (variant === 'exalted')
      d = {
        ...d,
        name: d.name + ' [Exaltado]',
        hp: Math.round(d.hp * 5),
        dmg: Math.round(d.dmg * 2.35),
        speed: Math.min(4.45, d.speed * 1.35),
        color: '#d8ad32',
      };
    U.enemies.push({
      ...d,
      type,
      visualType: type,
      boss,
      variant,
      nameColor: variant === 'exalted' ? '#f2c94c' : dangerColors[d.danger - 1],
      x,
      y,
      homeX: x,
      homeY: y,
      maxHp: d.hp,
      attackCd: 0,
      dead: false,
      radius: boss ? 0.7 : variant === 'exalted' ? 0.62 : variant === 'renowned' ? 0.54 : 0.42,
      status: 'hostile',
      aggro: false,
      aggroRange: 11,
      leashRange: 26,
    });
  };

  /* ══════════════════════════════════════════════════════════════════
     4 · UBICACIÓN EN EL MUNDO
       - Gules: se suman a la ronda de no-muertos del Cementerio de
         los Susurros (misma zona que zombie/esqueleto).
       - Orcos: campamento nuevo al este de la Torre del Umbral.
       - Drakes: guarida nueva junto a la Mina Escuela de Brumaférrea.
       - Wraiths: raros, en el pantano del Santuario del Velo.
       - Dragón: jefe único en una mazmorra nueva, "Cima del Dragón".
     ══════════════════════════════════════════════════════════════════ */
  U.terrain.dungeons.push({
    name: 'Cima del Dragón',
    x: 190,
    y: 140,
    friendly: false,
    boss: true,
    desc: 'Pico remoto al sureste. El Dragón lo usa de nido desde antes de Valdoria.',
  });

  const previousSetupWorld = U.setupWorld;
  U.setupWorld = function () {
    previousSetupWorld();

    const ring = (cx, cy, radius, count, type) => {
      for (let i = 0; i < count; i++) {
        const a = U.rnd(0, Math.PI * 2),
          r = Math.sqrt(Math.random()) * radius;
        U.spawnEnemy(type, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
    };

    ring(64, -54, 20, 6, 'ghoul'); // Cementerio de los Susurros
    ring(165, 55, 26, 10, 'orc'); // Campamento de orcos
    ring(195, -95, 18, 6, 'drake'); // Guarida de drakes, junto a Brumaférrea
    ring(-95, -105, 18, 4, 'wraith'); // Pantano del Santuario del Velo

    U.spawnEnemy('dragon', 190, 140, true, 'renowned'); // Jefe único: Cima del Dragón
  };
})((window.Ultra = window.Ultra || {}));
