(function (U) {
  // Cache de selectores: cada '#id' se resuelve una sola vez.
  // Si un nodo llegara a salir del DOM (isConnected=false), se vuelve a buscar solo.
  U.$ = (() => {
    const cache = new Map();
    return s => {
      let el = cache.get(s);
      if (el === undefined || (el && !el.isConnected)) {
        el = document.querySelector(s);
        cache.set(s, el);
      }
      return el;
    };
  })();
  U.$$ = s => [...document.querySelectorAll(s)];
  // Cada cuanto se refresca el HUD (12 veces por segundo en vez de 60).
  U.HUD_INTERVAL = 1 / 12;
  U.hudClock = 0;
  U.RESPAWN_MS = 240000; // 4 min para que reaparezca un enemigo
  U.INV_SLOTS = 40; // casillas de inventario del jugador
  U.CAST_SLOW = 0.4; // al canalizar te mueves al 40% de tu velocidad
  U.DEATH_HOLD = 1.8; // segundos que dura la muerte antes de reaparecer
  U.CAST_INTERRUPT_ON_HIT = false; // ponlo en true si quieres que el dano corte el conjuro
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  U.rnd = (a, b) => a + Math.random() * (b - a);
  U.pick = a => a[Math.floor(Math.random() * a.length)];
  U.state = {
    battle: false,
    autoAttack: false,
    selectedSpell: null,
    safeZone: true,
    contextAction: 'use',
    time: 0,
    day: 0.35,
    messages: [],
    corpses: [],
    projectiles: [],
    effects: [],
    houses: [{ city: 'Valdoria', owned: true, chests: 2, shop: true }],
    bank: [],
    vendor: null,
    currentCorpse: null,
    selectedVendor: null,
    selectedBank: null,
    titles: [],
  };
  U.player = {
    name: 'Pitiao',
    str: 50,
    dex: 50,
    int: 20,
    statProgress: { str: 0, dex: 0, int: 0 },
    maxWeight: 100,
    x: 2,
    y: 3,
    z: 0,
    vx: 0,
    vy: 0,
    speed: 5.4,
    hp: 120,
    maxHp: 120,
    mana: 90,
    maxMana: 90,
    stam: 100,
    maxStam: 100,
    dead: false,
    respawn: { x: 1, y: 1, name: 'Centro de Valdoria' },
    target: null,
    attackCd: 0,
    spellCd: 0,
    healCd: 0,
    bandaging: null,
    recoveryBoost: 0,
    knownSpells: [],
    favoriteSpells: [],
    gold: 100,
    inventory: [],
    equipment: {},
    skills: {},
    skillLocks: {},
    newbie: true,
    playTime: 0,
    anim: 0,
    attackAnim: 0,
    hitAnim: 0,
    deathAnim: 0,
    facing: 'down',
  };
  // Habilidades iniciales: Espada y Curar arrancan en 50, Tácticas en 20.
  // El resto empieza en 0 y se gana jugando.
  const STARTING_SKILLS = { Espada: 50, Curar: 50, Tácticas: 20 };
  for (const cat in U.SKILLS)
    for (const s of U.SKILLS[cat]) {
      U.player.skills[s] = STARTING_SKILLS[s] || 0;
      U.player.skillLocks[s] = 'up';
    }
  U.camera = { x: 0, y: 0 };
  U.input = { keys: {}, jx: 0, jy: 0, moveTarget: null };
  U.npcs = [];
  U.enemies = [];
  // FIX jugabilidad: sin tope, una ráfaga de eventos (combate + misión +
  // skills) apilaba toasts sin límite y tapaba la pantalla. Ahora se
  // conservan como máximo MAX_TOASTS a la vez; el más viejo se retira antes
  // de sumar uno nuevo.
  const MAX_TOASTS = 4;
  U.toast = function (msg) {
    const host = U.$('#toasts');
    if (!host) return;
    while (host.children.length >= MAX_TOASTS) host.firstElementChild.remove();
    const n = document.createElement('div');
    n.className = 'toast';
    n.textContent = msg;
    host.append(n);
    setTimeout(() => n.remove(), 2900);
  };
  U.SKILL_CAP = 100;
  U.SKILL_TOTAL_CAP = 700;
  U.raiseSkill = function (name, amt) {
    if (U.player.skillLocks[name] !== 'up') return;
    const old = U.player.skills[name] || 0,
      total = Object.values(U.player.skills).reduce((sum, value) => sum + value, 0),
      room = Math.max(0, U.SKILL_TOTAL_CAP - total),
      next = Math.min(U.SKILL_CAP, old + Math.min(amt, room));
    if (next <= old) return;
    U.player.skills[name] = next;
    const oldInt = Math.floor(old),
      newInt = Math.floor(next);
    if (newInt > oldInt) {
      U.skillNotice(name, newInt, true);
      const ix = (U.titleThresholds || []).indexOf(newInt);
      if (ix >= 0) {
        const rank =
          (U.titleRanks[name] || [])[ix] ||
          [
            'el Aprendiz',
            'el Practicante',
            'el Experto',
            'el Veterano',
            'el Maestro',
            'el Gran Maestro',
            'la Leyenda',
          ][ix];
        const title = `${rank} ${U.player.name}`;
        if (!U.state.titles.includes(title)) U.state.titles.push(title);
        U.toast(`Nuevo título: ${title}`);
      }
    } else U.skillNotice(name, next, false);
  };
  U.skillNotice = function (name, value, major) {
    const host = U.$('#level-notices');
    if (!host) return;
    const n = document.createElement('div');
    n.className = 'skill-notice ' + (major ? 'major' : 'minor');
    n.innerHTML = major
      ? `<b>${name} ${Math.floor(value)}</b><span>¡Nuevo nivel!</span>`
      : `<span>${name} +${value.toFixed(1)}</span>`;
    host.append(n);
    setTimeout(() => n.remove(), major ? 2600 : 1300);
  };
  U.raiseStat = function (stat, amount) {
    const labels = { str: 'Fuerza', dex: 'Destreza', int: 'Inteligencia' },
      p = U.player;
    p.statProgress = p.statProgress || { str: 0, dex: 0, int: 0 };
    if (!labels[stat] || p[stat] >= 150 || p.str + p.dex + p.int >= 700) return;
    p.statProgress[stat] = (p.statProgress[stat] || 0) + amount;
    if (p.statProgress[stat] + 1e-9 < 1) return;
    p.statProgress[stat] -= 1;
    p[stat] = Math.min(150, p[stat] + 1);
    const host = U.$('#level-notices');
    if (host) {
      const n = document.createElement('div');
      n.className = 'skill-notice major';
      n.innerHTML = `<b>¡${labels[stat]} subió a ${p[stat]}!</b><span>Atributo mejorado por práctica</span>`;
      host.append(n);
      setTimeout(() => n.remove(), 2800);
    }
    U.ui?.refreshHUD?.();
  };
})((window.Ultra = window.Ultra || {}));
