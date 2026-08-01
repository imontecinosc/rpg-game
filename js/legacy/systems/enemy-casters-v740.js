(function (U) {
  'use strict';
  /* NPC que tiran magia: las bestias Drake, Wraith y el Guardián del
     Umbral (que ya se ve como un Lich — characterAdapter lo reskinea)
     más un nuevo Mago errante humano. Mientras mayor la dificultad de la
     zona (worldTier, calculado en balance-v721.js) más poderoso el
     hechizo que pueden lanzar. */
  const CASTER_TYPES = new Set(['drake', 'dragon', 'wraith', 'mage']);
  function isCaster(e) {
    return CASTER_TYPES.has(e.type) || e.boss;
  }
  const CASTER_COLOR = {
    drake: '#8fd07a', dragon: '#e8703c', wraith: '#a8e0f0', mage: '#8a7ae8', boss: '#c060e8', cryptBoss: '#9aa8b0',
  };
  /* Poder de hechizo por nivel de zona (1 a 5). El daño y la cadencia
     escalan juntos: en zonas más peligrosas, tiran más fuerte Y más
     seguido. */
  const SPELL_TIERS = [
    { dmg: [5, 9], cd: 3.4, range: 8 },
    { dmg: [9, 15], cd: 3.0, range: 9 },
    { dmg: [15, 23], cd: 2.6, range: 10 },
    { dmg: [23, 33], cd: 2.2, range: 11 },
    { dmg: [33, 45], cd: 1.8, range: 12 },
  ];
  function tierFor(e) {
    const t = Math.max(1, Math.min(5, e.worldTier || 1));
    // Los jefes lanzan siempre con la fuerza más alta, sin importar la zona.
    return SPELL_TIERS[e.boss ? 4 : t - 1];
  }

  U.state.enemyProjectiles = U.state.enemyProjectiles || [];

  const rawUpdate = U.update;
  U.update = function (dt) {
    rawUpdate(dt);
    const p = U.player;
    for (const e of U.enemies) {
      if (e.dead || !e.aggro || !isCaster(e)) continue;
      e.castCd = Math.max(0, (e.castCd || 0) - dt);
      const tier = tierFor(e),
        d = U.dist(e, p);
      if (d > tier.range || d < 1.6) continue; // fuera de rango, o ya cuerpo a cuerpo
      if (e.castCd <= 0) {
        e.castCd = tier.cd;
        e.castAnim = 0.5;
        e.castTotal = 0.5;
        const dmg = Math.round(U.rnd(tier.dmg[0], tier.dmg[1])),
          color = CASTER_COLOR[e.type] || CASTER_COLOR[e.boss ? 'boss' : ''] || '#9a7ae0';
        U.state.enemyProjectiles.push({
          x: e.x, y: e.y, tx: p.x, ty: p.y, speed: 9.5, damage: dmg, color, life: 3.2,
        });
        U.sound('cast');
      }
    }
    for (let i = U.state.enemyProjectiles.length - 1; i >= 0; i--) {
      const pr = U.state.enemyProjectiles[i];
      pr.life -= dt;
      const dx = pr.tx - pr.x,
        dy = pr.ty - pr.y,
        d = Math.hypot(dx, dy);
      if (d < 0.7 || pr.life <= 0) {
        if (d < 1.6 && !p.dead) {
          const b = U.getEquipmentBonuses(),
            reduction = Math.min(0.6, (b.armor || 0) * 0.006 + (b.magicResist || 0) / 100),
            taken = Math.max(1, Math.round(pr.damage * (1 - reduction)));
          p.hp = Math.max(0, p.hp - taken);
          p.hitAnim = 0.22;
          U.state.effects.push({ type: 'float', x: p.x, y: p.y, text: '-' + taken, color: pr.color, life: 1 });
          if (p.hp <= 0) U.die();
        }
        U.state.enemyProjectiles.splice(i, 1);
        continue;
      }
      pr.x += (dx / d) * pr.speed * dt;
      pr.y += (dy / d) * pr.speed * dt;
    }
  };

  const rawDraw = U.draw;
  U.draw = function () {
    rawDraw();
    const c = U.ctx;
    for (const pr of U.state.enemyProjectiles) {
      const s = U.worldToScreen(pr.x, pr.y, 9);
      c.save();
      c.globalAlpha = Math.min(1, pr.life);
      c.fillStyle = pr.color;
      c.shadowColor = pr.color;
      c.shadowBlur = 14;
      c.beginPath();
      c.arc(s.x, s.y, 6, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  };
})((window.Ultra = window.Ultra || {}));
