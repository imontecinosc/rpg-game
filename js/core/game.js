(function (U) {
  U.update = function (dt) {
    const p = U.player,
      k = U.input.keys,
      b = U.getEquipmentBonuses();
    p.maxHp = 70 + p.str + (b.maxHp || 0);
    p.maxMana = 70 + p.int + (b.maxMana || 0);
    p.maxStam = 50 + p.dex + (b.maxStamina || 0);
    p.maxWeight = 50 + p.str;
    let dx = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0) + U.input.jx,
      dy = (k.s || k.arrowdown ? 1 : 0) - (k.w || k.arrowup ? 1 : 0) + U.input.jy,
      m = Math.hypot(dx, dy);
    const manualMovement = m > 0.08;
    if (manualMovement) U.input.moveTarget = null;
    else if (U.input.moveTarget && !p.dead) {
      const tx = U.input.moveTarget.x - p.x,
        ty = U.input.moveTarget.y - p.y,
        distance = Math.hypot(tx, ty);
      if (distance <= 0.16) {
        U.input.moveTarget = null;
        dx = 0;
        dy = 0;
        m = 0;
      } else {
        dx = tx / distance;
        dy = ty / distance;
        m = 1;
      }
    }
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    // Mientras dura la muerte el jugador no responde y el cuerpo se queda tendido.
    if (p.dead) {
      U.input.moveTarget = null;
      dx = 0;
      dy = 0;
      m = 0;
      p.deathHold = Math.max(0, (p.deathHold || 0) - dt);
      if (p.deathHold <= 0) U.respawn();
    }
    // Al canalizar un hechizo te mueves lento, no te quedas clavado.
    p.recoveryBoost = Math.max(0, (p.recoveryBoost || 0) - dt);
    const recoverySpeed = p.recoveryBoost > 0 ? 1.1 : 1;
    const move = p.speed * recoverySpeed * (1 + (b.moveSpeed || 0) / 100) * (p.casting ? U.CAST_SLOW : 1);
    p.vx = dx * move;
    p.vy = dy * move;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0.1) p.facing = dx > 0 ? 'right' : 'left';
    else if (Math.abs(dy) > 0.1) p.facing = dy > 0 ? 'down' : 'up';
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    /* FIX: el reloj de animación solo avanzaba si el personaje se movía,
       así que picar/talar (que se hace parado, quieto) nunca se veía
       animado — solo si por casualidad el joystick tenía algo de deriva.
       El renderer ya sabe dibujar la animación de picar/talar (CLIPS
       'mine'/'chop'), solo hacía falta que el reloj avanzara también. */
    p.anim += dt * (m > 0.05 || p.bandaging?.gather ? 1 : 0);
    p.stepClock = Math.max(0, (p.stepClock || 0) - dt);
    if (m > 0.05 && !p.dead && p.stepClock <= 0) {
      U.sound('step');
      p.stepClock = p.casting ? 0.58 : 0.38;
    }
    p.playTime += dt;
    p.attackCd = Math.max(0, p.attackCd - dt);
    p.spellCd = Math.max(0, p.spellCd - dt);
    p.healCd = Math.max(0, p.healCd - dt);
    p.attackAnim = Math.max(0, p.attackAnim - dt);
    p.castAnim = Math.max(0, (p.castAnim || 0) - dt);
    if (p.casting) {
      p.casting.t = Math.max(0, p.casting.t - dt);
      if (p.casting.t <= 0) {
        const sp = U.spells.find(s => s.id === p.casting.id);
        p.casting = null;
        if (sp) U.finishCast(sp);
        if (U.ui.refreshCastBar) U.ui.refreshCastBar();
      }
    }
    p.hitAnim = Math.max(0, (p.hitAnim || 0) - dt);
    p.deathAnim = Math.max(0, (p.deathAnim || 0) - dt);
    p.hp = Math.min(p.maxHp, p.hp + dt * (b.healthRegen || 0) * 0.01);
    p.mana = Math.min(
      p.maxMana,
      p.mana + dt * (1.5 + p.skills.Concentración * 0.015) * (1 + (b.manaRegen || 0) / 100),
    );
    p.stam = Math.min(p.maxStam, p.stam + dt * 8 * (1 + (b.staminaRegen || 0) / 100));
    if (p.bandaging) {
      p.bandaging.t -= dt;
      if (p.bandaging.t <= 0) {
        /* FIX jugabilidad: antes esto solo agregaba el material en
           silencio, sin avisar qué se obtuvo, y nunca llamaba a
           U.showActivityResult (por eso la barra de minar/talar se
           quedaba pegada llena después de parar — solo el vendaje de
           curación la ocultaba). La tabla de materiales también era muy
           limitada (sin carbón como material normal, sin mithril nunca). */
        if (p.bandaging.gather === 'mine') {
          const skill = p.skills.Minería || 0,
            id = U.pickOre ? U.pickOre(skill) : 'ironOre',
            qty = Math.round(U.rnd(3, 7)),
            name = U.itemDefs[id]?.name || id;
          U.addItem(id, qty);
          U.raiseSkill('Minería', 0.25);
          if (U.damageEquippedTool) U.damageEquippedTool('mine', 1);
          U.toast(`Obtienes ${qty} ${name}.`);
          if (U.showActivityResult) U.showActivityResult('complete', `+${qty} ${name}`);
        } else if (p.bandaging.gather === 'wood') {
          const skill = p.skills.Tala || 0,
            id = U.pickWood ? U.pickWood(skill) : 'wood',
            qty = Math.round(U.rnd(3, 7)),
            name = U.itemDefs[id]?.name || id;
          U.addItem(id, qty);
          U.raiseSkill('Tala', 0.25);
          if (U.damageEquippedTool) U.damageEquippedTool('wood', 1);
          U.toast(`Obtienes ${qty} ${name}.`);
          if (U.showActivityResult) U.showActivityResult('complete', `+${qty} ${name}`);
        } else if (p.bandaging.gather === 'fish') {
          U.addItem('fish', 1);
          U.raiseSkill('Pesca', 0.25);
          U.toast('Obtienes 1 pescado.');
          if (U.showActivityResult) U.showActivityResult('complete', '+1 Pescado');
        } else {
          const failed = Math.random() < (p.bandaging.failChance || 0);
          if (!failed) p.hp = Math.min(p.maxHp, p.hp + 28 + p.skills.Curar * 0.12);
          p.healCd = 0.5;
          U.toast(failed ? 'El vendaje falló por los golpes recibidos.' : 'Terminas de vendarte.');
          if (U.showActivityResult)
            U.showActivityResult(
              failed ? 'failed' : 'complete',
              failed ? 'Vendaje fallido' : 'Vendaje completado',
            );
        }
        p.bandaging = null;
        U.ui.refreshAll();
      }
    }
    if (U.state.autoAttack && U.state.battle && p.target && !p.target.dead && !p.casting) U.attack();
    U.state.safeZone = U.cities.some(c => Math.hypot(p.x - c.x, p.y - c.y) < c.safe);
    for (const e of U.enemies) {
      if (e.dead) {
        e.deathAnim = Math.max(0, (e.deathAnim || 0) - dt);
        if (!e.respawnAt) e.respawnAt = Date.now() + U.RESPAWN_MS;
        if (Date.now() >= e.respawnAt) {
          e.dead = false;
          e.hp = e.maxHp;
          e.aggro = false;
          e.respawnAt = null;
          e.x = (e.homeX ?? e.x) + U.rnd(-3, 3);
          e.y = (e.homeY ?? e.y) + U.rnd(-3, 3);
        }
        continue;
      }
      e.hitAnim = Math.max(0, (e.hitAnim || 0) - dt);
      e.attackCd = Math.max(0, e.attackCd - dt);
      e.moving = false;
      e.homeX ??= e.x;
      e.homeY ??= e.y;
      e.aggroRange ??= 11;
      e.leashRange ??= 26;
      const playerDist = U.dist(e, p),
        homeDist = Math.hypot(e.x - e.homeX, e.y - e.homeY);
      if (playerDist < e.aggroRange) e.aggro = true;
      if (e.aggro && playerDist > e.leashRange) e.aggro = false;
      let target = e.aggro ? p : null;
      if (!target && homeDist > 1) target = { x: e.homeX, y: e.homeY };
      if (target) {
        const d = Math.hypot(target.x - e.x, target.y - e.y);
        if (d > 1.1) {
          const q = Math.min(e.speed, p.speed * 0.8) * dt;
          e.x += ((target.x - e.x) / d) * q;
          e.y += ((target.y - e.y) / d) * q;
          e.moving = true;
          e.facing =
            Math.abs(target.x - e.x) > Math.abs(target.y - e.y)
              ? target.x > e.x
                ? 'right'
                : 'left'
              : target.y > e.y
                ? 'down'
                : 'up';
        }
      }
      if (e.moving) e.anim = (e.anim || 0) + dt;
      if (e.aggro && playerDist < 1.3 && e.attackCd <= 0) {
        e.attackCd = 1.2;
        e.attackAnim = 0.45;
        e.attackTotal = 0.45;
        const blocked = Math.random() < (b.blockChance || 0) / 100,
          reduction = Math.min(0.65, (b.armor || 0) * 0.008 + (b.physicalResist || 0) / 100),
          taken = blocked ? 0 : Math.max(1, Math.round(e.dmg * (1 - reduction)));
        p.hp -= taken;
        if (!blocked) {
          p.hitAnim = 0.22;
          if (U.registerBandageHit) U.registerBandageHit(taken);
          if (U.CAST_INTERRUPT_ON_HIT) U.cancelCast('Te interrumpieron el conjuro.');
        }
        U.state.effects.push({
          type: 'float', x: p.x, y: p.y, text: blocked ? 'BLOQUEO' : '-' + taken,
          color: blocked ? '#9ed6ff' : '#ff9a91', life: 1,
        });
        if (p.hp <= 0) U.die();
      }
    }
    for (const g of U.npcs.filter(n => n.type === 'guard')) {
      g.attackCd = Math.max(0, (g.attackCd || 0) - dt);
      g.attackAnim = Math.max(0, (g.attackAnim || 0) - dt);
      g.moving = false;
      const city = U.cities.find(c => c.name === g.city),
        hostile =
          city &&
          U.enemies
            .filter(e => !e.dead && Math.hypot(e.x - city.x, e.y - city.y) < city.safe + 7)
            .sort((a, z) => U.dist(g, a) - U.dist(g, z))[0];
      const target = hostile || { x: g.homeX, y: g.homeY };
      const d = Math.hypot(target.x - g.x, target.y - g.y);
      if (d > 1.45) {
        g.x += ((target.x - g.x) / d) * g.speed * dt;
        g.y += ((target.y - g.y) / d) * g.speed * dt;
        g.moving = true;
        g.facing =
          Math.abs(target.x - g.x) > Math.abs(target.y - g.y)
            ? target.x > g.x
              ? 'right'
              : 'left'
            : target.y > g.y
              ? 'down'
              : 'up';
      }
      if (g.moving) g.anim = (g.anim || 0) + dt;
      if (hostile && d <= 1.65 && g.attackCd <= 0) {
        g.attackCd = 0.85;
        g.attackAnim = 0.3;
        g.attackTotal = 0.3;
        hostile.hp -= 24;
        hostile.hitAnim = 0.18;
        hostile.aggro = true;
        U.state.effects.push({ type: 'float', x: hostile.x, y: hostile.y, text: '-24', color: '#a8d8ff', life: 0.8 });
        if (hostile.hp <= 0) {
          hostile.dead = true;
          hostile.hp = 0;
          hostile.aggro = false;
          hostile.respawnAt = Date.now() + U.RESPAWN_MS;
        }
      }
    }
    for (let i = U.state.projectiles.length - 1; i >= 0; i--) {
      const pr = U.state.projectiles[i],
        t = pr.target;
      if (!t || t.dead) {
        U.state.projectiles.splice(i, 1);
        continue;
      }
      const d = U.dist(pr, t),
        q = pr.speed * dt;
      if (d < q + 0.25) {
        let dmg = pr.damage;
        if (pr.spell)
          dmg = 18 + U.player.skills.Magia * 0.11 + (pr.spell.id === 'lightning' ? 9 : 0) + (b.magicPower || 0);
        U.hitEnemy(t, dmg, pr.crit);
        U.state.projectiles.splice(i, 1);
      } else {
        pr.x += ((t.x - pr.x) / d) * q;
        pr.y += ((t.y - pr.y) / d) * q;
      }
    }
    for (let i = U.state.effects.length - 1; i >= 0; i--) {
      const ef = U.state.effects[i];
      ef.life -= dt;
      if (ef.life <= 0) U.state.effects.splice(i, 1);
    }
    for (let i = U.state.corpses.length - 1; i >= 0; i--) {
      U.state.corpses[i].life -= dt;
      if (U.state.corpses[i].life <= 0) U.state.corpses.splice(i, 1);
    }
    const sp = U.worldToScreen(p.x, p.y);
    U.camera.x += (sp.x - U.W / 2) * 0.12;
    U.camera.y += (sp.y - U.H / 2) * 0.12;
    U.hudClock += dt;
    if (U.hudClock >= U.HUD_INTERVAL) {
      U.hudClock = 0;
      U.ui.refreshHUD();
      U.ui.updateBattleUI();
      U.ui.updateContextAction();
    }
  };
  U.die = function () {
    if (U.player.dead) return;
    U.player.dead = true;
    const dropped = [];
    for (let i = U.player.inventory.length - 1; i >= 0; i--) dropped.push(U.player.inventory.splice(i, 1)[0]);
    for (const slot of Object.keys(U.player.equipment)) {
      const it = U.player.equipment[slot];
      if (!it.insured) {
        it.recoverySlot = slot;
        dropped.push(it);
        delete U.player.equipment[slot];
      }
    }
    U.state.corpses.push({
      name: 'Tu cadáver', x: U.player.x, y: U.player.y, items: dropped, life: 300,
      owner: 'player', isPlayerCorpse: true,
    });
    U.player.target = null;
    U.state.autoAttack = false;
    U.cancelCast();
    U.player.deathAnim = U.DEATH_HOLD;
    U.player.deathTotal = U.DEATH_HOLD;
    U.player.deathHold = U.DEATH_HOLD;
    U.toast('Has muerto.');
    U.sound('death');
    U.ui.refreshAll();
  };
  U.respawn = function () {
    const p = U.player;
    p.hp = p.maxHp;
    p.mana = p.maxMana;
    p.stam = p.maxStam;
    p.x = p.respawn.x;
    p.y = p.respawn.y;
    p.dead = false;
    p.deathAnim = 0;
    p.deathHold = 0;
    p.target = null;
    p.recoveryBoost = 300;
    U.state.autoAttack = false;
    U.sound('respawn');
    U.toast('Reapareces en ' + p.respawn.name + ' con +10% de velocidad para recuperar tu cadáver.');
    U.ui.refreshAll();
  };
  U.save = function () {
    localStorage.setItem(
      'ultra_v722',
      JSON.stringify({
        player: { ...U.player, target: null, bandaging: null },
        state: { ...U.state, projectiles: [], effects: [], currentCorpse: null, vendor: null },
        enemies: U.enemies,
      }),
    );
    U.sound('save');
    U.toast('Partida guardada.');
  };
  U.load = function () {
    const raw =
      localStorage.getItem('ultra_v722') ||
      localStorage.getItem('ultra_v721') ||
      localStorage.getItem('ultra_v720') ||
      localStorage.getItem('ultra_v56') ||
      localStorage.getItem('ultra_v55') ||
      localStorage.getItem('ultra_v52') ||
      localStorage.getItem('ultra_v51');
    if (!raw) return U.toast('No hay guardado.');
    const d = JSON.parse(raw);
    Object.assign(U.player, d.player);
    Object.assign(U.state, d.state);
    U.player.statProgress = U.player.statProgress || { str: 0, dex: 0, int: 0 };
    U.player.knownSpells = U.player.knownSpells || [];
    U.player.favoriteSpells = U.player.favoriteSpells || [];
    U.player.recoveryBoost = U.player.recoveryBoost || 0;
    for (const cat in U.SKILLS)
      for (const sk of U.SKILLS[cat]) {
        U.player.skills[sk] = Math.max(50, U.player.skills[sk] || 50);
        U.player.skillLocks[sk] = U.player.skillLocks[sk] || 'up';
      }
    U.enemies.splice(0, U.enemies.length, ...(d.enemies || []));
    U.normalizeInventory();
    U.sound('load');
    U.ui.refreshAll();
    U.toast('Partida cargada y objetos apilados.');
  };
  U.reset = function () {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('ultra_')) localStorage.removeItem(k);
    }
    location.reload();
  };
  U.loop = function (now) {
    const dt = Math.min(0.033, (now - U.last) / 1000);
    U.last = now;
    U.update(dt);
    U.draw();
    requestAnimationFrame(U.loop);
  };
})((window.Ultra = window.Ultra || {}));
