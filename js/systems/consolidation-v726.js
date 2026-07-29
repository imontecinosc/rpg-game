(function (U) {
  'use strict';

  U.VERSION = '7.26';
  const SKILL_TOTAL_CAP = U.SKILL_TOTAL_CAP || 700;
  const canonicalIds = { helmet: 'ironHelmet', boots: 'leatherBoots' };

  function normalizeProgression() {
    for (const name of Object.keys(U.player.skills || {}))
      U.player.skills[name] = U.clamp(Number(U.player.skills[name]) || 0, 0, U.SKILL_CAP || 100);
  }

  const previousNormalize = U.normalizeInventory;
  U.normalizeInventory = function () {
    for (const item of U.player.inventory || []) if (canonicalIds[item.id]) item.id = canonicalIds[item.id];
    for (const item of Object.values(U.player.equipment || {}))
      if (canonicalIds[item?.id]) item.id = canonicalIds[item.id];
    previousNormalize();
    normalizeProgression();
  };

  // Al llegar al cap total, practicar una skill marcada ↑ libera la misma
  // cantidad desde una skill marcada ↓. Mantener (—) nunca cambia.
  const previousRaiseSkill = U.raiseSkill;
  U.raiseSkill = function (name, amount, context) {
    const total = Object.values(U.player.skills).reduce((sum, value) => sum + value, 0);
    if (total >= SKILL_TOTAL_CAP - 0.0001 && U.player.skillLocks[name] === 'up') {
      const donor = Object.keys(U.player.skills).find(
        skill => skill !== name && U.player.skillLocks[skill] === 'down' && U.player.skills[skill] > 0,
      );
      if (!donor) return;
      U.player.skills[donor] = Math.max(0, U.player.skills[donor] - Math.min(amount, 0.1));
    }
    previousRaiseSkill(name, amount, context);
  };

  const specials = {
    Espada: {
      60: { name: 'Golpe poderoso', cd: 8, cost: 24 },
      80: { name: 'Ignorar armadura', cd: 14, cost: 36 },
    },
    Magia: {
      60: { name: 'Oleada arcana', cd: 10, cost: 28 },
      80: { name: 'Tormenta encadenada', cd: 18, cost: 45 },
    },
    Curar: {
      60: { name: 'Vendaje rápido', cd: 12, cost: 18 },
      80: { name: 'Baluarte vital', cd: 22, cost: 32 },
    },
  };

  function activeSpecialSkill() {
    const weapon = U.player.equipment.weapon && U.itemDefs[U.player.equipment.weapon.id];
    if (weapon?.skill === 'Espada') return 'Espada';
    if ((U.player.skills.Magia || 0) >= Math.max(U.player.skills.Espada || 0, U.player.skills.Curar || 0))
      return 'Magia';
    return (U.player.skills.Curar || 0) >= (U.player.skills.Espada || 0) ? 'Curar' : 'Espada';
  }

  U.useSpecial = function (level) {
    const skill = activeSpecialSkill(),
      ability = specials[skill][level],
      p = U.player;
    p.specialCooldowns ||= {};
    const key = `${skill}-${level}`,
      remaining = (p.specialCooldowns[key] || 0) - performance.now();
    if ((p.skills[skill] || 0) < level) return U.toast(`Requiere ${skill} ${level}.`);
    if (remaining > 0) return U.toast(`${ability.name}: ${(remaining / 1000).toFixed(1)} s de recarga.`);
    if (p.stam < ability.cost && skill === 'Espada') return U.toast('No tienes aguante suficiente.');
    if (p.mana < ability.cost && skill !== 'Espada') return U.toast('No tienes maná suficiente.');

    if (skill === 'Curar') {
      p.mana -= ability.cost;
      if (level === 60) {
        p.hp = Math.min(p.maxHp, p.hp + 24 + p.skills.Curar * 0.28);
        U.toast('Vendaje rápido completado.');
      } else {
        p.hp = Math.min(p.maxHp, p.hp + 35);
        p.vitalBulwark = 8;
        U.toast('Baluarte vital activo durante 8 s.');
      }
    } else {
      const target = p.target;
      if (!U.state.battle || !target || target.dead) return U.toast('Marca un enemigo en modo Batalla.');
      const maxRange = skill === 'Magia' ? 9 : 1.9;
      if (U.dist(p, target) > maxRange) return U.toast('El objetivo está fuera de alcance.');
      if (skill === 'Espada') {
        p.stam -= ability.cost;
        const weapon = U.itemDefs[p.equipment.weapon?.id] || U.itemDefs.ironSword;
        const multiplier = level === 60 ? 1.65 : 1.35;
        const damage = (weapon.damage + p.skills.Espada * 0.1 + p.str * 0.06) * multiplier;
        U.hitEnemy(target, damage, level === 80);
      } else {
        p.mana -= ability.cost;
        const targets =
          level === 80 ? U.enemies.filter(e => !e.dead && U.dist(e, target) < 4).slice(0, 4) : [target];
        targets.forEach((enemy, index) => U.hitEnemy(enemy, 22 + p.skills.Magia * 0.22 - index * 3));
      }
      p.attackAnim = 0.5;
      U.toast(ability.name);
    }
    p.specialCooldowns[key] = performance.now() + ability.cd * 1000;
    U.sound(skill === 'Magia' ? 'magic' : skill === 'Espada' ? 'sword' : 'bandage');
    U.ui.refreshAll();
  };

  const previousRefreshHud = U.ui.refreshHUD;
  U.ui.refreshHUD = function () {
    previousRefreshHud();
    const skill = activeSpecialSkill();
    for (const level of [60, 80]) {
      const button = U.$(`#special-${level}`),
        ability = specials[skill][level];
      button.disabled = (U.player.skills[skill] || 0) < level;
      button.title = `${skill}: ${ability.name}`;
      button.innerHTML = `<b>${level}</b><small>${ability.name}</small>`;
    }
  };
  U.$('#special-60').onclick = () => U.useSpecial(60);
  U.$('#special-80').onclick = () => U.useSpecial(80);

  const previousBonuses = U.getEquipmentBonuses;
  U.getEquipmentBonuses = function () {
    const bonuses = previousBonuses();
    if ((U.player.vitalBulwark || 0) > 0) {
      bonuses.physicalResist = (bonuses.physicalResist || 0) + 22;
      bonuses.magicResist = (bonuses.magicResist || 0) + 15;
    }
    return bonuses;
  };

  // Roles reales: cada familia modifica posicionamiento o apoyo, sin aumentar
  // únicamente vida y daño.
  const previousUpdate = U.update;
  U.update = function (dt) {
    previousUpdate(dt);
    const p = U.player;
    p.vitalBulwark = Math.max(0, (p.vitalBulwark || 0) - dt);
    for (const e of U.enemies) {
      if (e.dead || !e.aggro || !e.role) continue;
      const dx = e.x - p.x,
        dy = e.y - p.y,
        distance = Math.max(0.01, Math.hypot(dx, dy));
      if (e.role === 'skirmisher' && distance < 4.2) {
        e.x += (dx / distance) * e.speed * 0.55 * dt;
        e.y += (dy / distance) * e.speed * 0.55 * dt;
      } else if (e.role === 'flanker' && distance > 1.55) {
        const side = e.spawnId?.length % 2 ? 1 : -1;
        e.x += (-dy / distance) * side * e.speed * 0.38 * dt;
        e.y += (dx / distance) * side * e.speed * 0.38 * dt;
      } else if (e.role === 'guardian') {
        e.guardAura = U.enemies.some(
          ally => ally !== e && !ally.dead && U.dist(e, ally) < 3.2 && ally.hp < ally.maxHp * 0.75,
        );
      } else if (e.role === 'control' && distance < 4.5) {
        e.controlClock = (e.controlClock || 0) - dt;
        if (e.controlClock <= 0) {
          e.controlClock = 5;
          p.stam = Math.max(0, p.stam - 10);
          U.state.effects.push({
            type: 'float',
            x: p.x,
            y: p.y,
            text: 'ZONA DE CONTROL',
            color: '#bda6ef',
            life: 1,
          });
        }
      }
    }
  };

  const previousHitEnemy = U.hitEnemy;
  U.hitEnemy = function (target, damage, critical) {
    const guardian = U.enemies.find(
      enemy =>
        enemy !== target &&
        !enemy.dead &&
        enemy.role === 'guardian' &&
        enemy.guardAura &&
        U.dist(enemy, target) < 3.2,
    );
    previousHitEnemy(target, guardian ? damage * 0.72 : damage, critical);
  };

  // Las regiones superiores mejoran recompensas sin garantizar rarezas.
  const previousKillEnemy = U.killEnemy;
  U.killEnemy = function (enemy) {
    const before = U.state.corpses.length;
    previousKillEnemy(enemy);
    const corpse = U.state.corpses.slice(before)[0],
      tier = enemy.worldTier || 1;
    for (const item of corpse?.items || [])
      if (item.id === 'gold') item.qty = Math.round(item.qty * (1 + (tier - 1) * 0.16));
    if (corpse && tier >= 3 && Math.random() < (tier - 2) * 0.035) {
      const pool = ['ironSword', 'greatSword', 'spear', 'mace', 'ironHelmet', 'ironChest', 'copperChest'];
      const id = U.pick(pool.filter(itemId => U.itemDefs[itemId]));
      corpse.items.push(U.createEquipmentInstance(id, { danger: tier }));
    }
  };

  // Corrige la progresión de materiales sin invalidar objetos existentes.
  if (U.itemDefs.copperChest) U.itemDefs.copperChest.armor = Math.max(13, U.itemDefs.copperChest.armor || 0);
  for (const [id, def] of Object.entries(U.itemDefs))
    if (/^copper/.test(id) && def.type === 'armor')
      def.armor = Math.max(
        def.armor || 0,
        Math.ceil((U.itemDefs[`iron${id.slice(6)}`]?.armor || def.armor || 1) * 1.08),
      );

  const previousLoad = U.load;
  U.load = function () {
    previousLoad();
    normalizeProgression();
    U.ui.refreshAll();
  };
})((window.Ultra = window.Ultra || {}));
