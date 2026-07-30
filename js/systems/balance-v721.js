(function (U) {
  'use strict';
  U.VERSION = '7.21';
  U.ORE_RESPAWN_MS = 600000;
  const rawRaise = U.raiseSkill;
  /* Curva de dificultad por nivel de habilidad. Se sube más rápido cuando
     recién se empieza (0-15) para que arrancar de cero (Minería,
     Herrería...) no se sienta imposible, y cada vez más lento a medida
     que se acerca al máximo — así el 100 realmente cuesta. */
  const tier = n => (n < 15 ? 1.6 : n < 30 ? 1 : n < 60 ? 0.55 : n < 80 ? 0.25 : n < 90 ? 0.12 : 0.05);
  const challenge = d => (d >= 20 ? 1.3 : d >= -8 ? 1 : d >= -25 ? 0.4 : d >= -45 ? 0.08 : 0.01);
  U.skillPractice = {};
  /* Skills y stats a la mitad de velocidad, pedido explícitamente. */
  U.GLOBAL_SKILL_RATE = 0.5;
  U.raiseSkill = function (name, amount, ctx = {}) {
    const lv = U.player.skills[name] || 0,
      difficulty = ctx.difficulty ?? ((U.player.target?.danger || 0) * 12 || lv);
    const key = ctx.targetKey || U.player.target?.spawnId || U.player.target?.type || name,
      now = Date.now();
    const r = U.skillPractice[key] || { count: 0, last: 0 };
    r.count = now - r.last < 90000 ? r.count + 1 : 1;
    r.last = now;
    U.skillPractice[key] = r;
    const variety = Math.max(0.25, 1 - Math.max(0, r.count - 10) * 0.035);
    rawRaise(
      name,
      Math.max(0.0003, amount * tier(lv) * challenge(difficulty - lv) * variety * U.GLOBAL_SKILL_RATE),
    );
  };
  const rawRaiseStat = U.raiseStat;
  U.raiseStat = function (stat, amount) {
    rawRaiseStat(stat, amount * U.GLOBAL_SKILL_RATE);
  };
  /* ══════════════════════════════════════════════════════════════════
     TABLAS DE MATERIALES — antes estaban escritas directo en game.js con
     solo 2-3 opciones (sin carbón como material normal, mithril nunca
     aparecía). Ahora es una tabla ponderada por nivel de habilidad:
     el hierro siempre es la base, el carbón se suma temprano igual que
     cualquier otro mineral, y a nivel 100 ya sale de todo — el mithril
     con probabilidad baja, tal como se pidió.
     ══════════════════════════════════════════════════════════════════ */
  U.pickOre = function (skill) {
    const pool = [['ironOre', 38]];
    if (skill >= 8) pool.push(['coal', 24]);
    if (skill >= 25) pool.push(['copperOre', 20]);
    if (skill >= 55) pool.push(['goldOre', 11]);
    if (skill >= 100) pool.push(['mithrilOre', 2]);
    const total = pool.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [id, w] of pool) {
      if (r < w) return id;
      r -= w;
    }
    return pool[0][0];
  };
  U.pickWood = function (skill) {
    const pool = [['wood', 40]];
    if (skill >= 20) pool.push(['oakWood', 24]);
    if (skill >= 50) pool.push(['yewWood', 18]);
    if (skill >= 100) pool.push(['ironwood', 5]);
    const total = pool.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [id, w] of pool) {
      if (r < w) return id;
      r -= w;
    }
    return pool[0][0];
  };
  function affixValue(danger = 1) {
    const r = Math.random();
    let a, b;
    if (r < 0.55) [a, b] = [0.5, 2];
    else if (r < 0.83) [a, b] = [2.1, 4];
    else if (r < 0.96) [a, b] = [4.1, 6];
    else if (r < 0.995) [a, b] = [6.1, 7.5];
    else [a, b] = [7.6, 8];
    return Math.min(8, Math.round((a + Math.random() * (b - a) + Math.min(0.8, (danger - 1) * 0.08)) * 10) / 10);
  }
  const rawCreate = U.createEquipmentInstance;
  U.createEquipmentInstance = function (id, opt = {}) {
    const it = rawCreate(id, opt);
    if (!it) return it;
    const out = {};
    for (const k of Object.keys(it.bonuses || {})) out[k] = affixValue(opt.danger || 1);
    it.bonuses = out;
    return it;
  };
  const families = [
    [/great|mandoble/i, 'Mandoble', 'Lento, gran daño y alcance', { str: 58 }],
    [/dagger|kriss|daga/i, 'Daga', 'Rápida, crítica y apta para veneno', { dex: 42 }],
    [/mace|maza|hammer/i, 'Contundente', 'Especializada contra armadura', { str: 48 }],
    [/spear|pike|lanza|pica/i, 'Arma de asta', 'Más alcance y peor combate adyacente', { dex: 42 }],
    [/bow|arco/i, 'Arco', 'Distancia y consumo de munición', { dex: 48 }],
    [/staff|báculo/i, 'Báculo', 'Potencia y eficiencia mágica', { int: 45, skill: ['Magia', 35] }],
    [/axe|hacha/i, 'Hacha', 'Daño alto e irregular', { str: 50 }],
    [/sword|espada/i, 'Espada', 'Equilibrada y fiable', { str: 35 }],
  ];
  for (const [id, d] of Object.entries(U.itemDefs)) {
    if (!d.slot) continue;
    const f = families.find(x => x[0].test(id + ' ' + d.name));
    if (f && d.type === 'weapon')
      Object.assign(d, { identity: f[1], combatIdentity: f[2], requirements: { ...f[3], ...(d.requirements || {}) } });
    if (d.type === 'armor' && /iron|metal|copper|gold|mithril|black/i.test(id)) {
      const req = { helmet: 35, neck: 30, torso: 60, arms: 40, gloves: 25, legs: 50, boots: 30 }[d.slot] || 35;
      d.requirements = { ...(d.requirements || {}), str: Math.max(req, d.requirements?.str || 0) };
      d.weight = Math.max(d.weight || 0, d.slot === 'torso' ? 18 : d.slot === 'legs' ? 12 : 7);
    }
  }
  function missing(d) {
    for (const [k, v] of Object.entries(d.requirements || {})) {
      if (k === 'skill') {
        if ((U.player.skills[v[0]] || 0) < v[1]) return `${v[0]} ${v[1]}`;
      } else if ((U.player[k] || 0) < v) return `${k.toUpperCase()} ${v}`;
    }
  }
  const rawEquip = U.equip;
  U.equip = function (i) {
    const d = U.itemDefs[U.player.inventory[i]?.id],
      m = d && missing(d);
    if (m) return U.toast('No cumples el requisito: ' + m + '.');
    rawEquip(i);
  };
  U.equipmentWeight = () =>
    Object.values(U.player.equipment || {}).reduce((s, it) => s + (U.itemDefs[it.id]?.weight || 0), 0);
  for (const m of U.terrain.mines) {
    m.nodeId ||= `mine-${m.x}-${m.y}`;
    m.maxCharges ||= m.rich ? 12 : Math.round(U.rnd(5, 9));
    m.charges ??= m.maxCharges;
    m.respawnAt ??= 0;
    if (!U.terrain.stations.some(s => s.type === 'forge' && U.dist(s, m) < m.r))
      U.terrain.stations.push({ type: 'forge', name: 'Forja de ' + (m.name || 'la mina'), x: m.x + 1.5, y: m.y + 1 });
  }
  function mineNear() {
    const now = Date.now();
    for (const m of U.terrain.mines)
      if (m.charges <= 0 && m.respawnAt && now >= m.respawnAt) {
        m.charges = m.maxCharges;
        m.respawnAt = 0;
      }
    return U.terrain.mines.find(m => U.dist(U.player, m) < m.r && m.charges > 0);
  }
  /* ══════════════════════════════════════════════════════════════════
     MINAR Y TALAR AUTOMÁTICOS. Antes solo minar era automático (y con
     un bug: esta función volvía a llamar raiseSkill('Minería',...) por
     su cuenta ADEMÁS de la que ya hace game.js en cada golpe, duplicando
     la velocidad de subida — justo lo contrario de la mitad pedida).
     Ahora ninguno de los dos duplica: la única raiseSkill vive en
     game.js, y acá solo se administra la sesión (reinicio automático,
     stamina, cuándo parar y ocultar la barra).
     ══════════════════════════════════════════════════════════════════ */
  const rawGather = U.gather;
  U.gather = function (type) {
    if (type === 'mine') {
      const node = mineNear();
      if (!node) return U.toast('La veta está agotada. Busca otro enclave mientras reaparece.');
      U.player.miningSession = { node, startX: U.player.x, startY: U.player.y };
      U.player.stam = Math.max(0, U.player.stam - 4);
      return rawGather(type);
    }
    if (type === 'wood') {
      U.player.choppingSession = { startX: U.player.x, startY: U.player.y };
      U.player.stam = Math.max(0, U.player.stam - 3);
      return rawGather(type);
    }
    return rawGather(type);
  };
  const rawUpdate = U.update;
  U.update = function (dt) {
    const beforeGather = U.player.bandaging?.gather;
    rawUpdate(dt);

    const ms = U.player.miningSession;
    if (ms) {
      if (U.player.dead || U.state.battle || Math.hypot(U.player.x - ms.startX, U.player.y - ms.startY) > 1.25) {
        U.player.miningSession = null;
        if (U.player.bandaging?.gather === 'mine') U.player.bandaging = null;
        U.toast('Minería automática detenida.');
        U.showActivityResult?.('interrupted', 'Minería detenida');
      } else if (beforeGather === 'mine' && !U.player.bandaging) {
        ms.node.charges--;
        U.raiseStat('str', ms.node.rich ? 0.05 : 0.025);
        if (ms.node.charges <= 0) {
          ms.node.respawnAt = Date.now() + U.ORE_RESPAWN_MS;
          U.player.miningSession = null;
          U.toast('Agotaste la veta. Reaparecerá en 10 minutos; busca otro enclave.');
          U.showActivityResult?.('complete', 'Veta agotada');
        } else if (U.player.stam < 4) {
          U.player.miningSession = null;
          U.toast('No tienes aguante para seguir minando.');
          U.showActivityResult?.('interrupted', 'Sin aguante');
        } else {
          U.player.stam -= 4;
          const t = ms.node.rich ? 1.25 : 2.5;
          U.player.bandaging = { t, total: t, gather: 'mine' };
          U.sound('mine');
        }
      }
    }

    const cs = U.player.choppingSession;
    if (cs) {
      if (U.player.dead || U.state.battle || Math.hypot(U.player.x - cs.startX, U.player.y - cs.startY) > 1.25) {
        U.player.choppingSession = null;
        if (U.player.bandaging?.gather === 'wood') U.player.bandaging = null;
        U.toast('Tala automática detenida.');
        U.showActivityResult?.('interrupted', 'Tala detenida');
      } else if (beforeGather === 'wood' && !U.player.bandaging) {
        U.raiseStat('str', 0.03);
        if (U.player.stam < 3) {
          U.player.choppingSession = null;
          U.toast('No tienes aguante para seguir talando.');
          U.showActivityResult?.('interrupted', 'Sin aguante');
        } else {
          U.player.stam -= 3;
          const t = 2.1;
          U.player.bandaging = { t, total: t, gather: 'wood' };
          U.sound('wood');
        }
      }
    }

    if (U.equipmentWeight() / Math.max(1, U.player.maxWeight) > 0.92)
      U.player.stam = Math.max(0, U.player.stam - dt * 1.5);
  };
  /* Vendaje aleatorio 1.5-4.0s, ponderado por Curar+Destreza sin ser
     determinístico. Sube Destreza y Anatomía. */
  U.healBandage = function () {
    const p = U.player;
    if (p.healCd > 0 || p.bandaging) return U.toast('No puedes vendarte todavía.');
    if (U.countItem('bandage') < 1) return U.toast('No tienes vendas.');
    U.removeItem('bandage', 1);
    const mastery = Math.min(100, p.skills.Curar || 0) * 0.65 + (Math.min(150, p.dex || 0) / 1.5) * 0.35;
    const masteryNorm = Math.min(1, mastery / 100);
    const roll = Math.pow(Math.random(), 1 + masteryNorm * 2.2);
    const duration = 1.5 + roll * 2.5;
    p.bandaging = { t: duration, total: duration };
    U.toast(`Comienzas a vendarte · ${duration.toFixed(1)} s.`);
    U.sound('bandage');
    U.raiseSkill('Curar', 0.08, { difficulty: Math.max(15, 100 - (p.hp / p.maxHp) * 70), targetKey: 'bandage' });
    U.raiseStat('dex', 0.08);
    U.raiseSkill('Anatomía', 0.05, { difficulty: 20, targetKey: 'bandage-anatomia' });
  };
  const rawUse = U.useAction;
  U.useAction = function () {
    const all = U.state.corpses.filter(c => U.dist(U.player, c) < 2.25);
    if (!all.length) return rawUse();
    const own = all.find(c => c.isPlayerCorpse && c.owner === 'player');
    if (own) return U.ui.openCorpse(own);
    if (all.length === 1) return U.ui.openCorpse(all[0]);
    const group = {
      name: `${all.length} cadáveres cercanos`, x: U.player.x, y: U.player.y,
      items: all.flatMap(c => c.items), life: Math.max(...all.map(c => c.life || 1)),
    };
    U.state.corpses = U.state.corpses.filter(c => !all.includes(c));
    U.state.corpses.push(group);
    U.toast(`Abriste el botín de ${all.length} cuerpos.`);
    U.ui.openCorpse(group);
  };
  const rawCraft = U.craft;
  U.craft = function (i) {
    const ids = new Set(U.player.inventory.map(x => x.uid));
    rawCraft(i);
    for (const it of U.player.inventory)
      if (!ids.has(it.uid) && U.itemDefs[it.id]?.slot) Object.assign(it, { crafted: true, craftedBy: U.player.name, recipeIndex: i });
  };
  U.smeltCrafted = function (i) {
    const it = U.player.inventory[i];
    if (!it?.crafted) return U.toast('Solo puedes fundir objetos fabricados.');
    if (!U.terrain.stations.some(s => s.type === 'forge' && U.dist(U.player, s) < 2.4))
      return U.toast('Debes estar junto a una forja.');
    const ingots = Object.entries(U.recipes[it.recipeIndex]?.in || {}).filter(([id]) => /Ingot$/.test(id));
    if (!ingots.length) return U.toast('Este objeto no contiene lingotes.');
    const quality = { Normal: 0, Superior: 0.03, Excepcional: 0.06, 'Obra maestra': 0.1 }[it.quality] || 0;
    const durability = Math.min(1, (it.durability || 100) / (U.itemDefs[it.id]?.durability || 100));
    const rate = Math.min(0.55, (0.35 + Math.min(100, U.player.skills.Herrería || 0) * 0.0015 + quality) * durability);
    let total = 0;
    for (const [id, q] of ingots) {
      const n = Math.floor(q * rate);
      if (n) {
        U.addItem(id, n);
        total += n;
      }
    }
    U.player.inventory.splice(i, 1);
    U.raiseSkill('Herrería', 0.02, { difficulty: 25, targetKey: 'smelting' });
    U.sound('craft');
    U.toast(`Recuperaste ${total} lingotes (${Math.round(rate * 100)}%).`);
    U.ui.refreshAll();
  };
  const refreshInv = U.ui.refreshInventory;
  U.ui.refreshInventory = function () {
    refreshInv();
    const i = U.state.selectedInventoryIndex,
      it = U.player.inventory[i],
      box = U.$('#inventory-detail');
    if (it?.crafted && box && !box.querySelector('[data-smelt]'))
      box.querySelector('.detail-actions')?.insertAdjacentHTML('beforeend', `<button data-smelt="${i}">Fundir</button>`);
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-smelt]');
    if (b) U.smeltCrafted(+b.dataset.smelt);
  });
  U.worldDifficultyZones = [
    { name: 'Refugio de Valdoria', x: 0, y: 0, r: 36, tier: 1 },
    { name: 'Fronteras iniciales', x: 35, y: -20, r: 55, tier: 2 },
    { name: 'Tierras intermedias', x: 105, y: -25, r: 65, tier: 3 },
    { name: 'Territorios peligrosos', x: -80, y: -85, r: 55, tier: 4 },
    { name: 'Dominio avanzado de Brumaférrea', x: 155, y: -100, r: 48, tier: 5 },
  ];
  const rawSetup = U.setupWorld;
  U.setupWorld = function () {
    rawSetup();
    for (const e of U.enemies) {
      const z = U.worldDifficultyZones.reduce((best, x) => (U.dist(e, x) < x.r && x.tier > best.tier ? x : best), { tier: 1 });
      e.worldTier = z.tier;
      e.xpDifficulty = Math.max(10, z.tier * 20 + (e.danger || 1) * 4);
      if (z.tier >= 3) e.aggroRange = (e.aggroRange || 11) + (z.tier - 2);
      if (z.tier >= 4) e.role = e.magic ? 'control' : e.ranged ? 'skirmisher' : e.armor > 10 ? 'guardian' : 'flanker';
    }
  };
})((window.Ultra = window.Ultra || {}));
