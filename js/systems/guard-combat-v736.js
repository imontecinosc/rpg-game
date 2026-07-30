(function (U) {
  'use strict';
  /* FIX jugabilidad: los guardias no tenían NINGUNA lógica de combate.
     U.hitEnemy/U.killEnemy ya funcionan con ellos (ver world-services.js,
     donde ahora sí tienen hp/maxHp/loot/danger), pero nadie los hacía
     perseguir ni golpear de vuelta, y como viven en U.npcs (no en
     U.enemies) el bucle de reaparición del juego nunca los tocaba. */
  const MELEE_RANGE = 1.55;
  const CALM_DISTANCE = 17; // si el jugador se aleja tanto, el guardia se calma

  const rawUpdate = U.update;
  U.update = function (dt) {
    rawUpdate(dt);
    for (const n of U.npcs) {
      if (n.type !== 'guard') continue;

      if (n.dead) {
        n.deathAnim = Math.max(0, (n.deathAnim || 0) - dt);
        if (!n.respawnAt) n.respawnAt = Date.now() + U.RESPAWN_MS;
        if (Date.now() >= n.respawnAt) {
          n.dead = false;
          n.hp = n.maxHp;
          n.aggro = false;
          n.respawnAt = null;
          n.x = n.homeX;
          n.y = n.homeY;
        }
        continue;
      }

      n.hitAnim = Math.max(0, (n.hitAnim || 0) - dt);
      n.attackCd = Math.max(0, n.attackCd - dt);
      if (!n.aggro) {
        n.moving = false;
        continue;
      }

      const d = U.dist(n, U.player);
      if (U.player.dead || d > CALM_DISTANCE) {
        n.aggro = false;
        n.moving = false;
        continue;
      }

      if (d > MELEE_RANGE) {
        // Perseguir al jugador.
        const dx = U.player.x - n.x,
          dy = U.player.y - n.y,
          dd = Math.hypot(dx, dy) || 1;
        const speed = Math.min(n.speed || 4, U.player.speed * 0.95);
        n.x += (dx / dd) * speed * dt;
        n.y += (dy / dd) * speed * dt;
        n.moving = true;
        n.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        n.anim = (n.anim || 0) + dt;
      } else {
        n.moving = false;
        if (n.attackCd <= 0) {
          n.attackCd = 0.85;
          n.attackAnim = 0.42;
          n.attackTotal = 0.42;
          n.facing = U.player.x > n.x ? 'right' : 'left';
          const weaponDef = U.itemDefs[n.equipment?.weapon?.id] || { damage: 14 };
          const raw = weaponDef.damage * 1.3 + U.rnd(-2, 4);
          const armor = (U.getEquipmentBonuses().armor || 0) * 0.35;
          const dmg = Math.max(1, Math.round(raw - armor));
          U.player.hp = Math.max(0, U.player.hp - dmg);
          U.player.hitAnim = 0.22;
          U.sound('hit');
          U.state.effects.push({
            type: 'float', x: U.player.x, y: U.player.y, text: '-' + dmg, color: '#ff9c8f', life: 1,
          });
        }
      }
    }
  };
})((window.Ultra = window.Ultra || {}));
